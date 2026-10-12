import { PORTAL_INFO } from '../router';
import { ApiError, authApi } from '../services/authApi';
import { store } from '../services/store';
import { Portal } from '../types';

/**
 * Sign-in page for ONE staff portal (/admin, /recruiter or /proctor).
 * Sign in only: staff accounts and password resets are handled by a System Admin.
 *
 *   step 1  email + password  -> server emails a 6-digit OTP
 *   step 2  OTP               -> session (JWT + HttpOnly refresh cookie)
 *
 * The app re-renders on every store change, so the form state lives at module level.
 */
interface LoginState {
  portal: Portal | null;
  step: 'credentials' | 'otp';
  email: string;
  challengeId: string;
  otpDestination: string;
  devOtp: string;
  info: string;
}

const form: LoginState = {
  portal: null,
  step: 'credentials',
  email: '',
  challengeId: '',
  otpDestination: '',
  devOtp: '',
  info: '',
};

function resetFor(portal: Portal) {
  form.portal = portal;
  form.step = 'credentials';
  form.email = '';
  form.challengeId = '';
  form.otpDestination = '';
  form.devOtp = '';
  form.info = '';
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const errorText = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');

export class StaffLoginPage {
  private container: HTMLElement;
  private portal: Portal;

  constructor(container: HTMLElement, portal: Portal) {
    this.container = container;
    this.portal = portal;
    if (form.portal !== portal) resetFor(portal);
  }

  public render() {
    const info = PORTAL_INFO[this.portal];

    this.container.innerHTML = `
      <div class="max-w-md mx-auto py-16 px-4">
        <div class="glass-panel w-full rounded-3xl border border-slate-800 p-8 space-y-6 shadow-2xl">
          <div class="flex items-center gap-3 border-b border-slate-800 pb-4">
            <span class="text-2xl">${info.icon}</span>
            <div>
              <h1 class="text-lg font-extrabold text-white">${info.loginTitle}</h1>
              <p class="text-[11px] text-slate-400 mt-0.5">${info.blurb}</p>
            </div>
          </div>

          <p id="login-error" class="text-xs font-semibold text-red-400 hidden"></p>
          <p id="login-info" class="text-xs font-semibold text-emerald-400 ${form.info ? '' : 'hidden'}">${escapeHtml(form.info)}</p>

          ${form.step === 'credentials' ? this.credentialsHtml() : this.otpHtml()}

          <p class="text-[11px] text-slate-500 text-center">
            Accounts are created by your System Administrator. Forgot your password? Ask them to reset it.
          </p>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private credentialsHtml(): string {
    return `
      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="login-email">Username</label>
          <input id="login-email" type="text" autocomplete="username" value="${escapeHtml(form.email)}"
            class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="username" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="login-password">Password</label>
          <input id="login-password" type="password" autocomplete="current-password" value=""
            class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="••••••••" />
        </div>
        <button id="submit-creds-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
          <span>SEND 2FA EMAIL OTP</span> <span>➔</span>
        </button>
      </div>
    `;
  }

  private otpHtml(): string {
    return `
      <div class="space-y-4 text-xs">
        <div class="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300">
          <span class="font-bold">✉️ 2FA OTP sent to your email</span>
          <p class="text-[11px] text-slate-300 mt-1">A 6-digit passcode was sent to <code class="text-emerald-400 font-bold font-mono">${escapeHtml(form.otpDestination)}</code>. It expires in 10 minutes.</p>
        </div>
        ${form.devOtp ? `<div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">🧪 DEV MODE: OTP is <strong class="font-mono tracking-widest">${escapeHtml(form.devOtp)}</strong> (hidden in production)</div>` : ''}
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="login-otp-input">6-Digit Email OTP</label>
          <input id="login-otp-input" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" value=""
            class="glass-input w-full px-4 py-3 rounded-xl text-center font-mono text-xl tracking-[0.5em] font-bold border border-slate-700 bg-slate-950 text-emerald-400 focus:ring-2 focus:ring-emerald-500" placeholder="------" />
        </div>
        <button id="verify-otp-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
          <span>VERIFY OTP & SIGN IN</span> <span>➔</span>
        </button>
        <div class="flex items-center justify-between">
          <button id="resend-otp-btn" type="button" class="text-[11px] font-semibold text-slate-400 hover:text-white">Didn't get it? Resend code</button>
          <button id="back-btn" type="button" class="text-[11px] font-semibold text-slate-400 hover:text-white">← Use a different account</button>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------ helpers
  private showError(message: string) {
    const el = this.container.querySelector('#login-error');
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('hidden', !message);
    if (message) this.container.querySelector('#login-info')?.classList.add('hidden');
  }

  /** Run an async action with the button disabled; failures are shown inline and never left unhandled. */
  private run(btn: Element | null, action: () => Promise<void>) {
    const button = btn as HTMLButtonElement | null;
    if (button) button.disabled = true;
    this.showError('');
    action()
      .catch(e => this.showError(errorText(e)))
      .finally(() => {
        if (button && button.isConnected) button.disabled = false;
      })
      .catch(() => {});
  }

  private onEnter(input: Element | null, target: Element | null) {
    input?.addEventListener('keydown', (e: Event) => {
      if ((e as KeyboardEvent).key === 'Enter') (target as HTMLElement | null)?.click();
    });
  }

  private attachEvents() {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    if (form.step === 'credentials') {
      const emailInput = q<HTMLInputElement>('#login-email');
      const passInput = q<HTMLInputElement>('#login-password');
      const submit = q('#submit-creds-btn');
      this.onEnter(emailInput, submit);
      this.onEnter(passInput, submit);
      (emailInput?.value ? passInput : emailInput)?.focus();

      submit?.addEventListener('click', () => {
        const email = (emailInput?.value || '').trim();
        const password = passInput?.value || ''; // never trim passwords
        form.email = email;
        if (!email || !password) {
          this.showError('Enter your email and password.');
          return;
        }
        this.run(submit, async () => {
          const challenge = await authApi.login(this.portal, email, password);
          form.challengeId = challenge.challengeId;
          form.otpDestination = challenge.otpDestination;
          form.devOtp = challenge.devOtp || '';
          form.step = 'otp';
          form.info = '';
          this.render();
        });
      });
      return;
    }

    // OTP step
    const otpInput = q<HTMLInputElement>('#login-otp-input');
    const verify = q('#verify-otp-btn');
    this.onEnter(otpInput, verify);
    otpInput?.focus();

    verify?.addEventListener('click', () => {
      const otp = (otpInput?.value || '').trim();
      if (otp.length !== 6) {
        this.showError('Enter the 6-digit passcode.');
        return;
      }
      this.run(verify, async () => {
        const session = await authApi.verifyOtp(this.portal, form.challengeId, otp);
        resetFor(this.portal);
        store.loginStaff(session.user); // the app re-renders into the portal
      });
    });

    q('#resend-otp-btn')?.addEventListener('click', e => {
      this.run(e.currentTarget as Element, async () => {
        const challenge = await authApi.resendOtp(this.portal, form.challengeId);
        form.challengeId = challenge.challengeId;
        form.devOtp = challenge.devOtp || '';
        form.info = 'A new passcode has been sent.';
        this.render();
      });
    });

    q('#back-btn')?.addEventListener('click', () => {
      form.step = 'credentials';
      form.challengeId = '';
      form.devOtp = '';
      form.info = '';
      this.render();
    });
  }
}
