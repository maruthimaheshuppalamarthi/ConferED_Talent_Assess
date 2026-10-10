import { PORTAL_INFO } from '../router';
import { ApiError, authApi } from '../services/authApi';
import { store } from '../services/store';
import { Portal } from '../types';

const errorText = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');

const MIN_LENGTH = 8;

/**
 * "Choose your own password" form.
 *  - forced:  shown instead of the portal after an admin created the account / reset the password.
 *  - optional: opened from the header as a dialog by any signed-in staff member.
 */
export function renderChangePasswordForm(
  host: HTMLElement,
  opts: { portal: Portal; forced: boolean; onCancel?: () => void },
) {
  const info = PORTAL_INFO[opts.portal];
  const user = store.getState().currentUser;

  host.innerHTML = `
    <div class="glass-panel w-full max-w-md mx-auto rounded-3xl border border-slate-800 p-8 space-y-5 shadow-2xl">
      <div class="flex items-center gap-3 border-b border-slate-800 pb-4">
        <span class="text-2xl">🔑</span>
        <div class="flex-1">
          <h2 class="text-lg font-extrabold text-white">${opts.forced ? 'Set your new password' : 'Change password'}</h2>
          <p class="text-[11px] text-slate-400 mt-0.5">${opts.forced
            ? `Your administrator issued a temporary password for the ${info.loginTitle}. Choose your own to continue.`
            : 'You will be signed out of your other devices.'}</p>
        </div>
        ${opts.forced ? '' : '<button id="pw-cancel-x" class="text-slate-400 hover:text-white font-bold">✕</button>'}
      </div>

      <p id="pw-error" class="text-xs font-semibold text-red-400 hidden"></p>

      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="pw-current">${opts.forced ? 'Temporary password' : 'Current password'}</label>
          <input id="pw-current" type="password" autocomplete="current-password" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="pw-new">New password</label>
          <input id="pw-new" type="password" autocomplete="new-password" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="At least ${MIN_LENGTH} characters" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="pw-confirm">Confirm new password</label>
          <input id="pw-confirm" type="password" autocomplete="new-password" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" />
        </div>
        <button id="pw-submit" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60">
          UPDATE PASSWORD ➔
        </button>
        <div class="flex items-center justify-between text-[11px] text-slate-500">
          <span>Signed in as <b class="text-slate-300">${user ? user.email.replace(/[<>&"]/g, '') : ''}</b></span>
          ${opts.forced
            ? '<button id="pw-logout" type="button" class="font-semibold text-slate-400 hover:text-white">Sign out</button>'
            : '<button id="pw-cancel" type="button" class="font-semibold text-slate-400 hover:text-white">Cancel</button>'}
        </div>
      </div>
    </div>
  `;

  const q = <T extends HTMLElement>(sel: string) => host.querySelector(sel) as T | null;
  const error = q('#pw-error');
  const showError = (msg: string) => {
    if (!error) return;
    error.textContent = msg;
    error.classList.toggle('hidden', !msg);
  };

  const submit = q<HTMLButtonElement>('#pw-submit');
  const run = () => {
    const current = q<HTMLInputElement>('#pw-current')?.value || '';
    const next = q<HTMLInputElement>('#pw-new')?.value || '';
    const confirm = q<HTMLInputElement>('#pw-confirm')?.value || '';

    if (!current || !next) return showError('Fill in all the fields.');
    if (next.length < MIN_LENGTH) return showError(`New password must be at least ${MIN_LENGTH} characters.`);
    if (next !== confirm) return showError('The new passwords do not match.');
    if (next === current) return showError('Choose a password different from the current one.');

    showError('');
    if (submit) submit.disabled = true;
    authApi
      .changePassword(opts.portal, current, next)
      .then(session => {
        store.loginStaff(session.user); // clears mustChangePassword -> the app opens the portal
        opts.onCancel?.();
      })
      .catch(e => {
        showError(errorText(e));
        if (submit && submit.isConnected) submit.disabled = false;
      });
  };

  submit?.addEventListener('click', run);
  host.querySelectorAll('input').forEach(input =>
    input.addEventListener('keydown', e => {
      if ((e as KeyboardEvent).key === 'Enter') run();
    }),
  );
  q('#pw-logout')?.addEventListener('click', () => {
    store.logoutStaff().catch(() => {});
  });
  q('#pw-cancel')?.addEventListener('click', () => opts.onCancel?.());
  q('#pw-cancel-x')?.addEventListener('click', () => opts.onCancel?.());
  q<HTMLInputElement>('#pw-current')?.focus();
}

/** Page shown instead of a portal while `mustChangePassword` is set. */
export class ForcedPasswordChangePage {
  constructor(private container: HTMLElement, private portal: Portal) {}

  public render() {
    this.container.innerHTML = '<div class="py-16 px-4"><div id="forced-pw-host"></div></div>';
    renderChangePasswordForm(this.container.querySelector('#forced-pw-host') as HTMLElement, {
      portal: this.portal,
      forced: true,
    });
  }
}

/** Dialog opened from the header. */
export function openChangePasswordDialog(portal: Portal) {
  document.getElementById('change-password-dialog')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'change-password-dialog';
  overlay.className = 'fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md overflow-y-auto';
  const inner = document.createElement('div');
  inner.className = 'min-h-full flex items-center justify-center p-4';
  overlay.appendChild(inner);
  document.body.appendChild(overlay);
  renderChangePasswordForm(inner, { portal, forced: false, onCancel: () => overlay.remove() });
}
