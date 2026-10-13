import { flushCodingEditor } from './components/MonacoEditorComponent';
import { FooterComponent } from './components/Footer';
import { NavbarComponent } from './components/Navbar';
import { SidebarComponent } from './components/Sidebar';
import { AdminPortalModule } from './modules/AdminPortal';
import { CandidatePortalModule } from './modules/CandidatePortal';
import { LiveMonitorPortalModule } from './modules/LiveMonitorPortal';
import { RecruiterPortalModule } from './modules/RecruiterPortal';
import { AccessDeniedPage } from './pages/AccessDenied';
import { ForcedPasswordChangePage } from './pages/ChangePassword';
import { StaffLoginPage } from './pages/StaffLogin';
import { Route, currentRoute, portalHomePath, router } from './router';
import { applyPathTab, resetPortalTabs } from './services/portalNav';
import { authApi } from './services/authApi';
import { candidateAssist } from './services/candidateAssist';
import { readExamSnapshot } from './services/examDraft';
import { store } from './services/store';
import { Portal } from './types';
import './styles/index.css';

class App {
  private appElement: HTMLElement;
  private navbarHost: HTMLElement;
  private contentHost: HTMLElement;
  private footerHost: HTMLElement;
  // Portals whose session restore (refresh cookie) is currently running.
  private restoring = new Set<Portal>();
  private wasStaffAuthenticated = false;

  constructor() {
    this.appElement = document.getElementById('app') as HTMLElement;

    // Inject Layout Shell
    this.appElement.innerHTML = `
      <div id="app-shell" class="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <div id="navbar-host" class="sticky top-0 z-50"></div>
        <main id="content-host" class="flex-1"></main>
        <div id="footer-host"></div>
      </div>
    `;

    this.navbarHost = document.getElementById('navbar-host') as HTMLElement;
    this.contentHost = document.getElementById('content-host') as HTMLElement;
    this.footerHost = document.getElementById('footer-host') as HTMLElement;

    // Re-render whenever the store changes or the URL changes.
    store.subscribe(() => this.render());
    router.subscribe(() => {
      this.syncSession(currentRoute()).catch(e => console.error('Session restore failed', e));
      this.render();
    });
  }

  /**
   * Opening a staff portal URL: turn the HttpOnly refresh cookie (if any) back into an in-memory
   * session for THAT portal. Candidate invitation links never pick up a staff session.
   */
  public async syncSession(route: Route): Promise<void> {
    if (route.kind !== 'staff') return;
    const portal = route.portal;
    const state = store.getState();

    if (state.isStaffAuthenticated) {
      authApi.setActivePortal(portal); // an admin moving between portals keeps the same session
      return;
    }
    if (this.restoring.has(portal)) return;

    this.restoring.add(portal);
    store.setAuthReady(false);
    try {
      const session = await authApi.restoreSession(portal);
      if (session) store.loginStaff(session.user);
    } catch (e) {
      console.error('Session restore failed', e);
    } finally {
      this.restoring.delete(portal);
      store.setAuthReady(true);
    }
  }

  public render() {
    const navbar = new NavbarComponent(this.navbarHost);
    navbar.render();

    const state = store.getState();
    const route = currentRoute();
    const examLive = state.examStarted && !state.examCompleted;
    const isStaffSignedIn = route.kind === 'staff' && state.isStaffAuthenticated && !!state.currentUser;
    const showFooter = !examLive;
    const shell = document.getElementById('app-shell');
    if (shell) {
      shell.className = 'min-h-screen flex flex-col bg-slate-950 text-slate-100';
    }
    if (showFooter) {
      const footerMode = isStaffSignedIn ? 'small' : 'full';
      new FooterComponent(this.footerHost, footerMode).render();
    } else {
      this.footerHost.innerHTML = '';
    }

    // A fresh sign-in (or sign-out) resets in-memory tabs; the URL then restores the open section.
    if (state.isStaffAuthenticated !== this.wasStaffAuthenticated) {
      this.wasStaffAuthenticated = state.isStaffAuthenticated;
      resetPortalTabs();
    }
    if (route.kind === 'staff') {
      applyPathTab(route.portal, route.section);
      // `/admin` is the login URL; once signed in, show `/admin/dashboard` in the address bar.
      if (state.isStaffAuthenticated && !route.section) {
        const home = portalHomePath(route.portal);
        if (home !== window.location.pathname) window.history.replaceState({}, '', home);
      }
    }

    this.contentHost.innerHTML = '';

    if (route.kind === 'candidate') {
      new CandidatePortalModule(this.contentHost).render();
      if (state.otpVerified) candidateAssist.mount();
      else candidateAssist.hide();
      return;
    }
    candidateAssist.hide();

    // ---- staff portals (/admin, /recruiter, /proctor)
    const portal = route.portal;

    if (!state.authReady) {
      this.contentHost.innerHTML = `
        <div class="py-24 text-center text-xs text-slate-500 font-mono">Checking your session…</div>
      `;
      return;
    }

    if (!state.isStaffAuthenticated || !state.currentUser) {
      new StaffLoginPage(this.contentHost, portal).render();
      return;
    }

    if (!state.allowedPortals.includes(portal)) {
      new AccessDeniedPage(this.contentHost, portal).render();
      return;
    }

    if (state.currentUser.mustChangePassword) {
      new ForcedPasswordChangePage(this.contentHost, portal).render();
      return;
    }

    // Signed-in layout: one scrolling sidebar on the left, the portal page on the right.
    const navHeight = this.navbarHost.offsetHeight;
    this.contentHost.innerHTML = `
      <div class="flex flex-col md:flex-row md:items-start flex-1 min-h-[calc(100vh-110px)]">
        <aside id="sidebar-host"
          class="glass-panel w-full md:w-64 md:shrink-0 rounded-none border-0 border-b md:border-b-0 md:border-r border-slate-800 p-3 md:sticky md:overflow-y-auto"
          style="${navHeight ? `top:${navHeight}px;height:calc(100vh - ${navHeight}px - 44px)` : ''}"></aside>
        <div id="portal-host" class="flex-1 min-w-0"></div>
      </div>
    `;
    new SidebarComponent(this.contentHost.querySelector('#sidebar-host') as HTMLElement, portal).render();
    const portalHost = this.contentHost.querySelector('#portal-host') as HTMLElement;

    if (portal === 'admin') new AdminPortalModule(portalHost).render();
    else if (portal === 'recruiter') new RecruiterPortalModule(portalHost).render();
    else new LiveMonitorPortalModule(portalHost).render();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const invite = new URLSearchParams(window.location.search).get('invite');
  const snap = readExamSnapshot();
  if (invite && snap?.inviteToken === invite && authApi.getCandidateToken()) {
    store.hydrateExam(snap);
  } else if (invite && snap?.inviteToken === invite && snap.codeDrafts) {
    store.seedCodeDrafts(snap.codeDrafts);
  } else if (snap && invite && snap.inviteToken !== invite) {
    authApi.clearCandidateSession();
  }
  window.addEventListener('pagehide', () => {
    flushCodingEditor();
    store.flushExamProgress();
  });

  const app = new App();
  app.render();

  try {
    await app.syncSession(currentRoute());
  } catch (e) {
    console.error('Session restore failed', e);
  } finally {
    store.markAuthReady();
  }
});

// Safety net: surface any promise rejection that slips through instead of failing silently.
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
