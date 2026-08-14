import api from './api';
import type { AppNotification } from '../types';

export const notificationService = {
  getNotifications: async (): Promise<AppNotification[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markNotificationAsRead: async (notifId: number): Promise<void> => {
    await api.patch(`/notifications/${notifId}/read`);
  }
};