import { prisma } from '../index';

export class NotificationService {
    
    async getUserNotifications(userId: number) {
        return await prisma.notification.findMany({
            where: { 
                userId: userId 
            },
            orderBy: { 
                createdAt: 'desc' 
            }
        });
    }

    async markAsRead(notifId: number, userId: number) {
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
            throw new Error('NOT_FOUND');
        }

        return result;
    }
}