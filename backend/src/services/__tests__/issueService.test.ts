import { IssueService } from '../issueService';
import { prisma } from '../../index';
import { IssueStatus } from '@prisma/client';

// 1. MOCK DI PRISMA
jest.mock('../../index', () => ({
  prisma: {
    issue: { findUnique: jest.fn(), update: jest.fn() },
    user: { findUnique: jest.fn() },
    historyLog: { create: jest.fn() },
    notification: { create: jest.fn() },
    $transaction: jest.fn(),
  }
}));

describe('IssueService - updateStatus', () => {
  let issueService: IssueService;

  beforeEach(() => {
    issueService = new IssueService();
    jest.clearAllMocks();
  });

  // TEST 1: Segnalazione inesistente
  it('Dovrebbe lanciare errore se la segnalazione non esiste', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(issueService.updateStatus(999, IssueStatus.IN_PROGRESS, 1))
      .rejects.toThrow('Segnalazione non trovata.');
  });

  // TEST 2: Controllo Accessi
  it('Dovrebbe lanciare errore se l\'utente non ha i permessi', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValue({ 
      id: 1, status: IssueStatus.TODO, assigneeId: 2 
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
      id: 1, role: 'MEMBER' 
    }); 

    await expect(issueService.updateStatus(1, IssueStatus.IN_PROGRESS, 1))
      .rejects.toThrow('Permesso negato: solo l\'utente assegnato (o un Amministratore) può modificare lo stato.');
  });

  // TEST 3: Percorso di Successo (Happy Path)
  it('Dovrebbe aggiornare lo stato e lanciare la transazione', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValue({ 
      id: 1, status: IssueStatus.TODO, assigneeId: 1, reporterId: 3 
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
      id: 1, role: 'MEMBER' 
    });

    const mockUpdatedIssue = { id: 1, status: IssueStatus.RESOLVED };
    (prisma.$transaction as jest.Mock).mockResolvedValue([mockUpdatedIssue]);

    const result = await issueService.updateStatus(1, IssueStatus.RESOLVED, 1);

    expect(result).toEqual(mockUpdatedIssue);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe('IssueService - assignUser', () => {
  let issueService: IssueService;

  beforeEach(() => {
    issueService = new IssueService();
    jest.clearAllMocks();
  });

  // TEST 4: Controllo Accessi (Solo Admin)
  it('Dovrebbe lanciare errore se l\'utente non è Admin', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, role: 'MEMBER' }); 

    await expect(issueService.assignUser(1, 2, 1))
      .rejects.toThrow('Permesso negato: solo un Amministratore può assegnare le issue.');
  });

  // TEST 5: Percorso di Successo (Happy Path)
  it('Dovrebbe assegnare la issue e lanciare la transazione', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValue({ id: 1, status: 'TODO' });
    // Il servizio reale cerca SOLO il modificatore nel DB, quindi 1 sola chiamata
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, role: 'ADMIN' });
      
    const mockUpdatedIssue = { id: 1, assigneeId: 2 };
    (prisma.$transaction as jest.Mock).mockResolvedValue([mockUpdatedIssue]);

    const result = await issueService.assignUser(1, 2, 1);

    expect(result).toEqual(mockUpdatedIssue);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe('IssueService - addTag', () => {
  let issueService: IssueService;

  beforeEach(() => {
    issueService = new IssueService();
    jest.clearAllMocks();
  });

  // TEST 6: Controllo Accessi
  it('Dovrebbe lanciare errore se l\'utente non ha permessi sull\'issue', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValue({ 
      id: 1, assigneeId: 2, reporterId: 3 
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
      id: 1, role: 'MEMBER' 
    }); 

    await expect(issueService.addTag(1, 'frontend', 1))
      .rejects.toThrow('Permesso negato: solo l\'utente assegnato (o un Amministratore) può aggiungere etichette.');
  });

  // TEST 7: Percorso di Successo (Happy Path)
  it('Dovrebbe associare un tag alla issue con successo', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, role: 'ADMIN' });
    
    const mockIssueWithTag = { id: 1, tags: [{ name: 'frontend' }] };
    
    // Il servizio reale non usa la transazione qui, fa un update diretto
    (prisma.issue.update as jest.Mock).mockResolvedValue(mockIssueWithTag);

    const result = await issueService.addTag(1, 'frontend', 1);

    expect(result).toEqual(mockIssueWithTag);
    expect(prisma.issue.update).toHaveBeenCalledTimes(1);
  });
});