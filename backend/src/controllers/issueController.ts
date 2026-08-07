import { Response } from 'express';
import { IssueService, IssueCreateDTO } from '../services/issueService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { IssueStatus } from '@prisma/client';

const issueService = new IssueService();

export class IssueController {

    async create(req: AuthRequest, res: Response): Promise<void> {
        try {
        // 1. Estrazione dei dati dal payload HTTP (il body)
        const { title, description, type } = req.body as IssueCreateDTO;

        // 2. Recupero dell'ID utente iniettato dal nostro Middleware!
        // Usiamo req.user?.userId perché TypeScript sa che potrebbe essere undefined 
        // (anche se il middleware garantisce che ci sia)
        const reporterId = req.user?.userId;

        if (!reporterId) {
            res.status(401).json({ error: 'Accesso non autorizzato. ID utente mancante.' });
            return;
        }

        // 3. Validazione sintattica di base
        if (!title || !description || !type) {
            res.status(400).json({ error: 'Titolo, descrizione e tipo (BUG o FEATURE) sono campi obbligatori.' });
            return;
        }

        // 4. Delega alla Logica di Business
        const newIssue = await issueService.create(
            { title, description, type }, 
            reporterId
        );

        // 5. Risposta al Client (201 = Created)
        res.status(201).json({
            message: 'Segnalazione creata con successo!',
            issue: newIssue
        });
        
        } catch (error: any) {
        res.status(500).json({ error: error.message || 'Errore interno del server.' });
        }
    }

    async getAll(req: AuthRequest, res: Response): Promise<void> {
        try {
        // Chiamiamo il service senza parametri, vogliamo tutto
        const issues = await issueService.getAll();

        // Rispondiamo con 200 OK e l'array dei risultati
        res.status(200).json(issues);
        
        } catch (error: any) {
        res.status(500).json({ error: 'Errore durante il recupero delle segnalazioni.' });
        }
    }

  async updateStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
        // Estraiamo l'ID dall'URL (es. /api/issues/1/status)
        const issueId = parseInt(req.params.id as string, 10);
        
        // Estraiamo il nuovo stato dal body
        const { status } = req.body; 
        
        const modifierId = req.user?.userId;

        if (!modifierId) {
            res.status(401).json({ error: 'Accesso negato.' });
            return;
        }

        if (isNaN(issueId)) {
            res.status(400).json({ error: 'ID segnalazione non valido.' });
            return;
        }

        // Validazione formale: verifichiamo che lo stato inviato sia uno di quelli previsti dall'Enum
        if (!Object.values(IssueStatus).includes(status)) {
            res.status(400).json({ error: 'Stato non valido.' });
            return;
        }

        // Invochiamo la logica di business
        const updatedIssue = await issueService.updateStatus(
            issueId, 
            status as IssueStatus, 
            modifierId
        );

        res.status(200).json({
            message: 'Stato aggiornato con successo!',
            issue: updatedIssue
        });
        
        } catch (error: any) {
        // Catturiamo gli errori (es. issue non trovata o stato identico)
        res.status(400).json({ error: error.message || 'Errore durante l\'aggiornamento.' });
        }
    }
}