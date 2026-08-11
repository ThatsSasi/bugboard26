import { Request, Response } from 'express';
import { UserService } from '../services/userService';
// NUOVI IMPORT PER IL PROFILO
import { AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '..'; // Adegua il path alla tua istanza Prisma se diverso

// Istanziamo il service.
const userService = new UserService();

export class UserController {
  
  /**
   * Gestisce la richiesta HTTP per la registrazione di un nuovo utente
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // 1. Estraiamo anche il fullName
      const { email, password, fullName, role } = req.body;

      // 2. Aggiungiamo fullName ai campi obbligatori
      if (!email || !password || !fullName || !role) {
        res.status(400).json({ error: 'Email, password, nome completo e ruolo sono obbligatori.' });
        return;
      }

      // 3. Passiamo il fullName al service
      const newUser = await userService.createUser(email, password, fullName, role);

      res.status(201).json({
        message: 'Utente registrato con successo!',
        user: newUser,
      });
      
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Errore durante la registrazione.' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email e password sono campi obbligatori.' });
        return;
      }

      const authData = await userService.login(email, password);

      res.status(200).json({
        message: 'Login effettuato con successo!',
        user: authData.user,
        token: authData.token, 
      });
      
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Errore di autenticazione.' });
    }
  }

  // --- NUOVO METODO: AGGIORNAMENTO PROFILO ---
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Accesso negato. Autenticazione richiesta.' });
        return;
      }

      const { fullName } = req.body;
      let avatarUrl = undefined;

      // Se c'è un file immagine, costruiamo l'URL
      if (req.file) {
        avatarUrl = `http://localhost:3000/uploads/${req.file.filename}`;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(fullName !== undefined && { fullName }),
          ...(avatarUrl !== undefined && { avatarUrl })
        },
        select: {
          id: true,
          email: true,
          role: true,
          fullName: true,
          avatarUrl: true
        }
      });

      res.status(200).json({
        message: 'Profilo aggiornato con successo',
        user: updatedUser
      });

    } catch (error: any) {
      console.error("Errore aggiornamento profilo:", error);
      res.status(500).json({ error: 'Errore interno durante l\'aggiornamento del profilo.' });
    }
  }
}