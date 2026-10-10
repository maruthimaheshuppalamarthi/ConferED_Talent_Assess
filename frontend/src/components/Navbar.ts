import { PORTAL_INFO, PORTALS, currentRoute, portalHomePath, router } from '../router';
import { store } from '../services/store';
import { Portal } from '../types';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/**
 * Top bar.
 *  - Candidate entry (/):   a single "Staff Login" menu that leads to the three portal login pages.
 *  - Staff portals:         portal name, who is signed in, change-password and sign-out
 *                           (System Admin additionally gets a switcher between the portals).
 * The app re-renders this component often, so the menu's open/closed state is kept in a static field.
 */
export class NavbarComponent {
  private static menuOpen = false;
  private static outsideClickBound = false;

  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render() {
    const state = store.getState();
    const route = currentRoute();
    const user = state.currentUser;
    const currentTheme = state.theme || 'dark';
    const examParams = new URLSearchParams(window.location.search);
    const onExamLink = examParams.has('invite') || examParams.has('assessment');
    const isExplicitCandidateLink = examParams.has('assessment') || examParams.has('invite');
    const inCandidateSession = state.otpVerified || state.examStarted;

    // Signed-in staff already see their portal in the sidebar, so the badge is not repeated here.
    const staffSignedIn = route.kind === 'staff' && state.isStaffAuthenticated && !!user;
    const badge = staffSignedIn
      ? ''
      : route.kind === 'staff'
        ? PORTAL_INFO[route.portal].title
        : isExplicitCandidateLink
          ? 'Candidate Assessment Portal'
          : 'Evaluation Platform';

    // Portals the "Staff Login" menu offers: everything when signed out, only allowed ones when signed in.
    const menuPortals: Portal[] = state.isStaffAuthenticated ? state.allowedPortals : PORTALS;

    this.container.innerHTML = `
      <header class="glass-panel border-b border-slate-800/80 sticky top-0 z-50 px-4 lg:px-8 py-3 transition-all">
        <div class="${staffSignedIn ? '' : 'max-w-7xl mx-auto '}flex items-center justify-between">
          <!-- Logo & Platform Identity -->
          <div class="flex items-center gap-3 ${onExamLink ? '' : 'cursor-pointer'}" id="brand-logo-btn">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span class="text-xl font-black text-white tracking-wider">N</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-lg text-white tracking-tight">Nexus<span class="text-blue-500">Assess</span></span>
                ${badge ? `
                <span class="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  ${escapeHtml(badge)}
                </span>` : ''}
              </div>
              <p class="text-xs text-slate-400 font-medium">Enterprise Online Assessment Platform</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Global Theme Switcher (Dark / Light) -->
            <button id="theme-toggle-btn" title="Toggle Light / Dark Mode" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm">
              <span>${currentTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}</span>
            </button>

            ${staffSignedIn ? this.staffControlsHtml() : ''}

            ${route.kind === 'candidate' && !onExamLink && !inCandidateSession ? this.staffMenuHtml(menuPortals, state.isStaffAuthenticated) : ''}

            <!-- Global Proctoring Indicator Status Badge -->
            ${state.examStarted ? `
              <div class="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl animate-pulse">
                <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <span class="text-xs font-bold text-red-400 uppercase tracking-wider">PROCTORING ACTIVE</span>
              </div>
            ` : ''}
          </div>
        </div>
      </header>
    `;

    this.attachEvents();
  }

  /** Signed-in controls on a staff portal page. */
  private staffControlsHtml(): string {
    const user = store.getState().currentUser!;

    return `
      <span class="hidden sm:inline text-xs font-bold text-white" title="${escapeHtml(user.role)}">${escapeHtml(user.name)}</span>

      <button id="logout-btn" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-red-400 text-xs font-bold transition-all flex items-center gap-1">
        <span>🚪</span> Logout
      </button>
    `;
  }

  /** The single "Staff Login" entry on the candidate landing page. */
  private staffMenuHtml(portals: Portal[], signedIn: boolean): string {
    return `
      <div class="relative">
        <button id="staff-menu-btn" aria-haspopup="true" aria-expanded="${NavbarComponent.menuOpen}" class="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30">
          <span>🔒</span> ${signedIn ? 'My Portals' : 'Staff Login'} <span class="text-[10px]">▾</span>
        </button>
        ${NavbarComponent.menuOpen ? `
          <div id="staff-menu" class="absolute right-0 mt-2 w-72 menu-panel rounded-2xl border border-slate-800 shadow-2xl p-2 space-y-1 z-50">
            ${portals.map(p => `
              <button data-portal-link="${p}" class="portal-link w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-800/70 transition-all flex items-start gap-3">
                <span class="text-lg leading-none mt-0.5">${PORTAL_INFO[p].icon}</span>
                <span>
                  <span class="block text-xs font-bold text-white">${PORTAL_INFO[p].title}</span>
                  <span class="block text-[11px] text-slate-400">${PORTAL_INFO[p].blurb}</span>
                </span>
              </button>
            `).join('')}
            ${signedIn ? `
              <button id="menu-logout-btn" class="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-800/70 text-xs font-bold text-slate-300 flex items-center gap-2 border-t border-slate-800 mt-1">
                <span>🚪</span> Logout
              </button>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  private attachEvents() {
    const q = (sel: string) => this.container.querySelector(sel);

    q('#brand-logo-btn')?.addEventListener('click', () => {
      const params = new URLSearchParams(window.location.search);
      if (params.has('invite') || params.has('assessment')) return;
      NavbarComponent.menuOpen = false;
      const route = currentRoute();
      if (route.kind === 'staff' && store.getState().isStaffAuthenticated) {
        // Signed in: the logo returns to this portal's dashboard, not the public landing page.
        router.navigate(portalHomePath(route.portal));
      } else {
        router.navigate('/');
      }
    });

    q('#theme-toggle-btn')?.addEventListener('click', () => store.toggleTheme());

    q('#logout-btn')?.addEventListener('click', () => {
      store.logoutStaff().catch(() => {});
    });
    q('#menu-logout-btn')?.addEventListener('click', () => {
      NavbarComponent.menuOpen = false;
      store.logoutStaff().catch(() => {});
    });

    // "Staff Login" menu
    q('#staff-menu-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      NavbarComponent.menuOpen = !NavbarComponent.menuOpen;
      this.render();
    });
    this.container.querySelectorAll('.portal-link').forEach(btn =>
      btn.addEventListener('click', e => {
        const portal = (e.currentTarget as HTMLElement).getAttribute('data-portal-link') as Portal;
        NavbarComponent.menuOpen = false;
        router.navigate(PORTAL_INFO[portal].path);
      }));

    if (!NavbarComponent.outsideClickBound) {
      NavbarComponent.outsideClickBound = true;
      document.addEventListener('click', e => {
        if (NavbarComponent.menuOpen && !(e.target as HTMLElement).closest('#staff-menu')) {
          NavbarComponent.menuOpen = false;
          document.getElementById('staff-menu')?.remove();
          document.getElementById('staff-menu-btn')?.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }
}
