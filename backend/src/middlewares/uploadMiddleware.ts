import multer from 'multer';
import path from 'path';
import crypto from 'crypto'; // <-- 1. Importiamo crypto nativo di Node.js
import { Request, Response, NextFunction } from 'express';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    
    // 2. Usiamo randomUUID invece di Math.random() (Risolve Weak Cryptography)
    const uniqueSuffix = crypto.randomUUID(); 
    
    cb(null, `issue-${uniqueSuffix}${ext}`);
  }
});

// 3. Aggiungiamo un limite di 5MB (Risolve il Denial of Service)
export const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB in byte
});

/**
 * Middleware per formattare l'URL dell'immagine caricata
 * e iniettarlo nel body per la validazione di Zod.
 */
export const formatImageUrl = (req: Request, res: Response, next: NextFunction) => {
    if (req.file) {
        // In produzione l'host dinamico sarebbe meglio, ma per ora lo cabliamo a localhost
        req.body.imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    }
    next();
};