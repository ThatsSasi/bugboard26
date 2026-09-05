import api from './api';
import type { DashboardMetrics } from '../types';

export const reportService = {
  getDashboardMetrics: async (month?: number, year?: number): Promise<DashboardMetrics> => {
    const response = await api.get('/reports/metrics', {
      params: {
        month: month,
        year: year
      }
    });
    return response.data;
  }
};