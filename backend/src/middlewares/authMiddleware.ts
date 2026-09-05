import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Accesso negato. Token mancante.' });
    return;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ error: 'Errore di configurazione del server (JWT_SECRET mancante).' });
    return;
  }
  
  jwt.verify(token, secret, (err, decodedUser) => {
    if (err) {
      res.status(403).json({ error: 'Token non valido o scaduto.' });
      return;
    }

    req.user = decodedUser as { userId: number; role: string };
    next();
  });
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Accesso negato. Operazione riservata agli Amministratori.' });
    return;
  }
  
  next();
};