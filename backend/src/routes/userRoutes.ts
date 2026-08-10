import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { validate } from '../middlewares/validateMiddleware';
import { registerSchema, loginSchema } from '../schemas/userSchema';

const router = Router();
const userController = new UserController();

// Definiamo l'endpoint per la registrazione.
// Usiamo un'arrow function per mantenere il corretto contesto di "this" all'interno della classe Controller.
router.post('/register', validate(registerSchema), (req, res) => userController.register(req, res));
// Definiamo l'endpoint per il login
/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Autenticazione utente
 *     tags: [Auth]
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
 *                 example: "test@studente.it"
 *               password:
 *                 type: string
 *                 example: "SuperSecretPassword123!"
 *     responses:
 *       200:
 *         description: Login effettuato, restituisce il token JWT
 *       401:
 *         description: Credenziali non valide
 */
router.post('/login', validate(loginSchema), (req, res) => userController.login(req, res));

export default router;