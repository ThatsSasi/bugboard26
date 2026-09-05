import { Router } from 'express';
import { IssueController } from '../controllers/issueController';
import { authenticateToken, isAdmin } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { createIssueSchema, updateStatusSchema } from '../schemas/issueSchema';
import { upload, formatImageUrl } from '../middlewares/uploadMiddleware';

const router = Router();
const issueController = new IssueController();

/**
 * @swagger
 * /api/issues:
 *   post:
 *     summary: Crea una nuova Issue (con allegato opzionale)
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 description: "Priorità della segnalazione (opzionale)"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: "Immagine allegata (opzionale)"
 *     responses:
 *       201:
 *         description: Segnalazione creata con successo
 *       400:
 *         description: Errore di validazione (Zod)
 */
router.post('/', authenticateToken, upload.single('image'), formatImageUrl, validate(createIssueSchema), issueController.create);
/**
 * @swagger
 * /api/issues:
 *   get:
 *     summary: Recupera la lista di tutte le Issue
 *     description: Restituisce tutte le segnalazioni attive. Supporta il filtraggio tramite query parameters.
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
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
/**
 * @swagger
 * /api/issues/{id}/status:
 *   patch:
 *     summary: Aggiorna lo stato di una Issue
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
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
router.patch('/:id/status', authenticateToken, validate(updateStatusSchema), (req, res) => issueController.updateStatus(req as any, res));
/**
 * @swagger
 * /api/issues/{id}/assign:
 *   patch:
 *     summary: Assegna una issue a un utente
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assigneeId:
 *                 type: integer
 *                 nullable: true
 *                 example: 2
 *     responses:
 *       200:
 *         description: Segnalazione assegnata con successo
 */
router.patch('/:id/assign', authenticateToken, isAdmin, (req, res) => issueController.assignUser(req as any, res));
/**
 * @swagger
 * /api/issues/{id}:
 *   delete:
 *     summary: Archivia una issue (Soft Delete)
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Segnalazione archiviata con successo
 *       403:
 *         description: Accesso negato
 */
router.delete('/:id', authenticateToken, isAdmin, (req, res) => issueController.delete(req as any, res));
/**
 * @swagger
 * /api/issues/{id}/history:
 *   get:
 *     summary: Ottiene la cronologia delle modifiche di una issue
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista dei log storici recuperata
 */
router.get('/:id/history', authenticateToken, (req, res) => issueController.getHistory(req as any, res));
/**
 * @swagger
 * /api/issues/{id}/tags:
 *   post:
 *     summary: Aggiunge un tag a una issue
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "frontend"
 *     responses:
 *       200:
 *         description: Tag aggiunto con successo
 */
router.post('/:id/tags', authenticateToken, (req, res) => issueController.addTag(req as any, res));
/**
 * @swagger
 * /api/issues/{id}/tags/{tagId}:
 *   delete:
 *     summary: Rimuove un tag specifico da una issue
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tag rimosso con successo
 */
router.delete('/:id/tags/:tagId', authenticateToken, (req, res) => issueController.removeTag(req as any, res));

export default router;