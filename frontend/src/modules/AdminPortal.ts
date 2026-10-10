import { getPortalTab } from '../services/portalNav';
import { AuditPanel } from './admin/AuditPanel';
import { OverviewPanel } from './admin/OverviewPanel';
import { SettingsPanel } from './admin/SettingsPanel';
import { StaffPanel } from './admin/StaffPanel';

/**
 * System Admin portal shell. The section is chosen from the left sidebar (see services/portalNav.ts); each section is
 * its own screen in ./admin and talks to its own part of the /admin API:
 *
 *   overview  Dashboard & Health      /admin/dashboard/*
 *   staff     Staff Management        /admin/staff/*
 *   settings  Global System Settings  /admin/settings/*
 *   audit     Audit Logs              /admin/audit-logs, /admin/login-events
 *
 * Nothing here is mock data and no credential lives in the browser: the server stores and encrypts them.
 */
type AdminTab = 'overview' | 'staff' | 'settings' | 'audit';

const TITLES: Record<AdminTab, { icon: string; title: string; blurb: string }> = {
  overview: { icon: '📊', title: 'Dashboard & Health', blurb: 'How the platform is doing right now: accounts, sign-in security, activity and system health.' },
  staff: { icon: '👥', title: 'Staff Management', blurb: 'Who can sign in, with which role, and what they can do.' },
  settings: { icon: '⚙️', title: 'Global System Settings', blurb: 'Proctoring rules, assessment defaults, security policy and the email gateway.' },
  audit: { icon: '📜', title: 'Audit Logs', blurb: 'Every sign-in and administrative action, with who did it and from where.' },
};

export class AdminPortalModule {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  private get activeTab(): AdminTab {
    const tab = getPortalTab('admin') as AdminTab;
    return tab in TITLES ? tab : 'overview';
  }

  public render(): void {
    const tab = this.activeTab;
    const info = TITLES[tab];
    this.container.innerHTML = `
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <div class="glass-panel p-4 rounded-3xl border border-slate-800">
          <h1 class="text-xl font-extrabold text-white flex items-center gap-2"><span>${info.icon}</span> ${info.title}</h1>
          <p class="text-xs text-slate-400 mt-0.5">${info.blurb}</p>
        </div>
        <div id="admin-tab-content"></div>
      </div>`;
    const host = this.container.querySelector('#admin-tab-content') as HTMLElement;

    switch (tab) {
      case 'overview': new OverviewPanel(host).mount(); break;
      case 'staff': new StaffPanel(host).mount(); break;
      case 'settings': new SettingsPanel(host).mount(); break;
      case 'audit': new AuditPanel(host).mount(); break;
    }
  }
}
