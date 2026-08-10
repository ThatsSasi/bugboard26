import { Response } from 'express';
import { IssueService, IssueCreateDTO } from '../services/issueService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { IssueStatus } from '@prisma/client';
import { prisma } from '..';

const issueService = new IssueService();

export class IssueController {

    async create(req: AuthRequest, res: Response): Promise<void> {
        try {
        // 1. Estrazione dei dati dal payload HTTP (il body)
        const { title, description, type, priority, imageUrl } = req.body as IssueCreateDTO;

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
            res.status(400).json({ error: 'Titolo, descrizione e tipo sono obbligatori.' });
            return;
        }

        // 4. Delega alla Logica di Business (Come un vero Software Engineer!)
        const newIssue = await issueService.create({
            title,
            description,
            type,
            priority,
            imageUrl
        }, reporterId);

        // 5. Risposta al Client (201 = Created)
        res.status(201).json(newIssue);
            } catch (error) {
            res.status(500).json({ error: 'Errore interno del server' });
        }
    };

    async getAll(req: AuthRequest, res: Response): Promise<void> {
        try {
        // Estraiamo i query parameters dall'URL (es: ?status=TODO&assigneeId=2)
        const { status, assigneeId } = req.query;
        
        const filters: { status?: IssueStatus; assigneeId?: number } = {};

        // Validazione e inserimento del filtro status
        if (status && Object.values(IssueStatus).includes(status as IssueStatus)) {
            filters.status = status as IssueStatus;
        }

        // Validazione e inserimento del filtro assigneeId
        if (assigneeId) {
            const parsedId = parseInt(assigneeId as string, 10);
            if (!isNaN(parsedId)) {
            filters.assigneeId = parsedId;
            }
        }

        // Passiamo i filtri puliti alla logica di business
        const issues = await issueService.getAll(filters);

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

    async assignUser(req: AuthRequest, res: Response): Promise<void> {
        try {
        const issueId = parseInt(req.params.id as string, 10);
        
        // Dal body questa volta ci aspettiamo l'ID dell'utente a cui assegnare il lavoro
        const { assigneeId } = req.body; 
        
        const modifierId = req.user?.userId;

        if (!modifierId) {
            res.status(401).json({ error: 'Accesso negato.' });
            return;
        }

        if (isNaN(issueId)) {
            res.status(400).json({ error: 'ID segnalazione non valido.' });
            return;
        }

        if (!assigneeId || typeof assigneeId !== 'number') {
            res.status(400).json({ error: 'ID utente assegnatario mancante o non valido.' });
            return;
        }

        // Invochiamo la logica di business
        const updatedIssue = await issueService.assignUser(
            issueId, 
            assigneeId, 
            modifierId
        );

        res.status(200).json({
            message: 'Segnalazione assegnata con successo!',
            issue: updatedIssue
        });
        
        } catch (error: any) {
        res.status(400).json({ error: error.message || 'Errore durante l\'assegnazione.' });
        }
    }

    async delete(req: AuthRequest, res: Response): Promise<void> {
        try {
        const issueId = parseInt(req.params.id as string, 10);
        const modifierId = req.user?.userId;

        if (!modifierId) {
            res.status(401).json({ error: 'Accesso negato.' });
            return;
        }

        if (isNaN(issueId)) {
            res.status(400).json({ error: 'ID segnalazione non valido.' });
            return;
        }

        await issueService.archive(issueId, modifierId);

        res.status(200).json({ message: 'Segnalazione archiviata con successo!' });
        } catch (error: any) {
        res.status(400).json({ error: error.message || 'Errore durante l\'archiviazione.' });
        }
    }

    async getHistory(req: AuthRequest, res: Response): Promise<void> {
        try {
        const issueId = parseInt(req.params.id as string, 10);

        if (isNaN(issueId)) {
            res.status(400).json({ error: 'ID segnalazione non valido.' });
            return;
        }

        const logs = await issueService.getHistory(issueId);

        res.status(200).json(logs);
        
        } catch (error: any) {
        res.status(404).json({ error: error.message || 'Errore durante il recupero della cronologia.' });
        }
    }

    async addTag(req: AuthRequest, res: Response): Promise<void> {
        try {
        const issueId = parseInt(req.params.id as string, 10);
        const { name } = req.body; // Ci aspettiamo { "name": "frontend" }

        if (isNaN(issueId) || !name || typeof name !== 'string') {
            res.status(400).json({ error: 'ID segnalazione o nome tag non validi.' });
            return;
        }

        const updatedIssue = await issueService.addTag(issueId, name);
        res.status(200).json(updatedIssue);
        
        } catch (error: any) {
        res.status(400).json({ error: error.message || 'Errore durante l\'aggiunta del tag.' });
        }
    }

    async removeTag(req: AuthRequest, res: Response): Promise<void> {
        try {
        const issueId = parseInt(req.params.id as string, 10);
        const tagId = parseInt(req.params.tagId as string, 10);

        if (isNaN(issueId) || isNaN(tagId)) {
            res.status(400).json({ error: 'ID segnalazione o ID tag non validi.' });
            return;
        }

        const updatedIssue = await issueService.removeTag(issueId, tagId);
        res.status(200).json(updatedIssue);
        
        } catch (error: any) {
        res.status(400).json({ error: error.message || 'Errore durante la rimozione del tag.' });
        }
    }
}