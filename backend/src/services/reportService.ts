import { prisma } from '..'; 

export class ReportService {
  
  async getDashboardMetrics(queryMonth?: string, queryYear?: string) {
    // --- 1. LETTURA PARAMETRI E RANGE TEMPORALE ---
    const now = new Date();
    let targetMonth = now.getMonth(); 
    let targetYear = now.getFullYear();

    if (queryMonth && queryYear) {
      targetMonth = parseInt(queryMonth, 10) - 1; 
      targetYear = parseInt(queryYear, 10);
    }

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 1); 

    // --- METRICHE AGGREGATE GLOBALI ---
    const totalOpen = await prisma.issue.count({
      where: { 
        status: { in: ['TODO', 'IN_PROGRESS'] },
        updatedAt: { gte: startOfMonth, lt: endOfMonth } 
      }
    });

    const globalResolvedIssues = await prisma.issue.findMany({
      where: { 
        status: 'RESOLVED',
        resolvedAt: { gte: startOfMonth, lt: endOfMonth } // <-- RICERCA CORRETTA!
      },
      select: { createdAt: true, updatedAt: true, resolvedAt: true } // <-- SELECT CORRETTA!
    });

    const totalResolved = globalResolvedIssues.length;
    let globalTotalHours = 0;

    globalResolvedIssues.forEach(issue => {
      if (issue.resolvedAt) {
        const diffMs = issue.resolvedAt.getTime() - issue.createdAt.getTime();
        globalTotalHours += diffMs / (1000 * 60 * 60); 
      }
    });

    const globalAvgTime = totalResolved > 0 ? globalTotalHours / totalResolved : 0;

    // --- METRICHE DETTAGLIATE PER UTENTE ---
    const users = await prisma.user.findMany({
      select: { id: true, email: true, fullName: true, avatarUrl: true }
    });

    const userMetrics = await Promise.all(users.map(async (user) => {
      const openIssues = await prisma.issue.count({
        where: { 
          assigneeId: user.id, 
          status: { in: ['TODO', 'IN_PROGRESS'] },
          updatedAt: { gte: startOfMonth, lt: endOfMonth } 
        }
      });

      const userResolved = await prisma.issue.findMany({
        where: { 
          assigneeId: user.id, 
          status: 'RESOLVED',
          resolvedAt: { gte: startOfMonth, lt: endOfMonth } // <-- RICERCA CORRETTA!
        },
        select: { createdAt: true, updatedAt: true, resolvedAt: true } // <-- SELECT CORRETTA!
      });

      let userHours = 0;
      userResolved.forEach(issue => {
        if (issue.resolvedAt) { // <-- FORMULA CORRETTA!
          const diffMs = issue.resolvedAt.getTime() - issue.createdAt.getTime();
          userHours += diffMs / (1000 * 60 * 60);
        }
      });

      const userAvgTime = userResolved.length > 0 ? userHours / userResolved.length : 0;

      return {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        openIssues,
        resolvedIssues: userResolved.length,
        avgResolutionTimeHours: userAvgTime
      };
    }));

    // Restituiamo direttamente l'oggetto dati
    return {
      aggregate: { totalOpen, totalResolved, avgResolutionTimeHours: globalAvgTime },
      userMetrics
    };
  }
}