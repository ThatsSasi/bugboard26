import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueService, type Issue, type HistoryLog, type User, type AppNotification } from '../services/issueService';
import { authService } from '../services/authService';

// --- PALETTE COLORI ---
const UI_COLORS = {
  background: '#E1E4E8', // Sfondo globale più scuro (più contrasto)
  surface: '#FFFFFF',    
  surfaceAlt: '#F6F8FA', // NUOVO: Grigio neve per righe alternate
  textPrimary: '#172B4D',
  textMuted: '#5E6C84',  
  border: '#D1D5DA',     // Bordi leggermente più marcati
  primary: '#0052CC',    
  primaryHover: '#0047B3',
  buttonSecondary: '#EBECF0',
  buttonSecondaryText: '#172B4D',
  
  badgeHighBg: '#FFEBE6', badgeHighText: '#BF2600',
  badgeMedBg: '#FFFAE6',  badgeMedText: '#FF8B00',
  badgeLowBg: '#E3FCEF',  badgeLowText: '#006644',
  badgeTypeBg: '#DEEBFF', badgeTypeText: '#0747A6',
  badgeStatusBg: '#EAE6FF', badgeStatusText: '#403294'
};

export const Board = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [tempSearch, setTempSearch] = useState('');
  const [tempTagSearch, setTempTagSearch] = useState('');
  const [tempStatus, setTempStatus] = useState('TUTTI');
  const [tempType, setTempType] = useState('TUTTI');
  const [tempSort, setTempSort] = useState('DESC');

  const [appliedFilters, setAppliedFilters] = useState({
    search: '', tag: '', status: 'TUTTI', type: 'TUTTI', sort: 'DESC' // <-- Aggiunto 'tag: ""'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState('BUG'); 
  const [newPriority, setNewPriority] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [issueHistory, setIssueHistory] = useState<HistoryLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loggedUserEmail, setLoggedUserEmail] = useState<string>('Caricamento...');
  const [newTagInput, setNewTagInput] = useState('');
  // NUOVI STATI PER LE NOTIFICHE
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  // NUOVO: Ascoltatore per il click esterno
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Se la tendina è aperta e il click avviene fuori dal div "notifRef", chiudila
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    // Aggiungiamo l'ascoltatore al documento
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup: rimuoviamo l'ascoltatore quando il componente viene smontato
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [issuesData, usersData, notifData] = await Promise.all([
          issueService.getAll(),
          issueService.getUsers(),
          issueService.getNotifications()
        ]);
        setIssues(issuesData);
        setUsers(usersData);
        setNotifications(notifData);

        // --- INIZIO NUOVO BLOCCO: IDENTIFICAZIONE UTENTE ---
        try {
          // Nota: Assicurati che 'token' sia la chiave esatta usata nel tuo authService al momento del login
          const token = localStorage.getItem('token'); 
          if (token) {
            // Decodifica il payload del JWT nativamente
            const payload = JSON.parse(atob(token.split('.')[1])); 
            
            // Se il backend ha inserito l'email direttamente nel token:
            if (payload.email) {
              setLoggedUserEmail(payload.email.split('@')[0]); // Opzionale: mostra solo la parte prima della @
            } 
            // Altrimenti, se c'è solo il userId (come nel tuo backend), cerchiamolo nella lista utenti:
            else if (payload.userId) {
              const me = usersData.find((u: User) => u.id === payload.userId);
              if (me) setLoggedUserEmail(me.email);
            }
          } else {
             setLoggedUserEmail('Ospite');
          }
        } catch (e) {
          console.warn("Impossibile leggere l'utente dal token");
          setLoggedUserEmail('Utente');
        }
        // --- FINE NUOVO BLOCCO ---

      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          authService.logout();
          navigate('/login');
        } else {
          setError('Impossibile caricare i dati della board.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [navigate]);

  useEffect(() => {
    if (selectedIssue?.id) {
      setLoadingHistory(true);
      issueService.getHistory(selectedIssue.id)
        .then(data => setIssueHistory(data))
        .catch(err => console.error("Errore nel caricamento della cronologia:", err))
        .finally(() => setLoadingHistory(false));
    } else {
      setIssueHistory([]);
    }
  }, [selectedIssue?.id]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) setImageFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setImageFile(e.target.files[0]);
  };

  const handleCreateIssue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newTitle);
      formData.append('description', newDescription);
      formData.append('type', newType);
      if (newPriority !== '') formData.append('priority', newPriority);
      if (imageFile) formData.append('image', imageFile);

      const createdIssue = await issueService.create(formData);
      setIssues([createdIssue, ...issues]); 
      
      setNewTitle(''); setNewDescription(''); setNewType('BUG'); setNewPriority(''); setImageFile(null);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Errore durante la creazione');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedIssue) return;
    const previousStatus = selectedIssue.status;
    if (previousStatus === newStatus) return;

    // 1. Aggiornamento Ottimistico visivo immediato (Modale e Tabella)
    const updatedIssue = { ...selectedIssue, status: newStatus as Issue['status'] };
    setSelectedIssue(updatedIssue);
    setIssues(issues.map(i => i.id === selectedIssue.id ? updatedIssue : i));

    try {
      // 2. Chiamata al Backend
      await issueService.updateStatus(selectedIssue.id, newStatus);
      
      // 3. Scarichiamo la nuova history per mostrare il log del cambio stato!
      const newHistory = await issueService.getHistory(selectedIssue.id);
      setIssueHistory(newHistory);
      
    } catch (error) {
      // Rollback in caso di errore
      setSelectedIssue({ ...selectedIssue, status: previousStatus });
      setIssues(issues.map(i => i.id === selectedIssue.id ? { ...selectedIssue, status: previousStatus } : i));
      alert("Errore di comunicazione col server. Spostamento annullato.");
    }
  };

  const handleAssignUser = async (userIdStr: string) => {
    if (!selectedIssue) return;
    
    // Se la stringa è vuota, significa che stiamo rimuovendo l'assegnazione
    const userId = userIdStr === "" ? null : Number(userIdStr);
    const previousAssignee = selectedIssue.assignee;

    // 1. Aggiornamento Ottimistico visivo immediato
    const assignedUser = users.find(u => u.id === userId) || null;
    const updatedIssue = { ...selectedIssue, assignee: assignedUser };
    setSelectedIssue(updatedIssue);
    setIssues(issues.map(i => i.id === selectedIssue.id ? updatedIssue : i));

    try {
      // 2. Chiamata al Backend
      await issueService.assignUser(selectedIssue.id, userId);
      
      // 3. Scarichiamo la nuova history per mostrare il log dell'assegnazione
      const newHistory = await issueService.getHistory(selectedIssue.id);
      setIssueHistory(newHistory);
      
    } catch (error) {
      // Rollback in caso di errore
      setSelectedIssue({ ...selectedIssue, assignee: previousAssignee });
      setIssues(issues.map(i => i.id === selectedIssue.id ? { ...selectedIssue, assignee: previousAssignee } : i));
      alert("Errore di comunicazione col server durante l'assegnazione.");
    }
  };

  const handleAddTag = async () => {
    if (!selectedIssue || !newTagInput.trim()) return;
    try {
      const updatedIssue = await issueService.addTag(selectedIssue.id, newTagInput);
      setSelectedIssue(updatedIssue);
      setIssues(issues.map(i => i.id === selectedIssue.id ? updatedIssue : i));
      setNewTagInput(''); // Resetta l'input
    } catch (error) {
      alert("Errore durante l'aggiunta dell'etichetta.");
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!selectedIssue) return;
    try {
      const updatedIssue = await issueService.removeTag(selectedIssue.id, tagId);
      setSelectedIssue(updatedIssue);
      setIssues(issues.map(i => i.id === selectedIssue.id ? updatedIssue : i));
    } catch (error) {
      alert("Errore durante la rimozione dell'etichetta.");
    }
  };

  const handleReadNotification = async (id: number) => {
    try {
      await issueService.markNotificationAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Errore durante l'aggiornamento della notifica");
    }
  };

  const applyFilters = () => {
    // Aggiunto tempTagSearch all'aggiornamento
    setAppliedFilters({ search: tempSearch, tag: tempTagSearch, status: tempStatus, type: tempType, sort: tempSort });
    setCurrentPage(1); 
  };

  const clearFilters = () => {
    setTempSearch('');
    setTempTagSearch('');
    setTempStatus('TUTTI');
    setTempType('TUTTI');
    setTempSort('DESC');
    
    setAppliedFilters({ search: '', tag: '', status: 'TUTTI', type: 'TUTTI', sort: 'DESC' });
    setCurrentPage(1);
  };

  let processedIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(appliedFilters.search.toLowerCase());
    const matchesStatus = appliedFilters.status === 'TUTTI' || issue.status === appliedFilters.status;
    const matchesType = appliedFilters.type === 'TUTTI' || issue.type === appliedFilters.type;
    
    // NUOVO: Controlla se almeno uno dei tag della issue contiene il testo cercato
    const matchesTag = appliedFilters.tag === '' || 
      (issue.tags && issue.tags.some(t => t.name.toLowerCase().includes(appliedFilters.tag.toLowerCase())));
      
    // Applica tutte le condizioni insieme
    return matchesSearch && matchesStatus && matchesType && matchesTag;
  });

  processedIssues = processedIssues.sort((a, b) => appliedFilters.sort === 'DESC' ? b.id - a.id : a.id - b.id);
  const totalPages = Math.ceil(processedIssues.length / itemsPerPage) || 1;
  const paginatedIssues = processedIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif', color: UI_COLORS.textPrimary }}>Caricamento...</div>;

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
        
        {/* HEADER CON SISTEMA DI NOTIFICHE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${UI_COLORS.border}`, paddingBottom: '15px', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: UI_COLORS.textPrimary }}>BugBoard26</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            
            {/* CAMPANELLA NOTIFICHE */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '20px', position: 'relative' }}
              >
                🔔
                {/* BADGE ROSSO per notifiche non lette */}
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: UI_COLORS.badgeHighText, color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              {/* TENDINA NOTIFICHE (Dropdown) */}
              {isNotifOpen && (
                <div style={{ position: 'absolute', top: '35px', right: '0', width: '300px', backgroundColor: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: '8px', boxShadow: '0 8px 16px rgba(0,0,0,0.15)', zIndex: 9999 }}>
                  <div style={{ padding: '10px 15px', borderBottom: `1px solid ${UI_COLORS.border}`, fontWeight: 'bold', fontSize: '14px', backgroundColor: UI_COLORS.background, borderRadius: '8px 8px 0 0' }}>
                    Le tue Notifiche
                  </div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }} className="custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: UI_COLORS.textMuted, fontSize: '13px' }}>Nessuna notifica</div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => handleReadNotification(notif.id)}
                          style={{ padding: '12px 15px', borderBottom: `1px solid ${UI_COLORS.border}`, cursor: 'pointer', backgroundColor: notif.isRead ? UI_COLORS.surface : UI_COLORS.badgeTypeBg, transition: 'background-color 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = UI_COLORS.background}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.isRead ? UI_COLORS.surface : UI_COLORS.badgeTypeBg}
                        >
                          <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: UI_COLORS.textPrimary }}>{notif.message}</p>
                          <span style={{ fontSize: '10px', color: UI_COLORS.textMuted }}>{new Date(notif.createdAt).toLocaleDateString('it-IT')}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <span style={{ fontWeight: '500', color: UI_COLORS.textMuted, borderLeft: `1px solid ${UI_COLORS.border}`, paddingLeft: '20px' }}>
              👤 {loggedUserEmail}
            </span>
            <button 
              onClick={() => navigate('/dashboard')} 
              style={{ cursor: 'pointer', background: 'none', border: 'none', color: UI_COLORS.textPrimary, fontWeight: 'bold', fontSize: '14px' }}
            >
              Dashboard Report
            </button>
            <button onClick={handleLogout} style={{ cursor: 'pointer', background: 'none', border: 'none', color: UI_COLORS.primary, fontWeight: 'bold' }}>Esci</button>
          </div>
        </div>

        {error && <div style={{ backgroundColor: UI_COLORS.badgeHighBg, color: UI_COLORS.badgeHighText, padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}

        {/* TITOLO E BOTTONE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontWeight: '600', fontSize: '20px' }}>Lista Issue</h3>
          <button onClick={() => setIsModalOpen(true)} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: UI_COLORS.primary, color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            + Nuova Issue
          </button>
        </div>

        {/* BOX FILTRI */}
        <div style={{ backgroundColor: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, padding: '25px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: UI_COLORS.textMuted, fontSize: '14px', textTransform: 'uppercase' }}>Filtri di Ricerca</h4>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>
            
            {/* INPUT E SELECT AGGIORNATI CON LA PALETTE */}
            <div style={{ flex: '1 1 250px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Ricerca testo:</label>
              <input 
                type="text" 
                placeholder="Cerca per titolo..." 
                value={tempSearch} 
                onChange={(e) => setTempSearch(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()} 
                style={{ width: '100%', padding: '10px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', boxSizing: 'border-box', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }} 
              />
            </div>

            {/* INPUT RICERCA ETICHETTA */}
            <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Etichetta:</label>
              <input 
                type="text" 
                placeholder="es. frontend..." 
                value={tempTagSearch} 
                onChange={(e) => setTempTagSearch(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()} 
                style={{ width: '100%', padding: '10px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', boxSizing: 'border-box', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }} 
              />
            </div>

            <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Stato:</label>
              <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value)} style={{ width: '100%', padding: '10px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }}>
                <option value="TUTTI">Tutti</option>
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Tipologia:</label>
              <select value={tempType} onChange={(e) => setTempType(e.target.value)} style={{ width: '100%', padding: '10px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }}>
                <option value="TUTTI">Tutti</option>
                <option value="BUG">Bug</option>
                <option value="FEATURE">Feature</option>
                <option value="QUESTION">Question</option>
                <option value="DOCUMENTATION">Doc</option>
              </select>
            </div>

            <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Ordina per:</label>
              <select value={tempSort} onChange={(e) => setTempSort(e.target.value)} style={{ width: '100%', padding: '10px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }}>
                <option value="DESC">Più recenti</option>
                <option value="ASC">Meno recenti</option>
              </select>
            </div>

            {/* BOTTONI FILTRI */}
            <div style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button 
                onClick={clearFilters} 
                style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: 'transparent', color: UI_COLORS.textMuted, border: `1px solid ${UI_COLORS.border}`, borderRadius: '4px', fontWeight: 'bold', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = UI_COLORS.surfaceAlt}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Rimuovi Filtri
              </button>
              
              <button 
                onClick={applyFilters} 
                style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: UI_COLORS.buttonSecondary, color: UI_COLORS.buttonSecondaryText, border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
              >
                Applica Filtri
              </button>
            </div>
          </div>
        </div>

        {/* TABELLA ISSUE */}
        <div style={{ backgroundColor: UI_COLORS.surface, borderRadius: '8px', border: `1px solid ${UI_COLORS.border}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: '#F0F2F4', borderBottom: `2px solid ${UI_COLORS.textMuted}`, textAlign: 'left' }}>
                <th style={{ padding: '15px', color: UI_COLORS.textMuted, fontSize: '12px', width: '60px' }}>ID</th>
                <th style={{ padding: '15px', color: UI_COLORS.textMuted, fontSize: '12px' }}>TITOLO</th>
                <th style={{ padding: '15px', color: UI_COLORS.textMuted, fontSize: '12px', width: '150px' }}>TIPO</th>
                <th style={{ padding: '15px', color: UI_COLORS.textMuted, fontSize: '12px', width: '150px' }}>STATO</th>
                <th style={{ padding: '15px', color: UI_COLORS.textMuted, fontSize: '12px', width: '100px' }}>PRIORITÀ</th>
              </tr>
            </thead>
            <tbody>
              {paginatedIssues.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', fontStyle: 'italic', color: UI_COLORS.textMuted }}>Nessuna issue trovata.</td></tr>
              ) : (
                paginatedIssues.map(issue => (
                  <tr key={issue.id} onClick={() => setSelectedIssue(issue)} style={{ borderBottom: `1px solid ${UI_COLORS.border}`, cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = UI_COLORS.background} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '15px', color: UI_COLORS.textMuted, fontWeight: '500' }}>#{issue.id}</td>
                    <td style={{ padding: '15px', whiteSpace: 'normal', wordBreak: 'break-word', fontWeight: '500' }}>{issue.title}</td>
                    <td style={{ padding: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={issue.type}>
                      <span style={{ backgroundColor: UI_COLORS.badgeTypeBg, color: UI_COLORS.badgeTypeText, padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{issue.type}</span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ backgroundColor: UI_COLORS.badgeStatusBg, color: UI_COLORS.badgeStatusText, padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{issue.status}</span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      {issue.priority && (
                        <span style={{ backgroundColor: issue.priority === 'HIGH' ? UI_COLORS.badgeHighBg : issue.priority === 'MEDIUM' ? UI_COLORS.badgeMedBg : UI_COLORS.badgeLowBg, color: issue.priority === 'HIGH' ? UI_COLORS.badgeHighText : issue.priority === 'MEDIUM' ? UI_COLORS.badgeMedText : UI_COLORS.badgeLowText, padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                          {issue.priority}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLLI DI PAGINAZIONE */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} style={{ padding: '10px 15px', border: `1px solid ${UI_COLORS.border}`, backgroundColor: UI_COLORS.surface, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', borderRadius: '4px', color: currentPage === 1 ? UI_COLORS.textMuted : UI_COLORS.textPrimary }}>Precedente</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} style={{ padding: '10px 15px', border: `1px solid ${currentPage === page ? UI_COLORS.primary : UI_COLORS.border}`, backgroundColor: currentPage === page ? UI_COLORS.primary : UI_COLORS.surface, color: currentPage === page ? 'white' : UI_COLORS.textPrimary, cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>{page}</button>
            ))}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} style={{ padding: '10px 15px', border: `1px solid ${UI_COLORS.border}`, backgroundColor: UI_COLORS.surface, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', borderRadius: '4px', color: currentPage === totalPages ? UI_COLORS.textMuted : UI_COLORS.textPrimary }}>Successiva</button>
          </div>
        )}

        {/* OVERLAY MODALE CREAZIONE */}
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
            <div style={{ backgroundColor: UI_COLORS.surface, padding: '30px', borderRadius: '8px', width: '600px', maxWidth: '90%', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${UI_COLORS.border}`, paddingBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: UI_COLORS.textPrimary }}>Crea Nuova Issue</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ cursor: 'pointer', backgroundColor: 'transparent', border: 'none', fontSize: '18px', color: UI_COLORS.textMuted }}>✖</button>
              </div>
              
              <form onSubmit={handleCreateIssue} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* INPUT AGGIORNATI NELLA MODALE DI CREAZIONE */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Titolo *</label>
                  <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }} />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Descrizione *</label>
                  <textarea required value={newDescription} onChange={(e) => setNewDescription(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', minHeight: '120px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', resize: 'vertical', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }} />
                </div>
                
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Tipologia</label>
                    <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }}>
                      <option value="BUG">Bug</option>
                      <option value="FEATURE">Feature</option>
                      <option value="QUESTION">Question</option>
                      <option value="DOCUMENTATION">Documentation</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Priorità</label>
                    <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }}>
                      <option value="">Seleziona...</option>
                      <option value="LOW">Bassa</option>
                      <option value="MEDIUM">Media</option>
                      <option value="HIGH">Alta</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Allegato (Immagine)</label>
                  <div onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} style={{ border: `2px dashed ${UI_COLORS.border}`, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', backgroundColor: UI_COLORS.background, borderRadius: '8px' }}>
                    {imageFile ? <span style={{ color: UI_COLORS.badgeLowText, fontWeight: 'bold' }}>✓ {imageFile.name}</span> : <div style={{ color: UI_COLORS.textMuted }}><span style={{ fontSize: '24px', display: 'block', marginBottom: '10px' }}>📷</span>Trascina qui un immagine o clicca per caricare</div>}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: 'transparent', color: UI_COLORS.textPrimary, border: 'none', fontWeight: 'bold' }}>Annulla</button>
                  <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: UI_COLORS.primary, color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Crea Issue</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* OVERLAY MODALE DI DETTAGLIO */}
        {selectedIssue && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }} onClick={() => setSelectedIssue(null)}>
            <div style={{ backgroundColor: UI_COLORS.surface, padding: '30px', borderRadius: '8px', width: '1000px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', gap: '30px', cursor: 'default', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ flex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '18px', color: UI_COLORS.textMuted }}>#{selectedIssue.id}</span>
                  <h2 style={{ margin: 0, fontSize: '24px', wordBreak: 'break-word', color: UI_COLORS.textPrimary }}>{selectedIssue.title}</h2>
                </div>
                <div style={{ marginBottom: '20px' }}><h4 style={{ margin: '0 0 10px 0', color: UI_COLORS.textMuted }}>Descrizione</h4><div style={{ backgroundColor: UI_COLORS.background, padding: '20px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6', color: UI_COLORS.textPrimary }}>{selectedIssue.description}</div></div>
                {selectedIssue.imageUrl && (
                  <div><h4 style={{ margin: '0 0 10px 0', color: UI_COLORS.textMuted }}>Allegato</h4><a href={selectedIssue.imageUrl} target="_blank" rel="noopener noreferrer"><img src={selectedIssue.imageUrl} alt="Allegato Issue" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', backgroundColor: UI_COLORS.background, borderRadius: '4px', border: `1px solid ${UI_COLORS.border}` }} /></a></div>
                )}
              </div>
              <div style={{ flex: 1, borderLeft: `1px solid ${UI_COLORS.border}`, paddingLeft: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}><button onClick={() => setSelectedIssue(null)} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: UI_COLORS.buttonSecondary, color: UI_COLORS.buttonSecondaryText, border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>X Chiudi</button></div>
                {/* CAMBIO DI STATO INTERATTIVO */}
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ margin: '0 0 5px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '12px' }}>Stato Attuale</h5>
                <select 
                  value={selectedIssue.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{ 
                    padding: '6px 10px', 
                    backgroundColor: UI_COLORS.badgeStatusBg, 
                    color: UI_COLORS.badgeStatusText, 
                    borderRadius: '4px', 
                    fontWeight: 'bold',
                    border: `1px solid ${UI_COLORS.primary}`,
                    cursor: 'pointer',
                    width: '100%',
                    outline: 'none'
                  }}
                >
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
                <div style={{ marginBottom: '20px' }}><h5 style={{ margin: '0 0 5px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '12px' }}>Tipologia</h5><span style={{ backgroundColor: UI_COLORS.badgeTypeBg, color: UI_COLORS.badgeTypeText, padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{selectedIssue.type}</span></div>
                {/* --- INIZIO NUOVO BLOCCO ASSEGNAZIONE UTENTE --- */}
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ margin: '0 0 5px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '12px' }}>Assegnato a</h5>
                  <select 
                    value={selectedIssue.assignee?.id || ""}
                    onChange={(e) => handleAssignUser(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: `2px solid ${UI_COLORS.border}`, 
                      borderRadius: '4px', 
                      color: UI_COLORS.textPrimary, 
                      backgroundColor: UI_COLORS.background,
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Nessun assegnatario --</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                </div>
                {/* --- FINE NUOVO BLOCCO ASSEGNAZIONE UTENTE --- */}
                {selectedIssue.priority && (<div style={{ marginBottom: '20px' }}><h5 style={{ margin: '0 0 5px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '12px' }}>Priorità</h5><span style={{ padding: '4px 8px', backgroundColor: selectedIssue.priority === 'HIGH' ? UI_COLORS.badgeHighBg : selectedIssue.priority === 'MEDIUM' ? UI_COLORS.badgeMedBg : UI_COLORS.badgeLowBg, color: selectedIssue.priority === 'HIGH' ? UI_COLORS.badgeHighText : selectedIssue.priority === 'MEDIUM' ? UI_COLORS.badgeMedText : UI_COLORS.badgeLowText, borderRadius: '4px', fontWeight: 'bold' }}>{selectedIssue.priority}</span></div>)}
                
                {/* BLOCCO ETICHETTE (TAGS) */}
                <div style={{ marginBottom: '20px', borderTop: `1px solid ${UI_COLORS.border}`, paddingTop: '15px' }}>
                  <h5 style={{ margin: '0 0 10px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '12px' }}>Etichette</h5>
                  
                  {/* Lista dei Tag attuali */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    {selectedIssue.tags && selectedIssue.tags.length > 0 ? (
                      selectedIssue.tags.map(tag => (
                        <span key={tag.id} style={{ backgroundColor: UI_COLORS.buttonSecondary, color: UI_COLORS.textPrimary, padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          #{tag.name}
                          <button onClick={() => handleRemoveTag(tag.id)} style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', color: UI_COLORS.badgeHighText, fontWeight: 'bold', fontSize: '14px', lineHeight: '1' }}>&times;</button>
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: UI_COLORS.textMuted, fontStyle: 'italic' }}>Nessuna etichetta</span>
                    )}
                  </div>

                  {/* Input per aggiungere un nuovo Tag */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      value={newTagInput} 
                      onChange={(e) => setNewTagInput(e.target.value)} 
                      placeholder="es. frontend" 
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} // Permette di aggiungere col tasto Invio
                      style={{ flex: 1, padding: '6px 10px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', backgroundColor: UI_COLORS.background, color: UI_COLORS.textPrimary }}
                    />
                    <button onClick={handleAddTag} style={{ padding: '6px 12px', backgroundColor: UI_COLORS.primary, color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                      +
                    </button>
                  </div>
                </div>

                {/* CRONOLOGIA REALE */}
                <div style={{ marginTop: '40px' }}>
                  <h5 style={{ margin: '0 0 15px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '13px', borderBottom: `1px solid ${UI_COLORS.border}`, paddingBottom: '10px' }}>Cronologia Attività</h5>
                  {loadingHistory ? (<p style={{ fontSize: '13px', color: UI_COLORS.textMuted, fontStyle: 'italic' }}>Caricamento cronologia...</p>) : issueHistory.length === 0 ? (<p style={{ fontSize: '13px', color: UI_COLORS.textMuted, fontStyle: 'italic' }}>Nessuna attività registrata.</p>) : (
                    <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
                      {issueHistory.map(log => (
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
        )}

      </div>
    </div>
  );
};