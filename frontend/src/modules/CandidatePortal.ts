import { BRAND } from '../brand';
import { flushCodingEditor, MonacoEditorComponent } from '../components/MonacoEditorComponent';
import { ensureProctoringOverlay, teardownProctoringOverlay } from '../components/ProctoringOverlay';
import { SystemCheckComponent } from '../components/SystemCheck';
import { PORTAL_INFO, router } from '../router';
import { authApi, ApiError } from '../services/authApi';
import { store } from '../services/store';
import { Portal } from '../types';

function formatExamClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export class CandidatePortalModule {
  private container: HTMLElement;
  private selectedRating: number = 0;
  private feedbackDraft = '';
  private static clockId = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.attachFullscreenEnforcement();
  }

  // The app creates a new CandidatePortalModule on every re-render; the lockdown must be wired up only once.
  private static fullscreenEnforcementBound = false;

  private attachFullscreenEnforcement() {
    if (CandidatePortalModule.fullscreenEnforcementBound) return;
    CandidatePortalModule.fullscreenEnforcementBound = true;

    // Add a blocker overlay to DOM that shows when not in fullscreen
    const blocker = document.createElement('div');
    blocker.id = 'fullscreen-enforcer-overlay';
    blocker.className = 'fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center hidden';
    blocker.innerHTML = `
      <div class="glass-panel p-8 rounded-3xl border border-red-500/50 text-center max-w-lg space-y-6 shadow-2xl">
        <div class="w-20 h-20 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center text-4xl animate-pulse">
          ⚠️
        </div>
        <div>
          <h2 id="fullscreen-enforcer-title" class="text-xl font-extrabold text-white">Fullscreen required</h2>
          <p id="fullscreen-enforcer-copy" class="text-sm text-slate-300 mt-2">
            The proctor has admitted you. Enter fullscreen to continue the assessment.
          </p>
        </div>
        <button id="resume-fullscreen-btn" class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold tracking-wide shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2">
          <span>🛡️ RE-ENTER FULLSCREEN TO RESUME</span>
        </button>
      </div>
    `;
    document.body.appendChild(blocker);

    blocker.querySelector('#resume-fullscreen-btn')?.addEventListener('click', () => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    });

    document.addEventListener('fullscreenchange', () => {
      const state = store.getState();
      const finished = state.candidateFeedback !== null || state.examCompleted;
      if (!state.examStarted || finished) {
        blocker.classList.add('hidden');
        return;
      }
      const title = blocker.querySelector('#fullscreen-enforcer-title');
      const copy = blocker.querySelector('#fullscreen-enforcer-copy');
      if (!document.fullscreenElement) {
        blocker.classList.remove('hidden');
        if (CandidatePortalModule.wasFullscreen) {
          flushCodingEditor();
          store.logProctoringViolation('Fullscreen Exit', 'Candidate left fullscreen lockdown', 'high');
          const next = store.getState();
          const used = next.violationCount;
          const max = next.settings.maxViolationsBeforeTerminate;
          if (title) title.textContent = used >= max ? 'Exam closing' : `Fullscreen warning ${used} of ${max}`;
          if (copy) {
            copy.textContent = used >= max
              ? 'You left fullscreen too many times. The exam window is closing automatically.'
              : `Leaving fullscreen is a warning. After ${max} warnings the exam closes automatically. Return to fullscreen to continue.`;
          }
        } else if (title && copy) {
          title.textContent = 'Fullscreen required';
          copy.textContent = 'Enter fullscreen to continue the assessment.';
        }
        CandidatePortalModule.wasFullscreen = false;
      } else {
        CandidatePortalModule.wasFullscreen = true;
        blocker.classList.add('hidden');
      }
    });
  }

  private static wasFullscreen = false;

  public render() {
    const state = store.getState();
    if (!state.examStarted || state.examCompleted) {
      document.getElementById('fullscreen-enforcer-overlay')?.classList.add('hidden');
      CandidatePortalModule.stopExamClock();
    }

    // Candidate Flow Router
    if (!state.otpVerified) {
      teardownProctoringOverlay();
      this.renderOtpVerification();
    } else if (!state.systemCheckCompleted) {
      teardownProctoringOverlay();
      const systemCheck = new SystemCheckComponent(this.container);
      systemCheck.render().catch((e) => console.error('System check failed to render', e));
    } else if (state.examStarted && !state.examCompleted) {
      ensureProctoringOverlay();
      this.renderExamEngine();
      CandidatePortalModule.ensureExamClock();
    } else if (state.examCompleted) {
      teardownProctoringOverlay();
      this.renderCompletionScreen();
    } else {
      teardownProctoringOverlay();
      this.renderInstructionsScreen();
      if (!state.assessmentReady && state.activeCandidateId) {
        void store.loadCandidateAssessment(state.activeAssessmentId);
      }
    }
  }

  private renderLanding() {
    const portals: Portal[] = ['admin', 'recruiter', 'proctor'];
    this.container.innerHTML = `
      <section class="bg-white">
        <div class="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-20 grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">
          <div class="space-y-5 lg:pt-4">
            <p class="text-[13px] font-semibold tracking-[0.14em] uppercase text-slate-500">
              ConferED Talent Assess
            </p>
            <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.15]" style="color:${BRAND.navy}">
              Sign in to run assessments, hiring, and live proctoring.
            </h1>
            <p class="text-base sm:text-lg leading-relaxed text-slate-600 max-w-xl">
              This is the staff workspace for <strong style="color:${BRAND.navy}">System Admin</strong>,
              <strong style="color:${BRAND.navy}">Recruiter / HR</strong>, and
              <strong style="color:${BRAND.navy}">Proctors</strong>.
              Build exams, send invitations, and monitor live sessions.
            </p>
            <p class="text-sm leading-relaxed text-slate-500 max-w-xl">
              Candidates do not sign in here. They only open the personal invitation link sent to their email.
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-7 space-y-5 shadow-sm">
            <div>
              <p class="text-[11px] font-bold tracking-[0.16em] uppercase text-slate-500">Staff portals</p>
              <h2 class="text-2xl font-extrabold tracking-tight mt-1" style="color:${BRAND.navy}">Choose your workspace</h2>
              <p class="text-sm mt-2 text-slate-600">Sign in with the account your System Admin created for you.</p>
            </div>
            <div class="space-y-2.5">
              ${portals.map(p => {
                const info = PORTAL_INFO[p];
                return `
                  <button type="button" data-portal="${p}" class="w-full text-left rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all px-4 py-3.5 flex items-start gap-3 bg-white">
                    <span class="text-xl leading-none mt-0.5">${info.icon}</span>
                    <span class="min-w-0 flex-1">
                      <span class="block text-sm font-bold" style="color:${BRAND.navy}">${info.title}</span>
                      <span class="block text-xs text-slate-500 mt-0.5">${info.blurb}</span>
                    </span>
                    <span class="shrink-0 text-xs font-semibold mt-1" style="color:${BRAND.navy}">Sign in →</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </section>
    `;
    this.container.querySelectorAll('[data-portal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const portal = (btn as HTMLElement).getAttribute('data-portal') as Portal;
        if (portal) router.navigate(PORTAL_INFO[portal].path);
      });
    });
  }

  private renderOtpVerification() {
    const inviteToken = store.getState().candidateInviteToken;

    // The exam can only be opened from the personal invitation link (it carries a signed-by-server token).
    if (!inviteToken) {
      this.renderLanding();
      return;
    }

    this.container.innerHTML = `
      <div class="max-w-md mx-auto py-16 px-4">
        <div class="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-6">
          <div class="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 mx-auto flex items-center justify-center text-2xl font-bold">
            🔑
          </div>
          <div>
            <h2 class="text-2xl font-extrabold text-white tracking-tight">Candidate Verification</h2>
            <p class="text-xs text-slate-400 mt-2">Enter the 6-digit verification OTP sent to your registered Email and Phone.</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-left text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Verification Passcode (OTP)</label>
              <input id="otp-input" type="text" maxlength="6" value="" class="glass-input w-full px-4 py-3 rounded-xl text-center font-mono text-xl tracking-[0.5em] font-bold border border-slate-700 bg-slate-950 text-emerald-400 focus:ring-2 focus:ring-emerald-500" placeholder="------" />
            </div>

            <button type="button" id="verify-otp-btn" class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition-all">
              VERIFY & CONTINUE ➔
            </button>
            <p id="otp-error" class="text-xs font-semibold text-red-400 hidden"></p>
            <p id="otp-info" class="text-xs font-semibold text-emerald-400 hidden"></p>
            <button id="resend-otp-btn" type="button" class="text-[11px] font-semibold text-slate-400 hover:text-white">Didn't get a code? Resend</button>
          </div>
        </div>
      </div>
    `;

    const input = this.container.querySelector('#otp-input') as HTMLInputElement;
    const btn = this.container.querySelector('#verify-otp-btn');
    const err = this.container.querySelector('#otp-error');

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        btn?.dispatchEvent(new Event('click'));
      }
    });

    const info = this.container.querySelector('#otp-info');
    const showError = (msg: string) => {
      info?.classList.add('hidden');
      if (err) {
        err.textContent = msg;
        err.classList.remove('hidden');
      }
    };
    const errText = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');

    btn?.addEventListener('click', async () => {
      const button = btn as HTMLButtonElement;
      const val = input.value.replace(/\D/g, '');
      if (val.length !== 6) {
        showError('Enter the 6-digit passcode from your email.');
        return;
      }

      button.disabled = true;
      button.textContent = 'VERIFYING...';
      try {
        // Server verifies invite token + OTP (expiry, attempt limit, single use) and returns a candidate-scoped JWT.
        const session = await authApi.candidateVerify(inviteToken, val);
        store.candidateVerified(session);
      } catch (e) {
        showError(errText(e));
        button.disabled = false;
        button.textContent = 'VERIFY & CONTINUE ➔';
      }
    });

    this.container.querySelector('#resend-otp-btn')?.addEventListener('click', async (ev) => {
      const resend = ev.currentTarget as HTMLButtonElement;
      resend.disabled = true;
      try {
        const ch = await authApi.candidateResendOtp(inviteToken);
        err?.classList.add('hidden');
        if (info) {
          info.textContent =
            'A new passcode was sent to ' + ch.otpDestination + '.' + (ch.devOtp ? ` (DEV OTP: ${ch.devOtp})` : '');
          info.classList.remove('hidden');
        }
      } catch (e) {
        showError(errText(e));
      } finally {
        resend.disabled = false;
      }
    });
  }

  private renderInstructionsScreen() {
    const state = store.getState();
    const assessment = store.getActiveAssessment();
    const cand = state.candidates.find(c => c.id === state.activeCandidateId);
    const waitingForProctor = state.systemCheckCompleted && cand?.identityStatus !== 'approved';
    if (!state.assessmentReady) {
      this.container.innerHTML = `
        <div class="max-w-md mx-auto py-16 px-4 text-center space-y-3">
          <p class="text-sm font-bold text-white">Loading your exam paper…</p>
          <p class="text-xs text-slate-400">Fetching sections and questions for this invitation.</p>
          <button id="retry-paper-btn" class="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700">Retry</button>
        </div>
      `;
      this.container.querySelector('#retry-paper-btn')?.addEventListener('click', () => {
        void store.loadCandidateAssessment(state.activeAssessmentId);
      });
      return;
    }

    const sections = assessment?.sections || [];
    this.container.innerHTML = `
      <div class="max-w-4xl mx-auto py-10 px-4">
        <div class="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
          ${waitingForProctor ? `
            <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold">
              Identity is with the proctor. Stay on this screen. Your exam sections are ready below and will open after you are admitted.
            </div>
          ` : ''}
          <div class="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <span class="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">Assessment Overview</span>
              <h1 class="text-2xl font-extrabold text-white mt-2">${assessment?.title || 'Technical Assessment'}</h1>
              <p class="text-xs text-slate-400 mt-1">${assessment?.description || ''}</p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-extrabold font-mono text-blue-400">${assessment?.totalDurationMinutes || 0} Mins</div>
              <span class="text-xs text-slate-400 font-medium">Total Duration</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${sections.map((sec, idx) => `
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Section ${idx + 1}</span>
                <h3 class="text-xs font-bold text-white truncate">${sec.name}</h3>
                <div class="text-xs font-mono text-blue-400 font-semibold">${sec.timeLimitMinutes || 0} Mins • ${(sec.questions || []).length} Questions</div>
              </div>
            `).join('') || '<p class="text-xs text-slate-500 col-span-full">No sections are on this paper yet. Ask the recruiter to assign questions in Assessment Builder.</p>'}
          </div>

          ${waitingForProctor ? `
            <div class="pt-4 border-t border-slate-800 flex items-center gap-3 text-xs text-slate-400">
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <span>Waiting for proctor authorization…</span>
            </div>
          ` : `
            <div class="pt-4 border-t border-slate-800 flex justify-end">
              <button id="goto-syscheck-btn" class="py-3.5 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2">
                <span>PROCEED TO SYSTEM DIAGNOSTICS</span>
                <span>➔</span>
              </button>
            </div>
          `}
        </div>
      </div>
    `;

    this.container.querySelector('#goto-syscheck-btn')?.addEventListener('click', () => {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      const systemCheck = new SystemCheckComponent(this.container);
      systemCheck.render().catch((e) => console.error('System check failed to render', e));
    });
  }

  private renderExamEngine() {
    const state = store.getState();
    const assessment = store.getActiveAssessment();
    if (!state.assessmentReady || !assessment) {
      this.container.innerHTML = `
        <div class="py-24 text-center space-y-3">
          <p class="text-sm font-bold text-white">Loading your assessment…</p>
          <p class="text-xs text-slate-400">Keep your camera in view. The exam paper will appear in a moment.</p>
          <button id="retry-exam-paper-btn" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700">Reload paper</button>
        </div>
      `;
      this.container.querySelector('#retry-exam-paper-btn')?.addEventListener('click', () => {
        void store.loadCandidateAssessment(state.activeAssessmentId);
      });
      return;
    }

    const sections = assessment.sections || [];
    let sectionIndex = state.currentSectionIndex;
    if (sectionIndex < 0 || sectionIndex >= sections.length) sectionIndex = 0;
    let currentSection = sections[sectionIndex];
    if (currentSection && !(currentSection.questions || []).length) {
      const filled = sections.findIndex(sec => (sec.questions || []).length > 0);
      if (filled >= 0) {
        sectionIndex = filled;
        currentSection = sections[filled];
        state.currentSectionIndex = filled;
        state.currentQuestionIndex = 0;
      }
    }
    const questions = currentSection?.questions || [];
    const currentQuestion = questions[state.currentQuestionIndex] || questions[0];
    if (!currentSection || !currentQuestion) {
      this.container.innerHTML = `
        <div class="max-w-2xl mx-auto py-16 px-4 space-y-4">
          <h2 class="text-lg font-extrabold text-white">${assessment.title || 'Assessment'}</h2>
          <p class="text-sm text-slate-300">This exam has no questions yet. Reload the paper if the recruiter just assigned questions.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${sections.map((sec, idx) => `
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <p class="text-[10px] font-bold uppercase text-slate-500">Section ${idx + 1}</p>
                <p class="text-sm font-bold text-white">${sec.name}</p>
                <p class="text-xs text-slate-400">${sec.timeLimitMinutes || 0} mins • ${(sec.questions || []).length} questions</p>
              </div>
            `).join('')}
          </div>
          <button id="retry-empty-paper-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">Reload paper</button>
        </div>
      `;
      this.container.querySelector('#retry-empty-paper-btn')?.addEventListener('click', () => {
        void store.loadCandidateAssessment(state.activeAssessmentId);
      });
      return;
    }

    const remaining = store.getSectionRemainingSeconds();
    const timerStr = formatExamClock(remaining);
    const urgent = remaining < 120;

    this.container.innerHTML = `
      <div class="min-h-[calc(100vh-65px)] flex flex-col bg-slate-950">
        <!-- Secure Exam Top Navigation Header -->
        <div class="glass-panel px-6 py-3 border-b border-slate-800 flex items-center justify-between sticky top-14 z-30">
          <div class="flex items-center gap-4">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                SECTION ${sectionIndex + 1} OF ${sections.length}
              </span>
              <h2 class="text-sm font-bold text-white">${currentSection.name}</h2>
              <div class="flex flex-wrap gap-1.5 mt-2">
                ${sections.map((sec, idx) => `
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    idx === sectionIndex
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                      : idx < sectionIndex
                        ? 'bg-slate-800 text-slate-500 border-slate-700'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                  }">${idx + 1}. ${sec.name} · ${(sec.questions || []).length}q</span>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Section Timer & Section Navigation Controls -->
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl font-mono">
              <span class="text-xs text-slate-400 uppercase tracking-wider">Section Time:</span>
              <span id="exam-section-timer" class="text-base font-extrabold tabular-nums ${urgent ? 'text-red-400 animate-pulse' : 'text-blue-400'}">${timerStr}</span>
            </div>

            <button id="finish-sec-btn" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all">
              Complete Section ➔
            </button>
          </div>
        </div>

        <!-- Exam Workspace Main Body -->
        <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          <!-- Left Question Description & Navigation Panel -->
          <div class="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 overflow-y-auto space-y-6 bg-slate-950">
            <div class="flex items-center justify-between">
              <!-- STRICT REQUIREMENT: NO MARKS OR POINTS DISPLAYED TO CANDIDATE -->
              <span class="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                Question ${state.currentQuestionIndex + 1} of ${currentSection.questions.length}
              </span>
              <button id="flag-q-btn" class="text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                state.flaggedQuestions.has(currentQuestion.id)
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }">
                🚩 ${state.flaggedQuestions.has(currentQuestion.id) ? 'Flagged for Review' : 'Flag Question'}
              </button>
            </div>

            <div>
              <h3 class="text-lg font-bold text-white tracking-tight">${currentQuestion.title}</h3>
              <div class="prose prose-invert prose-sm text-slate-300 mt-3 space-y-2 whitespace-pre-line leading-relaxed">
                ${currentQuestion.content}
              </div>
              ${codingNotes(currentQuestion)}
            </div>

            <!-- Answer Input Widget based on Question Type -->
            <div class="pt-4 border-t border-slate-800/80">
              ${this.renderAnswerWidget(currentQuestion, state.candidateAnswers[currentQuestion.id])}
            </div>

            <!-- Question Navigation Next / Prev Action Bar -->
            <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
              <button id="prev-q-btn" ${state.currentQuestionIndex === 0 ? 'disabled class="px-4 py-2 rounded-xl bg-slate-900 text-slate-600 border border-slate-800 text-xs font-bold cursor-not-allowed"' : 'class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"'}>
                ⬅ Previous Question
              </button>

              ${state.currentQuestionIndex < currentSection.questions.length - 1 ? `
                <button id="next-q-btn" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5">
                  <span>Next Question</span> <span>➔</span>
                </button>
              ` : `
                <button id="next-sec-btn" class="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5">
                  <span>Submit Section & Proceed</span> <span>➔</span>
                </button>
              `}
            </div>

            <!-- Question Palette Map -->
            <div class="pt-4 border-t border-slate-800/80 space-y-2">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Question Navigation Map:</span>
              <div class="flex flex-wrap gap-2">
                ${currentSection.questions.map((q, idx) => {
                  const isAns = state.candidateAnswers[q.id] !== undefined;
                  const isFlag = state.flaggedQuestions.has(q.id);
                  const isCur = idx === state.currentQuestionIndex;
                  return `
                    <button data-qidx="${idx}" class="q-map-btn w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                      isCur ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/30' :
                      isFlag ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      isAns ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }">
                      ${idx + 1}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Right Interactive Code IDE / Essay Workspace -->
          <div class="lg:col-span-7 bg-slate-900/50 p-4 flex flex-col overflow-hidden">
            ${currentQuestion.type === 'coding' || currentQuestion.type === 'sql' ? `
              <div id="monaco-container" class="w-full h-full"></div>
            ` : currentQuestion.type === 'essay' ? (() => {
                const initialText = (state.candidateAnswers[currentQuestion.id] || '').trim();
                const initialWords = initialText ? initialText.split(/\s+/).filter(Boolean).length : 0;
                return `
                  <div class="w-full h-full flex flex-col glass-panel p-5 rounded-2xl border border-slate-800">
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Rich Text Essay Response Editor</span>
                      <span id="word-count" class="text-xs font-mono text-blue-400">${initialWords} / ${currentQuestion.essayMaxWords || 500} words</span>
                    </div>
                    <textarea id="essay-editor" class="flex-1 w-full p-4 glass-input rounded-xl text-sm font-sans text-slate-100 border border-slate-700 bg-slate-950 focus:ring-2 focus:ring-blue-500 resize-none outline-none" placeholder="Type your response here... (Minimum ${currentQuestion.essayMinWords || 150} words requirement)">${state.candidateAnswers[currentQuestion.id] || ''}</textarea>
                  </div>
                `;
              })() : `
              <div class="w-full h-full flex items-center justify-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-sm">
                Select your answer in the question panel on the left.
              </div>
            `}
          </div>
        </div>

      </div>
    `;

    // Render Monaco Component if coding or SQL question
    if (currentQuestion.type === 'coding' || currentQuestion.type === 'sql') {
      const monacoHost = this.container.querySelector('#monaco-container') as HTMLElement;
      if (monacoHost) {
        const editorComp = new MonacoEditorComponent(monacoHost, currentQuestion);
        editorComp.render();
      }
    }

    this.attachExamEvents(currentQuestion);
  }

  private renderAnswerWidget(question: any, existingAnswer: any): string {
    if (question.type === 'mcq' || question.type === 'msq') {
      const opts = (question.options && question.options.length > 0) ? question.options : [];
      const multi = question.type === 'msq' || question.selectionMode === 'multi';
      const selected = multi
        ? (Array.isArray(existingAnswer) ? existingAnswer : [])
        : existingAnswer;

      return `
        <div class="space-y-2.5">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${multi ? 'Select all that apply:' : 'Select one option:'}</span>
          ${opts.map((opt: any, idx: number) => {
            const optId = typeof opt === 'string' ? `opt-${idx + 1}` : (opt.id || `opt-${idx + 1}`);
            const optText = typeof opt === 'string' ? opt : (opt.text || `Option ${idx + 1}`);
            const isSelected = multi ? selected.includes(optId) : (selected === optId || selected === optText);
            return `
              <label class="flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600/10 border-blue-500/50 text-white shadow-sm ring-1 ring-blue-500/20'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
              }">
                <input type="${multi ? 'checkbox' : 'radio'}" name="mcq-option" value="${optId}" ${isSelected ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 focus:ring-blue-500" />
                <span class="text-xs font-medium">${optText}</span>
              </label>
            `;
          }).join('')}
        </div>
      `;
    }

    if (question.type === 'drag_drop') {
      const opts = [...(question.options || [])];
      // The server froze this order on the attempt. Keep it so a refresh does not reshuffle.
      const order: string[] = Array.isArray(existingAnswer) && existingAnswer.length
        ? existingAnswer
        : opts.map((o: any) => o.id);
      const byId = Object.fromEntries(opts.map((o: any) => [o.id, o]));
      return `
        <div class="space-y-2">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Drag items into the correct order:</span>
          <ul id="drag-list" class="space-y-2">
            ${order.map((id, idx) => `
              <li draggable="true" data-drag-id="${id}" class="drag-item flex items-center gap-3 p-3.5 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 cursor-grab active:cursor-grabbing">
                <span class="text-slate-500 font-mono text-[10px] w-5">${idx + 1}</span>
                <span class="text-xs font-medium flex-1">${(byId[id]?.text) || id}</span>
                <span class="text-slate-600 text-sm">⠿</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }
    return ``;
  }

  private attachExamEvents(currentQuestion: any) {
    this.container.querySelectorAll('input[name="mcq-option"]').forEach(input => {
      input.addEventListener('change', () => {
        const multi = currentQuestion.type === 'msq' || currentQuestion.selectionMode === 'multi';
        if (multi) {
          const vals = Array.from(this.container.querySelectorAll('input[name="mcq-option"]:checked'))
            .map(el => (el as HTMLInputElement).value);
          store.setAnswer(currentQuestion.id, vals);
        } else {
          const checked = this.container.querySelector('input[name="mcq-option"]:checked') as HTMLInputElement | null;
          if (checked) store.setAnswer(currentQuestion.id, checked.value);
        }
        this.renderExamEngine();
      });
    });

    // Drag-and-drop ordering
    const list = this.container.querySelector('#drag-list');
    if (list) {
      let dragEl: HTMLElement | null = null;
      list.querySelectorAll('.drag-item').forEach(item => {
        item.addEventListener('dragstart', e => {
          dragEl = item as HTMLElement;
          (e as DragEvent).dataTransfer?.setData('text/plain', '');
          item.classList.add('opacity-50');
        });
        item.addEventListener('dragend', () => {
          item.classList.remove('opacity-50');
          dragEl = null;
          const ids = Array.from(list.querySelectorAll('.drag-item')).map(
            el => (el as HTMLElement).getAttribute('data-drag-id') || '',
          );
          store.setAnswer(currentQuestion.id, ids, false);
        });
        item.addEventListener('dragover', e => {
          e.preventDefault();
          const over = item as HTMLElement;
          if (!dragEl || dragEl === over) return;
          const rect = over.getBoundingClientRect();
          const before = (e as DragEvent).clientY < rect.top + rect.height / 2;
          list.insertBefore(dragEl, before ? over : over.nextSibling);
        });
      });
    }

    const essayEditor = this.container.querySelector('#essay-editor') as HTMLTextAreaElement;
    const wordCountSpan = this.container.querySelector('#word-count');
    if (essayEditor) {
      essayEditor.addEventListener('input', () => {
        const text = essayEditor.value;
        const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
        if (wordCountSpan) wordCountSpan.textContent = `${words} / ${currentQuestion.essayMaxWords || 500} words`;
        store.setAnswer(currentQuestion.id, text, false);
      });
    }

    this.container.querySelector('#flag-q-btn')?.addEventListener('click', () => {
      store.toggleFlagQuestion(currentQuestion.id);
      this.renderExamEngine();
    });

    this.container.querySelectorAll('.q-map-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qidx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-qidx') || '0', 10);
        flushCodingEditor();
        const state = store.getState();
        state.currentQuestionIndex = qidx;
        store.flushExamProgress();
        this.renderExamEngine();
      });
    });

    this.container.querySelector('#prev-q-btn')?.addEventListener('click', () => {
      flushCodingEditor();
      store.prevQuestion();
      this.renderExamEngine();
    });

    this.container.querySelector('#next-q-btn')?.addEventListener('click', () => {
      flushCodingEditor();
      store.nextQuestion();
      this.renderExamEngine();
    });

    const openSubmitSectionModal = () => {
      this.renderCustomSubmitSectionModal();
    };

    this.container.querySelector('#finish-sec-btn')?.addEventListener('click', openSubmitSectionModal);
    this.container.querySelector('#next-sec-btn')?.addEventListener('click', openSubmitSectionModal);
  }

  private renderCustomSubmitSectionModal() {
    const modalHost = document.createElement('div');
    modalHost.id = 'sec-confirm-modal';
    modalHost.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl text-center">
          <div class="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center text-2xl font-bold">
            ⚠️
          </div>
          <div>
            <h3 class="text-lg font-extrabold text-white">Complete & Submit Section?</h3>
            <p class="text-xs text-slate-300 mt-2 leading-relaxed">
              Are you sure you want to submit this section and proceed to the next section? You will not be able to revisit previous questions.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button id="cancel-sec-modal-btn" class="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all">
              Cancel & Continue Section
            </button>
            <button id="confirm-sec-modal-btn" class="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all">
              Yes, Submit Section ➔
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalHost);

    modalHost.querySelector('#cancel-sec-modal-btn')?.addEventListener('click', () => {
      modalHost.remove();
    });

    modalHost.querySelector('#confirm-sec-modal-btn')?.addEventListener('click', () => {
      modalHost.remove();
      flushCodingEditor();
      store.nextSection();
      // Re-affirm Fullscreen mode without triggering browser native exit
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      this.render();
    });
  }

  private static stopExamClock() {
    if (CandidatePortalModule.clockId) {
      window.clearInterval(CandidatePortalModule.clockId);
      CandidatePortalModule.clockId = 0;
    }
  }

  private static ensureExamClock() {
    if (CandidatePortalModule.clockId) return;
    CandidatePortalModule.clockId = window.setInterval(() => {
      const state = store.getState();
      if (!state.examStarted || state.examCompleted) {
        CandidatePortalModule.stopExamClock();
        return;
      }
      const remaining = store.getSectionRemainingSeconds();
      const timerEl = document.getElementById('exam-section-timer');
      if (timerEl) {
        timerEl.textContent = formatExamClock(remaining);
        timerEl.classList.toggle('text-red-400', remaining < 120);
        timerEl.classList.toggle('animate-pulse', remaining < 120);
        timerEl.classList.toggle('text-blue-400', remaining >= 120);
      }
      if (remaining <= 0) {
        flushCodingEditor();
        store.nextSection();
      }
    }, 250);
  }

  private renderCompletionScreen() {
    const state = store.getState();
    const isSubmitted = state.candidateFeedback !== null;

    const starsChosen = this.selectedRating >= 1;
    this.container.innerHTML = `
      <div class="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <!-- Hardware Stopped & Exit Fullscreen Confirmation Badge -->
        <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Webcam & Microphone Closed • Fullscreen Lockdown Ended</span>
          </div>
          <span class="font-mono text-[11px] bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-500/20">Camera OFF</span>
        </div>

        <div class="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-6 shadow-2xl">
          <div class="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center text-3xl animate-pulse-green">
            ✓
          </div>
          <div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">Assessment Submitted Successfully</h1>
            <p class="text-xs text-slate-300 mt-2">
              Your test responses and code submissions have been securely encrypted and transmitted to the hiring team.
            </p>
          </div>

          <!-- Strict Compliance Policy Notice (No Scores Displayed) -->
          <div class="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-left space-y-1.5">
            <h4 class="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔒</span> Candidate Evaluation Policy Notice
            </h4>
            <p class="text-[11px] text-slate-300 leading-relaxed">
              In accordance with enterprise recruitment compliance standards, evaluation scores, section percentages, and recruiter comments are directly routed to the hiring committee and are not displayed on the candidate portal.
            </p>
          </div>

          <!-- Candidate Rating & Feedback Survey Form -->
          ${!isSubmitted ? `
            <div id="feedback-section" class="pt-6 border-t border-slate-800/80 space-y-5 text-left">
              <div class="text-center">
                <h3 class="text-base font-extrabold text-white">Rate Your Assessment Experience</h3>
                <p class="text-xs text-slate-400 mt-1">Please take a moment to rate the platform and share your feedback.</p>
              </div>

              <!-- Interactive 5-Star Rating Selector -->
              <div class="flex justify-center items-center gap-3">
                ${[1, 2, 3, 4, 5].map(star => `
                  <button type="button" data-star="${star}" class="star-btn text-3xl transition-transform hover:scale-125 focus:outline-none ${
                    star <= this.selectedRating ? 'text-amber-400' : 'text-slate-700'
                  }">
                    ★
                  </button>
                `).join('')}
              </div>
              <p class="text-center text-[11px] text-slate-500">A star rating is required.</p>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Comments (optional):</label>
                <textarea id="feedback-text" rows="3" class="w-full p-3 glass-input rounded-xl text-xs text-white border border-slate-700 bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional comments">${this.feedbackDraft.replace(/</g, '&lt;')}</textarea>
              </div>

              <button id="submit-feedback-btn" type="button" ${starsChosen ? '' : 'disabled'} class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all ${starsChosen ? 'hover:from-blue-500 hover:to-indigo-500' : 'opacity-50 cursor-not-allowed'}">
                SUBMIT AND EXIT
              </button>
            </div>
          ` : `
            <div class="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-4">
              <span class="text-3xl">🌟</span>
              <h4 class="text-sm font-extrabold uppercase tracking-wider text-emerald-300">Thank You for Your Feedback!</h4>
              <p class="text-xs text-slate-300">Your rating & feedback have been securely recorded. You may now safely exit the assessment environment.</p>

              <button id="exit-fullscreen-close-tab-btn" class="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2">
                <span>🔒 EXIT SECURE EXAM & CLOSE TAB</span>
              </button>
            </div>
          `}

          <div class="pt-4 border-t border-slate-800">
            <p class="text-xs text-slate-500 font-mono">Reference Submission ID: SUB-2026-98412-SEC</p>
          </div>
        </div>
      </div>
    `;

    this.attachFeedbackEvents();
  }

  private attachFeedbackEvents() {
    this.container.querySelector('#exit-fullscreen-close-tab-btn')?.addEventListener('click', () => {
      closeExamTab();
    });

    // Star rating click handler
    this.container.querySelector('#feedback-text')?.addEventListener('input', (e) => {
      this.feedbackDraft = (e.currentTarget as HTMLTextAreaElement).value;
    });

    this.container.querySelectorAll('.star-btn').forEach(starBtn => {
      starBtn.addEventListener('click', (e) => {
        const star = parseInt((e.currentTarget as HTMLElement).getAttribute('data-star') || '0', 10);
        const textInput = this.container.querySelector('#feedback-text') as HTMLTextAreaElement | null;
        this.feedbackDraft = textInput?.value || this.feedbackDraft;
        this.selectedRating = star;
        this.renderCompletionScreen();
      });
    });

    const submitBtn = this.container.querySelector('#submit-feedback-btn');
    submitBtn?.addEventListener('click', () => {
      if (this.selectedRating < 1) return;
      const textInput = this.container.querySelector('#feedback-text') as HTMLTextAreaElement;
      const text = textInput ? textInput.value.trim() : this.feedbackDraft.trim();
      submitBtn.setAttribute('disabled', 'true');
      store.finishAndClose(this.selectedRating, text);
      closeExamTab();
    });
  }
}

function codingNotes(question: { type?: string; constraints?: string; ioFormat?: string }): string {
  if (question.type !== 'coding' && question.type !== 'sql') return '';
  const constraints = (question.constraints || '').trim();
  const ioFormat = (question.ioFormat || '').trim();
  if (!constraints && !ioFormat) return '';
  const block = (label: string, text: string) => text ? `
    <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${label}</p>
      <p class="text-xs text-slate-200 mt-1 whitespace-pre-line">${escHtml(text)}</p>
    </div>` : '';
  return `<div class="mt-4 space-y-2">${block('Constraints', constraints)}${block('Input / Output format', ioFormat)}</div>`;
}

function escHtml(value: string): string {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function closeExamTab() {
  try {
    sessionStorage.removeItem('confered.candidateToken');
    sessionStorage.removeItem('confered.examSnapshot');
  } catch {
    /* private browsing */
  }
  if (document.fullscreenElement && document.exitFullscreen) {
    void document.exitFullscreen().catch(() => undefined);
  }
  // A click can close this tab once the page replaces itself.
  window.open('', '_self');
  window.close();
}

export function requestExamFullscreen() {
  const blocker = document.getElementById('fullscreen-enforcer-overlay');
  const request = document.documentElement.requestFullscreen?.();
  if (!request) {
    blocker?.classList.remove('hidden');
    return;
  }
  request.catch(() => blocker?.classList.remove('hidden'));
}
