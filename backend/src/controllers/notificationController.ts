import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { NotificationService } from '../services/notificationService';

const notificationService = new NotificationService();

export class NotificationController {
    
    async getUserNotifications(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({ error: 'Accesso non autorizzato.' });
                return;
            }

            const notifications = await notificationService.getUserNotifications(userId);

            res.status(200).json(notifications);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Errore durante il recupero delle notifiche.' });
        }
    }

    async markAsRead(req: AuthRequest, res: Response): Promise<void> {
        try {
            const notifId = parseInt(req.params.id as string, 10);
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({ error: 'Accesso non autorizzato.' });
                return;
            }

            if (isNaN(notifId)) {
                res.status(400).json({ error: 'ID notifica non valido.' });
                return;
            }

            await notificationService.markAsRead(notifId, userId);

            res.status(200).json({ message: 'Notifica segnata come letta.' });
        } catch (error: any) {
            console.error(error);
            
            if (error.message === 'NOT_FOUND') {
                res.status(404).json({ error: 'Notifica non trovata o già aggiornata.' });
            } else {
                res.status(500).json({ error: 'Errore durante l\'aggiornamento della notifica.' });
            }
        }
    }
}