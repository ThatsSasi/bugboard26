import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { validate } from '../middlewares/validateMiddleware';
import { registerSchema, loginSchema } from '../schemas/userSchema';
import { upload } from '../middlewares/uploadMiddleware';
import { authenticateToken, isAdmin } from '../middlewares/authMiddleware';

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Registra un nuovo utente nel sistema (Solo Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 example: "mario.rossi@bugboard.it"
 *               password:
 *                 type: string
 *                 example: "PasswordSicura123!"
 *               fullName:
 *                 type: string
 *                 example: "Mario Rossi"
 *               role:
 *                 type: string
 *                 enum: [MEMBER, ADMIN]
 *     responses:
 *       201:
 *         description: Utente registrato con successo
 *       400:
 *         description: Errore di validazione
 *       403:
 *         description: Accesso negato (non sei un Amministratore)
 */
router.post('/register', authenticateToken, isAdmin, validate(registerSchema), (req, res) => userController.register(req, res));
/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Autenticazione utente
 *     tags: [Users]
 *     security: [] 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@bugboard.it"
 *               password:
 *                 type: string
 *                 example: "Admin123!"
 *     responses:
 *       200:
 *         description: Login effettuato, restituisce il token JWT
 *       401:
 *         description: Credenziali non valide
 */
router.post('/login', validate(loginSchema), (req, res) => userController.login(req, res));
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Recupera la lista di tutti gli utenti registrati
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista degli utenti recuperata con successo
 */
router.get('/', authenticateToken, (req, res) => userController.getAll(req, res));
/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Aggiorna il profilo utente (incluso l'avatar)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profilo aggiornato con successo
 */
router.patch('/me', authenticateToken, upload.single('avatar'), (req, res) => userController.updateProfile(req as any, res));

export default router;