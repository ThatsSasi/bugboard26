import React, { useState, useRef } from 'react';
import { UI_COLORS } from '../styles/theme';

interface CreateIssueModalProps {
  onClose: () => void;
  onCreate: (formData: FormData) => Promise<void>;
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({ onClose, onCreate }) => {
  // Spostiamo qui gli stati locali che prima intasavano la Board!
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState('BUG'); 
  const [newPriority, setNewPriority] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) setImageFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newTitle);
    formData.append('description', newDescription);
    formData.append('type', newType);
    if (newPriority !== '') formData.append('priority', newPriority);
    if (imageFile) formData.append('image', imageFile);

    await onCreate(formData);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ backgroundColor: UI_COLORS.surface, padding: '30px', borderRadius: '3px', width: '600px', maxWidth: '90%', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', color: UI_COLORS.textPrimary }}>Crea Nuova Issue</h3>
          <button onClick={onClose} style={{ cursor: 'pointer', backgroundColor: 'transparent', border: 'none', fontSize: '18px', color: UI_COLORS.textMuted }}>✖</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Tipologia *</label>
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
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: 'transparent', color: UI_COLORS.textPrimary, border: 'none', fontWeight: 'bold' }}>Annulla</button>
            <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: UI_COLORS.primary, color: 'white', border: 'none', borderRadius: '3px', fontWeight: 'bold' }}>Crea Issue</button>
          </div>
        </form>
      </div>
    </div>
  );
};