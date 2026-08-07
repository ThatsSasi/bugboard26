import { Router } from 'express';
import { IssueController } from '../controllers/issueController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
const issueController = new IssueController();

// Definiamo l'endpoint per la creazione. 
// NOTA BENE: Inseriamo authenticateToken come secondo parametro! 
// Express eseguirà prima il middleware, e solo se ha successo chiamerà il controller.
router.post('/', authenticateToken, (req, res) => issueController.create(req as any, res));
// Ottenere la lista di tutte le Issue (sempre protetta dal token!)
router.get('/', authenticateToken, (req, res) => issueController.getAll(req as any, res));
// Modificare lo stato di una singola Issue (PATCH)
router.patch('/:id/status', authenticateToken, (req, res) => issueController.updateStatus(req as any, res));

export default router;