import React, { useState } from 'react';
import type { Issue, HistoryLog, User } from '../types';
import { UI_COLORS } from '../styles/theme';

interface IssueDetailModalProps {
  issue: Issue;
  onClose: () => void;
  users: User[];
  loggedUserId: number | null;
  loggedUserRole: string | null;
  history: HistoryLog[];
  loadingHistory: boolean;
  onStatusChange: (status: string) => Promise<void>;
  onAssignUser: (userIdStr: string) => Promise<void>;
  onAddTag: (tagName: string) => Promise<void>;
  onRemoveTag: (tagId: number) => Promise<void>;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue, onClose, users, loggedUserId, loggedUserRole, history, loadingHistory,
  onStatusChange, onAssignUser, onAddTag, onRemoveTag
}) => {
  // Spostiamo qui lo stato dell'input del tag!
  const [newTagInput, setNewTagInput] = useState('');

  const handleAddTagClick = async () => {
    if (!newTagInput.trim()) return;
    await onAddTag(newTagInput);
    setNewTagInput(''); // Svuota l'input dopo il salvataggio
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }} onClick={onClose}>
      <div style={{ backgroundColor: UI_COLORS.surface, padding: '30px', borderRadius: '3px', width: '1000px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', gap: '30px', cursor: 'default', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ flex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '18px', color: UI_COLORS.textMuted }}>#{issue.id}</span>
            <h2 style={{ margin: 0, fontSize: '24px', wordBreak: 'break-word', color: UI_COLORS.textPrimary }}>{issue.title}</h2>
          </div>
          <div style={{ marginBottom: '20px' }}><h4 style={{ margin: '0 0 10px 0', color: UI_COLORS.textMuted }}>Descrizione</h4><div style={{ backgroundColor: UI_COLORS.background, padding: '20px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6', color: UI_COLORS.textPrimary }}>{issue.description}</div></div>
          {issue.imageUrl && (
            <div><h4 style={{ margin: '0 0 10px 0', color: UI_COLORS.textMuted }}>Allegato</h4><a href={issue.imageUrl} target="_blank" rel="noopener noreferrer"><img src={issue.imageUrl} alt="Allegato Issue" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', backgroundColor: UI_COLORS.background, borderRadius: '4px', border: `1px solid ${UI_COLORS.border}` }} /></a></div>
          )}
        </div>
        <div style={{ flex: 1, borderLeft: `1px solid ${UI_COLORS.border}`, paddingLeft: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}><button onClick={onClose} style={{ cursor: 'pointer', backgroundColor: 'transparent', border: 'none', fontSize: '18px', color: UI_COLORS.textMuted }}>✖</button></div>
          <div style={{ marginBottom: '20px' }}>
            <h5 style={{ margin: '0 0 5px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '12px' }}>Stato Attuale</h5>
              <select 
                value={issue.status}
                onChange={(e) => onStatusChange(e.target.value)}
                disabled={loggedUserRole !== 'ADMIN' && issue.assignee?.id !== loggedUserId}
                style={{ 
                  padding: '6px 10px', 
                  backgroundColor: (loggedUserRole !== 'ADMIN' && issue.assignee?.id !== loggedUserId) ? UI_COLORS.buttonSecondary : UI_COLORS.badgeStatusBg, 
                  color: (loggedUserRole !== 'ADMIN' && issue.assignee?.id !== loggedUserId) ? UI_COLORS.textMuted : UI_COLORS.badgeStatusText, 
                  borderRadius: '3px', 
                  fontWeight: 'bold', 
                  border: `1px solid ${(loggedUserRole !== 'ADMIN' && issue.assignee?.id !== loggedUserId) ? UI_COLORS.border : UI_COLORS.primary}`, 
                  cursor: (loggedUserRole !== 'ADMIN' && issue.assignee?.id !== loggedUserId) ? 'not-allowed' : 'pointer', 
                  width: '100%', 
                  outline: 'none' 
                }}
              >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
              {loggedUserRole === 'ADMIN' && <option value="ARCHIVED">ARCHIVED</option>}
              </select>
            
            {loggedUserRole !== 'ADMIN' && issue.assignee?.id !== loggedUserId && (
              <div style={{ fontSize: '11px', color: UI_COLORS.badgeHighText, marginTop: '6px' }}>
                Solo l'assegnatario può modificare lo stato.
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <h5 style={{ margin: '0 0 5px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '12px' }}>Tipologia</h5>
              <span style={{ backgroundColor: UI_COLORS.badgeTypeBg, color: UI_COLORS.badgeTypeText, padding: '4px 8px', borderRadius: '3px', fontWeight: 'bold', fontSize: '12px', display: 'inline-block' }}>
                {issue.type}
              </span>
            </div>
            
            {issue.priority && (
              <div style={{ flex: 1 }}>
                <h5 style={{ margin: '0 0 5px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '12px' }}>Priorità</h5>
                <span style={{ 
                  padding: '4px 8px', 
                  backgroundColor: issue.priority === 'HIGH' ? UI_COLORS.badgeHighBg : issue.priority === 'MEDIUM' ? UI_COLORS.badgeMedBg : UI_COLORS.badgeLowBg, 
                  color: issue.priority === 'HIGH' ? UI_COLORS.badgeHighText : issue.priority === 'MEDIUM' ? UI_COLORS.badgeMedText : UI_COLORS.badgeLowText, 
                  borderRadius: '3px', 
                  fontWeight: 'bold', 
                  fontSize: '12px',
                  display: 'inline-block'
                }}>
                  {issue.priority}
                </span>
              </div>
            )}
          </div>
          <div style={{ marginBottom: '20px' }}>
            <h5 style={{ margin: '0 0 5px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '12px' }}>Assegnato a</h5>
            <select 
              value={issue.assignee?.id || ""}
              onChange={(e) => onAssignUser(e.target.value)}
              disabled={loggedUserRole !== 'ADMIN'}
              style={{ 
                width: '100%', padding: '8px', 
                border: `2px solid ${loggedUserRole !== 'ADMIN' ? UI_COLORS.border : UI_COLORS.primary}`, borderRadius: '3px', 
                color: loggedUserRole !== 'ADMIN' ? UI_COLORS.textMuted : UI_COLORS.textPrimary, 
                backgroundColor: loggedUserRole !== 'ADMIN' ? UI_COLORS.buttonSecondary : UI_COLORS.background, 
                cursor: loggedUserRole !== 'ADMIN' ? 'not-allowed' : 'pointer', outline: 'none' 
              }}
            >
              <option value="">-- Nessun assegnatario --</option>
              {users.map(user => <option key={user.id} value={user.id}>{user.email}</option>)}
            </select>
            
            {loggedUserRole !== 'ADMIN' && (
              <div style={{ fontSize: '11px', color: UI_COLORS.badgeHighText, marginTop: '6px' }}>
                Solo un amministratore può assegnare le issue.
              </div>
            )}
          </div>
          <div style={{ marginBottom: '20px', borderTop: `1px solid ${UI_COLORS.border}`, paddingTop: '15px' }}>
            <h5 style={{ margin: '0 0 10px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '12px' }}>Etichette</h5>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              {issue.tags && issue.tags.length > 0 ? (
                issue.tags.map(tag => (
                  <span key={tag.id} style={{ backgroundColor: UI_COLORS.buttonSecondary, color: UI_COLORS.textPrimary, padding: '4px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    #{tag.name}
                    {(loggedUserRole === 'ADMIN' || issue.assignee?.id === loggedUserId) && (
                      <button onClick={() => onRemoveTag(tag.id)} style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', color: UI_COLORS.badgeHighText, fontWeight: 'bold', fontSize: '14px', lineHeight: '1' }}>&times;</button>
                    )}
                  </span>
                ))
              ) : (<span style={{ fontSize: '12px', color: UI_COLORS.textMuted, fontStyle: 'italic' }}>Nessuna etichetta</span>)}
            </div>

            {(loggedUserRole === 'ADMIN' || issue.assignee?.id === loggedUserId) && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} placeholder="es. frontend" onKeyDown={(e) => e.key === 'Enter' && handleAddTagClick()} style={{ flex: 1, padding: '6px 10px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', backgroundColor: UI_COLORS.background, color: UI_COLORS.textPrimary }} />
                <button onClick={handleAddTagClick} style={{ padding: '6px 12px', backgroundColor: UI_COLORS.primary, color: 'white', border: 'none', borderRadius: '3px', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
              </div>
            )}
          </div>
          <div style={{ marginTop: '40px' }}>
            <h5 style={{ margin: '0 0 15px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '13px', borderBottom: `1px solid ${UI_COLORS.border}`, paddingBottom: '10px' }}>Cronologia Attività</h5>
            {loadingHistory ? (<p style={{ fontSize: '13px', color: UI_COLORS.textMuted, fontStyle: 'italic' }}>Caricamento cronologia...</p>) : history.length === 0 ? (<p style={{ fontSize: '13px', color: UI_COLORS.textMuted, fontStyle: 'italic' }}>Nessuna attività registrata.</p>) : (
              <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
                {history.map(log => (
                  <div key={log.id} style={{ fontSize: '13px', borderLeft: `2px solid ${UI_COLORS.primary}`, paddingLeft: '12px' }}>
                    <div style={{ color: UI_COLORS.textPrimary, marginBottom: '4px' }}><strong style={{ color: UI_COLORS.primary }}>{log.modifier.email}</strong> <span style={{ color: UI_COLORS.textMuted }}> ha eseguito: </span> <strong>{log.action.replace('_', ' ')}</strong></div>
                    {(log.oldValue || log.newValue) && (
                      <div style={{ backgroundColor: UI_COLORS.background, padding: '6px 8px', borderRadius: '4px', fontSize: '12px', color: UI_COLORS.textPrimary, fontFamily: 'monospace', marginTop: '4px' }}><span style={{ textDecoration: 'line-through', color: UI_COLORS.badgeHighText }}>{log.oldValue || 'N/A'}</span><span style={{ margin: '0 8px', color: UI_COLORS.textMuted }}>➔</span><span style={{ color: UI_COLORS.badgeLowText, fontWeight: 'bold' }}>{log.newValue}</span></div>
                    )}
                    <div style={{ fontSize: '11px', color: UI_COLORS.textMuted, marginTop: '6px' }}>{new Date(log.modifiedAt).toLocaleString('it-IT')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};