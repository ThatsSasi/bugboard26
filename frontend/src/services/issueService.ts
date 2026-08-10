import api from './api';

export interface Tag {
  id: number;
  name: string;
}

export interface Issue {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';
  type: 'QUESTION' | 'BUG' | 'DOCUMENTATION' | 'FEATURE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  imageUrl?: string;
  assignee?: User | null;
  tags?: Tag[];
}

export interface User {
  id: number;
  email: string;
  role: string;
}

export interface HistoryLog {
  id: number;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  modifiedAt: string;
  modifier: User;
}

export interface AppNotification {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// NUOVE INTERFACCE PER LA DASHBOARD
export interface UserMetric {
  userId: number;
  email: string;
  openIssues: number;
  resolvedIssues: number;
  avgResolutionTimeHours: number;
}

export interface DashboardMetrics {
  aggregate: {
    totalOpen: number;
    totalResolved: number;
    avgResolutionTimeHours: number;
  };
  userMetrics: UserMetric[];
}

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

  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    // Effettuiamo la vera chiamata all'endpoint che hai creato!
    const response = await api.get('/reports/metrics');
    return response.data;
  }
};