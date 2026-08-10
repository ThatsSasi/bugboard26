import React from 'react';
import { useDroppable } from '@dnd-kit/core';

// Definiamo le props in TypeScript per massima rigidità
interface DroppableColumnProps {
  id: string;
  title: string;
  color: string;
  children: React.ReactNode;
}

export const DroppableColumn = ({ id, title, color, children }: DroppableColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  const backgroundColor = isOver ? '#d7ccc8' : color;

  return (
    <div ref={setNodeRef} style={{ flex: 1, minWidth: '300px', backgroundColor, padding: '15px', borderRadius: '8px', transition: 'background-color 0.2s' }}>
      <h3>{title}</h3>
      {children}
    </div>
  );
};