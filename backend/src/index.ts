import 'dotenv/config';
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// --- IMPORT DEI ROUTER ---
import userRoutes from './routes/userRoutes';
import issueRoutes from './routes/issueRoutes';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'BugBoard26 Server is running!' });
});

// --- REGISTRAZIONE DELLE ROTTE ---
// Tutte le rotte definite in userRoutes avranno il prefisso /api/users
app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);

app.listen(port, () => {
  console.log(`🚀 Server avviato con successo su http://localhost:${port}`);
});