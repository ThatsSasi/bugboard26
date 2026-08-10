import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Issue } from '../services/issueService';

interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
}

export const IssueCard = ({ issue, onClick }: IssueCardProps) => {
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