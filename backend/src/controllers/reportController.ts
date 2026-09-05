import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { ReportService } from '../services/reportService';

const reportService = new ReportService();

export class ReportController {
  
  async getDashboardMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const queryMonth = req.query.month as string;
      const queryYear = req.query.year as string;

      const metrics = await reportService.getDashboardMetrics(queryMonth, queryYear);

      res.status(200).json(metrics);

    } catch (error: any) {
      console.error("Errore Report:", error);
      res.status(500).json({ error: 'Errore interno durante il calcolo delle metriche mensili.' });
    }
  }
}