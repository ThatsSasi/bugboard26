import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Logo } from '../components/Logo';
import { UI_COLORS } from '../styles/theme';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

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
    <div style={{ backgroundColor: UI_COLORS.background, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      
      {/* LOGO DELL'APP */}
      <div style={{ marginBottom: '35px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Logo size={42} />
        <p style={{ margin: '12px 0 0 0', color: UI_COLORS.textMuted, fontSize: '15px' }}>
          Accedi per continuare
        </p>
      </div>

      {/* CARD DEL FORM */}
      <div style={{ backgroundColor: UI_COLORS.surface, padding: '40px', borderRadius: '3px', width: '400px', maxWidth: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: UI_COLORS.textPrimary, textAlign: 'center' }}>Accesso</h2>
        
        {error && (
          <div style={{ backgroundColor: UI_COLORS.badgeHighBg, color: UI_COLORS.badgeHighText, padding: '10px', marginBottom: '20px', borderRadius: '3px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: UI_COLORS.textPrimary }}>Email</label>
            <input 
              type="email" 
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="Inserisci la tua email"
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', color: UI_COLORS.textPrimary, background: UI_COLORS.surface, outline: 'none' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: UI_COLORS.textPrimary }}>Password</label>
            <input 
              type="password" 
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Inserisci la tua password"
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', color: UI_COLORS.textPrimary, background: UI_COLORS.surface, outline: 'none' }}
            />
          </div>

          <button 
            type="submit" 
            style={{ padding: '12px', backgroundColor: UI_COLORS.primary, color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '10px' }}
          >
            Entra
          </button>
        </form>
      </div>
    </div>
  );
};