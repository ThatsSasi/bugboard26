import { IssueType, IssueStatus, IssuePriority } from '@prisma/client';
import { prisma } from '../index';

export interface IssueCreateDTO {
  title: string;
  description: string;
  type: IssueType; 
  priority?: IssuePriority;
  imageUrl?: string;
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
        priority: data.priority, // <-- Aggiunto al salvataggio
        imageUrl: data.imageUrl,
        status: IssueStatus.TODO, // <-- Eccolo qui, perfettamente allineato allo schema!
        reporter: {
          connect: { id: reporterId } 
        }
      },
      include: {reporter: true }
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
          select: { id: true, email: true, role: true, fullName: true, avatarUrl: true }
        },
        assignee: { // <-- Aggiunto l'assegnatario per la board!
          select: { id: true, email: true, role: true, fullName: true, avatarUrl: true }
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

    if (!existingIssue) throw new Error('Segnalazione non trovata.');
    if (existingIssue.status === newStatus) throw new Error('La segnalazione si trova già in questo stato.');

    // --- NUOVO: CONTROLLO PERMESSI (Requisito 6 e 9) ---
    const modifier = await prisma.user.findUnique({ where: { id: modifierId } });
    if (modifier?.role !== 'ADMIN' && existingIssue.assigneeId !== modifierId) {
      throw new Error('Permesso negato: solo l\'utente assegnato (o un Amministratore) può modificare lo stato.');
    }

    // 2. Eseguiamo entrambe le query in una singola Transazione
    const [updatedIssue, log] = await prisma.$transaction([
      prisma.issue.update({
        where: { id: issueId },
        data: { status: newStatus }
      }),
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

  async assignUser(issueId: number, assigneeId: number | null, modifierId: number) {
    const existingIssue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!existingIssue) throw new Error('Segnalazione non trovata.');

    const modifier = await prisma.user.findUnique({ where: { id: modifierId } });
    if (modifier?.role !== 'ADMIN') {
      throw new Error('Permesso negato: solo un Amministratore può assegnare le issue.');
    }

    const oldAssignee = existingIssue.assigneeId ? existingIssue.assigneeId.toString() : 'UNASSIGNED';
    const newAssignee = assigneeId ? assigneeId.toString() : 'UNASSIGNED';

    if (oldAssignee === newAssignee) throw new Error('Questo utente è già assegnato a questa segnalazione.');

    // 1. Creiamo un array dinamico di query per la Transazione
    const queries: any[] = [
      // Query A: Aggiorna l'issue collegando o scollegando l'assegnatario
      prisma.issue.update({
        where: { id: issueId },
        data: {
          assignee: assigneeId ? { connect: { id: assigneeId } } : { disconnect: true }
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
    ];

    // --- NUOVO: CREAZIONE NOTIFICA (Requisito 4) ---
    if (assigneeId !== null) {
      queries.push(
        prisma.notification.create({
          data: {
            userId: assigneeId,
            message: `Ti è stata assegnata una nuova issue: #${existingIssue.id} "${existingIssue.title}".`,
            isRead: false
          }
        })
      );
    }

    // 2. Eseguiamo tutte le query insieme
    const results = await prisma.$transaction(queries);
    return results[0]; // L'issue aggiornata è il primo risultato
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

  async addTag(issueId: number, tagName: string, modifierId: number) {
        // 1. Controlliamo se l'issue esiste
        const issue = await prisma.issue.findUnique({ where: { id: issueId } });
        if (!issue) throw new Error('Segnalazione non trovata.');

        // 2. Controllo Permessi (Requisito 9)
        const modifier = await prisma.user.findUnique({ where: { id: modifierId } });
        if (modifier?.role !== 'ADMIN' && issue.assigneeId !== modifierId) {
            throw new Error('Permesso negato: solo l\'utente assegnato (o un Amministratore) può aggiungere etichette.');
        }

        const name = tagName.toLowerCase().trim();
        
        return await prisma.issue.update({
            where: { id: issueId },
            data: {
                tags: {
                    connectOrCreate: {
                        where: { name: name },
                        create: { name: name }
                    }
                }
            },
            include: { assignee: true, tags: true, reporter: true } 
        });
    }

  async removeTag(issueId: number, tagId: number, modifierId: number) {
        // 1. Controlliamo se l'issue esiste
        const issue = await prisma.issue.findUnique({ where: { id: issueId } });
        if (!issue) throw new Error('Segnalazione non trovata.');

        // 2. Controllo Permessi (Requisito 9)
        const modifier = await prisma.user.findUnique({ where: { id: modifierId } });
        if (modifier?.role !== 'ADMIN' && issue.assigneeId !== modifierId) {
            throw new Error('Permesso negato: solo l\'utente assegnato (o un Amministratore) può rimuovere etichette.');
        }

        return await prisma.issue.update({
            where: { id: issueId },
            data: {
                tags: { disconnect: { id: tagId } }
            },
            include: { assignee: true, tags: true, reporter: true }
        });
    }
}