import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticateToken, isAdmin } from '../middlewares/authMiddleware';

const router = Router();
const reportController = new ReportController();

// GET /api/reports/metrics
router.get('/metrics', authenticateToken, isAdmin, (req, res) => reportController.getDashboardMetrics(req as any, res));

export default router;