import { Portal } from '../types';

/**
 * Sidebar sections of each portal, and which one is open.
 * The app re-creates the portal modules on every store change, so the open section lives here
 * (module scope); the sidebar (navigation) and the portal pages (content) both read it.
 *
 *   System Admin  people & platform: dashboard, staff, global settings, audit logs
 *   Recruiter     hiring work: pipeline, assessment builder, question bank
 *   Proctor       exam day: live monitoring, identity & ID verification
 */
export interface NavItem {
  tab: string;
  icon: string;
  label: string;
  /** Path after the portal root. Empty means the portal URL itself (/admin, /recruiter, /proctor). */
  slug?: string;
}

export const PORTAL_NAV: Record<Portal, NavItem[]> = {
  admin: [
    { tab: 'overview', icon: '📊', label: 'Dashboard & Health', slug: 'dashboard' },
    { tab: 'staff', icon: '👥', label: 'Staff Management', slug: 'staff-management' },
    { tab: 'settings', icon: '⚙️', label: 'Global System Settings', slug: 'global-system-settings' },
    { tab: 'audit', icon: '📜', label: 'Audit Logs', slug: 'audit-logs' },
  ],
  recruiter: [
    { tab: 'pipeline', icon: '📊', label: 'Hiring Overview', slug: 'hiring-overview' },
    { tab: 'candidate-evaluations', icon: '🎯', label: 'Candidate Assessments', slug: 'candidate-assessments' },
    { tab: 'assessment-builder', icon: '🛠️', label: 'Assessment Builder', slug: 'assessment-builder' },
    { tab: 'question-bank', icon: '🗂️', label: 'Question Bank', slug: 'question-bank' },
  ],
  proctor: [
    { tab: 'live', icon: '📹', label: 'Live Monitoring' },
    { tab: 'identity-verification', icon: '📸', label: 'Identity & ID Verification', slug: 'identity-verification' },
  ],
};

/** Section that opens first for each portal (right after sign-in or when the logo is clicked). */
export const DEFAULT_TAB: Record<Portal, string> = {
  admin: 'overview',
  recruiter: 'pipeline',
  proctor: 'live',
};

const current: Record<Portal, string> = { ...DEFAULT_TAB };

export const getPortalTab = (portal: Portal): string => {
  const known = PORTAL_NAV[portal].some(item => item.tab === current[portal]);
  return known ? current[portal] : DEFAULT_TAB[portal];
};

export const setPortalTab = (portal: Portal, tab: string): void => {
  current[portal] = tab;
};

/** Open the section that matches the URL (`staff-management` → staff). Unknown slugs fall back to the default. */
export const applyPathTab = (portal: Portal, sectionSlug: string): void => {
  // Candidate detail lives under candidate evaluations (`/recruiter/candidates/:id`).
  if (portal === 'recruiter' && sectionSlug.startsWith('candidates/')) {
    current[portal] = 'candidate-evaluations';
    return;
  }
  if (portal === 'recruiter' && (sectionSlug === 'hiringpipeline' || sectionSlug === 'pipeline' || sectionSlug === 'hiring-overview' || !sectionSlug)) {
    current[portal] = 'pipeline';
    return;
  }
  const match = PORTAL_NAV[portal].find(item => (item.slug || '') === sectionSlug);
  current[portal] = match ? match.tab : DEFAULT_TAB[portal];
};

export const resetPortalTabs = (): void => {
  (Object.keys(DEFAULT_TAB) as Portal[]).forEach(p => {
    current[p] = DEFAULT_TAB[p];
  });
};
