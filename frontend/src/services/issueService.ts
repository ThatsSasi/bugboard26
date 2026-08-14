import api from './api';
import type { Issue, HistoryLog } from '../types';

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

  assignUser: async (issueId: number, userId: number | null): Promise<Issue> => {
    const response = await api.patch(`/issues/${issueId}/assign`, { assigneeId: userId });
    return response.data;
  },

  addTag: async (issueId: number, tagName: string): Promise<Issue> => {
    const response = await api.post(`/issues/${issueId}/tags`, { name: tagName });
    return response.data;
  },

  removeTag: async (issueId: number, tagId: number): Promise<Issue> => {
    const response = await api.delete(`/issues/${issueId}/tags/${tagId}`);
    return response.data;
  }
};