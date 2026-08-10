import api from './api';

export const authService = {
  // La funzione per il Login
  login: async (email: string, password: string) => {
    // Usiamo api.post, l'URL finale sarà http://localhost:3000/api/users/login
    const response = await api.post('/users/login', { email, password });
    return response.data;
  },

  // La funzione per il Logout (elimina semplicemente il token dal browser)
  logout: () => {
    localStorage.removeItem('token');
  }
};