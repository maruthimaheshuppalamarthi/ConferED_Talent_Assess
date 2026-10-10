import { authApi, ApiError } from '../services/authApi';
import { store } from '../services/store';
import { UserRole } from '../types';

export class NavbarComponent {
  private container: HTMLElement;
  private authStep: 'credentials' | 'otp' | 'register' | 'forgot_password' | 'reset_password_otp' = 'credentials';
  // DEV: sign-in form is pre-filled with the seeded dev admin. Remove these defaults before production.
  private pendingEmail: string = 'admin@7666';
  private pendingPassword: string = '970598';
  private pendingRole: UserRole = 'Admin';
  private regName: string = '';
  private resetEmailTarget: string = '';
  // Server-side OTP challenge state
  private challengeId: string = '';
  private otpDestination: string = '';
  private devOtp: string = '';
  // Inline feedback
  private errorMsg: string = '';
  private infoMsg: string = '';

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render() {
    const state = store.getState();
    const activeRole = state.currentRole;
    const isAuth = state.isAuthenticatedAdminRecruiter;
    const currentTheme = state.theme || 'dark';
    const urlParams = new URLSearchParams(window.location.search);
    const isExplicitCandidateLink = urlParams.has('assessment');

    // Only workspaces the server granted to this account are offered (RBAC).
    const allRoles: { role: UserRole; label: string; icon: string }[] = [
      { role: 'Recruiter', label: 'Recruiter Workspace', icon: '💼' },
      { role: 'Admin', label: 'Admin & System Control', icon: '🛡️' },
      { role: 'Super Admin', label: 'Live Proctor Monitor', icon: '📹' },
    ];
    const roles = allRoles.filter(r => state.allowedRoles.includes(r.role));

    this.container.innerHTML = `
      <header class="glass-panel border-b border-slate-800/80 sticky top-0 z-50 px-4 lg:px-8 py-3 transition-all">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <!-- Logo & Platform Identity -->
          <div class="flex items-center gap-3 cursor-pointer" id="brand-logo-btn">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span class="text-xl font-black text-white tracking-wider">N</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-lg text-white tracking-tight">Nexus<span class="text-blue-500">Assess</span></span>
                <span class="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  ${isExplicitCandidateLink ? 'Candidate Assessment Portal' : activeRole === 'Recruiter' ? 'Recruiter Hub' : activeRole === 'Admin' ? 'Admin Control' : 'Evaluation Platform'}
                </span>
              </div>
              <p class="text-xs text-slate-400 font-medium">Enterprise Online Assessment Platform</p>
            </div>
          </div>

          <!-- Dynamic Header Navigation -->
          <div class="flex items-center gap-3">
            <!-- Global Theme Switcher (Dark 🌙 / Light ☀️) -->
            <button id="theme-toggle-btn" title="Toggle Light / Dark Mode" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm">
              <span>${currentTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}</span>
            </button>

            ${isAuth ? `
              <!-- Authenticated Admin / Recruiter Workspace Switcher -->
              <div class="inline-flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
                <button data-role="Candidate" class="role-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeRole === 'Candidate' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}">
                  <span>👤</span>
                  <span class="hidden md:inline">Candidate View</span>
                </button>
                ${roles.map(r => `
                  <button 
                    data-role="${r.role}"
                    class="role-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeRole === r.role || (r.role === 'Super Admin' && activeRole === 'Super Admin')
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }"
                  >
                    <span>${r.icon}</span>
                    <span class="hidden md:inline">${r.label}</span>
                  </button>
                `).join('')}
              </div>

              <!-- Exit / Logout Button -->
              <button id="logout-btn" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-red-400 text-xs font-bold transition-all flex items-center gap-1">
                <span>🚪</span> Logout
              </button>
            ` : `
              <!-- Sleek Admin/Recruiter Sign-In Button -->
              <div class="flex items-center gap-3">
                <button id="open-auth-btn" class="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30">
                  <span>🔒</span> Recruiter & Admin Portal Access
                </button>
              </div>
            `}

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

      <!-- Admin / Recruiter Authentication Modal Host -->
      <div id="auth-modal-host"></div>
    `;

    this.attachEvents();
  }

  private attachEvents() {
    this.container.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const role = (e.currentTarget as HTMLElement).getAttribute('data-role') as UserRole;
        store.setRole(role);
      });
    });

    this.container.querySelector('#logout-btn')?.addEventListener('click', () => {
      void store.logoutAdminRecruiter();
    });

    this.container.querySelector('#theme-toggle-btn')?.addEventListener('click', () => {
      store.toggleTheme();
    });

    this.container.querySelector('#open-auth-btn')?.addEventListener('click', () => {
      this.openStep('credentials');
    });

    this.container.querySelector('#brand-logo-btn')?.addEventListener('click', () => {
      if (!store.getState().isAuthenticatedAdminRecruiter) {
        this.openStep('credentials');
      }
    });
  }

  private openStep(step: NavbarComponent['authStep'], opts: { keepMessages?: boolean } = {}) {
    this.authStep = step;
    if (!opts.keepMessages) {
      this.errorMsg = '';
      this.infoMsg = '';
    }
    this.renderAuthModal();
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
  }

  private errorText(e: unknown): string {
    return e instanceof ApiError ? e.message : 'Something went wrong. Please try again.';
  }

  /** Run an async auth action with the button disabled and errors shown inline. */
  private async guarded(btn: Element | null, action: () => Promise<void>) {
    const button = btn as HTMLButtonElement | null;
    if (button) button.disabled = true;
    this.errorMsg = '';
    try {
      await action();
    } catch (e) {
      this.errorMsg = this.errorText(e);
      this.renderAuthModal();
    } finally {
      if (button && button.isConnected) button.disabled = false;
    }
  }

  private renderAuthModal() {
    const host = this.container.querySelector('#auth-modal-host') as HTMLElement;
    if (!host) return;

    host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-8 space-y-6 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div class="flex items-center gap-2">
              <span class="text-xl">🔐</span>
              <h3 class="text-lg font-extrabold text-white">Staff & Recruiter Portal</h3>
            </div>
            <button id="close-auth-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          <!-- Auth Navigation Tabs -->
          <div class="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
            <button id="tab-signin-btn" class="flex-1 py-2 rounded-lg font-bold transition-all ${this.authStep === 'credentials' || this.authStep === 'otp' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
              🔑 Sign In
            </button>
            <button id="tab-register-btn" class="flex-1 py-2 rounded-lg font-bold transition-all ${this.authStep === 'register' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
              📝 Register
            </button>
            <button id="tab-forgot-btn" class="flex-1 py-2 rounded-lg font-bold transition-all ${this.authStep === 'forgot_password' || this.authStep === 'reset_password_otp' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
              🔒 Reset Pass
            </button>
          </div>

          <p id="auth-error" class="text-xs font-semibold text-red-400 ${this.errorMsg ? '' : 'hidden'}">${this.escapeHtml(this.errorMsg)}</p>
          <p id="auth-info" class="text-xs font-semibold text-emerald-400 ${this.infoMsg ? '' : 'hidden'}">${this.escapeHtml(this.infoMsg)}</p>

          ${(this.authStep === 'credentials' || this.authStep === 'otp') ? `
            ${this.authStep === 'credentials' ? `
              <!-- Step 1: Admin Credentials Form -->
              <div class="space-y-4 text-xs">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Select Staff Role</label>
                  <select id="login-role-select" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-semibold">
                    <option value="Admin" ${this.pendingRole === 'Admin' ? 'selected' : ''}>System Administrator</option>
                    <option value="Recruiter" ${this.pendingRole === 'Recruiter' ? 'selected' : ''}>Recruiter / HR Workspace</option>
                    <option value="Super Admin" ${this.pendingRole === 'Super Admin' ? 'selected' : ''}>Live Proctoring Monitor</option>
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Enterprise Email</label>
                  <input id="login-email" type="text" value="${this.pendingEmail}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="admin@7666" />
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Password</label>
                  <input id="login-password" type="password" value="${this.pendingPassword}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="970598" />
                </div>

                <button id="submit-creds-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2">
                  <span>SEND 2FA EMAIL OTP</span> <span>➔</span>
                </button>
              </div>
            ` : `
              <!-- Step 2: Email OTP Passcode Verification Form -->
              <div class="space-y-4 text-xs">
                <div class="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300">
                  <span class="font-bold">✉️ 2FA OTP Sent to Your Email Inbox!</span>
                  <p class="text-[11px] text-slate-300 mt-1">A unique 6-digit verification OTP has been sent to <code class="text-emerald-400 font-bold font-mono">${this.escapeHtml(this.otpDestination)}</code>. It expires in 10 minutes. Check your inbox and enter the passcode below.</p>
                </div>
                ${this.devOtp ? `<div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">🧪 DEV MODE: OTP is <strong class="font-mono tracking-widest">${this.escapeHtml(this.devOtp)}</strong> (hidden in production)</div>` : ''}

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Enter 6-Digit Email OTP Passcode</label>
                  <input id="login-otp-input" type="text" maxlength="6" value="" class="glass-input w-full px-4 py-3 rounded-xl text-center font-mono text-xl tracking-[0.5em] font-bold border border-slate-700 bg-slate-950 text-emerald-400 focus:ring-2 focus:ring-emerald-500" placeholder="------" />
                </div>

                <button id="verify-admin-otp-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  <span>VERIFY OTP & ACCESS PORTAL</span> <span>➔</span>
                </button>
                <button id="resend-admin-otp-btn" type="button" class="w-full text-center text-[11px] font-semibold text-slate-400 hover:text-white">Didn't get it? Resend code</button>
              </div>
            `}
          ` : this.authStep === 'register' ? `
            <!-- Register Staff Account Form -->
            <div class="space-y-4 text-xs">
              <p class="text-xs text-slate-300">Create a Recruiter account. Admin access is granted by an existing administrator.</p>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input id="reg-name" type="text" value="${this.regName}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Jane Doe" />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Enterprise Email Address</label>
                <input id="reg-email" type="email" value="" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="jane@enterprise.com" />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">New Password</label>
                <input id="reg-pass" type="password" value="" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="••••••••" />
              </div>

              <p class="text-[11px] text-slate-500">Password must be at least 8 characters.</p>

              <button id="submit-reg-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60">
                CREATE ACCOUNT ➔
              </button>
            </div>
          ` : `
            <!-- Reset Password / Forgot Password Form -->
            ${this.authStep === 'forgot_password' ? `
              <div class="space-y-4 text-xs">
                <p class="text-xs text-slate-300">Enter your enterprise email to receive a password reset OTP via Gmail SMTP.</p>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Enterprise Email Address</label>
                  <input id="reset-email-input" type="email" value="${this.escapeHtml(this.resetEmailTarget || this.pendingEmail)}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="you@enterprise.com" />
                </div>

                <button id="send-reset-otp-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-purple-600/30 transition-all">
                  SEND RESET OTP VIA GMAIL ➔
                </button>
              </div>
            ` : `
              <!-- Reset Password Step 2: New Password Form -->
              <div class="space-y-4 text-xs">
                <div class="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300">
                  <span>✉️ If that account exists, a reset code was sent.</span>
                  <p class="text-[11px] text-slate-300 mt-1">Check <code class="text-emerald-400 font-mono">${this.escapeHtml(this.otpDestination)}</code> for your 6-digit reset passcode.</p>
                </div>
                ${this.devOtp ? `<div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">🧪 DEV MODE: OTP is <strong class="font-mono tracking-widest">${this.escapeHtml(this.devOtp)}</strong></div>` : ''}

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Enter 6-Digit Reset OTP</label>
                  <input id="reset-otp-input" type="text" maxlength="6" class="glass-input w-full px-4 py-2.5 rounded-xl text-center font-mono text-lg tracking-[0.4em] font-bold border border-slate-700 bg-slate-950 text-purple-400" placeholder="------" />
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Enter NEW Password</label>
                  <input id="new-password-input" type="password" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="At least 8 characters" />
                </div>

                <button id="confirm-reset-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-emerald-600/30 transition-all">
                  UPDATE PASSWORD ➔
                </button>
              </div>
            `}
          `}
        </div>
      </div>
    `;

    // Modal Attach Events
    host.querySelector('#close-auth-btn')?.addEventListener('click', () => {
      host.innerHTML = '';
    });

    host.querySelector('#tab-signin-btn')?.addEventListener('click', () => this.openStep('credentials'));
    host.querySelector('#tab-register-btn')?.addEventListener('click', () => this.openStep('register'));
    host.querySelector('#tab-forgot-btn')?.addEventListener('click', () => this.openStep('forgot_password'));

    // Helper for Enter Keypress Submission
    const bindEnterKey = (inputs: (Element | null)[], targetBtn: Element | null) => {
      inputs.forEach(input => {
        input?.addEventListener('keydown', (e: any) => {
          if (e.key === 'Enter') {
            targetBtn?.dispatchEvent(new Event('click'));
          }
        });
      });
    };

    const val = (selector: string) => ((host.querySelector(selector) as HTMLInputElement | null)?.value || '').trim();

    if (this.authStep === 'credentials') {
      const emailInput = host.querySelector('#login-email');
      const passInput = host.querySelector('#login-password');
      const submitBtn = host.querySelector('#submit-creds-btn');

      bindEnterKey([emailInput, passInput], submitBtn);

      submitBtn?.addEventListener('click', () => {
        const email = val('#login-email');
        const password = (passInput as HTMLInputElement).value; // do not trim passwords
        this.pendingRole = (host.querySelector('#login-role-select') as HTMLSelectElement).value as UserRole;
        this.pendingEmail = email;

        if (!email || !password) {
          this.errorMsg = 'Enter your email and password.';
          this.renderAuthModal();
          return;
        }

        void this.guarded(submitBtn, async () => {
          // Step 1: server verifies the password and emails a one-time passcode.
          const challenge = await authApi.login(email, password);
          this.challengeId = challenge.challengeId;
          this.otpDestination = challenge.otpDestination;
          this.devOtp = challenge.devOtp || '';
          this.pendingPassword = ''; // never keep the password around after step 1
          this.openStep('otp');
        });
      });
    } else if (this.authStep === 'otp') {
      const otpInput = host.querySelector('#login-otp-input');
      const verifyBtn = host.querySelector('#verify-admin-otp-btn');

      bindEnterKey([otpInput], verifyBtn);

      verifyBtn?.addEventListener('click', () => {
        const typedOtp = val('#login-otp-input');
        if (typedOtp.length !== 6) {
          this.errorMsg = 'Enter the 6-digit passcode.';
          this.renderAuthModal();
          return;
        }

        void this.guarded(verifyBtn, async () => {
          // Step 2: the server checks the OTP (expiry, attempts, single use) and issues the JWT session.
          const session = await authApi.verifyOtp(this.challengeId, typedOtp);
          this.challengeId = '';
          this.devOtp = '';
          host.innerHTML = '';
          this.authStep = 'credentials';
          store.loginAdminRecruiter(session.user, this.pendingRole);
          void store.loadStaffAccounts();
        });
      });

      host.querySelector('#resend-admin-otp-btn')?.addEventListener('click', (e) => {
        void this.guarded(e.currentTarget as Element, async () => {
          const challenge = await authApi.resendOtp(this.challengeId);
          this.challengeId = challenge.challengeId;
          this.devOtp = challenge.devOtp || '';
          this.infoMsg = 'A new passcode has been sent.';
          this.openStep('otp', { keepMessages: true });
        });
      });
    } else if (this.authStep === 'register') {
      const regName = host.querySelector('#reg-name');
      const regEmail = host.querySelector('#reg-email');
      const regPass = host.querySelector('#reg-pass');
      const regBtn = host.querySelector('#submit-reg-btn');

      bindEnterKey([regName, regEmail, regPass], regBtn);

      regBtn?.addEventListener('click', () => {
        const name = val('#reg-name') || 'Staff User';
        const email = val('#reg-email');
        const pass = (regPass as HTMLInputElement).value;

        if (!email || !pass) {
          this.errorMsg = 'Please enter a valid email and password.';
          this.renderAuthModal();
          return;
        }

        void this.guarded(regBtn, async () => {
          await authApi.register(name, email, pass);
          this.pendingEmail = email.toLowerCase();
          this.pendingPassword = '';
          this.infoMsg = 'Account created. Sign in with your email and password to receive your 2FA code.';
          this.openStep('credentials', { keepMessages: true });
        });
      });
    } else if (this.authStep === 'forgot_password') {
      const resetEmailInput = host.querySelector('#reset-email-input');
      const sendResetBtn = host.querySelector('#send-reset-otp-btn');

      bindEnterKey([resetEmailInput], sendResetBtn);

      sendResetBtn?.addEventListener('click', () => {
        const email = val('#reset-email-input');
        if (!email) {
          this.errorMsg = 'Please enter your enterprise email.';
          this.renderAuthModal();
          return;
        }

        void this.guarded(sendResetBtn, async () => {
          this.resetEmailTarget = email;
          const challenge = await authApi.requestPasswordReset(email);
          this.challengeId = challenge.challengeId;
          this.otpDestination = challenge.otpDestination;
          this.devOtp = challenge.devOtp || '';
          this.openStep('reset_password_otp');
        });
      });
    } else if (this.authStep === 'reset_password_otp') {
      const resetOtpInput = host.querySelector('#reset-otp-input');
      const newPassInput = host.querySelector('#new-password-input');
      const confirmResetBtn = host.querySelector('#confirm-reset-btn');

      bindEnterKey([resetOtpInput, newPassInput], confirmResetBtn);

      confirmResetBtn?.addEventListener('click', () => {
        const otp = val('#reset-otp-input');
        const newPass = (newPassInput as HTMLInputElement).value;

        if (otp.length !== 6 || !newPass) {
          this.errorMsg = 'Please enter the 6-digit OTP and your new password.';
          this.renderAuthModal();
          return;
        }

        void this.guarded(confirmResetBtn, async () => {
          await authApi.confirmPasswordReset(this.challengeId, otp, newPass);
          this.pendingEmail = this.resetEmailTarget;
          this.pendingPassword = '';
          this.challengeId = '';
          this.devOtp = '';
          this.infoMsg = 'Password updated. Sign in with your new password.';
          this.openStep('credentials', { keepMessages: true });
        });
      });
    }
  }
}
