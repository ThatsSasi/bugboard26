import { Router } from 'express';
import { IssueController } from '../controllers/issueController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { createIssueSchema } from '../schemas/issueSchema';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();
const issueController = new IssueController();

// Definiamo l'endpoint per la creazione. 
// NOTA BENE: Inseriamo authenticateToken come secondo parametro! 
// Express eseguirà prima il middleware, e solo se ha successo chiamerà il controller.
/**
 * @swagger
 * /api/issues:
 *   post:
 *     summary: Crea una nuova Issue
 *     tags: [Issues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Bottone login non funzionante"
 *               description:
 *                 type: string
 *                 example: "Cliccando sul bottone non succede nulla"
 *               type:
 *                 type: string
 *                 enum: [BUG, FEATURE, QUESTION, DOCUMENTATION]
 *     responses:
 *       201:
 *         description: Segnalazione creata con successo
 *       400:
 *         description: Errore di validazione (Zod)
 */
router.post(
  '/', 
  authenticateToken, 
  upload.single('image'), // 1. Multer intercetta e salva il file (se c'è)
  (req, res, next) => {
    // 2. Se Multer ha salvato un file, costruiamo l'URL e lo mettiamo nel body
    if (req.file) {
      // Nota: in produzione l'host dinamico sarebbe meglio, ma per ora lo cabliamo a localhost
      req.body.imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    }
    next();
  },
  validate(createIssueSchema), // 3. Zod valida il body (che ora contiene la stringa imageUrl)
  issueController.create // 4. Il controller salva nel DB
);
// Ottenere la lista di tutte le Issue (sempre protetta dal token!)
/**
 * @swagger
 * /api/issues:
 *   get:
 *     summary: Recupera la lista di tutte le Issue
 *     description: Restituisce tutte le segnalazioni attive. Supporta il filtraggio tramite query parameters.
 *     tags: [Issues]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, DONE]
 *         description: Filtra le issue per stato
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: integer
 *         description: ID dell'utente a cui è assegnata l'issue
 *     responses:
 *       200:
 *         description: Lista delle issue recuperata con successo
 *       500:
 *         description: Errore del server
 */
router.get('/', authenticateToken, (req, res) => issueController.getAll(req as any, res));
// Modificare lo stato di una singola Issue (PATCH)
/**
 * @swagger
 * /api/issues/{id}/status:
 *   patch:
 *     summary: Aggiorna lo stato di una Issue
 *     tags: [Issues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: L'ID della segnalazione
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, DONE, ARCHIVED]
 *     responses:
 *       200:
 *         description: Stato aggiornato con successo e log registrato
 *       400:
 *         description: Dati non validi
 */
router.patch('/:id/status', authenticateToken, (req, res) => issueController.updateStatus(req as any, res));
// Assegnare una Issue a un utente specifico (PATCH)
router.patch('/:id/assign', authenticateToken, (req, res) => issueController.assignUser(req as any, res));
// Archiviazione di una Issue (Soft Delete)
router.delete('/:id', authenticateToken, (req, res) => issueController.delete(req as any, res));
// Ottenere la cronologia di una specifica Issue (GET)
router.get('/:id/history', authenticateToken, (req, res) => issueController.getHistory(req as any, res));
// Gestione dei Tag
router.post('/:id/tags', authenticateToken, (req, res) => issueController.addTag(req as any, res));
router.delete('/:id/tags/:tagId', authenticateToken, (req, res) => issueController.removeTag(req as any, res));

export default router;