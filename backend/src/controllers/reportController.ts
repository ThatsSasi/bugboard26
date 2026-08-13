import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { ReportService } from '../services/reportService';

// Istanziamo il service
const reportService = new ReportService();

export class ReportController {
  
  async getDashboardMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      // 1. Estraiamo i parametri dalla query string
      const queryMonth = req.query.month as string;
      const queryYear = req.query.year as string;

      // 2. Chiamiamo il service delegando tutta la logica di business
      const metrics = await reportService.getDashboardMetrics(queryMonth, queryYear);

      // 3. Restituiamo i dati elaborati al client
      res.status(200).json(metrics);

    } catch (error: any) {
      console.error("Errore Report:", error);
      res.status(500).json({ error: 'Errore interno durante il calcolo delle metriche mensili.' });
    }
  }
}