import React from 'react';
import { UI_COLORS } from '../styles/theme';

type FilterType = 'ALL' | 'MY_OPEN' | 'DONE' | 'ARCHIVED';

interface SidebarProps {
  activeFilter: FilterType;
  loggedUserRole: string | null;
  onFilterChange: (filter: FilterType) => void;
  onOpenAdminModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeFilter, 
  loggedUserRole, 
  onFilterChange, 
  onOpenAdminModal 
}) => {
  return (
    <aside style={{ width: '240px', backgroundColor: UI_COLORS.background, borderRight: `1px solid ${UI_COLORS.border}`, display: 'flex', flexDirection: 'column', padding: '20px 0' }}>
      <div style={{ padding: '0 20px', marginBottom: '15px', color: UI_COLORS.textMuted, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
        Filtri Rapidi
      </div>
      
      <div 
        onClick={() => onFilterChange('ALL')} 
        style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: activeFilter === 'ALL' ? '#EBECF0' : 'transparent', color: activeFilter === 'ALL' ? UI_COLORS.primary : UI_COLORS.textPrimary, fontWeight: activeFilter === 'ALL' ? 'bold' : 'normal', borderLeft: activeFilter === 'ALL' ? `4px solid ${UI_COLORS.primary}` : '4px solid transparent' }}
      >
        Tutte le issue
      </div>
      
      <div 
        onClick={() => onFilterChange('MY_OPEN')} 
        style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: activeFilter === 'MY_OPEN' ? '#EBECF0' : 'transparent', color: activeFilter === 'MY_OPEN' ? UI_COLORS.primary : UI_COLORS.textPrimary, fontWeight: activeFilter === 'MY_OPEN' ? 'bold' : 'normal', borderLeft: activeFilter === 'MY_OPEN' ? `4px solid ${UI_COLORS.primary}` : '4px solid transparent' }}
      >
        Le mie issue aperte
      </div>
      
      <div 
        onClick={() => onFilterChange('DONE')} 
        style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: activeFilter === 'DONE' ? '#EBECF0' : 'transparent', color: activeFilter === 'DONE' ? UI_COLORS.primary : UI_COLORS.textPrimary, fontWeight: activeFilter === 'DONE' ? 'bold' : 'normal', borderLeft: activeFilter === 'DONE' ? `4px solid ${UI_COLORS.primary}` : '4px solid transparent' }}
      >
        Issue chiuse
      </div>
      
      {/* VOCI DEDICATE AGLI ADMIN */}
      {loggedUserRole === 'ADMIN' && (
        <div 
          onClick={() => onFilterChange('ARCHIVED')} 
          style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: activeFilter === 'ARCHIVED' ? '#EBECF0' : 'transparent', color: activeFilter === 'ARCHIVED' ? UI_COLORS.primary : UI_COLORS.textPrimary, fontWeight: activeFilter === 'ARCHIVED' ? 'bold' : 'normal', borderLeft: activeFilter === 'ARCHIVED' ? `4px solid ${UI_COLORS.primary}` : '4px solid transparent' }}
        >
          Issue archiviate
        </div>
      )}

      {loggedUserRole === 'ADMIN' && (
        <>
          <div style={{ padding: '0 20px', margin: '30px 0 15px 0', color: UI_COLORS.textMuted, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Amministrazione
          </div>
          <div 
            onClick={onOpenAdminModal} 
            style={{ padding: '10px 20px', cursor: 'pointer', color: UI_COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: '10px', transition: 'background-color 0.2s' }} 
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = UI_COLORS.surfaceAlt} 
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: '16px' }}>👤</span> Nuovo Utente
          </div>
        </>
      )}
    </aside>
  );
};