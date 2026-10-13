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
        <div class="p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel border-slate-800">
          <div class="space-y-1">
            <h1 class="text-xl font-extrabold flex items-center gap-2.5">
              <span class="text-2xl">${info.icon}</span>
              <span>${info.title}</span>
            </h1>
            <p class="text-xs text-slate-400 max-w-2xl">${info.blurb}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span> Admin Console
            </span>
            <span class="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Healthy
            </span>
          </div>
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
