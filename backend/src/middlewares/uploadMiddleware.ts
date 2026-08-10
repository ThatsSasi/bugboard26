import multer from 'multer';
import path from 'path';

// Configurazione dello storage su disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Specifica la cartella di destinazione (quella che hai appena creato)
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Estraiamo l'estensione originale (es. .png, .jpg)
    const ext = path.extname(file.originalname);
    // Creiamo un nome univoco basato sul timestamp per evitare conflitti
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `issue-${uniqueSuffix}${ext}`);
  }
});

// Esportiamo il middleware configurato per accettare un singolo file chiamato 'image'
export const upload = multer({ storage });