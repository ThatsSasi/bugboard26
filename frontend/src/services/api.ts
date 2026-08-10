import axios from 'axios';

// 1. Creiamo l'istanza base configurata per puntare al nostro backend
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Interceptor per le richieste: si attiva PRIMA che ogni chiamata parta
api.interceptors.request.use(
  (config) => {
    // Cerchiamo il token JWT salvato nel browser
    const token = localStorage.getItem('token');
    
    // Se il token esiste, lo iniettiamo automaticamente negli header
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;