import 'dotenv/config'; // Fondamentale per leggere process.env.DATABASE_URL
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL mancante nel file .env");
}

// 1. Configuriamo l'adattatore passandogli la stringa di connessione
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// 2. Inizializziamo Prisma con il nuovo adattatore
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = 'admin@bugboard.it';
  
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        fullName: 'System Administrator',
        role: 'ADMIN'
      }
    });
    console.log('✅ Account Amministratore di default creato con successo!');
  } else {
    console.log('ℹ️ Account Amministratore già presente nel database.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });