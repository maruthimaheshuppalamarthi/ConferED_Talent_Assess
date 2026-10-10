import { MonacoEditorComponent } from '../components/MonacoEditorComponent';
import { ProctoringOverlayComponent } from '../components/ProctoringOverlay';
import { SystemCheckComponent } from '../components/SystemCheck';
import { authApi, ApiError } from '../services/authApi';
import { store } from '../services/store';

export class CandidatePortalModule {
  private container: HTMLElement;
  private timerInterval: any = null;
  private selectedRating: number = 0;
  private feedbackDraft = '';

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
          if (title) title.textContent = 'Fullscreen Lockdown Violation';
          if (copy) copy.textContent = 'You left fullscreen. That is a proctoring violation. Return to fullscreen to continue.';
          store.logProctoringViolation('Fullscreen Exit', 'Candidate left fullscreen lockdown', 'high');
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

    // Candidate Flow Router
    if (!state.otpVerified) {
      this.renderOtpVerification();
    } else if (!state.systemCheckCompleted) {
      const systemCheck = new SystemCheckComponent(this.container);
      systemCheck.render().catch((e) => console.error('System check failed to render', e));
    } else if (state.examStarted && !state.examCompleted) {
      this.renderExamEngine();
      this.startTimer();
    } else if (state.examCompleted) {
      this.renderCompletionScreen();
    } else {
      this.renderInstructionsScreen();
    }
  }

  private renderOtpVerification() {
    const inviteToken = store.getState().candidateInviteToken;

    // The exam can only be opened from the personal invitation link (it carries a signed-by-server token).
    if (!inviteToken) {
      this.container.innerHTML = `
        <div class="max-w-md mx-auto py-16 px-4">
          <div class="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center text-2xl">🔗</div>
            <h2 class="text-2xl font-extrabold text-white tracking-tight">Invitation Link Required</h2>
            <p class="text-xs text-slate-400 leading-relaxed">
              This assessment can only be started from your personal invitation link. Open the email you received from the
              recruiter and click <strong class="text-slate-200">Begin Online Assessment</strong>.
            </p>
          </div>
        </div>
      `;
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
    const assessment = store.getActiveAssessment();

    this.container.innerHTML = `
      <div class="max-w-4xl mx-auto py-10 px-4">
        <div class="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <span class="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">Assessment Overview</span>
              <h1 class="text-2xl font-extrabold text-white mt-2">${assessment?.title || 'Technical Assessment'}</h1>
              <p class="text-xs text-slate-400 mt-1">${assessment?.description}</p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-extrabold font-mono text-blue-400">${assessment?.totalDurationMinutes} Mins</div>
              <span class="text-xs text-slate-400 font-medium">Total Duration</span>
            </div>
          </div>

          <!-- Section Breakdown Cards (NO MARKS DISPLAYED) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${(assessment?.sections || []).map((sec, idx) => `
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Section ${idx + 1}</span>
                <h3 class="text-xs font-bold text-white truncate">${sec.name}</h3>
                <div class="text-xs font-mono text-blue-400 font-semibold">${sec.timeLimitMinutes} Mins • ${sec.questions.length} Questions</div>
              </div>
            `).join('')}
          </div>

          <div class="pt-4 border-t border-slate-800 flex justify-end">
            <button id="goto-syscheck-btn" class="py-3.5 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2">
              <span>PROCEED TO SYSTEM DIAGNOSTICS</span>
              <span>➔</span>
            </button>
          </div>
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
    if (!assessment) return;

    const currentSection = assessment.sections[state.currentSectionIndex];
    const currentQuestion = currentSection?.questions[state.currentQuestionIndex];
    if (!currentSection || !currentQuestion) return;

    const mins = Math.floor(state.sectionTimeRemainingSeconds / 60);
    const secs = state.sectionTimeRemainingSeconds % 60;
    const timerStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    this.container.innerHTML = `
      <div class="min-h-[calc(100vh-65px)] flex flex-col bg-slate-950">
        <!-- Secure Exam Top Navigation Header -->
        <div class="glass-panel px-6 py-3 border-b border-slate-800 flex items-center justify-between sticky top-14 z-30">
          <div class="flex items-center gap-4">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                SECTION ${state.currentSectionIndex + 1} OF ${assessment.sections.length}
              </span>
              <h2 class="text-sm font-bold text-white">${currentSection.name}</h2>
            </div>
          </div>

          <!-- Section Timer & Section Navigation Controls -->
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl font-mono">
              <span class="text-xs text-slate-400 uppercase tracking-wider">Section Time:</span>
              <span class="text-base font-extrabold ${mins < 2 ? 'text-red-400 animate-pulse' : 'text-blue-400'}">${timerStr}</span>
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

        <!-- Floating Live Proctoring Webcam PIP -->
        <div id="proctoring-pip-container"></div>
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

    // Render Live Proctoring Overlay
    const proctorHost = this.container.querySelector('#proctoring-pip-container') as HTMLElement;
    if (proctorHost) {
      const proctorComp = new ProctoringOverlayComponent(proctorHost);
      proctorComp.render();
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
        const state = store.getState();
        state.currentQuestionIndex = qidx;
        this.renderExamEngine();
      });
    });

    this.container.querySelector('#prev-q-btn')?.addEventListener('click', () => {
      store.prevQuestion();
      this.renderExamEngine();
    });

    this.container.querySelector('#next-q-btn')?.addEventListener('click', () => {
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
      store.nextSection();
      // Re-affirm Fullscreen mode without triggering browser native exit
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      this.render();
    });
  }

  private startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const state = store.getState();
      if (!state.examStarted || state.examCompleted) {
        clearInterval(this.timerInterval);
        return;
      }

      if (state.sectionTimeRemainingSeconds > 0) {
        state.sectionTimeRemainingSeconds--;
        const mins = Math.floor(state.sectionTimeRemainingSeconds / 60);
        const secs = state.sectionTimeRemainingSeconds % 60;
        const timerStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        
        const timerEl = this.container.querySelector('.font-extrabold.text-blue-400');
        if (timerEl) timerEl.textContent = timerStr;
      } else {
        store.nextSection();
        this.render();
      }
    }, 1000);
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
    // Exit Fullscreen & Close Tab button listener
    const exitBtn = this.container.querySelector('#exit-fullscreen-close-tab-btn');
    exitBtn?.addEventListener('click', () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      alert('✅ Assessment session closed cleanly. You may now close this browser tab.');
      window.location.reload();
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
      store.saveCandidateFeedback(this.selectedRating, text).then(() => {
        this.renderCompletionScreen();
      }).catch(() => {
        submitBtn.removeAttribute('disabled');
      });
    });
  }
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
