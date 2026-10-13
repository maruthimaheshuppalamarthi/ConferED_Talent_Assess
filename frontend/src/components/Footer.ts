import { BRAND, conferLogoImg } from '../brand';
import { router } from '../router';

const SITE = BRAND.site;

/**
 * ConferED footer component:
 *  - 'full': The comprehensive multi-column SaaS footer (used before login across public landing and login screens).
 *  - 'small': The sleek, single-line dark footer bar (used after staff logs in to any workspace).
 */
export class FooterComponent {
  private container: HTMLElement;
  private mode: 'small' | 'full';

  constructor(container: HTMLElement, mode: 'small' | 'full' = 'full') {
    this.container = container;
    this.mode = mode;
  }

  public render() {
    if (this.mode === 'small') {
      this.renderSmall();
    } else {
      this.renderFull();
    }
  }

  /** Small single-line footer used inside signed-in staff workspaces. */
  private renderSmall() {
    this.container.innerHTML = `
      <footer class="mt-auto border-t border-slate-800/80 text-slate-400 text-xs py-2.5 sm:py-3 px-4 sm:px-6 lg:px-8 transition-colors select-none" style="background: #081628;">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 font-sans">
          <div class="text-slate-400 text-xs">
            Copyright 2026 ConferED LLC. All rights reserved.
          </div>

          <div class="flex items-center gap-3.5 text-xs">
            <a href="${BRAND.phoneHref}" class="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
              <span class="text-[#f43f5e]">📞</span>
              <span>${BRAND.phone}</span>
            </a>
            <span class="text-slate-600">·</span>
            <a href="mailto:${BRAND.email}" class="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
              <span class="text-[#818cf8]">✉️</span>
              <span>${BRAND.email}</span>
            </a>
          </div>
        </div>
      </footer>
    `;
  }

  /** Full rich SaaS footer used across all pages before login. */
  private renderFull() {
    this.container.innerHTML = `
      <footer class="mt-auto text-white" style="background:${BRAND.navy}">
        <div class="max-w-7xl mx-auto px-6 lg:px-10 pt-12 pb-8">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            
            <!-- Brand Column -->
            <div class="space-y-4">
              <a href="/" data-route="/" class="inline-block hover:opacity-90">
                ${conferLogoImg('onDark', 'h-11 sm:h-12 w-auto')}
              </a>
              <p class="text-sm leading-relaxed text-white/70">
                ConferED Talent Assess delivers high-stakes, AI-monitored technical and cognitive assessments for organizations, universities, and associations.
              </p>
              <p class="text-sm text-white/65">${BRAND.locations}</p>
              <div class="space-y-1.5 text-sm">
                <a href="${BRAND.bookUrl}" target="_blank" rel="noopener noreferrer" class="block font-semibold text-white hover:text-orange-400">Book a consultation</a>
                <a href="${BRAND.phoneHref}" class="block text-white/80 hover:text-white">${BRAND.phone}</a>
                <a href="mailto:${BRAND.email}" class="block text-white/80 hover:text-white">${BRAND.email}</a>
              </div>
            </div>

            <!-- Products Column -->
            <div>
              <h2 class="text-[11px] font-bold tracking-[0.16em] uppercase text-white/80 mb-4">Products</h2>
              <ul class="space-y-2.5 text-sm">
                <li><a href="/" data-route="/" class="text-white hover:text-orange-400">Talent Assess</a></li>
                <li><a href="/recruiter" data-route="/recruiter" class="text-white hover:text-orange-400">Recruiter Workspace</a></li>
                <li><a href="/proctor" data-route="/proctor" class="text-white hover:text-orange-400">Live Proctoring</a></li>
                <li><a href="/admin" data-route="/admin" class="text-white hover:text-orange-400">System Admin</a></li>
                <li><a href="${SITE}/lms" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">ConferLMS</a></li>
                <li><a href="${SITE}/digivision-media" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">DigiVision Media</a></li>
              </ul>
            </div>

            <!-- Company Column -->
            <div>
              <h2 class="text-[11px] font-bold tracking-[0.16em] uppercase text-white/80 mb-4">Company</h2>
              <ul class="space-y-2.5 text-sm">
                <li><a href="${SITE}/who-we-serve" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Who we serve</a></li>
                <li><a href="${SITE}/who-we-serve/associations" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Associations</a></li>
                <li><a href="${SITE}/experience" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Experience</a></li>
                <li><a href="${SITE}/partners" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Partners</a></li>
                <li><a href="${SITE}/about" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">About ConferED</a></li>
                <li><a href="${SITE}/careers" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Careers</a></li>
              </ul>
            </div>

            <!-- Talk Column -->
            <div>
              <h2 class="text-[11px] font-bold tracking-[0.16em] uppercase text-white/80 mb-4">Talk to Us</h2>
              <ul class="space-y-2.5 text-sm">
                <li><a href="${BRAND.bookUrl}" target="_blank" rel="noopener noreferrer" class="block text-white hover:text-orange-400 font-semibold">📅 Book a consultation</a></li>
                <li><a href="${SITE}/contact" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Contact & Support</a></li>
                <li><a href="${SITE}/partners" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Partnerships</a></li>
                <li><a href="${SITE}/privacy" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Privacy Policy</a></li>
                <li><a href="${SITE}/terms" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Terms of Service</a></li>
                <li><a href="${SITE}/cookies" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Cookie Settings</a></li>
              </ul>
            </div>
          </div>

          <div class="mt-10 pt-6 border-t border-white/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-white/60">
            <p>${BRAND.copyright} · ${BRAND.since}</p>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    `;

    this.container.querySelectorAll('[data-route]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        router.navigate((link as HTMLElement).getAttribute('data-route') || '/');
      });
    });
  }
}
