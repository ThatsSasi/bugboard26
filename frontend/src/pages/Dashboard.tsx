import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import type { DashboardMetrics } from '../types';
import { authService } from '../services/authService';
import { UI_COLORS } from '../styles/theme';

export const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // NUOVO: Stato per il selettore del mese (inizializzato al mese corrente)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Controllo Proattivo dei Permessi lato Frontend
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'ADMIN') {
        // Se è un utente normale, lo rimandiamo alla Board senza disconnetterlo
        navigate('/');
        return;
      }
    } catch (e) {
      authService.logout();
      navigate('/login');
      return;
    }

    // 2. Recupero delle metriche (avviene solo se si è superato il blocco sopra)
    const fetchMetrics = async () => {
      try {
        const [year, month] = selectedMonth.split('-'); // Estraiamo YYYY e MM stringa
        const data = await reportService.getDashboardMetrics(Number(month), Number(year));
        setMetrics(data);
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          authService.logout();
          navigate('/login');
        } else {
          setError('Impossibile caricare le metriche. Errore di comunicazione col server.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [navigate, selectedMonth]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'var(--sans)', color: UI_COLORS.textPrimary }}>Caricamento Report...</div>;
  if (error) return <div style={{ textAlign: 'center', marginTop: '50px', color: UI_COLORS.badgeHighText, fontWeight: 'bold', padding: '20px' }}>{error}</div>;
  if (!metrics) return null;

  return (
    <div style={{ padding: '20px', fontFamily: 'var(--sans)', minHeight: '100vh', boxSizing: 'border-box', backgroundColor: UI_COLORS.background, color: UI_COLORS.textPrimary }}>
      {/* STILI GLOBALI (Solo Scrollbar) */}
      <style>
        {`
          ::-webkit-scrollbar, .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track, .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${UI_COLORS.border};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover, .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${UI_COLORS.textMuted};
          }
          * {
            scrollbar-width: thin;
            scrollbar-color: ${UI_COLORS.border} transparent;
          }
        `}
      </style>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${UI_COLORS.border}`, paddingBottom: '15px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: UI_COLORS.textPrimary }}>Report Mensile Attività</h2>
              <p style={{ margin: '5px 0 0 0', color: UI_COLORS.textMuted, fontSize: '14px' }}>Dashboard riservata agli Amministratori</p>
            </div>
            
            {/* NUOVO: Selettori espliciti per Mese e Anno */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: UI_COLORS.textMuted, fontWeight: 'bold', marginRight: '5px' }}>📅 PERIODO:</span>
              
              {/* TENDINA MESE */}
              <select 
                value={selectedMonth.split('-')[1]} 
                onChange={(e) => setSelectedMonth(`${selectedMonth.split('-')[0]}-${e.target.value}`)}
                style={{ padding: '8px 12px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.surface, fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
              >
                <option value="01">Gennaio</option>
                <option value="02">Febbraio</option>
                <option value="03">Marzo</option>
                <option value="04">Aprile</option>
                <option value="05">Maggio</option>
                <option value="06">Giugno</option>
                <option value="07">Luglio</option>
                <option value="08">Agosto</option>
                <option value="09">Settembre</option>
                <option value="10">Ottobre</option>
                <option value="11">Novembre</option>
                <option value="12">Dicembre</option>
              </select>

              {/* TENDINA ANNO */}
              <select 
                value={selectedMonth.split('-')[0]} 
                onChange={(e) => setSelectedMonth(`${e.target.value}-${selectedMonth.split('-')[1]}`)}
                style={{ padding: '8px 12px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.surface, fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
              >
                {/* Genera dinamicamente l'anno in corso e i 4 anni precedenti */}
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/')} 
            style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: UI_COLORS.buttonSecondary, color: UI_COLORS.buttonSecondaryText, border: `1px solid ${UI_COLORS.border}`, borderRadius: '4px', fontWeight: 'bold', transition: 'background-color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = UI_COLORS.border}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = UI_COLORS.buttonSecondary}
          >
            ← Torna alla Board
          </button>
        </div>

        {/* METRICHE AGGREGATE (Cards) */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
          <div style={{ flex: 1, backgroundColor: UI_COLORS.surface, padding: '25px', borderRadius: '4px', border: `1px solid ${UI_COLORS.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: UI_COLORS.textMuted, fontSize: '13px', textTransform: 'uppercase' }}>Issue Aperti</h4>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: UI_COLORS.badgeHighText }}>
              {metrics.aggregate.totalOpen}
            </div>
          </div>
          
          <div style={{ flex: 1, backgroundColor: UI_COLORS.surface, padding: '25px', borderRadius: '4px', border: `1px solid ${UI_COLORS.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: UI_COLORS.textMuted, fontSize: '13px', textTransform: 'uppercase' }}>Issue Risolti</h4>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: UI_COLORS.badgeLowText }}>
              {metrics.aggregate.totalResolved}
            </div>
          </div>

          <div style={{ flex: 1, backgroundColor: UI_COLORS.surface, padding: '25px', borderRadius: '4px', border: `1px solid ${UI_COLORS.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: UI_COLORS.textMuted, fontSize: '13px', textTransform: 'uppercase' }}>Tempo Medio Risoluzione</h4>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: UI_COLORS.primary }}>
              {metrics.aggregate.avgResolutionTimeHours.toFixed(1)} <span style={{ fontSize: '16px', color: UI_COLORS.textMuted }}>ore</span>
            </div>
          </div>
        </div>

        {/* METRICHE DETTAGLIATE UTENTI (Tabella) */}
        <h3 style={{ margin: '0 0 20px 0', fontWeight: '600', fontSize: '20px' }}>Carico di Lavoro per Utente</h3>
        <div style={{ backgroundColor: UI_COLORS.surface, borderRadius: '4px', border: `1px solid ${UI_COLORS.border}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${UI_COLORS.border}`, textAlign: 'left' }}>
                <th style={{ padding: '15px', color: UI_COLORS.textMuted, fontSize: '12px' }}>UTENTE</th>
                <th style={{ padding: '15px', color: UI_COLORS.textMuted, fontSize: '12px', width: '180px' }}>IN CARICO (APERTI)</th>
                <th style={{ padding: '15px', color: UI_COLORS.textMuted, fontSize: '12px', width: '180px' }}>RISOLTI</th>
                <th style={{ padding: '15px', color: UI_COLORS.textMuted, fontSize: '12px', width: '200px' }}>TEMPO MEDIO (ORE)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.userMetrics.map((user) => (
                <tr 
                  key={user.userId} 
                  style={{ borderBottom: `1px solid ${UI_COLORS.border}`, transition: 'background-color 0.1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = UI_COLORS.surfaceAlt} 
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '15px', color: UI_COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* AVATAR: Se c'è l'immagine la mostra, altrimenti mostra l'iniziale del nome (o email se manca) */}
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${UI_COLORS.border}` }} />
                    ) : (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: UI_COLORS.background, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', color: UI_COLORS.textPrimary }}>
                        {(user.fullName || user.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* NOME ED EMAIL: Mostra il nome in grassetto e l'email piccola sotto (se il nome è disponibile) */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '500', fontSize: '14px' }}>
                        {user.fullName || user.email.split('@')[0]}
                      </span>
                      {user.fullName && (
                        <span style={{ fontSize: '11px', color: UI_COLORS.textMuted }}>
                          {user.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ backgroundColor: UI_COLORS.badgeHighBg, color: UI_COLORS.badgeHighText, padding: '4px 10px', borderRadius: '3px', fontWeight: 'bold', fontSize: '13px' }}>
                      {user.openIssues}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ backgroundColor: UI_COLORS.badgeLowBg, color: UI_COLORS.badgeLowText, padding: '4px 10px', borderRadius: '3px', fontWeight: 'bold', fontSize: '13px' }}>
                      {user.resolvedIssues}
                    </span>
                  </td>
                  <td style={{ padding: '15px', color: UI_COLORS.textMuted, fontWeight: '500', fontSize: '14px' }}>
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