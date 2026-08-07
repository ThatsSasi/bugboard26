import { Request, Response } from 'express';
import { UserService } from '../services/userService';

// Istanziamo il service. In un'architettura enterprise si userebbe la Dependency Injection,
// ma per questo progetto l'istanziazione diretta è più che adeguata.
const userService = new UserService();

export class UserController {
  
  /**
   * Gestisce la richiesta HTTP per la registrazione di un nuovo utente
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // 1. Estrazione dei dati dal payload della richiesta (body)
      const { email, password } = req.body;

      // 2. Validazione sintattica di base
      if (!email || !password) {
        res.status(400).json({ error: 'Email e password sono campi obbligatori.' });
        return;
      }

      // 3. Delega alla Logica di Business (Service)
      const newUser = await userService.createUser(email, password);

      // 4. Risposta al Client (201 = Created)
      res.status(201).json({
        message: 'Utente registrato con successo!',
        user: newUser,
      });
      
    } catch (error: any) {
      // 5. Gestione degli errori (es. l'errore "email già esistente" lanciato dal Service)
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

      // Invochiamo il Service
      const authData = await userService.login(email, password);

      // 200 = OK
      res.status(200).json({
        message: 'Login effettuato con successo!',
        user: authData.user,
        token: authData.token, // Questo è il pass che il client dovrà usare nelle prossime richieste
      });
      
    } catch (error: any) {
      // Usiamo 401 Unauthorized per errori di autenticazione
      res.status(401).json({ error: error.message || 'Errore di autenticazione.' });
    }
  }
}