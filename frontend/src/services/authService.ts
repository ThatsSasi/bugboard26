import api from './api';

export const authService = {
  register: async (email: string, password: string, fullName: string, role: string) => {
    const response = await api.post('/users/register', { email, password, fullName, role });
    return response.data;
  },
  login: async (email: string, password: string) => {
    const response = await api.post('/users/login', { email, password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  }
};