import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Middleware generico per validare le richieste HTTP con Zod
 */
export const validate = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    if (!result.success) {
      res.status(400).json({
        error: 'Dati non validi.',
        details: result.error.issues.map((e) => ({
          campo: e.path.join('.'),
          messaggio: e.message
        }))
      });
      return;
    }

    next();
  };
};