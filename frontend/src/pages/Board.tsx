import { UI_COLORS } from '../styles/theme';
import { useBoardData } from '../hooks/useBoardData';

// Componenti UI Astratti
import { TopNav } from '../components/TopNav';
import { Sidebar } from '../components/Sidebar';
import { IssueTable } from '../components/IssueTable';
import { CreateIssueModal } from '../components/CreateIssueModal';
import { IssueDetailModal } from '../components/IssueDetailModal';
import { EditProfileModal } from '../components/EditProfileModal';
import { CreateAdminUserModal } from '../components/CreateAdminUserModal';

export const Board = () => {
  // 1. Chiamiamo il nostro Custom Hook che ci fornisce solo i dati e le azioni!
  const {
    loading, error, paginatedIssues, totalPages, currentPage, setCurrentPage,
    tempSearch, setTempSearch, tempTagSearch, setTempTagSearch, tempStatus, setTempStatus, tempType, setTempType, tempSort, setTempSort,
    activeSidebarFilter, handleSidebarFilter, applyFilters, clearFilters,
    isModalOpen, setIsModalOpen, isProfileModalOpen, setIsProfileModalOpen, isAdminModalOpen, setIsAdminModalOpen, selectedIssue, setSelectedIssue,
    users, setUsers, loggedUserId, loggedUserRole, loggedUserFullName, loggedUserEmail, loggedUserAvatar,
    issueHistory, loadingHistory, notifications, handleReadNotification,
    handleCreateIssue, handleStatusChange, handleAssignUser, handleAddTag, handleRemoveTag, handleUpdateProfile, handleLogout
  } = useBoardData();

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'var(--sans)', color: UI_COLORS.textPrimary }}>Caricamento...</div>;

  // 2. Renderizziamo solo interfacce pulite!
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'var(--sans)', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.surface }}>
      <style>
        {`
          body { margin: 0; padding: 0; overflow: hidden; }
          ::-webkit-scrollbar, .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track, .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb { background: ${UI_COLORS.border}; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover, .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${UI_COLORS.textMuted}; }
          * { scrollbar-width: thin; scrollbar-color: ${UI_COLORS.border} transparent; }
        `}
      </style>

      {/* HEADER */}
      <TopNav 
        loggedUserFullName={loggedUserFullName} loggedUserEmail={loggedUserEmail} loggedUserAvatar={loggedUserAvatar} loggedUserRole={loggedUserRole}
        notifications={notifications} onReadNotification={handleReadNotification} onOpenProfileModal={() => setIsProfileModalOpen(true)} onLogout={handleLogout}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <Sidebar activeFilter={activeSidebarFilter} loggedUserRole={loggedUserRole} onFilterChange={handleSidebarFilter} onOpenAdminModal={() => setIsAdminModalOpen(true)} />

        <main style={{ flex: 1, padding: '30px', overflowY: 'auto', backgroundColor: UI_COLORS.surface }}>
          <div style={{ width: '100%' }}>
            {error && <div style={{ backgroundColor: UI_COLORS.badgeHighBg, color: UI_COLORS.badgeHighText, padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h1 style={{ margin: 0, fontWeight: '500', fontSize: '28px', color: UI_COLORS.textPrimary }}>Issues</h1>
              <button onClick={() => setIsModalOpen(true)} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: UI_COLORS.primary, color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' }}>Create</button>
            </div>

            {/* BARRA FILTRI */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', marginBottom: '25px', paddingBottom: '20px', borderBottom: `1px solid ${UI_COLORS.border}` }}>
              <input type="text" placeholder="Cerca per titolo..." value={tempSearch} onChange={(e) => setTempSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', boxSizing: 'border-box', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }} />
              <input type="text" placeholder="Tag..." value={tempTagSearch} onChange={(e) => setTempTagSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} style={{ width: '300px', padding: '8px 12px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', boxSizing: 'border-box', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }} />
              <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value)} style={{ padding: '8px 12px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }}>
                <option value="TUTTI">Status: Tutti</option>
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                {loggedUserRole === 'ADMIN' && <option value="ARCHIVED">ARCHIVED</option>}
              </select>
              <select value={tempType} onChange={(e) => setTempType(e.target.value)} style={{ padding: '8px 12px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }}>
                <option value="TUTTI">Tipo: Tutti</option>
                <option value="BUG">Bug</option>
                <option value="FEATURE">Feature</option>
                <option value="QUESTION">Question</option>
              </select>
              <select value={tempSort} onChange={(e) => setTempSort(e.target.value)} style={{ padding: '8px 12px', border: `2px solid ${UI_COLORS.border}`, borderRadius: '4px', color: UI_COLORS.textPrimary, backgroundColor: UI_COLORS.background }}>
                <option value="DESC">Più recenti (↓)</option>
                <option value="ASC">Più vecchi (↑)</option>
              </select>
              <button onClick={applyFilters} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: UI_COLORS.buttonSecondary, color: UI_COLORS.buttonSecondaryText, border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Cerca</button>
              <button onClick={clearFilters} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: 'transparent', color: UI_COLORS.textMuted, border: 'none', fontWeight: 'bold', textDecoration: 'underline' }}>Reset</button>
            </div>

            {/* TABELLA */}
            <IssueTable issues={paginatedIssues} onRowClick={setSelectedIssue} />

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

      {/* MODALI ESTERNI */}
      {isModalOpen && <CreateIssueModal onClose={() => setIsModalOpen(false)} onCreate={handleCreateIssue} />}
      {selectedIssue && <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} users={users} loggedUserId={loggedUserId} loggedUserRole={loggedUserRole} history={issueHistory} loadingHistory={loadingHistory} onStatusChange={handleStatusChange} onAssignUser={handleAssignUser} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />}
      {isProfileModalOpen && <EditProfileModal currentFullName={loggedUserFullName || ''} onClose={() => setIsProfileModalOpen(false)} onSave={handleUpdateProfile} />}
      {isAdminModalOpen && <CreateAdminUserModal onClose={() => setIsAdminModalOpen(false)} onSuccess={(updatedUsers) => setUsers(updatedUsers)} />}
    </div>
  );
};