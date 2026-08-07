import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../index';

export class UserService {
  
  /**
   * Registra un nuovo utente nel sistema
   */
  async createUser(email: string, plainTextPassword: string, role: Role = 'MEMBER') {
    // 1. Controllo duplicati: Verifichiamo se l'email è già registrata
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Un utente con questa email esiste già.');
    }

    // 2. Sicurezza: Eseguiamo l'hash della password (10 "salt rounds" è lo standard ottimale)
    const hashedPassword = await bcrypt.hash(plainTextPassword, 10);

    // 3. Persistenza: Salviamo l'utente nel database tramite Prisma
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    // 4. Data Transfer Object (DTO): Rimuoviamo la password crittografata prima 
    // di restituire l'oggetto, in modo che non finisca mai per sbaglio in una risposta HTTP
    const { password, ...userWithoutPassword } = newUser;
    
    return userWithoutPassword;
  }

  async login(email: string, plainTextPassword: string) {
    // 1. Cerchiamo l'utente nel database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Se non esiste, restituiamo un errore generico per sicurezza (evita l'enumerazione degli utenti)
    if (!user) {
      throw new Error('Credenziali non valide.');
    }

    // 2. Confrontiamo la password in chiaro con l'hash salvato
    const isPasswordValid = await bcrypt.compare(plainTextPassword, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Credenziali non valide.');
    }

    // 3. Generiamo il token JWT inserendo nel payload l'ID e il ruolo dell'utente
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      secret,
      { expiresIn: '24h' } // Il token scadrà dopo 24 ore
    );

    // 4. Rimuoviamo la password prima di restituire i dati
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }
}