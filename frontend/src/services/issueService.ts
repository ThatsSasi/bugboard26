import api from './api';
import type { Issue, HistoryLog, User, AppNotification, DashboardMetrics } from '../types';

export const issueService = {
  getAll: async (): Promise<Issue[]> => {
    const response = await api.get('/issues');
    return response.data;
  },

  create: async (formData: FormData): Promise<Issue> => {
    const response = await api.post('/issues', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<Issue> => {
    const response = await api.patch(`/issues/${id}/status`, { status });
    return response.data.issue; 
  },
  
  getHistory: async (issueId: number): Promise<HistoryLog[]> => {
    const response = await api.get(`/issues/${issueId}/history`);
    return response.data;
  },

  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/users'); 
    return response.data;
  },

  updateProfile: async (formData: FormData): Promise<User> => {
    const response = await api.patch('/users/me', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.user;
  },

  assignUser: async (issueId: number, userId: number | null): Promise<Issue> => {
    const response = await api.patch(`/issues/${issueId}/assign`, { assigneeId: userId });
    return response.data;
  },

  // CHIAMATE REALI PER LE NOTIFICHE
  getNotifications: async (): Promise<AppNotification[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markNotificationAsRead: async (notifId: number): Promise<void> => {
    await api.patch(`/notifications/${notifId}/read`);
  },

  addTag: async (issueId: number, tagName: string): Promise<Issue> => {
    const response = await api.post(`/issues/${issueId}/tags`, { name: tagName });
    return response.data;
  },

  removeTag: async (issueId: number, tagId: number): Promise<Issue> => {
    const response = await api.delete(`/issues/${issueId}/tags/${tagId}`);
    return response.data;
  },

  // METODO CORRETTO E COERENTE CON IL RESTO DEL FILE
  getDashboardMetrics: async (month?: number, year?: number): Promise<DashboardMetrics> => {
    // Axios gestisce automaticamente la creazione della query string (?month=X&year=Y)
    // ignorando i parametri se sono undefined.
    const response = await api.get('/reports/metrics', {
      params: {
        month: month,
        year: year
      }
    });
    return response.data;
  }
};