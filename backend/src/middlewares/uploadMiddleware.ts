import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    
    const uniqueSuffix = crypto.randomUUID(); 
    
    cb(null, `issue-${uniqueSuffix}${ext}`);
  }
});

export const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

export const formatImageUrl = (req: Request, res: Response, next: NextFunction) => {
    if (req.file) {
        req.body.imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    }
    next();
};