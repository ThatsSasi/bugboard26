import api from './api';
import type { User } from '../types';

export const userService = {
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
  }
};