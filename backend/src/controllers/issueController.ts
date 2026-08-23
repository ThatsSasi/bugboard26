import { Response } from 'express';
import { IssueService, IssueCreateDTO } from '../services/issueService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { IssueStatus } from '@prisma/client';

const issueService = new IssueService();

export class IssueController {

    async create(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { title, description, type, priority, imageUrl } = req.body as IssueCreateDTO;
            const reporterId = req.user?.userId;

            if (!reporterId) {
                res.status(401).json({ error: 'Accesso non autorizzato. ID utente mancante.' });
                return;
            }

            if (!title || !description || !type) {
                res.status(400).json({ error: 'Titolo, descrizione e tipo sono obbligatori.' });
                return;
            }

            const newIssue = await issueService.create({
                title,
                description,
                type,
                priority,
                imageUrl
            }, reporterId);

            res.status(201).json(newIssue);
        } catch (error) {
            res.status(500).json({ error: 'Errore interno del server' });
        }
    };

    async getAll(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { status, assigneeId } = req.query;
            const filters: { status?: IssueStatus; assigneeId?: number } = {};

            if (status && Object.values(IssueStatus).includes(status as IssueStatus)) {
                filters.status = status as IssueStatus;
            }

            if (assigneeId) {
                const parsedId = parseInt(assigneeId as string, 10);
                if (!isNaN(parsedId)) {
                    filters.assigneeId = parsedId;
                }
            }

            const issues = await issueService.getAll(filters);
            res.status(200).json(issues);
        
        } catch (error: any) {
            res.status(500).json({ error: 'Errore durante il recupero delle segnalazioni.' });
        }
    }

    async updateStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            const issueId = parseInt(req.params.id as string, 10);
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

            if (!Object.values(IssueStatus).includes(status)) {
                res.status(400).json({ error: 'Stato non valido.' });
                return;
            }

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
            res.status(400).json({ error: error.message || 'Errore durante l\'aggiornamento.' });
        }
    }

    async assignUser(req: AuthRequest, res: Response): Promise<void> {
        try {
            const issueId = parseInt(req.params.id as string, 10);
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

            // NUOVO CONTROLLO: Permettiamo che sia un numero oppure esplicitamente null
            if (assigneeId !== null && typeof assigneeId !== 'number') {
                res.status(400).json({ error: 'ID utente assegnatario mancante o non valido.' });
                return;
            }

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
            const { name } = req.body; 
            const modifierId = req.user?.userId; // <-- Aggiunto

            if (!modifierId) {
                res.status(401).json({ error: 'Accesso negato.' });
                return;
            }

            if (isNaN(issueId) || !name || typeof name !== 'string') {
                res.status(400).json({ error: 'ID segnalazione o nome tag non validi.' });
                return;
            }

            const updatedIssue = await issueService.addTag(issueId, name, modifierId); // <-- Passato al service
            res.status(200).json(updatedIssue);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Errore durante l\'aggiunta del tag.' });
        }
    }

    async removeTag(req: AuthRequest, res: Response): Promise<void> {
        try {
            const issueId = parseInt(req.params.id as string, 10);
            const tagId = parseInt(req.params.tagId as string, 10);
            const modifierId = req.user?.userId; // <-- Aggiunto

            if (!modifierId) {
                res.status(401).json({ error: 'Accesso negato.' });
                return;
            }

            if (isNaN(issueId) || isNaN(tagId)) {
                res.status(400).json({ error: 'ID segnalazione o ID tag non validi.' });
                return;
            }

            const updatedIssue = await issueService.removeTag(issueId, tagId, modifierId); // <-- Passato al service
            res.status(200).json(updatedIssue);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Errore durante la rimozione del tag.' });
        }
    }
}