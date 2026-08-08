import { IssueType, IssueStatus } from '@prisma/client';
import { prisma } from '../index';

export interface IssueCreateDTO {
  title: string;
  description: string;
  type: IssueType; 
}

export interface IssueFilters {
  status?: IssueStatus;
  assigneeId?: number;
}

export class IssueService {
  
  async create(data: IssueCreateDTO, reporterId: number) {
    // 1. Creazione dell'Issue nel database
    const newIssue = await prisma.issue.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        status: IssueStatus.TODO, // <-- Eccolo qui, perfettamente allineato allo schema!
        reporter: {
          connect: { id: reporterId } 
        }
      }
    });

    // 2. Creazione del log storico
    await prisma.historyLog.create({
      data: {
        action: 'CREATED_ISSUE',
        oldValue: 'N/A',
        newValue: IssueStatus.TODO, // Registriamo il nuovo stato
        issue: { connect: { id: newIssue.id } },
        modifier: { connect: { id: reporterId } }
      }
    });

    return newIssue;
  }

  async getAll(filters: IssueFilters = {}) {
    // Partiamo dalla base: non vogliamo mai vedere i bug archiviati
    const whereClause: any = {
      status: { not: IssueStatus.ARCHIVED }
    };

    // Se il client ha richiesto uno stato specifico, sovrascriviamo la regola
    if (filters.status) {
      whereClause.status = filters.status;
    }

    // Se il client vuole i bug di un utente specifico, aggiungiamo il filtro
    if (filters.assigneeId) {
      whereClause.assigneeId = filters.assigneeId;
    }

    const issues = await prisma.issue.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        reporter: {
          select: { id: true, email: true, role: true }
        },
        assignee: { // <-- Aggiunto l'assegnatario per la board!
          select: { id: true, email: true, role: true }
        },
        tags: true
      }
    });

    return issues;
  }

  async updateStatus(issueId: number, newStatus: IssueStatus, modifierId: number) {
    // 1. Recuperiamo lo stato attuale prima di modificarlo
    const existingIssue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!existingIssue) {
      throw new Error('Segnalazione non trovata.');
    }

    if (existingIssue.status === newStatus) {
      throw new Error('La segnalazione si trova già in questo stato.');
    }

    // 2. Eseguiamo entrambe le query in una singola Transazione
    const [updatedIssue, log] = await prisma.$transaction([
      
      // Query A: Aggiorna l'issue
      prisma.issue.update({
        where: { id: issueId },
        data: { status: newStatus }
      }),

      // Query B: Crea la traccia storica
      prisma.historyLog.create({
        data: {
          action: 'CHANGED_STATUS',
          oldValue: existingIssue.status,
          newValue: newStatus,
          issue: { connect: { id: issueId } },
          modifier: { connect: { id: modifierId } }
        }
      })
    ]);

    return updatedIssue;
  }

  async assignUser(issueId: number, assigneeId: number, modifierId: number) {
    // 1. Recuperiamo l'issue per controllare a chi era assegnata prima
    const existingIssue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!existingIssue) {
      throw new Error('Segnalazione non trovata.');
    }

    // Usiamo assigneeId esattamente come definito nello schema
    const oldAssignee = existingIssue.assigneeId ? existingIssue.assigneeId.toString() : 'UNASSIGNED';
    const newAssignee = assigneeId.toString();

    if (oldAssignee === newAssignee) {
      throw new Error('Questo utente è già assegnato a questa segnalazione.');
    }

    // 2. Eseguiamo la Transazione
    const [updatedIssue, log] = await prisma.$transaction([
      
      // Query A: Aggiorna l'issue collegando il nuovo utente tramite la relazione 'assignee'
      prisma.issue.update({
        where: { id: issueId },
        data: {
          assignee: {
            connect: { id: assigneeId } 
          }
        }
      }),

      // Query B: Crea la traccia storica
      prisma.historyLog.create({
        data: {
          action: 'ASSIGNED_USER',
          oldValue: oldAssignee,
          newValue: newAssignee,
          issue: { connect: { id: issueId } },
          modifier: { connect: { id: modifierId } }
        }
      })
    ]);

    return updatedIssue;
  }

  async archive(issueId: number, modifierId: number) {
    const existingIssue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!existingIssue) {
      throw new Error('Segnalazione non trovata.');
    }

    if (existingIssue.status === IssueStatus.ARCHIVED) {
      throw new Error('La segnalazione è già stata archiviata.');
    }

    const [archivedIssue, log] = await prisma.$transaction([
      
      // Query A: Spostiamo lo stato su ARCHIVED
      prisma.issue.update({
        where: { id: issueId },
        data: { status: IssueStatus.ARCHIVED }
      }),

      // Query B: Registriamo l'archiviazione
      prisma.historyLog.create({
        data: {
          action: 'ARCHIVED_ISSUE',
          oldValue: existingIssue.status,
          newValue: IssueStatus.ARCHIVED,
          issue: { connect: { id: issueId } },
          modifier: { connect: { id: modifierId } }
        }
      })
    ]);

    return archivedIssue;
  }

  async getHistory(issueId: number) {
    // Verifichiamo prima che l'issue esista
    const existingIssue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!existingIssue) {
      throw new Error('Segnalazione non trovata.');
    }

    const historyLogs = await prisma.historyLog.findMany({
      where: {
        issueId: issueId
      },
      orderBy: {
        modifiedAt: 'desc' // Ordine cronologico decrescente
      },
      include: {
        modifier: { // Eager loading per sapere CHI ha fatto l'azione
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });

    return historyLogs;
  }

  async addTag(issueId: number, tagName: string) {
    // Normalizziamo il testo (tutto minuscolo e senza spazi extra all'inizio/fine) 
    // per evitare di creare tag duplicati come "UI " e "ui"
    const normalizedTag = tagName.trim().toLowerCase();

    return await prisma.issue.update({
      where: { id: issueId },
      data: {
        tags: {
          connectOrCreate: {
            where: { name: normalizedTag },
            create: { name: normalizedTag }
          }
        }
      },
      // Chiediamo a Prisma di restituirci l'issue con i tag aggiornati
      include: { tags: true } 
    });
  }

  async removeTag(issueId: number, tagId: number) {
    return await prisma.issue.update({
      where: { id: issueId },
      data: {
        tags: {
          // 'disconnect' rompe il legame logico, ma NON cancella il Tag dal database,
          // in modo che rimanga disponibile per altre segnalazioni.
          disconnect: { id: tagId } 
        }
      },
      include: { tags: true }
    });
  }
}