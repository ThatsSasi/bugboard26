import React, { useState } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import type { User } from '../types';
import { UI_COLORS } from '../styles/theme';

interface CreateAdminUserModalProps {
  onClose: () => void;
  onSuccess: (updatedUsers: User[]) => void;
}

export const CreateAdminUserModal: React.FC<CreateAdminUserModalProps> = ({ onClose, onSuccess }) => {
  const [newAdminFullName, setNewAdminFullName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('MEMBER');
  const [adminFormMessage, setAdminFormMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormMessage(null);
    try {
      await authService.register(newAdminEmail, newAdminPassword, newAdminFullName, newAdminRole);
      setAdminFormMessage({ type: 'success', text: 'Utente creato e aggiunto al sistema!' });
      
      setNewAdminFullName(''); setNewAdminEmail(''); setNewAdminPassword(''); setNewAdminRole('MEMBER');
      
      const updatedUsers = await userService.getUsers();
      onSuccess(updatedUsers);
      
      setTimeout(() => onClose(), 2000);
    } catch (error: any) {
      setAdminFormMessage({ type: 'error', text: error.response?.data?.error || 'Errore durante la creazione.' });
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ backgroundColor: UI_COLORS.surface, padding: '30px', borderRadius: '3px', width: '450px', maxWidth: '90%', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', color: UI_COLORS.textPrimary }}>Crea Nuovo Utente</h3>
          <button onClick={onClose} style={{ cursor: 'pointer', backgroundColor: 'transparent', border: 'none', fontSize: '18px', color: UI_COLORS.textMuted }}>✖</button>
        </div>
        
        {adminFormMessage && (
          <div style={{ backgroundColor: adminFormMessage.type === 'success' ? UI_COLORS.badgeLowBg : UI_COLORS.badgeHighBg, color: adminFormMessage.type === 'success' ? UI_COLORS.badgeLowText : UI_COLORS.badgeHighText, padding: '10px', borderRadius: '3px', marginBottom: '20px', fontSize: '13px', fontWeight: 'bold' }}>
            {adminFormMessage.text}
          </div>
        )}

        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Nome Completo *</label>
            <input type="text" required value={newAdminFullName} onChange={(e) => setNewAdminFullName(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', backgroundColor: UI_COLORS.background, color: UI_COLORS.textPrimary }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Email *</label>
            <input type="email" required value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', backgroundColor: UI_COLORS.background, color: UI_COLORS.textPrimary }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Password *</label>
            <input type="password" required value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', backgroundColor: UI_COLORS.background, color: UI_COLORS.textPrimary }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Ruolo *</label>
            <select value={newAdminRole} onChange={(e) => setNewAdminRole(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', backgroundColor: UI_COLORS.background, color: UI_COLORS.textPrimary }}>
              <option value="MEMBER">Membro Normale</option>
              <option value="ADMIN">Amministratore</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: 'transparent', color: UI_COLORS.textPrimary, border: 'none', fontWeight: 'bold' }}>Annulla</button>
            <button type="submit" disabled={adminFormMessage?.type === 'success'} style={{ padding: '8px 16px', cursor: adminFormMessage?.type === 'success' ? 'not-allowed' : 'pointer', backgroundColor: adminFormMessage?.type === 'success' ? UI_COLORS.textMuted : UI_COLORS.primary, color: 'white', border: 'none', borderRadius: '3px', fontWeight: 'bold' }}>Crea Utente</button>
          </div>
        </form>
      </div>
    </div>
  );
};