import { IssueService } from '../issueService';
import { prisma } from '../../index';
import { IssueStatus } from '@prisma/client';

// 1. MOCK DI PRISMA: Diciamo a Jest di intercettare tutte le chiamate a 'prisma'
// e sostituirle con funzioni "finte" (jest.fn()) che possiamo controllare.
jest.mock('../../index', () => ({
  prisma: {
    issue: { findUnique: jest.fn(), update: jest.fn() },
    user: { findUnique: jest.fn() },
    historyLog: { create: jest.fn() },     // <-- AGGIUNTO!
    notification: { create: jest.fn() }, // <-- AGGIUNTO PER SICUREZZA!
    $transaction: jest.fn(),
  }
}));

describe('IssueService - updateStatus', () => {
  let issueService: IssueService;

  // Prima di ogni test, creiamo un'istanza pulita del service e resettiamo i mock
  beforeEach(() => {
    issueService = new IssueService();
    jest.clearAllMocks();
  });

  // TEST 1: Segnalazione inesistente
  it('Dovrebbe lanciare errore se la segnalazione non esiste', async () => {
    // Configuriamo il mock: se cerchi l'issue, ti restituisco null
    (prisma.issue.findUnique as jest.Mock).mockResolvedValue(null);

    // Ci aspettiamo che la funzione lanci esattamente questo errore
    await expect(issueService.updateStatus(999, IssueStatus.IN_PROGRESS, 1))
      .rejects.toThrow('Segnalazione non trovata.');
  });

  // TEST 2: Controllo Accessi
  it('Dovrebbe lanciare errore se l\'utente non ha i permessi', async () => {
    // Configuriamo il mock: l'issue esiste ed è assegnata all'utente ID 2
    (prisma.issue.findUnique as jest.Mock).mockResolvedValue({ 
      id: 1, status: IssueStatus.TODO, assigneeId: 2 
    });
    // L'utente che fa l'azione è l'ID 1 (ruolo normale MEMBER)
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
      id: 1, role: 'MEMBER' 
    }); 

    await expect(issueService.updateStatus(1, IssueStatus.IN_PROGRESS, 1))
      .rejects.toThrow('Permesso negato: solo l\'utente assegnato (o un Amministratore) può modificare lo stato.');
  });

  // TEST 3: Percorso di Successo (Happy Path)
  it('Dovrebbe aggiornare lo stato e lanciare la transazione', async () => {
    // L'issue esiste, ed è assegnata all'utente ID 1
    (prisma.issue.findUnique as jest.Mock).mockResolvedValue({ 
      id: 1, status: IssueStatus.TODO, assigneeId: 1, reporterId: 3 
    });
    // L'utente ID 1 tenta l'azione (è autorizzato perché è l'assegnatario)
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
      id: 1, role: 'MEMBER' 
    });

    // Simuliamo che la transazione Prisma vada a buon fine restituendo l'issue aggiornata
    const mockUpdatedIssue = { id: 1, status: IssueStatus.RESOLVED };
    (prisma.$transaction as jest.Mock).mockResolvedValue([mockUpdatedIssue]);

    // Eseguiamo il metodo
    const result = await issueService.updateStatus(1, IssueStatus.RESOLVED, 1);

    // Verifichiamo che il risultato sia corretto
    expect(result).toEqual(mockUpdatedIssue);
    
    // Verifichiamo che Prisma.$transaction sia stata effettivamente invocata!
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});