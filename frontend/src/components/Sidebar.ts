import { PORTAL_INFO, portalHomePath, portalSectionPath, router } from '../router';
import { authApi } from '../services/authApi';
import { PORTAL_NAV, getPortalTab } from '../services/portalNav';
import { store } from '../services/store';
import { Portal } from '../types';

const itemClass = (active: boolean) =>
  `w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 ${
    active
      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
  }`;

/**
 * Left navigation for signed-in staff: one scrolling bar with two sections.
 *   1. Workspaces: only shown if the account may open more than one portal (normally hidden).
 *   2. The menu of the portal that is currently open (admin / recruiter / proctor sections).
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

    // Every role has exactly one portal, so a "Workspaces" switcher only appears if an account ever has several.
    const showWorkspaces = state.allowedPortals.length > 1;

    this.container.innerHTML = `
      <nav class="space-y-6" aria-label="Staff navigation">
        ${showWorkspaces ? `
        <div>
          <p class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Workspaces</p>
          <div class="space-y-1">
            ${state.allowedPortals.map(p => `
              <button data-portal="${p}" class="side-portal ${itemClass(p === this.active)}">
                <span class="text-base leading-none">${PORTAL_INFO[p].icon}</span>
                <span>${PORTAL_INFO[p].title}</span>
              </button>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="${showWorkspaces ? 'pt-5 border-t border-slate-800' : ''}">
          <p class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">${PORTAL_INFO[this.active].menuTitle}</p>
          <div class="space-y-1">
            ${PORTAL_NAV[this.active].map(item => `
              <button data-nav-tab="${item.tab}" class="side-nav ${itemClass(item.tab === currentTab)}">
                <span class="text-base leading-none">${item.icon}</span>
                <span>${item.label}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </nav>
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
