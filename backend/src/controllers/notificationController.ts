import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '..'; // Assicurati che il path verso la tua istanza Prisma sia corretto

export class NotificationController {
    
    // Recupera tutte le notifiche dell'utente loggato
    async getUserNotifications(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({ error: 'Accesso non autorizzato.' });
                return;
            }

            const notifications = await prisma.notification.findMany({
                where: { 
                    userId: userId 
                },
                orderBy: { 
                    createdAt: 'desc' // Le più recenti in alto
                }
            });

            res.status(200).json(notifications);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Errore durante il recupero delle notifiche.' });
        }
    }

    // Segna una specifica notifica come letta
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

            // Usiamo updateMany per garantire che l'utente stia modificando SOLO una SUA notifica
            const result = await prisma.notification.updateMany({
                where: { 
                    id: notifId,
                    userId: userId 
                },
                data: { 
                    isRead: true 
                }
            });

            if (result.count === 0) {
                res.status(404).json({ error: 'Notifica non trovata o già aggiornata.' });
                return;
            }

            res.status(200).json({ message: 'Notifica segnata come letta.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Errore durante l\'aggiornamento della notifica.' });
        }
    }
}