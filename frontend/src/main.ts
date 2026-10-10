import { NavbarComponent } from './components/Navbar';
import { AdminPortalModule } from './modules/AdminPortal';
import { CandidatePortalModule } from './modules/CandidatePortal';
import { LiveMonitorPortalModule } from './modules/LiveMonitorPortal';
import { RecruiterPortalModule } from './modules/RecruiterPortal';
import { authApi } from './services/authApi';
import { store } from './services/store';
import './styles/index.css';

class App {
  private appElement: HTMLElement;
  private navbarHost: HTMLElement;
  private contentHost: HTMLElement;

  constructor() {
    this.appElement = document.getElementById('app') as HTMLElement;
    
    // Inject Layout Shell
    this.appElement.innerHTML = `
      <div class="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <div id="navbar-host"></div>
        <main id="content-host" class="flex-1"></main>
      </div>
    `;

    this.navbarHost = document.getElementById('navbar-host') as HTMLElement;
    this.contentHost = document.getElementById('content-host') as HTMLElement;

    // Subscribe to store updates
    store.subscribe(() => {
      this.render();
    });
  }

  public render() {
    const navbar = new NavbarComponent(this.navbarHost);
    navbar.render();

    const state = store.getState();
    const role = state.currentRole;

    this.contentHost.innerHTML = '';

    if (role === 'Candidate') {
      const candidatePortal = new CandidatePortalModule(this.contentHost);
      candidatePortal.render();
    } else if (role === 'Recruiter') {
      const recruiterPortal = new RecruiterPortalModule(this.contentHost);
      recruiterPortal.render();
    } else if (role === 'Admin') {
      const adminPortal = new AdminPortalModule(this.contentHost);
      adminPortal.render();
    } else if (role === 'Super Admin') {
      const liveMonitor = new LiveMonitorPortalModule(this.contentHost);
      liveMonitor.render();
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App();
  app.render();

  // Candidate invitation links must never pick up a staff session from the same browser.
  const isCandidateLink = new URLSearchParams(window.location.search).has('invite');
  if (!isCandidateLink) {
    // Turn the HttpOnly refresh cookie (if any) back into an in-memory access token.
    const session = await authApi.restoreSession();
    if (session) {
      store.loginAdminRecruiter(session.user);
      void store.loadStaffAccounts();
    }
  }
  store.markAuthReady();
});
