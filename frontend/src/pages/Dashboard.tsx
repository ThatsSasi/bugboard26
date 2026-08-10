import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueService, type DashboardMetrics } from '../services/issueService';
import { authService } from '../services/authService';

// --- PALETTE COLORI (Allineata a BugBoard26) ---
const UI_COLORS = {
  background: '#E1E4E8',
  surface: '#FFFFFF',    
  surfaceAlt: '#F6F8FA',
  textPrimary: '#172B4D',
  textMuted: '#5E6C84',  
  border: '#D1D5DA',     
  primary: '#0052CC',    
  buttonSecondary: '#EBECF0',
  buttonSecondaryText: '#172B4D',
  badgeHighBg: '#FFEBE6', badgeHighText: '#BF2600',
  badgeMedBg: '#FFFAE6',  badgeMedText: '#FF8B00',
  badgeLowBg: '#E3FCEF',  badgeLowText: '#006644',
};

export const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await issueService.getDashboardMetrics();
        setMetrics(data);
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          authService.logout();
          navigate('/login');
        } else {
          setError('Impossibile caricare le metriche. Assicurati di avere i permessi di amministratore.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [navigate]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif', color: UI_COLORS.textPrimary }}>Caricamento Report...</div>;
  if (error) return <div style={{ textAlign: 'center', marginTop: '50px', color: UI_COLORS.badgeHighText }}>{error}</div>;
  if (!metrics) return null;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', boxSizing: 'border-box', backgroundColor: UI_COLORS.background, color: UI_COLORS.textPrimary }}>
      {/* STILI GLOBALI (Solo Scrollbar) */}
      <style>
        {`
          /* 1. Applica la scrollbar personalizzata SIA alla cronologia CHE a tutta la pagina */
          ::-webkit-scrollbar, .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px; /* Utile in caso di scroll orizzontale */
          }
          ::-webkit-scrollbar-track, .custom-scrollbar::-webkit-scrollbar-track {
            background: ${UI_COLORS.background};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${UI_COLORS.border};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover, .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${UI_COLORS.textMuted};
          }
          
          /* 2. Supporto per Firefox (applicato globalmente) */
          * {
            scrollbar-width: thin;
            scrollbar-color: ${UI_COLORS.border} ${UI_COLORS.background};
          }
        `}
      </style>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${UI_COLORS.border}`, paddingBottom: '15px', marginBottom: '30px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: UI_COLORS.textPrimary }}>Report Mensile Attività</h2>
            <p style={{ margin: '5px 0 0 0', color: UI_COLORS.textMuted, fontSize: '14px' }}>Dashboard riservata agli Amministratori</p>
          </div>
          <button 
            onClick={() => navigate('/')} 
            style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: UI_COLORS.buttonSecondary, color: UI_COLORS.buttonSecondaryText, border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            ← Torna alla Board
          </button>
        </div>

        {/* METRICHE AGGREGATE (Cards) */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
          <div style={{ flex: 1, backgroundColor: UI_COLORS.surface, padding: '25px', borderRadius: '8px', border: `1px solid ${UI_COLORS.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: UI_COLORS.textMuted, fontSize: '13px', textTransform: 'uppercase' }}>Issue Aperti</h4>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: UI_COLORS.badgeHighText }}>
              {metrics.aggregate.totalOpen}
            </div>
          </div>
          
          <div style={{ flex: 1, backgroundColor: UI_COLORS.surface, padding: '25px', borderRadius: '8px', border: `1px solid ${UI_COLORS.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: UI_COLORS.textMuted, fontSize: '13px', textTransform: 'uppercase' }}>Issue Risolti</h4>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: UI_COLORS.badgeLowText }}>
              {metrics.aggregate.totalResolved}
            </div>
          </div>

          <div style={{ flex: 1, backgroundColor: UI_COLORS.surface, padding: '25px', borderRadius: '8px', border: `1px solid ${UI_COLORS.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: UI_COLORS.textMuted, fontSize: '13px', textTransform: 'uppercase' }}>Tempo Medio Risoluzione</h4>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: UI_COLORS.primary }}>
              {metrics.aggregate.avgResolutionTimeHours.toFixed(1)} <span style={{ fontSize: '16px', color: UI_COLORS.textMuted }}>ore</span>
            </div>
          </div>
        </div>

        {/* METRICHE DETTAGLIATE UTENTI (Tabella) */}
        <h3 style={{ margin: '0 0 20px 0', fontWeight: '600', fontSize: '20px' }}>Carico di Lavoro per Utente</h3>
        <div style={{ backgroundColor: UI_COLORS.surface, borderRadius: '8px', border: `1px solid ${UI_COLORS.border}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: '#F0F2F4', borderBottom: `2px solid ${UI_COLORS.textMuted}`, textAlign: 'left' }}>
                <th style={{ padding: '15px', color: UI_COLORS.textMuted, fontSize: '12px' }}>UTENTE</th>
                <th style={{ padding: '15px', color: UI_COLORS.textMuted, fontSize: '12px', width: '150px' }}>IN CARICO (APERTI)</th>
                <th style={{ padding: '15px', color: UI_COLORS.textMuted, fontSize: '12px', width: '150px' }}>RISOLTI</th>
                <th style={{ padding: '15px', color: UI_COLORS.textMuted, fontSize: '12px', width: '200px' }}>TEMPO MEDIO (ORE)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.userMetrics.map((user, index) => (
                <tr key={user.userId} style={{ backgroundColor: index % 2 === 0 ? UI_COLORS.surface : UI_COLORS.surfaceAlt, borderBottom: `1px solid ${UI_COLORS.border}` }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: UI_COLORS.textPrimary }}>{user.email}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ backgroundColor: UI_COLORS.badgeHighBg, color: UI_COLORS.badgeHighText, padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {user.openIssues}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ backgroundColor: UI_COLORS.badgeLowBg, color: UI_COLORS.badgeLowText, padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {user.resolvedIssues}
                    </span>
                  </td>
                  <td style={{ padding: '15px', color: UI_COLORS.textMuted, fontWeight: '500' }}>
                    {user.avgResolutionTimeHours > 0 ? user.avgResolutionTimeHours.toFixed(1) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};