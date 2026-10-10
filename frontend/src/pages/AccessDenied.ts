import { PORTAL_INFO, router } from '../router';
import { store } from '../services/store';
import { Portal } from '../types';

/** Shown when a signed-in user opens a portal their role is not allowed into. */
export class AccessDeniedPage {
  constructor(private container: HTMLElement, private portal: Portal) {}

  public render() {
    const state = store.getState();
    const user = state.currentUser;
    const wanted = PORTAL_INFO[this.portal];
    const own = state.allowedPortals.map(p => PORTAL_INFO[p]);

    this.container.innerHTML = `
      <div class="max-w-md mx-auto py-16 px-4">
        <div class="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-5">
          <div class="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mx-auto flex items-center justify-center text-2xl">⛔</div>
          <div>
            <h2 class="text-2xl font-extrabold text-white tracking-tight">Access denied</h2>
            <p class="text-xs text-slate-400 mt-2 leading-relaxed">
              You are signed in as <b class="text-slate-200">${user?.name ?? ''}</b> (${user?.role ?? ''}).
              That role cannot open the <b class="text-slate-200">${wanted.title}</b>.
            </p>
          </div>
          <div class="flex flex-col gap-2">
            ${own.map(p => `
              <button data-go="${p.path}" class="go-btn w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider transition-all">
                ${p.icon} Go to ${p.title}
              </button>
            `).join('')}
            <button id="denied-logout" class="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all">
              🚪 Sign out to use a different account
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.go-btn').forEach(btn =>
      btn.addEventListener('click', e => router.navigate((e.currentTarget as HTMLElement).getAttribute('data-go') || '/')));
    this.container.querySelector('#denied-logout')?.addEventListener('click', () => {
      store.logoutStaff().catch(() => {});
    });
  }
}
