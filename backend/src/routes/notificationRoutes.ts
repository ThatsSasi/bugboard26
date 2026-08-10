import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
const notificationController = new NotificationController();

// Recupera le notifiche dell'utente
router.get('/', authenticateToken, (req, res) => notificationController.getUserNotifications(req as any, res));

// Segna la notifica come letta (PATCH)
router.patch('/:id/read', authenticateToken, (req, res) => notificationController.markAsRead(req as any, res));

export default router;