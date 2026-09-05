import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

export class UserService {
  
  async createUser(email: string, plainTextPassword: string, fullName: string, role: any) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Un utente con questa email esiste già.');
    }

    const hashedPassword = await bcrypt.hash(plainTextPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role,
      },
    });

    const { password, ...userWithoutPassword } = newUser;
    
    return userWithoutPassword;
  }

  async login(email: string, plainTextPassword: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Credenziali non valide.');
    }

    const isPasswordValid = await bcrypt.compare(plainTextPassword, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Credenziali non valide.');
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('CONFIG ERROR: JWT_SECRET mancante nelle variabili d\'ambiente.');
    }
    
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      secret,
      { expiresIn: '24h' }
    );

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        avatarUrl: true
      }
    });
  }
}