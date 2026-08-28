import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, showText = true }) => {
  // Usiamo il primary color (blu Jira) per il logo
  const primaryColor = '#0052CC';
  const textColor = '#172B4D';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', userSelect: 'none' }}>
      {/* ICONA SVG */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Sfondo morbido arrotondato */}
        <rect width="32" height="32" rx="8" fill={primaryColor} fillOpacity="0.1"/>
        
        {/* Corpo centrale (che ricorda sia una card di una board, sia il corpo di un bug) */}
        <rect x="12" y="6" width="8" height="20" rx="3" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        
        {/* Dettagli interni del chip/bug */}
        <circle cx="16" cy="11" r="1.5" fill={primaryColor}/>
        <path d="M14 17H18" stroke={primaryColor} strokeWidth="2" strokeLinecap="round"/>
        <path d="M14 21H18" stroke={primaryColor} strokeWidth="2" strokeLinecap="round"/>
        
        {/* "Zampe" del bug / Pin del circuito elettronico */}
        <path d="M7 10H12" stroke={primaryColor} strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 16H12" stroke={primaryColor} strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 22H12" stroke={primaryColor} strokeWidth="2" strokeLinecap="round"/>
        
        <path d="M20 10H25" stroke={primaryColor} strokeWidth="2" strokeLinecap="round"/>
        <path d="M20 16H25" stroke={primaryColor} strokeWidth="2" strokeLinecap="round"/>
        <path d="M20 22H25" stroke={primaryColor} strokeWidth="2" strokeLinecap="round"/>
      </svg>

      {/* TESTO DEL LOGO (Opzionale) */}
      {showText && (
        <span style={{ 
          margin: 0, 
          fontSize: size * 0.75, // Il testo scala automaticamente in base alla dimensione dell'icona
          fontWeight: 800, 
          color: textColor, 
          fontFamily: 'var(--sans)', 
          letterSpacing: '-0.5px',
          lineHeight: 1
        }}>
          BugBoard<span style={{ color: primaryColor }}>26</span>
        </span>
      )}
    </div>
  );
};