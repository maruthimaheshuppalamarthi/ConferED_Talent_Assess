import { BRAND, conferLogoImg } from '../brand';
import { currentRoute, portalHomePath, router } from '../router';
import { store } from '../services/store';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/**
 * Top Header Navigation Bar.
 *  - When Signed In: Clean minimalist header showing ONLY Brand Logo | Talent Assess on left, and User Pill + Logout on right.
 *  - When On Public Landing: Enlarged Brand Logo | Talent Assess, full ConferED platform navigation tabs (Solutions, Products, Experience, Partners, Company, Contact), and orange "Book a consultation" button.
 *  - When On Login Screen: Brand Logo | Talent Assess on left, and "← All Workspaces" on right.
 */
export class NavbarComponent {
  private container: HTMLElement;
  private mobileMenuOpen: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render() {
    const state = store.getState();
    const route = currentRoute();
    const user = state.currentUser;
    const examParams = new URLSearchParams(window.location.search);
    const onExamLink = examParams.has('invite') || examParams.has('assessment');

    const staffSignedIn = route.kind === 'staff' && state.isStaffAuthenticated && !!user;
    const isLoginScreen = route.kind === 'staff' && !state.isStaffAuthenticated;
    const isExamRunning = !!state.examStarted;

    // Show marketing tabs and 'Book a consultation' CTA ONLY on public landing page
    const showPublicMarketing = !staffSignedIn && !isLoginScreen && !isExamRunning && !onExamLink;

    this.container.innerHTML = `
      <header class="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 backdrop-blur-md border-b border-slate-800 bg-[#070e17]/95 text-slate-100 shadow-xl transition-all">
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <!-- Left: Logo (clickable redirect) + Divider + "Talent Assess" (medium text, non-clickable) -->
          <div class="flex items-center gap-3 sm:gap-4 shrink-0">
            <a href="/" id="brand-logo-btn" class="inline-flex items-center shrink-0 ${onExamLink ? 'pointer-events-none' : 'cursor-pointer hover:opacity-90 transition-opacity'}" title="ConferED Home">
              ${conferLogoImg('onDark', 'h-11 sm:h-12 md:h-13 w-auto')}
            </a>
            <div class="h-7 sm:h-8 w-px bg-slate-700/80 mx-0.5 select-none pointer-events-none"></div>
            <span class="text-sm sm:text-base font-medium tracking-normal text-slate-200 select-none whitespace-nowrap cursor-default pointer-events-none">
              Talent Assess
            </span>
          </div>

          <!-- Center: Main ConferED Platform Navigation Tabs (ONLY on public pages, hidden after login) -->
          ${showPublicMarketing ? `
            <nav class="hidden xl:flex items-center gap-7 text-sm font-medium text-slate-200">
              
              <!-- Solutions Dropdown -->
              <div class="relative group">
                <button class="flex items-center gap-1.5 py-2 hover:text-white transition-colors focus:outline-none">
                  <span>Solutions</span>
                  <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div class="absolute left-0 top-full pt-2 w-72 invisible opacity-0 -translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div class="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl p-2.5 shadow-2xl space-y-1">
                    <a href="${BRAND.site}/who-we-serve/associations" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Associations & Societies</div>
                      <div class="text-[11px] text-slate-400">Annual conferences, member portals, and continuing education.</div>
                    </a>
                    <a href="${BRAND.site}/who-we-serve" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Organizations & Enterprise</div>
                      <div class="text-[11px] text-slate-400">High-stakes talent assessment, certifications, and compliance.</div>
                    </a>
                    <a href="${BRAND.site}/who-we-serve" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Healthcare & Medical</div>
                      <div class="text-[11px] text-slate-400">CME accredited video archives and proctored clinical evaluations.</div>
                    </a>
                  </div>
                </div>
              </div>

              <!-- Products Dropdown -->
              <div class="relative group">
                <button class="flex items-center gap-1.5 py-2 hover:text-white transition-colors focus:outline-none">
                  <span>Products</span>
                  <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div class="absolute left-0 top-full pt-2 w-80 invisible opacity-0 -translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div class="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl p-2.5 shadow-2xl space-y-1">
                    <a href="#workspaces-section" class="nav-internal-link block p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                      <div class="font-semibold text-blue-400 text-xs flex items-center justify-between">
                        <span>Talent Assess Suite</span>
                        <span class="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-300">Active</span>
                      </div>
                      <div class="text-[11px] text-slate-300">Enterprise AI proctoring, coding IDE, and automated grading.</div>
                    </a>
                    <a href="${BRAND.site}/lms" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">ConferLMS</div>
                      <div class="text-[11px] text-slate-400">Next-gen learning platform built for continuing education.</div>
                    </a>
                    <a href="${BRAND.site}/digivision-media" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">DigiVision Media</div>
                      <div class="text-[11px] text-slate-400">Conference video capture and synchronized slide recording.</div>
                    </a>
                    <a href="${BRAND.site}/event-capture" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Virtual & Hybrid Events</div>
                      <div class="text-[11px] text-slate-400">End-to-end event broadcasting and live attendee streaming.</div>
                    </a>
                  </div>
                </div>
              </div>

              <!-- Standalone Direct Tabs -->
              <a href="${BRAND.site}/experience" target="_blank" rel="noopener noreferrer" class="py-2 hover:text-white transition-colors">
                Experience
              </a>

              <a href="${BRAND.site}/partners" target="_blank" rel="noopener noreferrer" class="py-2 hover:text-white transition-colors">
                Partners
              </a>

              <!-- Company Dropdown -->
              <div class="relative group">
                <button class="flex items-center gap-1.5 py-2 hover:text-white transition-colors focus:outline-none">
                  <span>Company</span>
                  <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div class="absolute left-0 top-full pt-2 w-64 invisible opacity-0 -translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div class="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl p-2.5 shadow-2xl space-y-1">
                    <a href="${BRAND.site}/about" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">About ConferED</div>
                      <div class="text-[11px] text-slate-400">Delivering digital conference technology since 2006.</div>
                    </a>
                    <a href="${BRAND.site}/why-confered" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Why ConferED</div>
                      <div class="text-[11px] text-slate-400">Our customer-first media and assessment architecture.</div>
                    </a>
                    <a href="${BRAND.site}/careers" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Careers</div>
                      <div class="text-[11px] text-slate-400">Join our engineering and operations team.</div>
                    </a>
                  </div>
                </div>
              </div>

              <a href="${BRAND.site}/contact" target="_blank" rel="noopener noreferrer" class="py-2 hover:text-white transition-colors">
                Contact
              </a>
            </nav>
          ` : ''}

          <!-- Right Controls: Book a consultation CTA + Staff Info -->
          <div class="flex items-center gap-3">
            
            ${isLoginScreen ? `
              <button id="back-to-home-btn" class="text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-all flex items-center gap-1.5 shadow-sm">
                <span>←</span> <span>All Workspaces</span>
              </button>
            ` : ''}

            <!-- Official ConferED Orange "Book a consultation" button (Public pages only) -->
            ${showPublicMarketing ? `
              <a href="${BRAND.bookUrl}" target="_blank" rel="noopener noreferrer"
                 class="hidden sm:inline-flex items-center justify-center font-bold text-xs sm:text-sm text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0"
                 style="background: #ff6a00;">
                Book a consultation
              </a>
            ` : ''}

            <!-- Signed-in User Info & Logout (Staff Workspace) -->
            ${staffSignedIn ? this.staffControlsHtml() : ''}

            <!-- Exam Recording Badge (Active Candidate Exam) -->
            ${isExamRunning ? `
              <div class="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl">
                <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span class="text-xs font-bold text-red-400 uppercase tracking-wider">Recording</span>
                <span class="text-[10px] font-bold text-slate-300">${state.violationCount}/${state.settings.maxViolationsBeforeTerminate}</span>
              </div>
            ` : ''}

            <!-- Mobile Menu Toggle Button (Hamburger) - Public pages only -->
            ${showPublicMarketing ? `
              <button id="mobile-menu-toggle-btn" class="xl:hidden p-2 text-slate-300 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800/80 focus:outline-none" aria-label="Toggle navigation menu">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            ` : ''}

          </div>

        </div>

        <!-- Mobile Navigation Drawer (Public pages only) -->
        ${showPublicMarketing ? `
          <div id="mobile-nav-drawer" class="hidden xl:hidden border-t border-slate-800/80 mt-3 pt-4 pb-2 space-y-3">
            <div class="grid grid-cols-2 gap-2 text-xs font-medium text-slate-200">
              <a href="${BRAND.site}/who-we-serve" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Solutions ➔
              </a>
              <a href="#workspaces-section" class="nav-internal-link p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Talent Assess ➔
              </a>
              <a href="${BRAND.site}/lms" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                ConferLMS ➔
              </a>
              <a href="${BRAND.site}/digivision-media" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                DigiVision Media ➔
              </a>
              <a href="${BRAND.site}/experience" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Experience
              </a>
              <a href="${BRAND.site}/partners" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Partners
              </a>
              <a href="${BRAND.site}/about" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Company
              </a>
              <a href="${BRAND.site}/contact" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Contact
              </a>
            </div>

            <div class="pt-2">
              <a href="${BRAND.bookUrl}" target="_blank" rel="noopener noreferrer"
                 class="block w-full text-center font-bold text-xs text-white py-2.5 rounded-lg shadow"
                 style="background: #ff6a00;">
                Book a consultation
              </a>
            </div>
          </div>
        ` : ''}

      </header>
    `;

    this.attachEvents();
  }

  /** Signed-in controls on a staff portal page: User Avatar + Name/Role + Logout button. */
  private staffControlsHtml(): string {
    const user = store.getState().currentUser!;
    const rawName = user.name || user.email || 'User';
    const initials = rawName
      .split(' ')
      .map((s: string) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return `
      <div class="flex items-center gap-2.5 pl-2">
        <div class="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm" title="${escapeHtml(user.role)}">
          ${escapeHtml(initials)}
        </div>
        <div class="flex flex-col text-left">
          <span class="text-xs font-bold leading-tight text-white">${escapeHtml(user.name || user.email)}</span>
          <span class="text-[10px] text-slate-400 leading-tight">${escapeHtml(user.role)}</span>
        </div>
      </div>

      <button id="logout-btn" class="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 bg-slate-900 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border-slate-700/80 shadow-sm ml-2">
        <span>🚪</span> <span>Logout</span>
      </button>
    `;
  }

  private attachEvents() {
    const q = (sel: string) => this.container.querySelector(sel);

    q('#brand-logo-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      const params = new URLSearchParams(window.location.search);
      if (params.has('invite') || params.has('assessment')) return;
      const route = currentRoute();
      if (route.kind === 'staff' && store.getState().isStaffAuthenticated) {
        router.navigate(portalHomePath(route.portal));
      } else {
        router.navigate('/');
      }
    });

    q('#back-to-home-btn')?.addEventListener('click', () => {
      router.navigate('/');
    });

    q('#logout-btn')?.addEventListener('click', () => {
      store.logoutStaff().catch(() => {});
    });

    // Mobile menu toggle
    const mobileBtn = q('#mobile-menu-toggle-btn');
    const mobileDrawer = q('#mobile-nav-drawer');
    if (mobileBtn && mobileDrawer) {
      mobileBtn.addEventListener('click', () => {
        this.mobileMenuOpen = !this.mobileMenuOpen;
        if (this.mobileMenuOpen) {
          mobileDrawer.classList.remove('hidden');
        } else {
          mobileDrawer.classList.add('hidden');
        }
      });
    }

    // Smooth scroll for internal workspace anchor
    this.container.querySelectorAll('.nav-internal-link').forEach(link => {
      link.addEventListener('click', e => {
        const targetId = (link.getAttribute('href') || '').replace('#', '');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
          if (mobileDrawer) {
            mobileDrawer.classList.add('hidden');
            this.mobileMenuOpen = false;
          }
        }
      });
    });
  }
}
