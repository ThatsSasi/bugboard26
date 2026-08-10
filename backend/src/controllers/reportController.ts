import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '..'; // Adegua il path alla tua istanza Prisma

export class ReportController {
  
  async getDashboardMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      // 1. CONTROLLO ACCESSO (Solo Admin)
      // La traccia richiede che questa vista sia per gli amministratori.
      // Se nel tuo token salvi il ruolo (es. req.user.role), de-commenta queste righe:
      /*
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Accesso negato. Solo gli amministratori possono visualizzare i report.' });
        return;
      }
      */

      // --- METRICHE AGGREGATE GLOBALI ---

      // Conta i bug attualmente aperti (TODO o IN_PROGRESS)
      const totalOpen = await prisma.issue.count({
        where: { status: { in: ['TODO', 'IN_PROGRESS'] } }
      });

      // Recupera tutti i bug risolti per calcolare il tempo medio globale
      const globalResolvedIssues = await prisma.issue.findMany({
        where: { status: 'RESOLVED' },
        select: { createdAt: true, updatedAt: true } // Ottimizzazione: scarichiamo solo le date
      });

      const totalResolved = globalResolvedIssues.length;
      let globalTotalHours = 0;

      globalResolvedIssues.forEach(issue => {
        const diffMs = issue.updatedAt.getTime() - issue.createdAt.getTime();
        globalTotalHours += diffMs / (1000 * 60 * 60); // Converte millisecondi in ore
      });

      const globalAvgTime = totalResolved > 0 ? globalTotalHours / totalResolved : 0;

      // --- METRICHE DETTAGLIATE PER UTENTE ---
      
      // Recuperiamo tutti gli utenti dal sistema
      const users = await prisma.user.findMany({
        select: { id: true, email: true }
      });

      // Calcoliamo i dati per ogni singolo utente
      const userMetrics = await Promise.all(users.map(async (user) => {
        // Issue in carico all'utente
        const openIssues = await prisma.issue.count({
          where: { 
            assigneeId: user.id, 
            status: { in: ['TODO', 'IN_PROGRESS'] } 
          }
        });

        // Issue risolte dall'utente (per il tempo medio)
        const userResolved = await prisma.issue.findMany({
          where: { 
            assigneeId: user.id, 
            status: 'RESOLVED' 
          },
          select: { createdAt: true, updatedAt: true }
        });

        let userHours = 0;
        userResolved.forEach(issue => {
          const diffMs = issue.updatedAt.getTime() - issue.createdAt.getTime();
          userHours += diffMs / (1000 * 60 * 60);
        });

        const userAvgTime = userResolved.length > 0 ? userHours / userResolved.length : 0;

        return {
          userId: user.id,
          email: user.email,
          openIssues,
          resolvedIssues: userResolved.length,
          avgResolutionTimeHours: userAvgTime
        };
      }));

      // --- COSTRUZIONE RISPOSTA FINALE ---
      res.status(200).json({
        aggregate: {
          totalOpen,
          totalResolved,
          avgResolutionTimeHours: globalAvgTime
        },
        userMetrics
      });

    } catch (error: any) {
      console.error("Errore Report:", error);
      res.status(500).json({ error: 'Errore interno durante il calcolo delle metriche.' });
    }
  }
}