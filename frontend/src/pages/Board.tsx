import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, useDraggable, useDroppable, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { issueService, type Issue } from '../services/issueService';
import { authService } from '../services/authService';

// --- 1. COMPONENTE COLONNA ---
const DroppableColumn = ({ id, title, color, children }: { id: string, title: string, color: string, children: React.ReactNode }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  const backgroundColor = isOver ? '#d7ccc8' : color;

  return (
    <div ref={setNodeRef} style={{ flex: 1, minWidth: '300px', backgroundColor, padding: '15px', borderRadius: '8px', transition: 'background-color 0.2s' }}>
      <h3>{title}</h3>
      {children}
    </div>
  );
};

// --- 2. COMPONENTE CARD ---
const IssueCard = ({ issue, onClick }: { issue: Issue, onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: issue.id });
  
  const style = transform ? { 
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, 
    zIndex: 1000, 
    position: 'relative' as const 
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={{ ...style, backgroundColor: 'white', padding: '15px', marginBottom: '10px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'grab' }} 
      {...listeners} 
      {...attributes}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>{issue.title}</h4>
        {issue.priority && (
          <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: issue.priority === 'HIGH' ? '#ffcdd2' : '#fff9c4', borderRadius: '4px' }}>
            {issue.priority}
          </span>
        )}
      </div>
      <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
        {issue.description.length > 60 ? issue.description.substring(0, 60) + '...' : issue.description}
      </p>
      
      {issue.imageUrl && (
        <div style={{ margin: '10px 0' }}>
          <img src={issue.imageUrl} alt="Allegato" draggable={false} style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#e0e0e0', borderRadius: '12px' }}>{issue.type}</span>
        <span style={{ fontSize: '12px', color: '#888' }}>ID: #{issue.id}</span>
      </div>
    </div>
  );
};

// --- 3. IL COMPONENTE PRINCIPALE BOARD ---
export const Board = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Configurazione dei sensori per separare il Click dal Drag (8 pixel di tolleranza)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Stati Modale Creazione
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState('BUG'); 
  const [newPriority, setNewPriority] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stato per la Modale di Dettaglio
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const data = await issueService.getAll();
        setIssues(data);
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          authService.logout();
          navigate('/login');
        } else {
          setError('Impossibile caricare la board.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return; 

    const issueId = active.id as number;
    const newStatus = over.id as Issue['status'];

    const issueToMove = issues.find(i => i.id === issueId);
    if (!issueToMove || issueToMove.status === newStatus) return;

    const previousIssues = [...issues];
    setIssues(issues.map(issue => issue.id === issueId ? { ...issue, status: newStatus } : issue));

    try {
      await issueService.updateStatus(issueId, newStatus);
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue({ ...selectedIssue, status: newStatus });
      }
    } catch (err) {
      setIssues(previousIssues);
      alert('Errore di comunicazione col server. Spostamento annullato.');
    }
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

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Caricamento...</div>;

  const getIssuesByStatus = (status: string) => issues.filter(issue => issue.status === status);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>🚀 BugBoard26</h1>
        <div>
          <button onClick={() => setIsModalOpen(true)} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', marginRight: '10px' }}>+ Nuova Issue</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>Esci</button>
        </div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {/* Passiamo i sensors per distinguere il click dal trascinamento */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', minHeight: '60vh' }}>
          
          <DroppableColumn id="TODO" title={`Da Fare (${getIssuesByStatus('TODO').length})`} color="#f4f5f7">
            {getIssuesByStatus('TODO').map(issue => (
              <IssueCard key={issue.id} issue={issue} onClick={() => setSelectedIssue(issue)} />
            ))}
          </DroppableColumn>

          <DroppableColumn id="IN_PROGRESS" title={`In Corso (${getIssuesByStatus('IN_PROGRESS').length})`} color="#e3f2fd">
            {getIssuesByStatus('IN_PROGRESS').map(issue => (
              <IssueCard key={issue.id} issue={issue} onClick={() => setSelectedIssue(issue)} />
            ))}
          </DroppableColumn>

          <DroppableColumn id="RESOLVED" title={`Completate (${getIssuesByStatus('RESOLVED').length})`} color="#e8f5e9">
            {getIssuesByStatus('RESOLVED').map(issue => (
              <IssueCard key={issue.id} issue={issue} onClick={() => setSelectedIssue(issue)} />
            ))}
          </DroppableColumn>

        </div>
      </DndContext>

      {/* OVERLAY MODALE CREAZIONE */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#f5f5f5', padding: '30px', borderRadius: '4px', width: '600px', maxWidth: '90%', border: '1px solid #333' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontWeight: 'normal', letterSpacing: '1px' }}>CREA UNA NUOVA ISSUE</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '4px 10px', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid #333', borderRadius: '4px', fontWeight: 'bold' }}>X</button>
            </div>
            
            <form onSubmit={handleCreateIssue} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Titolo *</label>
                <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #999', borderRadius: '4px' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Descrizione *</label>
                <textarea required value={newDescription} onChange={(e) => setNewDescription(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', minHeight: '120px', border: '1px solid #999', borderRadius: '4px', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Tipologia</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #999', borderRadius: '4px', backgroundColor: '#e0e0e0' }}>
                    <option value="BUG">Bug</option>
                    <option value="FEATURE">Feature</option>
                    <option value="QUESTION">Question</option>
                    <option value="DOCUMENTATION">Documentation</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Priorità</label>
                  <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #999', borderRadius: '4px', backgroundColor: '#e0e0e0' }}>
                    <option value="">Seleziona...</option>
                    <option value="LOW">Bassa</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Allegato (Immagine)</label>
                <div 
                  onDragOver={handleDragOver} 
                  onDrop={handleDrop} 
                  onClick={() => fileInputRef.current?.click()} 
                  style={{ border: '1px solid #333', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', backgroundColor: 'white' }}
                >
                  {imageFile ? (
                    <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✓ {imageFile.name}</span>
                  ) : (
                    <div style={{ color: '#555' }}>
                      <span style={{ fontSize: '24px', display: 'block', marginBottom: '10px' }}>📷</span>
                      Trascina qui un immagine o clicca per caricare
                    </div>
                  )}
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 24px', cursor: 'pointer', backgroundColor: '#e0e0e0', color: '#333', border: '1px solid #333', borderRadius: '4px' }}>Annulla</button>
                <button type="submit" style={{ padding: '8px 24px', cursor: 'pointer', backgroundColor: '#e0e0e0', color: '#333', border: '1px solid #333', borderRadius: '4px' }}>Crea Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERLAY MODALE DI DETTAGLIO */}
      {selectedIssue && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}
          onClick={() => setSelectedIssue(null)}
        >
          <div 
            style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', gap: '30px', cursor: 'default' }}
            onClick={(e) => e.stopPropagation()}
          >
            
            <div style={{ flex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <span style={{ fontSize: '18px', color: '#666' }}>#{selectedIssue.id}</span>
                <h2 style={{ margin: 0, fontSize: '24px' }}>{selectedIssue.title}</h2>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>Descrizione</h4>
                <div style={{ backgroundColor: '#f4f5f7', padding: '15px', borderRadius: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {selectedIssue.description}
                </div>
              </div>

              {selectedIssue.imageUrl && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>Allegato</h4>
                  <a href={selectedIssue.imageUrl} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={selectedIssue.imageUrl} 
                      alt="Allegato Issue" 
                      style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', backgroundColor: '#f0f0f0', borderRadius: '4px', border: '1px solid #ddd' }} 
                    />
                  </a>
                </div>
              )}
            </div>

            <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <button 
                  onClick={() => setSelectedIssue(null)}
                  style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid #ccc', borderRadius: '4px', fontWeight: 'bold' }}
                >
                  X Chiudi
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ margin: '0 0 5px 0', color: '#888', textTransform: 'uppercase', fontSize: '12px' }}>Stato Attuale</h5>
                <span style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: '#e3f2fd', color: '#1565c0', borderRadius: '4px', fontWeight: 'bold' }}>
                  {selectedIssue.status}
                </span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ margin: '0 0 5px 0', color: '#888', textTransform: 'uppercase', fontSize: '12px' }}>Tipologia</h5>
                <span>{selectedIssue.type}</span>
              </div>

              {selectedIssue.priority && (
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ margin: '0 0 5px 0', color: '#888', textTransform: 'uppercase', fontSize: '12px' }}>Priorità</h5>
                  <span style={{ padding: '4px 8px', backgroundColor: selectedIssue.priority === 'HIGH' ? '#ffcdd2' : '#fff9c4', borderRadius: '4px' }}>
                    {selectedIssue.priority}
                  </span>
                </div>
              )}

              <div style={{ marginTop: '40px', padding: '15px', backgroundColor: '#fff3e0', borderRadius: '4px', border: '1px dashed #ffb74d' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#e65100', textAlign: 'center' }}>
                  Spazio riservato per assegnazione utente e cronologia
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};