import { describe, it, expect, beforeEach, vi } from 'vitest';
import { questionBankStore } from '../services/questionBankStore';
import { Question } from '../types';

vi.mock('../services/recruiterApi', () => ({
  recruiterApi: {
    questionBanks: vi.fn().mockResolvedValue({ items: [] }),
    createQuestionBank: vi.fn().mockResolvedValue({ id: 'qb-server-mock' }),
    updateQuestionBank: vi.fn().mockResolvedValue({ ok: true }),
    deleteQuestionBank: vi.fn().mockResolvedValue({ ok: true }),
  },
}));

describe('QuestionBankStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('guarantees that Default Question Bank (qb-default) is always present and marked as default', () => {
    const banks = questionBankStore.getBanks();
    const defaultBank = banks.find(b => b.id === 'qb-default');
    expect(defaultBank).toBeDefined();
    expect(defaultBank?.name).toBe('Default Question Bank');
    expect(defaultBank?.isDefault).toBe(true);
  });

  it('prevents deletion of the permanent Default Question Bank', () => {
    questionBankStore.deleteBank('qb-default');
    const banks = questionBankStore.getBanks();
    const defaultBank = banks.find(b => b.id === 'qb-default');
    expect(defaultBank).toBeDefined();
    expect(defaultBank?.isDefault).toBe(true);
  });

  it('allows creating custom question banks assigned to specific jobs', () => {
    const customBank = questionBankStore.createBank(
      'DevOps Special Bank',
      'Advanced CI/CD questions',
      'job-devops-123',
      'DevOps Engineer'
    );
    expect(customBank.id).toBeDefined();
    expect(customBank.name).toBe('DevOps Special Bank');
    expect(customBank.jobId).toBe('job-devops-123');
    expect(customBank.jobTitle).toBe('DevOps Engineer');

    const found = questionBankStore.getBank(customBank.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('DevOps Special Bank');
  });

  it('correctly filters banks for a specific job without leaking banks from other jobs', () => {
    const devopsBank = questionBankStore.createBank(
      'DevOps Bank',
      'Docker & K8s',
      'job-devops',
      'DevOps Engineer'
    );
    const seniorBank = questionBankStore.createBank(
      'Senior Software Bank',
      'Architecture & Algorithms',
      'job-senior',
      'Senior Software Engineer'
    );

    const questions: Question[] = [];

    // When querying for Senior Software Engineer, devopsBank must NEVER be returned
    const seniorResults = questionBankStore.getBanksForJob('job-senior', questions);
    expect(seniorResults.some(b => b.id === seniorBank.id)).toBe(true);
    expect(seniorResults.some(b => b.id === devopsBank.id)).toBe(false);

    // When querying for DevOps Engineer, seniorBank must NEVER be returned
    const devopsResults = questionBankStore.getBanksForJob('job-devops', questions);
    expect(devopsResults.some(b => b.id === devopsBank.id)).toBe(true);
    expect(devopsResults.some(b => b.id === seniorBank.id)).toBe(false);
  });

  it('stamps questions with correct bank tags', () => {
    const initialTags = ['algorithms', 'level-3'];
    const stamped = questionBankStore.stampQuestionBank(initialTags, 'qb-custom-999');
    expect(stamped).toContain('algorithms');
    expect(stamped).toContain('level-3');
    expect(stamped).toContain('bank:qb-custom-999');

    // Overwriting bank stamp replaces the previous one
    const reStamped = questionBankStore.stampQuestionBank(stamped, 'qb-default');
    expect(reStamped).not.toContain('bank:qb-custom-999');
    expect(reStamped).toContain('bank:qb-default');
  });
});
