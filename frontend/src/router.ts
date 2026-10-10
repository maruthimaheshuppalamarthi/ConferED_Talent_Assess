import { DEFAULT_TAB, PORTAL_NAV } from './services/portalNav';
import { Portal, StaffRole } from './types';

/**
 * Tiny path router.
 *
 *   /                                 candidate entry (invitation link)
 *   /admin                            System Admin login (signed-in: redirects to /admin/dashboard)
 *   /admin/dashboard                  Dashboard & Health
 *   /admin/staff-management           Staff Management
 *   /admin/global-system-settings     Global System Settings
 *   /admin/audit-logs                 Audit Logs
 *   /recruiter                        Recruiter portal
 *   /proctor                          Live proctoring portal
 */
export const PORTALS: Portal[] = ['admin', 'recruiter', 'proctor'];

export interface PortalInfo {
  portal: Portal;
  path: string;
  /** Staff role whose login this portal accepts. */
  role: StaffRole;
  title: string;
  loginTitle: string;
  icon: string;
  blurb: string;
  /** Heading of this portal's sidebar menu. */
  menuTitle: string;
}

export const PORTAL_INFO: Record<Portal, PortalInfo> = {
  admin: {
    portal: 'admin',
    path: '/admin',
    role: 'System Admin',
    title: 'System Administrator',
    loginTitle: 'System Admin Portal',
    icon: '🛡️',
    blurb: 'Staff accounts, global settings and audit logs.',
    menuTitle: 'Administration',
  },
  recruiter: {
    portal: 'recruiter',
    path: '/recruiter',
    role: 'Recruiter',
    title: 'Recruiter / HR Workspace',
    loginTitle: 'Recruiter Portal',
    icon: '💼',
    blurb: 'Build assessments and the question bank, invite candidates and review results.',
    menuTitle: 'Hiring',
  },
  proctor: {
    portal: 'proctor',
    path: '/proctor',
    role: 'Proctor',
    title: 'Live Proctoring Monitor',
    loginTitle: 'Proctoring Monitor',
    icon: '📹',
    blurb: 'Verify identities, watch live sessions and act on violations.',
    menuTitle: 'Proctoring',
  },
};

export type Route =
  | { kind: 'candidate' }
  | { kind: 'staff'; portal: Portal; section: string };

export function currentRoute(): Route {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  for (const portal of PORTALS) {
    const base = PORTAL_INFO[portal].path;
    if (path === base || path.startsWith(`${base}/`)) {
      return { kind: 'staff', portal, section: path === base ? '' : path.slice(base.length + 1) };
    }
  }
  return { kind: 'candidate' };
}

/** Browser path for a portal section, e.g. staff → `/admin/staff-management`. */
export function portalSectionPath(portal: Portal, tab: string, hash = ''): string {
  const item = PORTAL_NAV[portal].find(i => i.tab === tab);
  const base = PORTAL_INFO[portal].path;
  const path = item?.slug ? `${base}/${item.slug}` : base;
  return hash ? `${path}#${hash}` : path;
}

/** First screen of a signed-in portal (admin → `/admin/dashboard`). */
export function portalHomePath(portal: Portal): string {
  return portalSectionPath(portal, DEFAULT_TAB[portal]);
}

type Listener = () => void;
const listeners: Listener[] = [];
let listening = false;

function notify() {
  listeners.forEach(l => l());
}

export const router = {
  /** Go to a path without reloading the page. */
  navigate(path: string) {
    const here = window.location.pathname + window.location.search + window.location.hash;
    if (path === here) return;
    window.history.pushState({}, '', path);
    notify();
  },

  subscribe(listener: Listener) {
    listeners.push(listener);
    if (!listening) {
      listening = true;
      window.addEventListener('popstate', notify);
    }
  },
};
