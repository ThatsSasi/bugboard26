import api from './api';

export interface Issue {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED'; // <-- Modificato
  type: 'QUESTION' | 'BUG' | 'DOCUMENTATION' | 'FEATURE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'; // <-- Nuovo (opzionale)
  imageUrl?: string; // <-- Nuovo (opzionale)
}

export const issueService = {
  getAll: async (): Promise<Issue[]> => {
    const response = await api.get('/issues');
    return response.data;
  },

  // Aggiorniamo anche la firma della creazione per permettere l'invio della priorità e dell'immagine
  create: async (formData: FormData): Promise<Issue> => {
    // Aggiungiamo un header specifico per sovrascrivere l'application/json di default
    const response = await api.post('/issues', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // NUOVO: Metodo per aggiornare lo stato
  updateStatus: async (id: number, status: string): Promise<Issue> => {
    const response = await api.patch(`/issues/${id}/status`, { status });
    // Il nostro backend restituisce { message: '...', issue: { ... } }
    return response.data.issue; 
  }
};