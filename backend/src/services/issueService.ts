import { IssueType, IssueStatus } from '@prisma/client';
import { prisma } from '../index';

export interface IssueCreateDTO {
  title: string;
  description: string;
  type: IssueType; 
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

  async getAll() {
    const issues = await prisma.issue.findMany({
      // Ordiniamo dalla più recente alla più vecchia
      orderBy: {
        createdAt: 'desc'
      },
      // Eager Loading: chiediamo a Prisma di unire i dati dell'utente (JOIN)
      include: {
        reporter: {
          // Attenzione alla sicurezza: selezioniamo SOLO id ed email. 
          // Escludiamo categoricamente la password!
          select: {
            id: true,
            email: true,
            role: true
          }
        }
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
}