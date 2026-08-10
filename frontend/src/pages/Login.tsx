// 1. Rimuoviamo FormEvent e importiamo React per intero (o come namespace)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  // 2. Usiamo React.FormEvent e specifichiamo che arriva da un HTMLFormElement
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    setError(''); 

    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Errore di connessione al server.';
      setError(errorMessage);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h2>Accesso BugBoard26</h2>
      
      {error && (
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {/* Il resto del form rimane invariato */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <button 
          type="submit" 
          style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Entra
        </button>
      </form>
    </div>
  );
};