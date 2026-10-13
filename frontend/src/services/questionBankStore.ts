import { Question } from '../types';
import { recruiterApi } from './recruiterApi';

export interface QuestionBankFolder {
  id: string;
  name: string;
  description: string;
  jobId?: string | null;
  jobTitle?: string | null;
  createdAt: string;
  badgeTone?: string;
  isDefault?: boolean;
}

const STORAGE_KEY = 'confered_question_banks';

const DEFAULT_MAIN_BANK: QuestionBankFolder = {
  id: 'qb-default',
  name: 'Default Question Bank',
  description: 'Default repository containing all questions, MCQs, and coding challenges across all jobs.',
  jobId: null,
  jobTitle: null,
  createdAt: new Date().toISOString(),
  badgeTone: 'from-blue-600 to-indigo-600',
  isDefault: true,
};

const DEFAULT_BANKS: QuestionBankFolder[] = [
  DEFAULT_MAIN_BANK,
];

class QuestionBankStore {
  private banks: QuestionBankFolder[] = [];
  private syncedWithBackend = false;

  constructor() {
    this.init();
    void this.syncFromBackend();
  }

  private init() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.banks = this.ensureDefaultBank(parsed);
          return;
        }
      }
    } catch {
      // fallback
    }
    this.banks = [...DEFAULT_BANKS];
    this.persist();
  }

  private ensureDefaultBank(list: QuestionBankFolder[]): QuestionBankFolder[] {
    const hasDefault = list.some(b => b.id === 'qb-default' || b.isDefault);
    if (!hasDefault) {
      return [DEFAULT_MAIN_BANK, ...list.filter(b => b.id !== 'qb-default')];
    }
    return list.map(b => (b.id === 'qb-default' ? { ...b, name: 'Default Question Bank', isDefault: true } : b));
  }

  public async syncFromBackend(): Promise<void> {
    try {
      const res = await recruiterApi.questionBanks();
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        const mapped = res.items.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          jobId: item.jobId || null,
          jobTitle: item.jobTitle || null,
          createdAt: item.createdAt || new Date().toISOString(),
          badgeTone: item.badgeTone || 'from-blue-600 to-indigo-600',
          isDefault: Boolean(item.isDefault || item.id === 'qb-default'),
        }));
        this.banks = this.ensureDefaultBank(mapped);
        this.syncedWithBackend = true;
        this.persist();
      }
    } catch {
      // Offline fallback: keep local cache
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.banks));
    } catch {
      // ignore
    }
  }

  public getBanks(): QuestionBankFolder[] {
    if (!this.banks.length) {
      this.init();
    }
    return [...this.banks];
  }

  public getBank(id: string): QuestionBankFolder | null {
    return this.banks.find(b => b.id === id) || null;
  }

  public createBank(name: string, description: string, jobId?: string | null, jobTitle?: string | null): QuestionBankFolder {
    const id = `qb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const tones = [
      'from-blue-600 to-indigo-600',
      'from-emerald-600 to-teal-600',
      'from-purple-600 to-violet-600',
      'from-amber-600 to-orange-600',
      'from-cyan-600 to-blue-600',
    ];
    const badgeTone = tones[this.banks.length % tones.length];
    const newBank: QuestionBankFolder = {
      id,
      name: name.trim() || `Question Bank ${this.banks.length + 1}`,
      description: description.trim(),
      jobId: jobId || null,
      jobTitle: jobTitle || null,
      createdAt: new Date().toISOString(),
      badgeTone,
      isDefault: false,
    };
    this.banks.push(newBank);
    this.persist();

    // Persist to database in background
    void recruiterApi.createQuestionBank({
      name: newBank.name,
      description: newBank.description,
      jobId: newBank.jobId,
      jobTitle: newBank.jobTitle,
      badgeTone: newBank.badgeTone,
    }).then(serverRow => {
      if (serverRow?.id && serverRow.id !== id) {
        newBank.id = serverRow.id;
        this.persist();
      }
    }).catch(() => undefined);

    return newBank;
  }

  public updateBank(id: string, updates: Partial<QuestionBankFolder>): void {
    const idx = this.banks.findIndex(b => b.id === id);
    if (idx !== -1) {
      const isDef = Boolean(this.banks[idx].isDefault || id === 'qb-default');
      // If default bank, prevent renaming
      const safeUpdates = isDef ? { ...updates, name: 'Default Question Bank', isDefault: true } : updates;
      this.banks[idx] = { ...this.banks[idx], ...safeUpdates };
      this.persist();

      // Persist to database in background
      void recruiterApi.updateQuestionBank(id, {
        name: this.banks[idx].name,
        description: updates.description,
        jobId: updates.jobId,
        jobTitle: updates.jobTitle,
      }).catch(() => undefined);
    }
  }

  public deleteBank(id: string): void {
    const bank = this.banks.find(b => b.id === id);
    if (!bank || bank.isDefault || bank.id === 'qb-default') {
      return; // Protected: Default Question Bank cannot be deleted
    }
    this.banks = this.banks.filter(b => b.id !== id);
    if (!this.banks.length) {
      this.banks = [...DEFAULT_BANKS];
    }
    this.persist();

    // Delete in database in background
    void recruiterApi.deleteQuestionBank(id).catch(() => undefined);
  }

  /**
   * Resolves which Question Bank folder a question belongs to.
   * If not explicitly tagged with an existing custom bank, belongs to the Default Question Bank.
   */
  public getBankIdForQuestion(q: Question): string {
    const tags = Array.isArray(q.tags) ? q.tags : [];
    for (const tag of tags) {
      if (typeof tag === 'string' && tag.startsWith('bank:')) {
        const val = tag.substring(5).trim();
        const found = this.banks.find(b => b.id === val || b.name.toLowerCase() === val.toLowerCase());
        if (found) return found.id;
      }
    }
    // Check if any specific custom bank is assigned to this question's jobId
    if (q.jobId) {
      const matchJob = this.banks.find(b => b.jobId === q.jobId && !b.isDefault && b.id !== 'qb-default');
      if (matchJob) return matchJob.id;
    }
    // All questions by default belong to Default Question Bank!
    return 'qb-default';
  }

  /**
   * Stamps the question with the bank tag.
   */
  public stampQuestionBank(tags: string[] | undefined, bankId: string): string[] {
    const list = Array.isArray(tags) ? tags.filter(t => typeof t === 'string' && !t.startsWith('bank:')) : [];
    list.push(`bank:${bankId}`);
    return list;
  }

  /**
   * Returns all Question Banks relevant for a given job.
   */
  public getBanksForJob(jobId: string, questions: Question[]): QuestionBankFolder[] {
    const matchingBanks = new Set<string>();
    for (const bank of this.banks) {
      if (bank.jobId === jobId) {
        matchingBanks.add(bank.id);
      }
    }
    // Also include banks that contain questions assigned to this job
    for (const q of questions) {
      if (q.jobId === jobId) {
        const bId = this.getBankIdForQuestion(q);
        matchingBanks.add(bId);
      }
    }
    if (matchingBanks.size > 0) {
      return this.banks.filter(b => matchingBanks.has(b.id));
    }
    // If no specific bank is assigned, only return general / unassigned banks (like Default Bank)
    // NEVER return banks assigned to another job!
    return this.banks.filter(b => !b.jobId);
  }
}

export const questionBankStore = new QuestionBankStore();
