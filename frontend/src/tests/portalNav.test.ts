import { describe, it, expect, beforeEach } from 'vitest';
import {
  PORTAL_NAV,
  DEFAULT_TAB,
  getPortalTab,
  setPortalTab,
  applyPathTab,
  resetPortalTabs,
} from '../services/portalNav';

describe('portalNav', () => {
  beforeEach(() => {
    resetPortalTabs();
  });

  it('provides expected navigation items for each portal', () => {
    expect(PORTAL_NAV.admin.map(i => i.tab)).toEqual(['overview', 'staff', 'settings', 'audit']);
    expect(PORTAL_NAV.recruiter.map(i => i.tab)).toEqual([
      'pipeline',
      'candidate-evaluations',
      'assessment-builder',
      'question-bank',
    ]);
    expect(PORTAL_NAV.proctor.map(i => i.tab)).toEqual(['live', 'identity-verification']);
  });

  it('returns default tabs initially', () => {
    expect(getPortalTab('admin')).toBe(DEFAULT_TAB.admin);
    expect(getPortalTab('recruiter')).toBe(DEFAULT_TAB.recruiter);
    expect(getPortalTab('proctor')).toBe(DEFAULT_TAB.proctor);
  });

  it('updates and gets portal tab independently', () => {
    setPortalTab('admin', 'staff');
    setPortalTab('recruiter', 'question-bank');

    expect(getPortalTab('admin')).toBe('staff');
    expect(getPortalTab('recruiter')).toBe('question-bank');
    // Proctor remains untouched
    expect(getPortalTab('proctor')).toBe(DEFAULT_TAB.proctor);
  });

  it('correctly maps URL slugs via applyPathTab', () => {
    // Admin slugs
    applyPathTab('admin', 'staff-management');
    expect(getPortalTab('admin')).toBe('staff');

    applyPathTab('admin', 'global-system-settings');
    expect(getPortalTab('admin')).toBe('settings');

    // Recruiter slugs
    applyPathTab('recruiter', 'assessment-builder');
    expect(getPortalTab('recruiter')).toBe('assessment-builder');

    applyPathTab('recruiter', 'question-bank');
    expect(getPortalTab('recruiter')).toBe('question-bank');

    applyPathTab('recruiter', 'hiring-overview');
    expect(getPortalTab('recruiter')).toBe('pipeline');

    applyPathTab('recruiter', 'candidates/cand-xyz-123');
    expect(getPortalTab('recruiter')).toBe('candidate-evaluations');

    // Unknown slug defaults to DEFAULT_TAB
    applyPathTab('admin', 'non-existent-slug');
    expect(getPortalTab('admin')).toBe(DEFAULT_TAB.admin);
  });
});
