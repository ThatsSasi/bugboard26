import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueService, type Issue, type HistoryLog, type User, type AppNotification } from '../services/issueService';
import { authService } from '../services/authService';
import { Logo } from '../components/Logo';

// --- PALETTE COLORI (Stile Jira) ---
const UI_COLORS = {
  background: '#F4F5F7', // Sfondo classico Jira per la sidebar e gli sfondi neutri
  surface: '#FFFFFF',    // Bianco puro per l'area principale e le card
  surfaceAlt: '#F6F8FA', 
  textPrimary: '#172B4D',
  textMuted: '#5E6C84',  
  border: '#DFE1E6',     // Bordi più leggeri stile Atlassian
  primary: '#0052CC',    
  primaryHover: '#0047B3',
  buttonSecondary: '#F4F5F7',
  buttonSecondaryText: '#42526E',
  
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

  // Stati per la ricerca
  const [tempSearch, setTempSearch] = useState('');
  const [tempTagSearch, setTempTagSearch] = useState('');
  const [tempStatus, setTempStatus] = useState('TUTTI');
  const [tempType, setTempType] = useState('TUTTI');
  const [tempSort, setTempSort] = useState('DESC');

  // NUOVO: Aggiunto assigneeId per filtrare le issue personali
  const [appliedFilters, setAppliedFilters] = useState({
    search: '', tag: '', status: 'TUTTI', type: 'TUTTI', sort: 'DESC', assigneeId: null as number | null
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
  
  // STATI DEL PROFILO
  const [loggedUserEmail, setLoggedUserEmail] = useState<string>('Caricamento...');
  const [loggedUserId, setLoggedUserId] = useState<number | null>(null);
  const [loggedUserFullName, setLoggedUserFullName] = useState<string | null>(null);
  const [loggedUserAvatar, setLoggedUserAvatar] = useState<string | null>(null);
  const [loggedUserRole, setLoggedUserRole] = useState<string | null>(null);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newAdminFullName, setNewAdminFullName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('MEMBER');
  const [adminFormMessage, setAdminFormMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profileAvatarInput, setProfileAvatarInput] = useState<File | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  
  const [newTagInput, setNewTagInput] = useState('');
  
  // STATI PER SIDEBAR
  const [activeSidebarFilter, setActiveSidebarFilter] = useState<'ALL' | 'MY_OPEN' | 'DONE'>('ALL');

  // STATI PER LE NOTIFICHE
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  
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

        try {
          const token = localStorage.getItem('token'); 
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1])); 
            if (payload.userId) {
              setLoggedUserId(payload.userId);
              const me = usersData.find((u: User) => u.id === payload.userId);
              if (me) {
                setLoggedUserEmail(me.email);
                setLoggedUserFullName(me.fullName || null);
                setLoggedUserAvatar(me.avatarUrl || null);
                setLoggedUserRole(me.role);
                setProfileNameInput(me.fullName || ''); // Prepopola il form
              }
            }
          }
        } catch (e) {
          console.warn("Impossibile leggere l'utente");
        }

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

    const updatedIssue = { ...selectedIssue, status: newStatus as Issue['status'] };
    setSelectedIssue(updatedIssue);
    setIssues(issues.map(i => i.id === selectedIssue.id ? updatedIssue : i));

    try {
      await issueService.updateStatus(selectedIssue.id, newStatus);
      const newHistory = await issueService.getHistory(selectedIssue.id);
      setIssueHistory(newHistory);
    } catch (error) {
      setSelectedIssue({ ...selectedIssue, status: previousStatus });
      setIssues(issues.map(i => i.id === selectedIssue.id ? { ...selectedIssue, status: previousStatus } : i));
      alert("Errore di comunicazione col server. Spostamento annullato.");
    }
  };

  const handleAssignUser = async (userIdStr: string) => {
    if (!selectedIssue) return;
    const userId = userIdStr === "" ? null : Number(userIdStr);
    const previousAssignee = selectedIssue.assignee;

    const assignedUser = users.find(u => u.id === userId) || null;
    const updatedIssue = { ...selectedIssue, assignee: assignedUser };
    setSelectedIssue(updatedIssue);
    setIssues(issues.map(i => i.id === selectedIssue.id ? updatedIssue : i));

    try {
      await issueService.assignUser(selectedIssue.id, userId);
      const newHistory = await issueService.getHistory(selectedIssue.id);
      setIssueHistory(newHistory);
    } catch (error) {
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
      setNewTagInput(''); 
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
    setAppliedFilters({ search: tempSearch, tag: tempTagSearch, status: tempStatus, type: tempType, sort: tempSort, assigneeId: null });
    setActiveSidebarFilter('ALL'); // Resetta la sidebar se si usa la ricerca manuale
    setCurrentPage(1); 
  };

  const clearFilters = () => {
    setTempSearch(''); setTempTagSearch(''); setTempStatus('TUTTI'); setTempType('TUTTI'); setTempSort('DESC');
    setAppliedFilters({ search: '', tag: '', status: 'TUTTI', type: 'TUTTI', sort: 'DESC', assigneeId: null });
    setActiveSidebarFilter('ALL');
    setCurrentPage(1);
  };

  // NUOVO: Gestore per i click sulla Sidebar
  const handleSidebarFilter = (filterType: 'ALL' | 'MY_OPEN' | 'DONE') => {
    setActiveSidebarFilter(filterType);
    if (filterType === 'ALL') {
      setAppliedFilters({ search: '', tag: '', status: 'TUTTI', type: 'TUTTI', sort: 'DESC', assigneeId: null });
      setTempStatus('TUTTI');
    } else if (filterType === 'MY_OPEN') {
      // TODO_IN_PROGRESS è un flag speciale gestito giù nel filter
      setAppliedFilters({ search: '', tag: '', status: 'TODO_IN_PROGRESS', type: 'TUTTI', sort: 'DESC', assigneeId: loggedUserId });
      setTempStatus('TUTTI');
    } else if (filterType === 'DONE') {
      setAppliedFilters({ search: '', tag: '', status: 'RESOLVED', type: 'TUTTI', sort: 'DESC', assigneeId: null });
      setTempStatus('RESOLVED');
    }
    setCurrentPage(1);
  };

  let processedIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(appliedFilters.search.toLowerCase());
    const matchesType = appliedFilters.type === 'TUTTI' || issue.type === appliedFilters.type;
    const matchesTag = appliedFilters.tag === '' || (issue.tags && issue.tags.some(t => t.name.toLowerCase().includes(appliedFilters.tag.toLowerCase())));
    
    // Controllo speciale per "MY_OPEN" che include due stati
    const matchesStatus = appliedFilters.status === 'TUTTI' 
      ? true 
      : appliedFilters.status === 'TODO_IN_PROGRESS' 
        ? (issue.status === 'TODO' || issue.status === 'IN_PROGRESS')
        : issue.status === appliedFilters.status;

    // Controllo sull'assegnatario per "Le mie issue"
    const matchesAssignee = appliedFilters.assigneeId === null || issue.assignee?.id === appliedFilters.assigneeId;

    return matchesSearch && matchesStatus && matchesType && matchesTag && matchesAssignee;
  });

  processedIssues = processedIssues.sort((a, b) => appliedFilters.sort === 'DESC' ? b.id - a.id : a.id - b.id);
  const totalPages = Math.ceil(processedIssues.length / itemsPerPage) || 1;
  const paginatedIssues = processedIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif', color: UI_COLORS.textPrimary }}>Caricamento...</div>;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      if (profileNameInput) formData.append('fullName', profileNameInput);
      if (profileAvatarInput) formData.append('avatar', profileAvatarInput);

      const updatedUser = await issueService.updateProfile(formData);
      
      setLoggedUserFullName(updatedUser.fullName || null);
      setLoggedUserAvatar(updatedUser.avatarUrl || null);
      
      // Aggiorniamo la lista globale utenti così la tabella mostra i nuovi nomi
      const updatedUsers = await issueService.getUsers();
      setUsers(updatedUsers);

      setIsProfileModalOpen(false);
    } catch (error) {
      alert("Errore durante l'aggiornamento del profilo");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormMessage(null);
    try {
      await authService.register(newAdminEmail, newAdminPassword, newAdminFullName, newAdminRole);
      setAdminFormMessage({ type: 'success', text: 'Utente creato e aggiunto al sistema!' });
      setNewAdminFullName(''); setNewAdminEmail(''); setNewAdminPassword(''); setNewAdminRole('MEMBER');
      
      // Ricarica subito la lista utenti così il nuovo arrivato appare tra gli Assignee
      const updatedUsers = await issueService.getUsers();
      setUsers(updatedUsers);
      
      setTimeout(() => setIsAdminModalOpen(false), 2000);
    } catch (error: any) {
      setAdminFormMessage({ type: 'error', text: error.response?.data?.error || 'Errore durante la creazione.' });
    }
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.surface }}>
      <style>
        {`
          body {
            margin: 0;
            padding: 0;
            overflow: hidden; /* Evita lo scroll dell'intera finestra, deleghiamo al Main Content */
          }
          ::-webkit-scrollbar, .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track, .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb { background: ${UI_COLORS.border}; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover, .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${UI_COLORS.textMuted}; }
          * { scrollbar-width: thin; scrollbar-color: ${UI_COLORS.border} transparent; }
        `}
      </style>

      {/* 1. TOP NAV BAR (HEADER) */}
      <header style={{ height: '60px', borderBottom: `1px solid ${UI_COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', backgroundColor: UI_COLORS.surface, flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <Logo size={28} />
          </div>
          {/* Spazio per futuri bottoni globali come 'Projects', 'Filters' */}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* CAMPANELLA NOTIFICHE */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '20px', position: 'relative' }}
            >
              🔔
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: UI_COLORS.badgeHighText, color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
            {/* Tendina Notifiche (Invariata) */}
            {isNotifOpen && (
              <div style={{ position: 'absolute', top: '40px', right: '0', width: '320px', backgroundColor: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 }}>
                <div style={{ padding: '12px 15px', borderBottom: `1px solid ${UI_COLORS.border}`, fontWeight: 'bold', fontSize: '14px', backgroundColor: '#F8F9FA' }}>Notifiche</div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: UI_COLORS.textMuted, fontSize: '13px' }}>Nessuna notifica</div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => handleReadNotification(notif.id)}
                        style={{ padding: '12px 15px', borderBottom: `1px solid ${UI_COLORS.border}`, cursor: 'pointer', backgroundColor: notif.isRead ? UI_COLORS.surface : UI_COLORS.badgeTypeBg, transition: 'background-color 0.2s' }}
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

          {/* Mostra il pulsante Dashboard solo agli amministratori */}
          {loggedUserRole === 'ADMIN' && (
            <button onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', background: 'none', border: 'none', color: UI_COLORS.textMuted, fontWeight: 'bold', fontSize: '14px' }}>
              Dashboard
            </button>
          )}
          
          {/* AVATAR PROFILO CON DROPDOWN */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '15px', borderLeft: `1px solid ${UI_COLORS.border}`, position: 'relative' }} ref={profileMenuRef}>
            <div 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
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

            {/* TENDINA PROFILO */}
            {isProfileMenuOpen && (
              <div style={{ position: 'absolute', top: '40px', right: '0', width: '200px', backgroundColor: UI_COLORS.surface, border: `1px solid ${UI_COLORS.border}`, borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 }}>
                <div 
                  onClick={() => { setIsProfileModalOpen(true); setIsProfileMenuOpen(false); }}
                  style={{ padding: '12px 15px', borderBottom: `1px solid ${UI_COLORS.border}`, cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = UI_COLORS.surfaceAlt}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ⚙️ Modifica Profilo
                </div>
                <div 
                  onClick={handleLogout}
                  style={{ padding: '12px 15px', cursor: 'pointer', fontSize: '14px', color: UI_COLORS.badgeHighText, transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = UI_COLORS.surfaceAlt}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  🚪 Esci
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. BODY CONTAINER (SIDEBAR + MAIN CONTENT) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* SIDEBAR SINISTRA */}
        <aside style={{ width: '240px', backgroundColor: UI_COLORS.background, borderRight: `1px solid ${UI_COLORS.border}`, display: 'flex', flexDirection: 'column', padding: '20px 0' }}>
          <div style={{ padding: '0 20px', marginBottom: '15px', color: UI_COLORS.textMuted, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Filtri Rapidi</div>
          
          <div 
            onClick={() => handleSidebarFilter('ALL')}
            style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: activeSidebarFilter === 'ALL' ? '#EBECF0' : 'transparent', color: activeSidebarFilter === 'ALL' ? UI_COLORS.primary : UI_COLORS.textPrimary, fontWeight: activeSidebarFilter === 'ALL' ? 'bold' : 'normal', borderLeft: activeSidebarFilter === 'ALL' ? `4px solid ${UI_COLORS.primary}` : '4px solid transparent' }}
          >
            Tutte le issue
          </div>
          
          <div 
            onClick={() => handleSidebarFilter('MY_OPEN')}
            style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: activeSidebarFilter === 'MY_OPEN' ? '#EBECF0' : 'transparent', color: activeSidebarFilter === 'MY_OPEN' ? UI_COLORS.primary : UI_COLORS.textPrimary, fontWeight: activeSidebarFilter === 'MY_OPEN' ? 'bold' : 'normal', borderLeft: activeSidebarFilter === 'MY_OPEN' ? `4px solid ${UI_COLORS.primary}` : '4px solid transparent' }}
          >
            Le mie issue aperte
          </div>
          
          <div 
            onClick={() => handleSidebarFilter('DONE')}
            style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: activeSidebarFilter === 'DONE' ? '#EBECF0' : 'transparent', color: activeSidebarFilter === 'DONE' ? UI_COLORS.primary : UI_COLORS.textPrimary, fontWeight: activeSidebarFilter === 'DONE' ? 'bold' : 'normal', borderLeft: activeSidebarFilter === 'DONE' ? `4px solid ${UI_COLORS.primary}` : '4px solid transparent' }}
          >
            Issue chiuse
          </div>

          {/* MENU AMMINISTRATORE */}
          {loggedUserRole === 'ADMIN' && (
            <>
              <div style={{ padding: '0 20px', margin: '30px 0 15px 0', color: UI_COLORS.textMuted, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Amministrazione</div>
              <div
                onClick={() => setIsAdminModalOpen(true)}
                style={{ padding: '10px 20px', cursor: 'pointer', color: UI_COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: '10px', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = UI_COLORS.surfaceAlt}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={{ fontSize: '16px' }}>👤</span> Nuovo Utente
              </div>
            </>
          )}
        </aside>

        {/* 3. MAIN CONTENT (Area Tabella) */}
        <main style={{ flex: 1, padding: '30px', overflowY: 'auto', backgroundColor: UI_COLORS.surface }}>
          <div style={{ width: '100%' }}>
            
            {error && <div style={{ backgroundColor: UI_COLORS.badgeHighBg, color: UI_COLORS.badgeHighText, padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h1 style={{ margin: 0, fontWeight: '500', fontSize: '28px', color: UI_COLORS.textPrimary }}>Issues</h1>
              <button onClick={() => setIsModalOpen(true)} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: UI_COLORS.primary, color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                Create
              </button>
            </div>

            {/* BARRA DEI FILTRI ORIZZONTALE (Più pulita stile Jira) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', marginBottom: '25px', paddingBottom: '20px', borderBottom: `1px solid ${UI_COLORS.border}` }}>
              <input 
                type="text" 
                placeholder="Cerca per titolo..." 
                value={tempSearch} 
                onChange={(e) => setTempSearch(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()} 
                style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', boxSizing: 'border-box', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }} 
              />
              <input 
                type="text" 
                placeholder="Tag..." 
                value={tempTagSearch} 
                onChange={(e) => setTempTagSearch(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()} 
                style={{ width: '120px', padding: '8px 12px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', boxSizing: 'border-box', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }} 
              />
              <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value)} style={{ padding: '8px 12px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }}>
                <option value="TUTTI">Status: Tutti</option>
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
              <select value={tempType} onChange={(e) => setTempType(e.target.value)} style={{ padding: '8px 12px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }}>
                <option value="TUTTI">Tipo: Tutti</option>
                <option value="BUG">Bug</option>
                <option value="FEATURE">Feature</option>
                <option value="QUESTION">Question</option>
              </select>
              <button onClick={applyFilters} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: UI_COLORS.buttonSecondary, color: UI_COLORS.buttonSecondaryText, border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Cerca</button>
              <button onClick={clearFilters} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: 'transparent', color: UI_COLORS.textMuted, border: 'none', fontWeight: 'bold', textDecoration: 'underline' }}>Reset</button>
            </div>

            {/* TABELLA ISSUE Nuda (Senza bordi esterni) */}
            <div style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${UI_COLORS.border}`, textAlign: 'left' }}>
                    <th style={{ padding: '12px 24px', color: UI_COLORS.textMuted, fontSize: '12px', width: '80px' }}>KEY</th>
                    <th style={{ padding: '12px 24px', color: UI_COLORS.textMuted, fontSize: '12px' }}>SUMMARY</th>
                    <th style={{ padding: '12px 24px', color: UI_COLORS.textMuted, fontSize: '12px', width: '120px' }}>TYPE</th>
                    <th style={{ padding: '12px 24px', color: UI_COLORS.textMuted, fontSize: '12px', width: '140px' }}>STATUS</th>
                    <th style={{ padding: '12px 24px', color: UI_COLORS.textMuted, fontSize: '12px', width: '120px' }}>PRIORITY</th>
                    <th style={{ padding: '12px 24px', color: UI_COLORS.textMuted, fontSize: '12px', width: '180px' }}>REPORTER</th>
                    <th style={{ padding: '12px 24px', color: UI_COLORS.textMuted, fontSize: '12px', width: '180px' }}>ASSIGNEE</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedIssues.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', fontStyle: 'italic', color: UI_COLORS.textMuted }}>Nessuna issue trovata.</td></tr>
                  ) : (
                    paginatedIssues.map(issue => (
                      <tr key={issue.id} onClick={() => setSelectedIssue(issue)} style={{ borderBottom: `1px solid ${UI_COLORS.border}`, cursor: 'pointer', transition: 'background-color 0.1s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = UI_COLORS.surfaceAlt} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '16px 24px', color: UI_COLORS.textMuted, fontSize: '13px' }}>NUC-{issue.id}</td>
                        <td style={{ padding: '16px 24px', whiteSpace: 'normal', wordBreak: 'break-word', color: UI_COLORS.primary, fontWeight: '500' }}>{issue.title}</td>
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ backgroundColor: UI_COLORS.badgeTypeBg, color: UI_COLORS.badgeTypeText, padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold' }}>{issue.type}</span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ backgroundColor: UI_COLORS.badgeStatusBg, color: UI_COLORS.badgeStatusText, padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold' }}>{issue.status}</span>
                        </td>
                        
                        {/* CELLA PRIORITA' */}
                        <td style={{ padding: '16px 24px' }}>
                          {issue.priority && (
                            <span style={{ 
                              backgroundColor: issue.priority === 'HIGH' ? UI_COLORS.badgeHighBg : issue.priority === 'MEDIUM' ? UI_COLORS.badgeMedBg : UI_COLORS.badgeLowBg, 
                              color: issue.priority === 'HIGH' ? UI_COLORS.badgeHighText : issue.priority === 'MEDIUM' ? UI_COLORS.badgeMedText : UI_COLORS.badgeLowText, 
                              padding: '2px 6px', 
                              borderRadius: '3px', 
                              fontSize: '11px', 
                              fontWeight: 'bold' 
                            }}>
                              {issue.priority}
                            </span>
                          )}
                        </td>

                        {/* CELLA REPORTER */}
                        <td style={{ padding: '16px 24px', color: UI_COLORS.textPrimary, fontSize: '13px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             {issue.reporter ? (
                               <>
                                 {issue.reporter.avatarUrl ? (
                                   <img src={issue.reporter.avatarUrl} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                 ) : (
                                   <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: UI_COLORS.background, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', fontWeight: 'bold', color: UI_COLORS.textPrimary }}>
                                     {(issue.reporter.fullName || issue.reporter.email).charAt(0).toUpperCase()}
                                   </div>
                                 )}
                                 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                   {issue.reporter.fullName || issue.reporter.email.split('@')[0]}
                                 </span>
                               </>
                             ) : (
                               <span style={{ color: UI_COLORS.textMuted, fontStyle: 'italic' }}>System</span>
                             )}
                           </div>
                        </td>

                        {/* CELLA ASSIGNEE */}
                        <td style={{ padding: '16px 24px', color: UI_COLORS.textPrimary, fontSize: '13px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             {issue.assignee ? (
                               <>
                                 {issue.assignee.avatarUrl ? (
                                   <img src={issue.assignee.avatarUrl} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                 ) : (
                                   <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: UI_COLORS.background, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', fontWeight: 'bold', color: UI_COLORS.textPrimary }}>
                                     {(issue.assignee.fullName || issue.assignee.email).charAt(0).toUpperCase()}
                                   </div>
                                 )}
                                 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                   {issue.assignee.fullName || issue.assignee.email.split('@')[0]}
                                 </span>
                               </>
                             ) : (
                               <span style={{ color: UI_COLORS.textMuted, fontStyle: 'italic' }}>Unassigned</span>
                             )}
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINAZIONE */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', marginTop: '30px', paddingBottom: '30px' }}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} style={{ padding: '6px 12px', border: 'none', backgroundColor: 'transparent', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? UI_COLORS.border : UI_COLORS.textPrimary }}>&lt;</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} style={{ width: '32px', height: '32px', border: 'none', backgroundColor: currentPage === page ? UI_COLORS.primary : 'transparent', color: currentPage === page ? 'white' : UI_COLORS.textPrimary, cursor: 'pointer', borderRadius: '4px', fontWeight: currentPage === page ? 'bold' : 'normal' }}>{page}</button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} style={{ padding: '6px 12px', border: 'none', backgroundColor: 'transparent', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? UI_COLORS.border : UI_COLORS.textPrimary }}>&gt;</button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* OVERLAY MODALE CREAZIONE (Invariata ma con zIndex alto) */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: UI_COLORS.surface, padding: '30px', borderRadius: '3px', width: '600px', maxWidth: '90%', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: UI_COLORS.textPrimary }}>Crea Nuova Issue</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ cursor: 'pointer', backgroundColor: 'transparent', border: 'none', fontSize: '18px', color: UI_COLORS.textMuted }}>✖</button>
            </div>
            
            <form onSubmit={handleCreateIssue} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Titolo *</label>
                <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Descrizione *</label>
                <textarea required value={newDescription} onChange={(e) => setNewDescription(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', minHeight: '120px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', resize: 'vertical', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }} />
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Tipologia</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }}>
                    <option value="BUG">Bug</option>
                    <option value="FEATURE">Feature</option>
                    <option value="QUESTION">Question</option>
                    <option value="DOCUMENTATION">Documentation</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Priorità</label>
                  <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }}>
                    <option value="">Seleziona...</option>
                    <option value="LOW">Bassa</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Allegato</label>
                <div onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} style={{ border: `2px dashed ${UI_COLORS.border}`, padding: '20px', textAlign: 'center', cursor: 'pointer', backgroundColor: UI_COLORS.background, borderRadius: '3px' }}>
                  {imageFile ? <span style={{ color: UI_COLORS.badgeLowText, fontWeight: 'bold' }}>✓ {imageFile.name}</span> : <div style={{ color: UI_COLORS.textMuted }}>Clicca o trascina immagine</div>}
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: 'transparent', color: UI_COLORS.textPrimary, border: 'none', fontWeight: 'bold' }}>Annulla</button>
                <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: UI_COLORS.primary, color: 'white', border: 'none', borderRadius: '3px', fontWeight: 'bold' }}>Crea Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERLAY MODALE DI DETTAGLIO (Invariata) */}
      {selectedIssue && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }} onClick={() => setSelectedIssue(null)}>
          <div style={{ backgroundColor: UI_COLORS.surface, padding: '30px', borderRadius: '3px', width: '1000px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', gap: '30px', cursor: 'default', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}><button onClick={() => setSelectedIssue(null)} style={{ cursor: 'pointer', backgroundColor: 'transparent', border: 'none', fontSize: '18px', color: UI_COLORS.textMuted }}>✖</button></div>
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ margin: '0 0 5px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '12px' }}>Stato Attuale</h5>
                  <select 
                    value={selectedIssue.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={loggedUserRole !== 'ADMIN' && selectedIssue.assignee?.id !== loggedUserId}
                    style={{ 
                      padding: '6px 10px', 
                      backgroundColor: (loggedUserRole !== 'ADMIN' && selectedIssue.assignee?.id !== loggedUserId) ? UI_COLORS.buttonSecondary : UI_COLORS.badgeStatusBg, 
                      color: (loggedUserRole !== 'ADMIN' && selectedIssue.assignee?.id !== loggedUserId) ? UI_COLORS.textMuted : UI_COLORS.badgeStatusText, 
                      borderRadius: '3px', 
                      fontWeight: 'bold', 
                      border: `1px solid ${(loggedUserRole !== 'ADMIN' && selectedIssue.assignee?.id !== loggedUserId) ? UI_COLORS.border : UI_COLORS.primary}`, 
                      cursor: (loggedUserRole !== 'ADMIN' && selectedIssue.assignee?.id !== loggedUserId) ? 'not-allowed' : 'pointer', 
                      width: '100%', 
                      outline: 'none' 
                    }}
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                  {/* L'opzione ARCHIVED viene renderizzata (ed è cliccabile) SOLO per gli amministratori */}
                  {loggedUserRole === 'ADMIN' && <option value="ARCHIVED">ARCHIVED</option>}
                  </select>
                
                {/* Messaggino di spiegazione se il campo è bloccato */}
                {loggedUserRole !== 'ADMIN' && selectedIssue.assignee?.id !== loggedUserId && (
                  <div style={{ fontSize: '11px', color: UI_COLORS.badgeHighText, marginTop: '6px' }}>
                    Solo l'assegnatario può modificare lo stato.
                  </div>
                )}
              </div>
              {/* --- INIZIO NUOVO BLOCCO TIPOLOGIA E PRIORITÀ AFFIANCATE --- */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: '0 0 5px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '12px' }}>Tipologia</h5>
                  <span style={{ backgroundColor: UI_COLORS.badgeTypeBg, color: UI_COLORS.badgeTypeText, padding: '4px 8px', borderRadius: '3px', fontWeight: 'bold', fontSize: '12px', display: 'inline-block' }}>
                    {selectedIssue.type}
                  </span>
                </div>
                
                {selectedIssue.priority && (
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: '0 0 5px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '12px' }}>Priorità</h5>
                    <span style={{ 
                      padding: '4px 8px', 
                      backgroundColor: selectedIssue.priority === 'HIGH' ? UI_COLORS.badgeHighBg : selectedIssue.priority === 'MEDIUM' ? UI_COLORS.badgeMedBg : UI_COLORS.badgeLowBg, 
                      color: selectedIssue.priority === 'HIGH' ? UI_COLORS.badgeHighText : selectedIssue.priority === 'MEDIUM' ? UI_COLORS.badgeMedText : UI_COLORS.badgeLowText, 
                      borderRadius: '3px', 
                      fontWeight: 'bold', 
                      fontSize: '12px',
                      display: 'inline-block'
                    }}>
                      {selectedIssue.priority}
                    </span>
                  </div>
                )}
              </div>
              {/* --- FINE NUOVO BLOCCO --- */}
              {/* BLOCCO ASSEGNATARIO (Ripristinato) */}
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ margin: '0 0 5px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '12px' }}>Assegnato a</h5>
                <select 
                  value={selectedIssue.assignee?.id || ""}
                  onChange={(e) => handleAssignUser(e.target.value)}
                  disabled={loggedUserRole !== 'ADMIN'}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: `2px solid ${loggedUserRole !== 'ADMIN' ? UI_COLORS.border : UI_COLORS.primary}`, 
                    borderRadius: '3px', 
                    color: loggedUserRole !== 'ADMIN' ? UI_COLORS.textMuted : UI_COLORS.textPrimary, 
                    backgroundColor: loggedUserRole !== 'ADMIN' ? UI_COLORS.buttonSecondary : UI_COLORS.background, 
                    cursor: loggedUserRole !== 'ADMIN' ? 'not-allowed' : 'pointer', 
                    outline: 'none' 
                  }}
                >
                  <option value="">-- Nessun assegnatario --</option>
                  {users.map(user => <option key={user.id} value={user.id}>{user.email}</option>)}
                </select>
                
                {/* Avviso se l'utente non è amministratore */}
                {loggedUserRole !== 'ADMIN' && (
                  <div style={{ fontSize: '11px', color: UI_COLORS.badgeHighText, marginTop: '6px' }}>
                    Solo un amministratore può assegnare le issue.
                  </div>
                )}
              </div>
              <div style={{ marginBottom: '20px', borderTop: `1px solid ${UI_COLORS.border}`, paddingTop: '15px' }}>
                <h5 style={{ margin: '0 0 10px 0', color: UI_COLORS.textMuted, textTransform: 'uppercase', fontSize: '12px' }}>Etichette</h5>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  {selectedIssue.tags && selectedIssue.tags.length > 0 ? (
                    selectedIssue.tags.map(tag => (
                      <span key={tag.id} style={{ backgroundColor: UI_COLORS.buttonSecondary, color: UI_COLORS.textPrimary, padding: '4px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        #{tag.name}
                        {/* La "X" per rimuovere appare SOLO se si hanno i permessi */}
                        {(loggedUserRole === 'ADMIN' || selectedIssue.assignee?.id === loggedUserId) && (
                          <button onClick={() => handleRemoveTag(tag.id)} style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', color: UI_COLORS.badgeHighText, fontWeight: 'bold', fontSize: '14px', lineHeight: '1' }}>&times;</button>
                        )}
                      </span>
                    ))
                  ) : (<span style={{ fontSize: '12px', color: UI_COLORS.textMuted, fontStyle: 'italic' }}>Nessuna etichetta</span>)}
                </div>

                {/* La barra di input appare SOLO se si hanno i permessi */}
                {(loggedUserRole === 'ADMIN' || selectedIssue.assignee?.id === loggedUserId) && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} placeholder="es. frontend" onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} style={{ flex: 1, padding: '6px 10px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', backgroundColor: UI_COLORS.background, color: UI_COLORS.textPrimary }} />
                    <button onClick={handleAddTag} style={{ padding: '6px 12px', backgroundColor: UI_COLORS.primary, color: 'white', border: 'none', borderRadius: '3px', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                  </div>
                )}
              </div>
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
      {/* OVERLAY MODALE PROFILO */}
      {isProfileModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: UI_COLORS.surface, padding: '30px', borderRadius: '3px', width: '400px', maxWidth: '90%', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: UI_COLORS.textPrimary }}>Modifica Profilo</h3>
              <button onClick={() => setIsProfileModalOpen(false)} style={{ cursor: 'pointer', backgroundColor: 'transparent', border: 'none', fontSize: '18px', color: UI_COLORS.textMuted }}>✖</button>
            </div>
            
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Nome Completo</label>
                <input type="text" value={profileNameInput} onChange={(e) => setProfileNameInput(e.target.value)} placeholder="es. Mario Rossi" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Foto Profilo</label>
                <div onClick={() => profileFileInputRef.current?.click()} style={{ border: `2px dashed ${UI_COLORS.border}`, padding: '20px', textAlign: 'center', cursor: 'pointer', backgroundColor: UI_COLORS.background, borderRadius: '3px' }}>
                  {profileAvatarInput ? <span style={{ color: UI_COLORS.badgeLowText, fontWeight: 'bold' }}>✓ {profileAvatarInput.name}</span> : <div style={{ color: UI_COLORS.textMuted }}>Clicca per caricare un'immagine</div>}
                  <input type="file" accept="image/*" ref={profileFileInputRef} onChange={(e) => e.target.files && setProfileAvatarInput(e.target.files[0])} style={{ display: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsProfileModalOpen(false)} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: 'transparent', color: UI_COLORS.textPrimary, border: 'none', fontWeight: 'bold' }}>Annulla</button>
                <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: UI_COLORS.primary, color: 'white', border: 'none', borderRadius: '3px', fontWeight: 'bold' }}>Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* OVERLAY MODALE CREAZIONE UTENTE (ADMIN) */}
      {isAdminModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: UI_COLORS.surface, padding: '30px', borderRadius: '3px', width: '450px', maxWidth: '90%', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: UI_COLORS.textPrimary }}>Crea Nuovo Utente</h3>
              <button onClick={() => { setIsAdminModalOpen(false); setAdminFormMessage(null); }} style={{ cursor: 'pointer', backgroundColor: 'transparent', border: 'none', fontSize: '18px', color: UI_COLORS.textMuted }}>✖</button>
            </div>
            
            {adminFormMessage && (
              <div style={{ backgroundColor: adminFormMessage.type === 'success' ? UI_COLORS.badgeLowBg : UI_COLORS.badgeHighBg, color: adminFormMessage.type === 'success' ? UI_COLORS.badgeLowText : UI_COLORS.badgeHighText, padding: '10px', borderRadius: '3px', marginBottom: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                {adminFormMessage.text}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Nome Completo *</label>
                <input type="text" required value={newAdminFullName} onChange={(e) => setNewAdminFullName(e.target.value)} style={{ width: '100%', padding: '8px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', backgroundColor: UI_COLORS.background, color: UI_COLORS.textPrimary }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Email *</label>
                <input type="email" required value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} style={{ width: '100%', padding: '8px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', backgroundColor: UI_COLORS.background, color: UI_COLORS.textPrimary }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Password temporanea *</label>
                <input type="password" required value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} style={{ width: '100%', padding: '8px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', backgroundColor: UI_COLORS.background, color: UI_COLORS.textPrimary }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Ruolo *</label>
                <select value={newAdminRole} onChange={(e) => setNewAdminRole(e.target.value)} style={{ width: '100%', padding: '8px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '3px', backgroundColor: UI_COLORS.background, color: UI_COLORS.textPrimary }}>
                  <option value="MEMBER">Membro Normale</option>
                  <option value="ADMIN">Amministratore</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setIsAdminModalOpen(false)} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: 'transparent', color: UI_COLORS.textPrimary, border: 'none', fontWeight: 'bold' }}>Annulla</button>
                <button type="submit" disabled={adminFormMessage?.type === 'success'} style={{ padding: '8px 16px', cursor: adminFormMessage?.type === 'success' ? 'not-allowed' : 'pointer', backgroundColor: adminFormMessage?.type === 'success' ? UI_COLORS.textMuted : UI_COLORS.primary, color: 'white', border: 'none', borderRadius: '3px', fontWeight: 'bold' }}>Crea Utente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};