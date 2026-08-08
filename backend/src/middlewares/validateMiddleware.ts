import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Middleware generico per validare le richieste HTTP con Zod
 */
export const validate = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    
    // Usiamo safeParse per mantenere i tipi intatti ed evitare l'uso del try/catch
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Se la validazione fallisce, Zod popola automaticamente result.error
    if (!result.success) {
      res.status(400).json({
        error: 'Dati non validi.',
        // Iteriamo sull'array 'issues' nativo di Zod per estrarre i messaggi
        details: result.error.issues.map((e) => ({
          campo: e.path.join('.'),
          messaggio: e.message
        }))
      });
      return;
    }

    // Se la validazione ha successo, passiamo il controllo al Controller
    next();
  };
};