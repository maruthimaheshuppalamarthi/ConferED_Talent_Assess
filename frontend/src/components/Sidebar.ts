import { PORTAL_THEMES } from '../brand';
import { PORTAL_INFO, portalHomePath, portalSectionPath, router } from '../router';
import { authApi } from '../services/authApi';
import { PORTAL_NAV, getPortalTab } from '../services/portalNav';
import { store } from '../services/store';
import { Portal } from '../types';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/**
 * Left navigation for signed-in staff:
 *  - Top: Workspace identity badge & connection status
 *  - Middle: Section menu (active tab styled with portal theme gradient)
 *  - Bottom: Workspace switcher (if permitted) & User profile card
 */
export class SidebarComponent {
  private container: HTMLElement;
  private active: Portal;

  constructor(container: HTMLElement, active: Portal) {
    this.container = container;
    this.active = active;
  }

  public render() {
    const state = store.getState();
    const currentTab = getPortalTab(this.active);
    const theme = PORTAL_THEMES[this.active];
    const isLight = state.theme === 'light';
    const user = state.currentUser;
    const showWorkspaces = state.allowedPortals.length > 1;

    const itemClass = (active: boolean) => {
      if (active) {
        return `w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-3 bg-gradient-to-r ${theme.gradient} ${theme.shadowGlow}`;
      }
      return `w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-3 ${
        isLight
          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
      }`;
    };

    this.container.innerHTML = `
      <div class="flex flex-col h-full justify-between space-y-6">
        
        <div class="space-y-5">
          <!-- Active Workspace Header Badge -->
          <div class="px-2 py-3 rounded-2xl border transition-all ${isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-900/70 border-slate-800'}">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-inner"
                   style="background:${theme.accentLight}; border:1px solid ${theme.accentBorder}">
                ${theme.icon}
              </div>
              <div class="min-w-0 flex-1">
                <span class="block text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}">
                  ${theme.name}
                </span>
                <span class="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 mt-0.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active Session
                </span>
              </div>
            </div>
          </div>

          <!-- Multi-Workspace Switcher (only shown if account has multiple permissions) -->
          ${showWorkspaces ? `
            <div>
              <p class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Workspaces</p>
              <div class="space-y-1">
                ${state.allowedPortals.map(p => {
                  const pTheme = PORTAL_THEMES[p];
                  const isCurrent = p === this.active;
                  return `
                    <button data-portal="${p}" class="side-portal w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5
                            ${isCurrent
                              ? (isLight ? 'bg-slate-100 text-blue-900 font-bold' : 'bg-slate-800 text-blue-400 font-bold')
                              : (isLight ? 'text-slate-500 hover:bg-slate-50' : 'text-slate-400 hover:bg-slate-800/40')}">
                      <span class="text-sm leading-none">${pTheme.icon}</span>
                      <span class="truncate">${pTheme.name}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Portal Navigation Menu -->
          <nav class="space-y-1" aria-label="Portal sections">
            <p class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ${PORTAL_INFO[this.active].menuTitle}
            </p>
            ${PORTAL_NAV[this.active].map(item => `
              <button data-nav-tab="${item.tab}" class="side-nav ${itemClass(item.tab === currentTab)}">
                <span class="text-base leading-none">${item.icon}</span>
                <span class="truncate">${item.label}</span>
              </button>
            `).join('')}
          </nav>
        </div>

      </div>
    `;

    this.container.querySelectorAll('.side-portal').forEach(btn =>
      btn.addEventListener('click', e => {
        const portal = (e.currentTarget as HTMLElement).getAttribute('data-portal') as Portal;
        authApi.setActivePortal(portal);
        router.navigate(portalHomePath(portal));
      }));

    this.container.querySelectorAll('.side-nav').forEach(btn =>
      btn.addEventListener('click', e => {
        const tab = (e.currentTarget as HTMLElement).getAttribute('data-nav-tab') as string;
        router.navigate(portalSectionPath(this.active, tab));
      }));
  }
}
