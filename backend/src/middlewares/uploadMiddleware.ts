import multer from 'multer';
import path from 'path';
import crypto from 'crypto'; // <-- 1. Importiamo crypto nativo di Node.js

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
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB in byte
});