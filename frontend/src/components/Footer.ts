import { BRAND, conferLogoImg } from '../brand';
import { router } from '../router';

const SITE = BRAND.site;

/** ConferED-style footer. Company / talk / contact match confered.com; product links are this assessment app. */
export class FooterComponent {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render() {
    this.container.innerHTML = `
      <footer class="mt-auto text-white" style="background:${BRAND.navy}">
        <div class="max-w-7xl mx-auto px-6 lg:px-10 pt-12 pb-8">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            <div class="space-y-4">
              <a href="${SITE}/" class="inline-block hover:opacity-90">
                ${conferLogoImg('onDark', 'h-12 w-auto')}
              </a>
              <p class="text-sm leading-relaxed text-white/70">
                ConferED Talent Assess is the staff workspace for System Admin, Recruiter / HR, and Proctors.
                Candidates do not sign in here — they only open the personal invitation link from their email.
              </p>
              <p class="text-sm text-white/65">${BRAND.locations}</p>
              <div class="space-y-1.5 text-sm">
                <a href="${BRAND.bookUrl}" target="_blank" rel="noopener noreferrer" class="block font-semibold text-white hover:text-orange-400">Book a consultation</a>
                <a href="${BRAND.phoneHref}" class="block text-white/80 hover:text-white">${BRAND.phone}</a>
                <a href="mailto:${BRAND.email}" class="block text-white/80 hover:text-white">${BRAND.email}</a>
              </div>
            </div>

            <div>
              <h2 class="text-[11px] font-bold tracking-[0.16em] uppercase text-white/80 mb-4">Products</h2>
              <ul class="space-y-2.5 text-sm">
                <li><a href="/" data-route="/" class="text-white hover:text-orange-400">Talent Assess</a></li>
                <li><a href="/recruiter" data-route="/recruiter" class="text-white hover:text-orange-400">Recruiter Workspace</a></li>
                <li><a href="/proctor" data-route="/proctor" class="text-white hover:text-orange-400">Live Proctoring</a></li>
                <li><a href="/admin" data-route="/admin" class="text-white hover:text-orange-400">System Admin</a></li>
                <li><a href="${SITE}/lms" class="text-white hover:text-orange-400">ConferLMS</a></li>
                <li><a href="${SITE}/digivision-media" class="text-white hover:text-orange-400">DigiVision Media</a></li>
              </ul>
            </div>

            <div>
              <h2 class="text-[11px] font-bold tracking-[0.16em] uppercase text-white/80 mb-4">Company</h2>
              <ul class="space-y-2.5 text-sm">
                <li><a href="${SITE}/who-we-serve" class="text-white hover:text-orange-400">Who we serve</a></li>
                <li><a href="${SITE}/who-we-serve/associations" class="text-white hover:text-orange-400">Associations</a></li>
                <li><a href="${SITE}/experience" class="text-white hover:text-orange-400">Experience</a></li>
                <li><a href="${SITE}/partners" class="text-white hover:text-orange-400">Partners</a></li>
                <li><a href="${SITE}/about" class="text-white hover:text-orange-400">About</a></li>
                <li><a href="${SITE}/careers" class="text-white hover:text-orange-400">Careers</a></li>
              </ul>
            </div>

            <div>
              <h2 class="text-[11px] font-bold tracking-[0.16em] uppercase text-white/80 mb-4">Talk</h2>
              <ul class="space-y-2.5 text-sm">
                <li><a href="${BRAND.bookUrl}" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Book a consultation</a></li>
                <li><a href="${SITE}/contact" class="text-white hover:text-orange-400">Contact</a></li>
                <li><a href="${SITE}/partners" class="text-white hover:text-orange-400">Partners</a></li>
                <li><a href="${SITE}/privacy" class="text-white hover:text-orange-400">Privacy</a></li>
                <li><a href="${SITE}/terms" class="text-white hover:text-orange-400">Terms</a></li>
                <li><a href="${SITE}/cookies" class="text-white hover:text-orange-400">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div class="mt-10 pt-6 border-t border-white/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-white/60">
            <p>${BRAND.copyright}</p>
            <p>${BRAND.since}</p>
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
