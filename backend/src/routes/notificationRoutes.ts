import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
const notificationController = new NotificationController();

// Recupera le notifiche dell'utente
/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Recupera tutte le notifiche dell'utente loggato
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista delle notifiche
 */
router.get('/', authenticateToken, (req, res) => notificationController.getUserNotifications(req as any, res));

// Segna la notifica come letta (PATCH)
/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Segna una notifica come letta
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notifica aggiornata
 */
router.patch('/:id/read', authenticateToken, (req, res) => notificationController.markAsRead(req as any, res));

export default router;