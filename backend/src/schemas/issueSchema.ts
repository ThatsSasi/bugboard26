import { z } from 'zod';

export const createIssueSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Il titolo è obbligatorio'),
    description: z.string().min(1, 'La descrizione è obbligatoria'),
    type: z.enum(['QUESTION', 'BUG', 'DOCUMENTATION', 'FEATURE']),
    // Zod .optional() corrisponde al punto interrogativo (?) di Prisma
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    imageUrl: z.string().url('Deve essere un URL valido').optional()
  })
});

export const updateStatusSchema = z.object({
  body: z.object({
    // Corretto da DONE a RESOLVED
    status: z.enum(['TODO', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'])
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'L\'ID deve essere un numero')
  })
});