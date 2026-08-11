import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { validate } from '../middlewares/validateMiddleware';
import { registerSchema, loginSchema } from '../schemas/userSchema';
import { prisma } from '..';
import { upload } from '../middlewares/uploadMiddleware';
import { authenticateToken, isAdmin } from '../middlewares/authMiddleware';

const router = Router();
const userController = new UserController();

// Definiamo l'endpoint per la registrazione.
// Usiamo un'arrow function per mantenere il corretto contesto di "this" all'interno della classe Controller.
router.post(
  '/register', 
  authenticateToken, 
  isAdmin, 
  validate(registerSchema), 
  (req, res) => userController.register(req, res)
);
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
// Esempio nel tuo router Express (es. routes/userRoutes.ts)
router.get('/', async (req, res) => {
  try {
    // Recuperiamo tutti gli utenti dal database con Prisma
    // (potresti voler escludere le password per sicurezza!)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,  // <-- Aggiunto per includere il nome completo
        avatarUrl: true  // <-- Aggiunto per includere l'URL dell'avatar
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero degli utenti" });
  }
});
router.patch('/me', authenticateToken, upload.single('avatar'), (req, res) => userController.updateProfile(req as any, res));

export default router;