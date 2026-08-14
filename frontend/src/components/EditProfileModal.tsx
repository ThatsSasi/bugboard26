import React, { useState, useRef } from 'react';
import { UI_COLORS } from '../styles/theme';

interface EditProfileModalProps {
  currentFullName: string;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ currentFullName, onClose, onSave }) => {
  const [profileNameInput, setProfileNameInput] = useState(currentFullName);
  const [profileAvatarInput, setProfileAvatarInput] = useState<File | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    if (profileNameInput) formData.append('fullName', profileNameInput);
    if (profileAvatarInput) formData.append('avatar', profileAvatarInput);

    await onSave(formData);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ backgroundColor: UI_COLORS.surface, padding: '30px', borderRadius: '3px', width: '400px', maxWidth: '90%', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', color: UI_COLORS.textPrimary }}>Modifica Profilo</h3>
          <button onClick={onClose} style={{ cursor: 'pointer', backgroundColor: 'transparent', border: 'none', fontSize: '18px', color: UI_COLORS.textMuted }}>✖</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: 'transparent', color: UI_COLORS.textPrimary, border: 'none', fontWeight: 'bold' }}>Annulla</button>
            <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: UI_COLORS.primary, color: 'white', border: 'none', borderRadius: '3px', fontWeight: 'bold' }}>Salva</button>
          </div>
        </form>
      </div>
    </div>
  );
};