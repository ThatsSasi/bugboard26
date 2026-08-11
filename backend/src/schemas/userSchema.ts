import { z } from 'zod';

// Definiamo una Regex standard e robusta per validare le email
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const registerSchema = z.object({
  body: z.object({
    email: z.string({ message: 'L\'email è obbligatoria.' })
      // Sostituiamo .email() con .regex(), passando la nostra logica custom
      .regex(emailRegex, { message: 'Formato email non valido.' }),
      
    password: z.string({ message: 'La password è obbligatoria.' })
      .min(6, { message: 'La password deve contenere almeno 6 caratteri.' })
      .max(50, { message: 'La password è troppo lunga.' }),
      
    fullName: z.string().min(1, 'Il nome è obbligatorio')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ message: 'L\'email è obbligatoria.' })
      // Applichiamo la stessa protezione anche al login
      .regex(emailRegex, { message: 'Formato email non valido.' }),
      
    password: z.string({ message: 'La password è obbligatoria.' })
  })
});