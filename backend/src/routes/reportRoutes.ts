import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticateToken, isAdmin } from '../middlewares/authMiddleware';

const router = Router();
const reportController = new ReportController();

/**
 * @swagger
 * /api/reports/metrics:
 *   get:
 *     summary: Ottiene le metriche mensili della dashboard (Solo Admin)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Mese di riferimento (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Anno di riferimento (es. 2026)
 *     responses:
 *       200:
 *         description: Metriche aggregate e statistiche utenti generate con successo
 *       403:
 *         description: Accesso negato (non Admin)
 */
router.get('/metrics', authenticateToken, isAdmin, (req, res) => reportController.getDashboardMetrics(req as any, res));

export default router;