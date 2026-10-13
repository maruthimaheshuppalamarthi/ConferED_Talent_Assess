import { BRAND, PORTAL_THEMES } from '../brand';
import { PORTAL_INFO, PORTALS, router } from '../router';
import { ApiError, authApi } from '../services/authApi';
import { store } from '../services/store';
import { Portal } from '../types';

/**
 * Sign-in page for ONE staff portal (/admin, /recruiter or /proctor).
 * Sign in only: staff accounts and password resets are handled by a System Admin.
 *
 *   step 1  email + password  -> server emails a 6-digit OTP
 *   step 2  OTP               -> session (JWT + HttpOnly refresh cookie)
 */
interface LoginState {
  portal: Portal | null;
  step: 'credentials' | 'otp';
  email: string;
  challengeId: string;
  otpDestination: string;
  devOtp: string;
  info: string;
  showPassword: boolean;
}

const form: LoginState = {
  portal: null,
  step: 'credentials',
  email: '',
  challengeId: '',
  otpDestination: '',
  devOtp: '',
  info: '',
  showPassword: false,
};

function resetFor(portal: Portal) {
  form.portal = portal;
  form.step = 'credentials';
  form.email = '';
  form.challengeId = '';
  form.otpDestination = '';
  form.devOtp = '';
  form.info = '';
  form.showPassword = false;
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
    const theme = PORTAL_THEMES[this.portal];
    const isLight = store.getState().theme === 'light';

    this.container.innerHTML = `
      <div class="relative min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6">
        
        <!-- Ambient Radial Aura tailored to this portal's color -->
        <div class="absolute inset-0 pointer-events-none opacity-50"
             style="background:radial-gradient(circle 500px at 50% 40%, ${theme.accentLight}, transparent 70%)"></div>

        <div class="relative w-full max-w-md space-y-6">
          
          <!-- Authentication Card -->
          <div class="rounded-3xl border shadow-2xl p-7 sm:p-9 space-y-6 transition-all backdrop-blur-xl
                      ${isLight ? 'bg-white/95 border-slate-200/90 text-slate-800 shadow-slate-200/50' : 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-black/60'}">
            
            <!-- Card Header & Portal Brand -->
            <div class="space-y-4 border-b pb-5 ${isLight ? 'border-slate-100' : 'border-slate-800/80'}">
              <div class="flex items-center justify-between">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
                     style="background:${theme.accentLight}; border:1px solid ${theme.accentBorder}">
                  ${theme.icon}
                </div>
                <span class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full font-mono shadow-sm"
                      style="background:${theme.accentLight}; color:${theme.accentColor}; border:1px solid ${theme.accentBorder}">
                  ${theme.badge}
                </span>
              </div>

              <div>
                <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}">
                  ${info.loginTitle}
                </h1>
                <p class="text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} mt-1 leading-relaxed">
                  ${info.blurb}
                </p>
              </div>

              <!-- Two-Step Progress Pill -->
              <div class="flex items-center gap-2 pt-1">
                <div class="flex-1 flex items-center gap-2">
                  <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${form.step === 'credentials' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}">
                    ${form.step === 'credentials' ? '1' : '✓'}
                  </div>
                  <span class="text-[11px] font-semibold ${form.step === 'credentials' ? (isLight ? 'text-slate-900' : 'text-white') : 'text-emerald-500'}">Credentials</span>
                </div>
                <div class="w-6 h-0.5 ${form.step === 'otp' ? 'bg-emerald-500' : (isLight ? 'bg-slate-200' : 'bg-slate-800')}"></div>
                <div class="flex-1 flex items-center gap-2">
                  <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${form.step === 'otp' ? 'bg-emerald-600 text-white' : (isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400')}">
                    2
                  </div>
                  <span class="text-[11px] font-semibold ${form.step === 'otp' ? 'text-emerald-500' : (isLight ? 'text-slate-400' : 'text-slate-500')}">2FA Passcode</span>
                </div>
              </div>
            </div>

            <!-- Inline Alert Messages -->
            <p id="login-error" class="text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl hidden"></p>
            <p id="login-info" class="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-xl ${form.info ? '' : 'hidden'}">${escapeHtml(form.info)}</p>

            <!-- Form Content -->
            ${form.step === 'credentials' ? this.credentialsHtml(theme, isLight) : this.otpHtml(theme, isLight)}

            <!-- Security Notice -->
            <div class="pt-4 border-t ${isLight ? 'border-slate-100 text-slate-400' : 'border-slate-800/80 text-slate-500'} text-[11px] text-center space-y-1">
              <p>Staff accounts are issued by System Administrators.</p>
              <p class="font-mono text-[10px]">🔒 256-bit Encrypted Session · MFA Enforced</p>
            </div>
          </div>

          <!-- Quick Workspace Switcher Bar -->
          <div class="rounded-2xl border p-3.5 text-center transition-all ${isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-900/60 border-slate-800'} backdrop-blur-md">
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Switch Workspace</p>
            <div class="grid grid-cols-3 gap-2">
              ${PORTALS.map(p => {
                const isActive = p === this.portal;
                const pTheme = PORTAL_THEMES[p];
                return `
                  <button type="button" data-switch-portal="${p}"
                          class="py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border
                                 ${isActive
                                   ? 'bg-blue-600/10 text-blue-500 border-blue-500/30'
                                   : (isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800')}"
                          ${isActive ? 'disabled' : ''}>
                    <span>${pTheme.icon}</span>
                    <span class="truncate">${pTheme.key === 'admin' ? 'Admin' : (pTheme.key === 'recruiter' ? 'Recruiter' : 'Proctor')}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

        </div>
      </div>
    `;

    this.attachEvents();
  }

  private credentialsHtml(theme: typeof PORTAL_THEMES[Portal], isLight: boolean): string {
    return `
      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'} mb-1.5" for="login-email">
            Staff Username or Email
          </label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">👤</span>
            <input id="login-email" type="text" autocomplete="username" value="${escapeHtml(form.email)}"
              class="w-full pl-9 pr-3.5 py-3 rounded-xl border font-mono text-xs transition-all outline-none
                     ${isLight ? 'bg-slate-50 border-slate-300 focus:border-blue-600 text-slate-800' : 'bg-slate-950 border-slate-700 focus:border-blue-500 text-white'}"
              placeholder="username or email" />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}" for="login-password">
              Password
            </label>
            <span class="text-[10px] text-slate-400">Managed by Admin</span>
          </div>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔑</span>
            <input id="login-password" type="${form.showPassword ? 'text' : 'password'}" autocomplete="current-password" value=""
              class="w-full pl-9 pr-10 py-3 rounded-xl border font-mono text-xs transition-all outline-none
                     ${isLight ? 'bg-slate-50 border-slate-300 focus:border-blue-600 text-slate-800' : 'bg-slate-950 border-slate-700 focus:border-blue-500 text-white'}"
              placeholder="••••••••••••" />
            <button id="toggle-pwd-btn" type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs">
              ${form.showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <button id="submit-creds-btn"
                class="w-full py-3.5 px-4 rounded-xl text-white font-bold text-xs tracking-wider transition-all duration-200 shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 bg-gradient-to-r ${theme.gradient} ${theme.hoverGradient}">
          <span>SEND 2FA EMAIL PASSCODE</span>
          <span>➔</span>
        </button>
      </div>
    `;
  }

  private otpHtml(theme: typeof PORTAL_THEMES[Portal], isLight: boolean): string {
    return `
      <div class="space-y-4 text-xs">
        <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-1">
          <div class="flex items-center gap-2 font-bold text-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Two-Factor Code Sent</span>
          </div>
          <p class="text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'} leading-relaxed">
            A 6-digit one-time passcode was dispatched to <strong class="font-mono font-bold text-emerald-500">${escapeHtml(form.otpDestination)}</strong>. Code expires in 10 minutes.
          </p>
        </div>

        ${form.devOtp ? `
          <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center justify-between">
            <div>🧪 DEV OTP: <strong class="font-mono tracking-widest text-white">${escapeHtml(form.devOtp)}</strong></div>
            <button id="dev-autofill-btn" type="button" class="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-[10px] font-bold text-amber-200">
              Auto-fill
            </button>
          </div>
        ` : ''}

        <div>
          <label class="block font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'} mb-1.5 text-center" for="login-otp-input">
            Enter 6-Digit Email Passcode
          </label>
          <input id="login-otp-input" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" value=""
            class="w-full px-4 py-3.5 rounded-xl text-center font-mono text-2xl tracking-[0.6em] font-bold border transition-all outline-none
                   ${isLight ? 'bg-slate-50 border-slate-300 focus:border-emerald-600 text-emerald-600' : 'bg-slate-950 border-slate-700 focus:border-emerald-500 text-emerald-400'}"
            placeholder="------" />
        </div>

        <button id="verify-otp-btn"
                class="w-full py-3.5 px-4 rounded-xl text-white font-bold text-xs tracking-wider transition-all duration-200 shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500">
          <span>VERIFY PASSCODE & SIGN IN</span>
          <span>➔</span>
        </button>

        <div class="flex items-center justify-between pt-1">
          <button id="resend-otp-btn" type="button" class="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors">
            Didn't receive code? Resend
          </button>
          <button id="back-btn" type="button" class="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors">
            ← Use different account
          </button>
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

    // Workspace switchers
    this.container.querySelectorAll('[data-switch-portal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPortal = (btn as HTMLElement).getAttribute('data-switch-portal') as Portal;
        if (targetPortal && targetPortal !== this.portal) {
          router.navigate(PORTAL_INFO[targetPortal].path);
        }
      });
    });

    if (form.step === 'credentials') {
      const emailInput = q<HTMLInputElement>('#login-email');
      const passInput = q<HTMLInputElement>('#login-password');
      const submit = q('#submit-creds-btn');
      const togglePwd = q('#toggle-pwd-btn');

      this.onEnter(emailInput, submit);
      this.onEnter(passInput, submit);
      (emailInput?.value ? passInput : emailInput)?.focus();

      togglePwd?.addEventListener('click', () => {
        form.showPassword = !form.showPassword;
        if (passInput) passInput.type = form.showPassword ? 'text' : 'password';
        if (togglePwd) togglePwd.textContent = form.showPassword ? '👁️' : '👁️‍🗨️';
      });

      submit?.addEventListener('click', () => {
        const email = (emailInput?.value || '').trim();
        const password = passInput?.value || '';
        form.email = email;
        if (!email || !password) {
          this.showError('Enter your username or email and password.');
          return;
        }
        this.run(submit, async () => {
          if (submit) submit.innerHTML = '<span>Sending 2FA passcode…</span>';
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
    const autoFill = q('#dev-autofill-btn');

    this.onEnter(otpInput, verify);
    otpInput?.focus();

    autoFill?.addEventListener('click', () => {
      if (otpInput && form.devOtp) {
        otpInput.value = form.devOtp;
        otpInput.focus();
      }
    });

    verify?.addEventListener('click', () => {
      const otp = (otpInput?.value || '').trim();
      if (otp.length !== 6) {
        this.showError('Enter the 6-digit passcode.');
        return;
      }
      this.run(verify, async () => {
        const session = await authApi.verifyOtp(this.portal, form.challengeId, otp);
        resetFor(this.portal);
        store.loginStaff(session.user);
      });
    });

    q('#resend-otp-btn')?.addEventListener('click', e => {
      this.run(e.currentTarget as Element, async () => {
        const challenge = await authApi.resendOtp(this.portal, form.challengeId);
        form.challengeId = challenge.challengeId;
        form.devOtp = challenge.devOtp || '';
        form.info = 'A new passcode has been dispatched to your email.';
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
