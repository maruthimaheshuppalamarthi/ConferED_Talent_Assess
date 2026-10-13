import { describe, it, expect, beforeEach } from 'vitest';
import { currentRoute, portalSectionPath, portalHomePath, router, PORTALS, PORTAL_INFO } from '../router';

describe('router', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('exposes exactly three portals with roles and configurations', () => {
    expect(PORTALS).toEqual(['admin', 'recruiter', 'proctor']);
    expect(PORTAL_INFO.admin.role).toBe('System Admin');
    expect(PORTAL_INFO.recruiter.role).toBe('Recruiter');
    expect(PORTAL_INFO.proctor.role).toBe('Proctor');
  });

  it('identifies candidate route on root URL', () => {
    window.history.replaceState({}, '', '/');
    const route = currentRoute();
    expect(route.kind).toBe('candidate');
  });

  it('identifies staff portal routes correctly', () => {
    window.history.replaceState({}, '', '/admin');
    expect(currentRoute()).toEqual({ kind: 'staff', portal: 'admin', section: '' });

    window.history.replaceState({}, '', '/recruiter/question-bank');
    expect(currentRoute()).toEqual({ kind: 'staff', portal: 'recruiter', section: 'question-bank' });

    window.history.replaceState({}, '', '/proctor/identity-verification');
    expect(currentRoute()).toEqual({ kind: 'staff', portal: 'proctor', section: 'identity-verification' });
  });

  it('computes portalSectionPath and portalHomePath properly', () => {
    expect(portalSectionPath('admin', 'staff')).toBe('/admin/staff-management');
    expect(portalSectionPath('recruiter', 'question-bank')).toBe('/recruiter/question-bank');
    expect(portalHomePath('admin')).toBe('/admin/dashboard');
    expect(portalHomePath('recruiter')).toBe('/recruiter/hiring-overview');
  });

  it('triggers router listener when navigating', () => {
    let notified = false;
    router.subscribe(() => {
      notified = true;
    });

    router.navigate('/admin/audit-logs');
    expect(window.location.pathname).toBe('/admin/audit-logs');
    expect(notified).toBe(true);
  });
});
