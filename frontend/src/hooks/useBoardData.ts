import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueService } from '../services/issueService';
import { notificationService } from '../services/notificationService';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import type { Issue, HistoryLog, User, AppNotification } from '../types';

export const useBoardData = () => {
  const navigate = useNavigate();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [tempSearch, setTempSearch] = useState('');
  const [tempTagSearch, setTempTagSearch] = useState('');
  const [tempStatus, setTempStatus] = useState('TUTTI');
  const [tempType, setTempType] = useState('TUTTI');
  const [tempSort, setTempSort] = useState('DESC');
  
  const [appliedFilters, setAppliedFilters] = useState({
    search: '', tag: '', status: 'TUTTI', type: 'TUTTI', sort: 'DESC', assigneeId: null as number | null
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const [issueHistory, setIssueHistory] = useState<HistoryLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  
  const [loggedUserEmail, setLoggedUserEmail] = useState<string>('Caricamento...');
  const [loggedUserId, setLoggedUserId] = useState<number | null>(null);
  const [loggedUserFullName, setLoggedUserFullName] = useState<string | null>(null);
  const [loggedUserAvatar, setLoggedUserAvatar] = useState<string | null>(null);
  const [loggedUserRole, setLoggedUserRole] = useState<string | null>(null);

  const [activeSidebarFilter, setActiveSidebarFilter] = useState<'ALL' | 'MY_OPEN' | 'DONE' | 'ARCHIVED'>('ALL');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [issuesData, usersData, notifData] = await Promise.all([
          issueService.getAll(),
          userService.getUsers(),
          notificationService.getNotifications()
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

  useEffect(() => {
    if (!loggedUserId) return;

    const intervalId = setInterval(async () => {
      try {
        const notifData = await notificationService.getNotifications();
        
        setNotifications(notifData);
      } catch (error) {
        console.error("Errore nel recupero in background delle notifiche:", error);
      }
    }, 10000); 

    return () => clearInterval(intervalId);
  }, [loggedUserId]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleCreateIssue = async (formData: FormData) => {
    try {
      const createdIssue = await issueService.create(formData);
      setIssues([createdIssue, ...issues]); 
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

  const handleAddTag = async (tagName: string) => {
    if (!selectedIssue) return;
    try {
      const updatedIssue = await issueService.addTag(selectedIssue.id, tagName);
      setSelectedIssue(updatedIssue);
      setIssues(issues.map(i => i.id === selectedIssue.id ? updatedIssue : i));
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
      await notificationService.markNotificationAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Errore durante l'aggiornamento della notifica");
    }
  };

  const applyFilters = () => {
    setAppliedFilters({ search: tempSearch, tag: tempTagSearch, status: tempStatus, type: tempType, sort: tempSort, assigneeId: null });
    setActiveSidebarFilter('ALL'); 
    setCurrentPage(1); 
  };

  const clearFilters = () => {
    setTempSearch(''); setTempTagSearch(''); setTempStatus('TUTTI'); setTempType('TUTTI'); setTempSort('DESC');
    setAppliedFilters({ search: '', tag: '', status: 'TUTTI', type: 'TUTTI', sort: 'DESC', assigneeId: null });
    setActiveSidebarFilter('ALL');
    setCurrentPage(1);
  };

  const handleSidebarFilter = (filterType: 'ALL' | 'MY_OPEN' | 'DONE' | 'ARCHIVED') => {
    setActiveSidebarFilter(filterType);
    if (filterType === 'ALL') {
      setAppliedFilters({ search: '', tag: '', status: 'TUTTI', type: 'TUTTI', sort: 'DESC', assigneeId: null });
      setTempStatus('TUTTI');
    } else if (filterType === 'MY_OPEN') {
      setAppliedFilters({ search: '', tag: '', status: 'TODO_IN_PROGRESS', type: 'TUTTI', sort: 'DESC', assigneeId: loggedUserId });
      setTempStatus('TUTTI');
    } else if (filterType === 'DONE') {
      setAppliedFilters({ search: '', tag: '', status: 'RESOLVED', type: 'TUTTI', sort: 'DESC', assigneeId: null });
      setTempStatus('RESOLVED');
    } else if (filterType === 'ARCHIVED') {
      setAppliedFilters({ search: '', tag: '', status: 'ARCHIVED', type: 'TUTTI', sort: 'DESC', assigneeId: null });
      setTempStatus('ARCHIVED');
    }
    setCurrentPage(1);
  };

  const handleUpdateProfile = async (formData: FormData) => {
    try {
      const updatedUser = await userService.updateProfile(formData);
      setLoggedUserFullName(updatedUser.fullName || null);
      setLoggedUserAvatar(updatedUser.avatarUrl || null);
      
      const updatedUsers = await userService.getUsers();
      setUsers(updatedUsers);
      setIsProfileModalOpen(false);
    } catch (error) {
      alert("Errore durante l'aggiornamento del profilo");
    }
  };

  // --- CALCOLI DERIVATI ---
  let processedIssues = issues.filter(issue => {
    if (loggedUserRole !== 'ADMIN' && issue.status === 'ARCHIVED') return false;

    const matchesSearch = issue.title.toLowerCase().includes(appliedFilters.search.toLowerCase());
    const matchesType = appliedFilters.type === 'TUTTI' || issue.type === appliedFilters.type;
    const matchesTag = appliedFilters.tag === '' || (issue.tags && issue.tags.some(t => t.name.toLowerCase().includes(appliedFilters.tag.toLowerCase())));
    
    let matchesStatus = false;
    if (appliedFilters.status === 'TUTTI') {
      matchesStatus = issue.status !== 'ARCHIVED';
    } else if (appliedFilters.status === 'TODO_IN_PROGRESS') {
      matchesStatus = (issue.status === 'TODO' || issue.status === 'IN_PROGRESS');
    } else {
      matchesStatus = issue.status === appliedFilters.status;
    }

    const matchesAssignee = appliedFilters.assigneeId === null || issue.assignee?.id === appliedFilters.assigneeId;

    return matchesSearch && matchesStatus && matchesType && matchesTag && matchesAssignee;
  });

  processedIssues = processedIssues.sort((a, b) => appliedFilters.sort === 'DESC' ? b.id - a.id : a.id - b.id);
  const totalPages = Math.ceil(processedIssues.length / itemsPerPage) || 1;
  const paginatedIssues = processedIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- ESPORTAZIONE VERSO L'ESTERNO ---
  return {
    loading, error, paginatedIssues, totalPages, currentPage, setCurrentPage,
    tempSearch, setTempSearch, tempTagSearch, setTempTagSearch, tempStatus, setTempStatus, tempType, setTempType, tempSort, setTempSort,
    activeSidebarFilter, handleSidebarFilter, applyFilters, clearFilters,
    isModalOpen, setIsModalOpen, isProfileModalOpen, setIsProfileModalOpen, isAdminModalOpen, setIsAdminModalOpen, selectedIssue, setSelectedIssue,
    users, setUsers, loggedUserId, loggedUserRole, loggedUserFullName, loggedUserEmail, loggedUserAvatar,
    issueHistory, loadingHistory, notifications, handleReadNotification,
    handleCreateIssue, handleStatusChange, handleAssignUser, handleAddTag, handleRemoveTag, handleUpdateProfile, handleLogout
  };
};