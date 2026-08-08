import { z } from 'zod';
import { IssueType } from '@prisma/client';

// Definiamo lo schema per la creazione di un bug
export const createIssueSchema = z.object({
  body: z.object({
    title: z.string({ message: 'Il titolo è obbligatorio o non valido.' })
      .min(3, 'Il titolo deve contenere almeno 3 caratteri.')
      .max(100, 'Il titolo è troppo lungo.'),
      
    description: z.string({ message: 'La descrizione è obbligatoria o non valida.' })
      .min(10, 'La descrizione deve contenere almeno 10 caratteri.'),
      
    // Rimuoviamo il secondo parametro per evitare il warning di deprecazione.
    // In caso di errore, Zod dirà in automatico: "Expected 'BUG' | 'FEATURE' | ..."
    type: z.nativeEnum(IssueType)
  })
});