import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();
const userController = new UserController();

// Definiamo l'endpoint per la registrazione.
// Usiamo un'arrow function per mantenere il corretto contesto di "this" all'interno della classe Controller.
router.post('/register', (req, res) => userController.register(req, res));

// Definiamo l'endpoint per il login
router.post('/login', (req, res) => userController.login(req, res));

export default router;