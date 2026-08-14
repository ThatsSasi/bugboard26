import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { UI_COLORS } from '../styles/theme';
import type { AppNotification } from '../types';

interface TopNavProps {
  loggedUserFullName: string | null;
  loggedUserEmail: string;
  loggedUserAvatar: string | null;
  loggedUserRole: string | null;
  notifications: AppNotification[];
  onReadNotification: (id: number) => void;
  onOpenProfileModal: () => void;
  onLogout: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  loggedUserFullName, loggedUserEmail, loggedUserAvatar, loggedUserRole,
  notifications, onReadNotification, onOpenProfileModal, onLogout
}) => {
  const navigate = useNavigate();
  
  // Spostiamo qui gli stati e le ref delle tendine!
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Spostiamo qui il listener per i click esterni!
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) { 
        setIsProfileMenuOpen(false); 
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header style={{ height: '60px', borderBottom: `1px solid ${UI_COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', backgroundColor: UI_COLORS.surface, flexShrink: 0, zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}><Logo size={28} /></div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* CAMPANELLA NOTIFICHE */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button onClick={() => setIsNotifOpen(!isNotifOpen)} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '20px', position: 'relative' }}>
            🔔
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: UI_COLORS.badgeHighText, color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </button>
          {isNotifOpen && (
            <div style={{ position: 'absolute', top: '40px', right: '0', width: '320px', backgroundColor: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 }}>
              <div style={{ padding: '12px 15px', borderBottom: `1px solid ${UI_COLORS.border}`, fontWeight: 'bold', fontSize: '14px', backgroundColor: '#F8F9FA' }}>Notifiche</div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="custom-scrollbar">
                {notifications.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: UI_COLORS.textMuted, fontSize: '13px' }}>Nessuna notifica</div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} onClick={() => onReadNotification(notif.id)} style={{ padding: '12px 15px', borderBottom: `1px solid ${UI_COLORS.border}`, cursor: 'pointer', backgroundColor: notif.isRead ? UI_COLORS.surface : UI_COLORS.badgeTypeBg, transition: 'background-color 0.2s' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: UI_COLORS.textPrimary }}>{notif.message}</p>
                      <span style={{ fontSize: '10px', color: UI_COLORS.textMuted }}>{new Date(notif.createdAt).toLocaleDateString('it-IT')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* TASTO DASHBOARD */}
        {loggedUserRole === 'ADMIN' && (
          <button onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', background: 'none', border: 'none', color: UI_COLORS.textMuted, fontWeight: 'bold', fontSize: '14px' }}>Dashboard</button>
        )}
        
        {/* AVATAR PROFILO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '15px', borderLeft: `1px solid ${UI_COLORS.border}`, position: 'relative' }} ref={profileMenuRef}>
          <div onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {loggedUserAvatar ? (
              <img src={loggedUserAvatar} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: UI_COLORS.primary, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                {loggedUserFullName ? loggedUserFullName.charAt(0).toUpperCase() : loggedUserEmail.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ fontWeight: '500', fontSize: '14px' }}>{loggedUserFullName || loggedUserEmail.split('@')[0]}</span>
            <span style={{ fontSize: '10px', color: UI_COLORS.textMuted }}>▼</span>
          </div>

          {isProfileMenuOpen && (
            <div style={{ position: 'absolute', top: '40px', right: '0', width: '200px', backgroundColor: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 }}>
              <div onClick={() => { onOpenProfileModal(); setIsProfileMenuOpen(false); }} style={{ padding: '12px 15px', borderBottom: `1px solid ${UI_COLORS.border}`, cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = UI_COLORS.surfaceAlt} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>⚙️ Modifica Profilo</div>
              <div onClick={onLogout} style={{ padding: '12px 15px', cursor: 'pointer', fontSize: '14px', color: UI_COLORS.badgeHighText, transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = UI_COLORS.surfaceAlt} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>🚪 Esci</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};