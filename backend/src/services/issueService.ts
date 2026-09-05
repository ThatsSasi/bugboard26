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
    const newIssue = await prisma.issue.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        imageUrl: data.imageUrl,
        status: IssueStatus.TODO,
        reporter: {
          connect: { id: reporterId } 
        }
      },
      include: {reporter: true }
    });

    await prisma.historyLog.create({
      data: {
        action: 'CREATED_ISSUE',
        oldValue: 'N/A',
        newValue: IssueStatus.TODO,
        issue: { connect: { id: newIssue.id } },
        modifier: { connect: { id: reporterId } }
      }
    });

    return newIssue;
  }

  async getAll(filters: IssueFilters = {}) {
    const whereClause: any = {};

    if (filters.status) {
      whereClause.status = filters.status;
    }

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
        assignee: {
          select: { id: true, email: true, role: true, fullName: true, avatarUrl: true }
        },
        tags: true
      }
    });

    return issues;
  }

  async updateStatus(issueId: number, newStatus: IssueStatus, modifierId: number) {
    const existingIssue = await prisma.issue.findUnique({ where: { id: issueId } });

    if (!existingIssue) throw new Error('Segnalazione non trovata.');
    if (existingIssue.status === newStatus) throw new Error('La segnalazione si trova già in questo stato.');

    const modifier = await prisma.user.findUnique({ where: { id: modifierId } });
    if (modifier?.role !== 'ADMIN' && existingIssue.assigneeId !== modifierId) {
      throw new Error('Permesso negato: solo l\'utente assegnato (o un Amministratore) può modificare lo stato.');
    }
    
    if (newStatus === IssueStatus.ARCHIVED && modifier?.role !== 'ADMIN') {
    throw new Error('Permesso negato: solo un Amministratore può archiviare le segnalazioni.');
    }

    const queries: any[] = [
      prisma.issue.update({
        where: { id: issueId },
        data: { 
          status: newStatus,
          resolvedAt: newStatus === IssueStatus.RESOLVED ? new Date() : null 
        }
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
    ];

    if (newStatus === IssueStatus.RESOLVED && existingIssue.reporterId) {
       queries.push(
         prisma.notification.create({
           data: {
             userId: existingIssue.reporterId,
             message: `La issue #${existingIssue.id} "${existingIssue.title}" che avevi segnalato è stata RISOLTA.`,
             isRead: false
           }
         })
       );
    }

    const results = await prisma.$transaction(queries);
    return results[0]; 
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

    const queries: any[] = [
      prisma.issue.update({
        where: { id: issueId },
        data: {
          assignee: assigneeId ? { connect: { id: assigneeId } } : { disconnect: true }
        }
      }),
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

    const results = await prisma.$transaction(queries);
    return results[0];
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

    const [archivedIssue] = await prisma.$transaction([
      
      prisma.issue.update({
        where: { id: issueId },
        data: { status: IssueStatus.ARCHIVED }
      }),

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
        modifiedAt: 'desc'
      },
      include: {
        modifier: {
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
        const issue = await prisma.issue.findUnique({ where: { id: issueId } });
        if (!issue) throw new Error('Segnalazione non trovata.');

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
        const issue = await prisma.issue.findUnique({ where: { id: issueId } });
        if (!issue) throw new Error('Segnalazione non trovata.');

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