import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estendiamo l'interfaccia Request di Express per includere i dati dell'utente decodificati dal JWT
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // 1. Estraiamo l'header Authorization (il formato standard è "Bearer <token>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // 2. Se non c'è il token, blocchiamo la richiesta
  if (!token) {
    res.status(401).json({ error: 'Accesso negato. Token mancante.' });
    return;
  }

  // 3. Verifichiamo la validità del token
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  
  jwt.verify(token, secret, (err, decodedUser) => {
    if (err) {
      res.status(403).json({ error: 'Token non valido o scaduto.' });
      return;
    }

    // 4. Se è valido, salviamo i dati dell'utente nella richiesta e passiamo al prossimo blocco (Controller)
    req.user = decodedUser as { userId: number; role: string };
    next();
  });
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Verifichiamo che l'utente esista (grazie al token) e che sia un ADMIN
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Accesso negato. Operazione riservata agli Amministratori.' });
    return;
  }
  
  // Se è un ADMIN, lo facciamo passare alla rotta successiva
  next();
};