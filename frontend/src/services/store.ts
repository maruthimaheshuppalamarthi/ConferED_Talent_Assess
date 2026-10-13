import { Assessment, Candidate, CandidateResult, LiveCandidate, Portal, Question, SystemSettings, ProctoringViolation } from '../types';
import { initialSettings, sampleAssessments, sampleCandidateResults, sampleCandidates, sampleLiveCandidates, sampleQuestions } from './mockData';
import { authApi, AuthUser, CandidateSession } from './authApi';
import { CodeDraft, ExamSnapshot, writeExamSnapshot } from './examDraft';
import { sanitizeAssessmentQuestions } from './questionSanitize';

export interface CandidateFeedback {
  rating: number; // 1 to 5
  feedbackText: string;
  tags: string[];
  submittedAt: string;
}

export interface AppState {
  isStaffAuthenticated: boolean;
  // Verified server-side identity (JWT session). Roles/portals come from the backend, not the UI.
  currentUser: AuthUser | null;
  allowedPortals: Portal[];
  // True once the first "restore session from refresh cookie" attempt has finished.
  authReady: boolean;
  // Invite token from the candidate's link (?invite=...) - exchanged for a candidate JWT after OTP.
  candidateInviteToken: string | null;
  settings: SystemSettings;
  assessments: Assessment[];
  activeAssessmentId: string;
  candidates: Candidate[];
  candidateResults: Record<string, CandidateResult>;
  questionBank: Question[];
  liveCandidates: LiveCandidate[];
  
  // Active Candidate Exam Flow State
  activeCandidateId: string | null;
  otpVerified: boolean;
  systemCheckCompleted: boolean;
  examStarted: boolean;
  examCompleted: boolean;
  assessmentReady: boolean;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  sectionTimeRemainingSeconds: number;
  sectionEndsAtMs: number | null;
  candidateAnswers: Record<string, any>; // questionId -> answer
  codeSubmissions: Record<string, { code: string; language: string; executionTimeMs?: number; passedCount?: number; totalCount?: number }>;
  codeDrafts: Record<string, CodeDraft>;
  flaggedQuestions: Set<string>;
  candidateFeedback: CandidateFeedback | null;
  
  // Proctoring Engine State
  isFullscreen: boolean;
  violationCount: number;
  proctoringLogs: ProctoringViolation[];
  liveProctoringAlert: string | null;
  proctorIntercomMessage: string | null;
  
  // Theme Switcher State
  theme: 'dark' | 'light';
}

class Store {
  private state: AppState;
  private listeners: (() => void)[] = [];
  private activeStreams: MediaStream[] = [];
  private positionRestored = false;
  private progressTimer: number | null = null;

  constructor() {
    const params = new URLSearchParams(window.location.search);
    const assessmentFromLink = params.get('assessment');
    this.state = {
      isStaffAuthenticated: false,
      currentUser: null,
      allowedPortals: [],
      authReady: false,
      candidateInviteToken: params.get('invite'),
      liveCandidates: sampleLiveCandidates.map(c => ({ ...c })),
      settings: { ...initialSettings },
      assessments: [...sampleAssessments],
      activeAssessmentId: (assessmentFromLink
        && sampleAssessments.some(a => a.id === assessmentFromLink)
        ? assessmentFromLink
        : sampleAssessments[0].id),
      candidates: [...sampleCandidates],
      candidateResults: { ...sampleCandidateResults },
      questionBank: [...sampleQuestions],
      
      activeCandidateId: 'cand-3',
      otpVerified: false,
      systemCheckCompleted: false,
      examStarted: false,
      examCompleted: false,
      assessmentReady: false,
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      sectionTimeRemainingSeconds: 600,
      sectionEndsAtMs: null,
      candidateAnswers: {},
      codeSubmissions: {},
      codeDrafts: {},
      flaggedQuestions: new Set(),
      candidateFeedback: null,
      
      isFullscreen: false,
      violationCount: 0,
      proctoringLogs: [],
      liveProctoringAlert: null,
      proctorIntercomMessage: null,
      
      theme: 'dark'
    };

    // If the server revokes/expires the session mid-use, fall back to the signed-out state.
    authApi.setSessionExpiredHandler(() => this.clearStaffSession());
  }

  public toggleTheme() {
    this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
    if (this.state.theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
    this.notify();
  }

  public getState(): AppState {
    return this.state;
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  /** Ask the app to re-render (e.g. after navigation state outside the store changed). */
  public refresh() {
    this.notify();
  }

  // Camera & Mic MediaStream Track Management
  public registerMediaStream(stream: MediaStream) {
    if (stream && !this.activeStreams.includes(stream)) {
      this.activeStreams.push(stream);
    }
  }

  public getLiveCameraStream(): MediaStream | null {
    return this.activeStreams.find(stream => stream.getVideoTracks().some(track => track.readyState === 'live')) || null;
  }

  public stopAllMediaStreams() {
    this.activeStreams.forEach(stream => {
      if (stream && stream.getTracks) {
        stream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {}
        });
      }
    });
    this.activeStreams = [];
  }

  // ---------------------------------------------------------------------------
  // Authentication (state mirrors the server-verified JWT session; the backend
  // enforces every permission, this only drives what the UI shows).
  // ---------------------------------------------------------------------------
  /** Apply a verified staff session (also used to refresh the user after a password change). */
  public loginStaff(user: AuthUser) {
    this.state.currentUser = user;
    this.state.allowedPortals = user.portals;
    this.state.isStaffAuthenticated = true;
    this.notify();
    if (!user.mustChangePassword) void this.loadPolicy('staff');
  }

  private policyLoading = false;

  /**
   * Pull the proctoring + assessment policy the System Admin saved (Settings screen) into state.settings, so the
   * exam, proctoring and invitation screens follow the real rules. On failure the defaults already in state stay.
   */
  public async loadPolicy(mode: 'staff' | 'candidate'): Promise<void> {
    if (this.policyLoading) return;
    this.policyLoading = true;
    try {
      const [proctoring, assessment] = await Promise.all([
        authApi.fetchJson<Partial<SystemSettings>>('/policy/proctoring', 'GET', undefined, mode),
        authApi.fetchJson<Partial<SystemSettings>>('/policy/assessment', 'GET', undefined, mode),
      ]);
      this.state.settings = { ...this.state.settings, ...proctoring, ...assessment };
      this.notify();
    } catch {
      /* keep the defaults */
    } finally {
      this.policyLoading = false;
    }
  }

  public markAuthReady() {
    this.setAuthReady(true);
  }

  public setAuthReady(ready: boolean) {
    if (this.state.authReady !== ready) {
      this.state.authReady = ready;
      this.notify();
    }
  }

  private clearStaffSession() {
    this.state.isStaffAuthenticated = false;
    this.state.currentUser = null;
    this.state.allowedPortals = [];
    this.notify();
  }

  public async logoutStaff() {
    try {
      await authApi.logout();
    } finally {
      this.clearStaffSession(); // the UI always signs out, even if the request failed
    }
  }

  /** Candidate passed server-side invite + OTP verification. */
  public candidateVerified(session: CandidateSession) {
    this.state.activeCandidateId = session.candidate.id;
    this.state.activeAssessmentId = session.candidate.assessmentId;
    this.state.assessmentReady = false;
    this.state.otpVerified = true;
    this.notify();
    void this.loadPolicy('candidate');
    void this.loadCandidateAssessment(session.candidate.assessmentId);
  }

  /** Load sanitized assessment from API (no correct answers). */
  public async loadCandidateAssessment(assessmentId: string) {
    try {
      const data = await authApi.fetchJson<Assessment & {
        examStartedAt?: string | null;
        progress?: {
          sectionIndex?: number;
          questionIndex?: number;
          sectionEndsAt?: string | null;
          answers?: Record<string, unknown>;
          codeDrafts?: Record<string, CodeDraft>;
          flagged?: string[];
        } | null;
      }>('/candidate/assessment', 'GET', undefined, 'candidate');
      const sanitized = sanitizeAssessmentQuestions(data);
      const idx = this.state.assessments.findIndex(a => a.id === sanitized.id || a.id === assessmentId);
      if (idx >= 0) this.state.assessments[idx] = sanitized;
      else this.state.assessments.unshift(sanitized);
      this.state.activeAssessmentId = sanitized.id;
      this.state.assessmentReady = true;
      this.applyServerProgress(data);
      if (this.state.examStarted && this.state.sectionEndsAtMs == null) this.jumpToFirstQuestion(true);
      this.notify();
    } catch {
      this.state.assessmentReady = false;
      this.notify();
    }
  }

  /** Put a refresh copy of the attempt back into memory before the first paint. */
  public hydrateExam(snap: ExamSnapshot) {
    this.state.activeCandidateId = snap.candidateId;
    if (snap.assessmentId) this.state.activeAssessmentId = snap.assessmentId;
    this.state.otpVerified = snap.otpVerified;
    this.state.systemCheckCompleted = snap.systemCheckCompleted;
    this.state.examStarted = snap.examStarted;
    this.state.examCompleted = snap.examCompleted;
    this.state.currentSectionIndex = snap.currentSectionIndex || 0;
    this.state.currentQuestionIndex = snap.currentQuestionIndex || 0;
    this.state.sectionEndsAtMs = snap.sectionEndsAtMs;
    this.state.sectionTimeRemainingSeconds = this.getSectionRemainingSeconds();
    this.state.candidateAnswers = { ...(snap.answers || {}) };
    this.state.codeDrafts = snap.codeDrafts || {};
    this.state.flaggedQuestions = new Set(snap.flagged || []);
    this.positionRestored = true;
    if (snap.examStarted && !snap.examCompleted) {
      void authApi.fetchJson('/candidate/exam/start', 'POST', {}, 'candidate').catch(() => null);
      void this.loadCandidateAssessment(this.state.activeAssessmentId);
    }
  }

  /** Keep typed code when the token is gone and the candidate must sign in again. */
  public seedCodeDrafts(drafts: Record<string, CodeDraft>) {
    this.state.codeDrafts = drafts || {};
  }

  private applyServerProgress(data: {
    examStartedAt?: string | null;
    progress?: {
      sectionIndex?: number;
      questionIndex?: number;
      sectionEndsAt?: string | null;
      answers?: Record<string, unknown>;
      codeDrafts?: Record<string, CodeDraft>;
      flagged?: string[];
    } | null;
  }) {
    const progress = data.progress;
    if (data.examStartedAt && !this.state.examCompleted) {
      this.state.examStarted = true;
      this.state.systemCheckCompleted = true;
    }
    if (!progress) return;
    const localHasCode = Object.values(this.state.codeDrafts).some(draft =>
      Object.values(draft.files || {}).some(text => text.length > 0));
    if (!localHasCode && progress.codeDrafts) this.state.codeDrafts = progress.codeDrafts;
    if (!Object.keys(this.state.candidateAnswers).length && progress.answers) {
      this.state.candidateAnswers = { ...progress.answers };
    }
    if (this.state.sectionEndsAtMs == null && progress.sectionEndsAt) {
      const ms = Date.parse(progress.sectionEndsAt);
      if (!Number.isNaN(ms)) this.state.sectionEndsAtMs = ms;
    }
    if (!this.positionRestored) {
      if (typeof progress.sectionIndex === 'number') this.state.currentSectionIndex = progress.sectionIndex;
      if (typeof progress.questionIndex === 'number') this.state.currentQuestionIndex = progress.questionIndex;
      if (progress.flagged) this.state.flaggedQuestions = new Set(progress.flagged);
      this.positionRestored = true;
    }
  }

  private progressBody() {
    return {
      sectionIndex: this.state.currentSectionIndex,
      questionIndex: this.state.currentQuestionIndex,
      sectionEndsAt: this.state.sectionEndsAtMs ? new Date(this.state.sectionEndsAtMs).toISOString() : null,
      answers: this.state.candidateAnswers,
      codeDrafts: this.state.codeDrafts,
      flagged: Array.from(this.state.flaggedQuestions),
    };
  }

  private persistExam(immediate = false) {
    const invite = this.state.candidateInviteToken;
    if (!invite || !this.state.otpVerified) return;
    writeExamSnapshot({
      inviteToken: invite,
      savedAt: Date.now(),
      candidateId: this.state.activeCandidateId,
      assessmentId: this.state.activeAssessmentId,
      otpVerified: this.state.otpVerified,
      systemCheckCompleted: this.state.systemCheckCompleted,
      examStarted: this.state.examStarted,
      examCompleted: this.state.examCompleted,
      currentSectionIndex: this.state.currentSectionIndex,
      currentQuestionIndex: this.state.currentQuestionIndex,
      sectionEndsAtMs: this.state.sectionEndsAtMs,
      answers: this.state.candidateAnswers,
      codeDrafts: this.state.codeDrafts,
      flagged: Array.from(this.state.flaggedQuestions),
    });
    if (!this.state.examStarted || this.state.examCompleted) return;
    if (this.progressTimer) window.clearTimeout(this.progressTimer);
    this.progressTimer = window.setTimeout(() => {
      this.progressTimer = null;
      void authApi.fetchJson('/candidate/progress', 'PUT', this.progressBody(), 'candidate').catch(() => null);
    }, immediate ? 0 : 700);
  }

  public flushExamProgress() {
    if (!this.state.otpVerified || !this.state.examStarted || this.state.examCompleted) return;
    this.persistExam();
    authApi.flushJson('/candidate/progress', this.progressBody(), 'candidate');
  }

  public updateSettings(newSettings: Partial<SystemSettings>) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.notify();
  }

  public completeSystemCheck() {
    this.state.systemCheckCompleted = true;
    this.notify();
  }

  public startExam() {
    if (this.state.examStarted && this.state.sectionEndsAtMs && this.state.sectionEndsAtMs > Date.now()) {
      this.positionRestored = true;
      this.persistExam(true);
      this.notify();
      return;
    }
    this.state.examStarted = true;
    this.state.examCompleted = false;
    this.state.sectionEndsAtMs = null;
    this.terminateArmed = false;
    this.lastCountedViolationAt = {};
    this.jumpToFirstQuestion(true);
    this.positionRestored = true;
    this.notify();
    void authApi.fetchJson('/candidate/exam/start', 'POST', {}, 'candidate').catch(() => null);
    this.persistExam(true);
    if (this.state.activeCandidateId) {
      void this.loadCandidateAssessment(this.state.activeAssessmentId);
    }
  }

  public getSectionRemainingSeconds(): number {
    if (this.state.sectionEndsAtMs) {
      return Math.max(0, Math.ceil((this.state.sectionEndsAtMs - Date.now()) / 1000));
    }
    return Math.max(0, this.state.sectionTimeRemainingSeconds || 0);
  }

  private armSectionClock(minutes: number, force: boolean) {
    const assessment = this.getActiveAssessment();
    const overallMinutes = (assessment?.totalDurationMinutes && assessment.totalDurationMinutes > 0)
      ? assessment.totalDurationMinutes
      : (minutes || 60);
    const seconds = Math.max(1, Math.round(overallMinutes * 60));
    // If the overall exam clock is already running, keep ticking without reset
    if (this.state.sectionEndsAtMs && this.state.sectionEndsAtMs > Date.now()) {
      this.state.sectionTimeRemainingSeconds = this.getSectionRemainingSeconds();
      return;
    }
    this.state.sectionEndsAtMs = Date.now() + seconds * 1000;
    this.state.sectionTimeRemainingSeconds = seconds;
    this.persistExam();
  }

  public jumpToFirstQuestion(resetClock = false) {
    const assessment = this.getActiveAssessment();
    const sections = assessment?.sections || [];
    const idx = sections.findIndex(sec => (sec.questions || []).length > 0);
    const nextIndex = idx >= 0 ? idx : 0;
    this.state.currentSectionIndex = nextIndex;
    this.state.currentQuestionIndex = 0;
    const currentSection = sections[this.state.currentSectionIndex];
    if (currentSection) {
      const overallMinutes = assessment?.totalDurationMinutes || currentSection.timeLimitMinutes || 60;
      this.armSectionClock(overallMinutes, resetClock);
    }
  }

  public getActiveAssessment(): Assessment | undefined {
    const a = this.state.assessments.find(a => a.id === this.state.activeAssessmentId);
    // Never expose answer keys on the candidate exam path.
    if (a && this.state.otpVerified && !this.state.isStaffAuthenticated) {
      return sanitizeAssessmentQuestions(a);
    }
    return a;
  }

  public setAnswer(questionId: string, answer: any, shouldNotify: boolean = true) {
    this.state.candidateAnswers[questionId] = answer;
    this.persistExam();
    if (shouldNotify) {
      this.notify();
    }
  }

  /** Remember editor text without re-rendering, so a refresh or fullscreen exit keeps every character. */
  public noteCodeDraft(questionId: string, language: string, code: string) {
    const prev = this.state.codeDrafts[questionId] || { language, files: {} };
    prev.language = language;
    prev.files = { ...prev.files, [language]: code };
    this.state.codeDrafts[questionId] = prev;
    this.state.codeSubmissions[questionId] = {
      ...(this.state.codeSubmissions[questionId] || {}),
      code,
      language,
    };
    this.state.candidateAnswers[questionId] = { code, language };
    this.persistExam();
  }

  public recallCode(questionId: string, language: string): string | null {
    const text = this.state.codeDrafts[questionId]?.files?.[language];
    return typeof text === 'string' ? text : null;
  }

  public recallLanguage(questionId: string): string | null {
    return this.state.codeDrafts[questionId]?.language || null;
  }

  public setCodeSubmission(questionId: string, submission: { code: string; language: string; executionTimeMs?: number; passedCount?: number; totalCount?: number }) {
    this.noteCodeDraft(questionId, submission.language, submission.code);
    this.state.codeSubmissions[questionId] = {
      ...this.state.codeSubmissions[questionId],
      ...submission,
    };
  }

  public toggleFlagQuestion(questionId: string) {
    if (this.state.flaggedQuestions.has(questionId)) {
      this.state.flaggedQuestions.delete(questionId);
    } else {
      this.state.flaggedQuestions.add(questionId);
    }
    this.persistExam();
    this.notify();
  }

  public nextQuestion() {
    const section = this.getActiveAssessment()?.sections[this.state.currentSectionIndex];
    if (section && this.state.currentQuestionIndex < section.questions.length - 1) {
      this.state.currentQuestionIndex++;
      this.persistExam();
      this.notify();
    }
  }

  public prevQuestion() {
    if (this.state.currentQuestionIndex > 0) {
      this.state.currentQuestionIndex--;
      this.persistExam();
      this.notify();
    }
  }

  public nextSection() {
    const assessment = this.getActiveAssessment();
    const sections = assessment?.sections || [];
    let next = this.state.currentSectionIndex + 1;
    while (next < sections.length && !(sections[next].questions || []).length) next++;
    if (next < sections.length) {
      this.state.currentSectionIndex = next;
      this.state.currentQuestionIndex = 0;
      this.armSectionClock(sections[next].timeLimitMinutes || 15, false);
      this.persistExam();
      this.notify();
    } else {
      this.submitAssessment();
    }
  }

  public submitAssessment() {
    this.state.examStarted = false;
    this.state.examCompleted = true;
    this.state.sectionEndsAtMs = null;

    this.stopAllMediaStreams();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    const activeCandId = this.state.activeCandidateId || 'cand-3';
    const cand = this.state.candidates.find(c => c.id === activeCandId);
    if (cand) {
      cand.status = 'Completed';
      cand.assessmentCompleted = true;
    }

    const answers: Record<string, unknown> = { ...this.state.candidateAnswers };
    Object.entries(this.state.codeDrafts).forEach(([questionId, draft]) => {
      const language = draft.language;
      answers[questionId] = {
        code: draft.files[language] ?? '',
        language,
        files: draft.files,
      };
    });
    // Server grades objective items; candidate UI never receives scores/keys.
    void authApi.fetchJson('/candidate/submit', 'POST', {
      answers,
    }, 'candidate').catch(() => null);

    this.notify();
  }

  public async saveCandidateFeedback(rating: number, feedbackText: string) {
    await authApi.fetchJson('/candidate/feedback', 'POST', {
      rating,
      comment: feedbackText,
    }, 'candidate');
    this.markFeedbackSaved(rating, feedbackText);
  }

  /** Save the rating and close the exam tab. The request survives the tab closing. */
  public finishAndClose(rating: number, feedbackText: string) {
    authApi.postKeepalive('/candidate/feedback', {
      rating,
      comment: feedbackText,
    }, 'candidate');
    this.markFeedbackSaved(rating, feedbackText);
  }

  private markFeedbackSaved(rating: number, feedbackText: string) {
    this.state.candidateFeedback = {
      rating,
      feedbackText,
      tags: [],
      submittedAt: new Date().toISOString()
    };
    void import('./candidateAssist').then(({ candidateAssist }) => candidateAssist.reportFinished());
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    this.notify();
  }

  private lastCountedViolationAt: Partial<Record<ProctoringViolation['type'], number>> = {};
  private terminateArmed = false;

  public logProctoringViolation(type: ProctoringViolation['type'], description: string, severity: 'low' | 'medium' | 'high' = 'medium', extras?: { snapshotUrl?: string }) {
    if (!this.state.examStarted || this.state.examCompleted) return;

    const repeating = type === 'No Face Detected' || type === 'Multiple Faces' || type === 'Object Detected' || type === 'Mobile Phone Detected' || type === 'Looking Away';
    const now = Date.now();
    if (repeating && now - (this.lastCountedViolationAt[type] || 0) < 8000) return;
    this.lastCountedViolationAt[type] = now;

    this.state.violationCount++;
    const violation: ProctoringViolation = {
      id: `viol-${Date.now()}`,
      candidateId: this.state.activeCandidateId || 'cand-3',
      timestamp: new Date().toLocaleTimeString(),
      type,
      severity,
      snapshotUrl: extras?.snapshotUrl,
      description
    };

    this.state.proctoringLogs.unshift(violation);
    this.state.liveProctoringAlert = `${type}: ${description}`;
    import('./candidateAssist').then(mod => mod.candidateAssist.reportViolation(type, severity)).catch(() => undefined);

    const activeEntry = this.state.liveCandidates.find(c => c.candidateId === this.state.activeCandidateId);
    if (activeEntry) {
      activeEntry.violations = this.state.violationCount;
      activeEntry.status = this.state.violationCount >= this.state.settings.maxTabSwitches ? 'warning' : 'normal';
      activeEntry.lastEvent = `${type} detected`;
    }

    if (this.state.violationCount >= this.state.settings.maxViolationsBeforeTerminate && !this.terminateArmed) {
      this.terminateArmed = true;
      this.state.liveProctoringAlert = `EXAM TERMINATED: Warning limit reached (${this.state.violationCount}/${this.state.settings.maxViolationsBeforeTerminate})`;
      window.setTimeout(() => {
        if (!this.state.examCompleted) this.submitAssessment();
      }, 1200);
    }

    this.notify();
  }

  public clearProctoringAlert() {
    if (this.state.liveProctoringAlert !== null) {
      this.state.liveProctoringAlert = null;
      this.notify();
    }
  }

  public registerCandidateIdentity(
    candidateId: string,
    livePhotoUrl: string,
    idProofUrl: string,
    details?: { name?: string; email?: string },
  ) {
    const cand = this.state.candidates.find(c => c.id === candidateId);
    if (cand) {
      if (livePhotoUrl) cand.livePhotoUrl = livePhotoUrl;
      if (idProofUrl) cand.idProofUrl = idProofUrl;
      if (details?.name) cand.name = details.name;
      if (details?.email) cand.email = details.email;
      cand.identityStatus = 'pending_verification';
    } else {
      this.state.candidates.unshift({
        id: candidateId,
        name: details?.name || 'Candidate',
        email: details?.email || '',
        phone: '',
        experienceYears: 0,
        skills: [],
        status: 'Assessment Sent',
        assessmentId: this.state.activeAssessmentId,
        invitedAt: new Date().toLocaleDateString(),
        otpVerified: true,
        systemCheckPassed: true,
        assessmentCompleted: false,
        livePhotoUrl,
        idProofUrl,
        identityStatus: 'pending_verification'
      });
    }
    this.state.activeCandidateId = candidateId;
    // Do not notify here. A full re-render would wipe the system-check screen while the photo is being saved.
  }

  public approveCandidateIdentity(candidateId: string) {
    const cand = this.state.candidates.find(c => c.id === candidateId);
    if (cand) {
      cand.identityStatus = 'approved';
    }
    if (this.state.activeCandidateId === candidateId) {
      this.startExam();
    }
    this.notify();
  }

  public triggerProctorIntercom(candidateId: string, message: string) {
    this.state.proctorIntercomMessage = message;
    this.state.liveProctoringAlert = `PROCTOR INTERCOM / 360° ROOM INSPECTION: ${message}`;
    this.notify();
  }

  public clearProctorIntercom() {
    this.state.proctorIntercomMessage = null;
    if (this.state.liveProctoringAlert?.includes('PROCTOR INTERCOM')) {
      this.state.liveProctoringAlert = null;
    }
    this.notify();
  }

  public addQuestionToBank(question: Question) {
    this.state.questionBank.unshift(question);
    this.notify();
  }

  public addCandidate(candidate: Candidate) {
    this.state.candidates.unshift(candidate);
    this.notify();
  }

  public updateCandidateStatus(candidateId: string, newStatus: Candidate['status']) {
    const cand = this.state.candidates.find(c => c.id === candidateId);
    if (cand) {
      cand.status = newStatus;
      this.notify();
    }
  }

  public updateCandidateDecision(candidateId: string, decision: CandidateResult['recruiterDecision'], notes: string) {
    if (this.state.candidateResults[candidateId]) {
      this.state.candidateResults[candidateId].recruiterDecision = decision;
      this.state.candidateResults[candidateId].recruiterNotes = notes;
      this.notify();
    }
  }

  // Question Bank CRUD Operations
  public addQuestion(question: Question, targetSectionIdOrName?: string) {
    this.state.questionBank.unshift(question);
    if (targetSectionIdOrName) {
      this.assignQuestionToSection(targetSectionIdOrName, question);
    } else {
      const activeAssess = this.getActiveAssessment();
      if (activeAssess && activeAssess.sections.length > 0) {
        activeAssess.sections[0].questions.push(question);
      }
    }
    this.notify();
  }

  public assignQuestionToSection(sectionIdOrName: string, question: Question) {
    const activeAssess = this.getActiveAssessment();
    if (!activeAssess) return;

    // Remove from existing sections first
    activeAssess.sections.forEach(sec => {
      sec.questions = sec.questions.filter(q => q.id !== question.id);
    });

    let targetSection = activeAssess.sections.find(
      s => s.id === sectionIdOrName || s.name.toLowerCase() === sectionIdOrName.toLowerCase()
    );

    if (!targetSection) {
      targetSection = {
        id: `sec-${Date.now()}`,
        name: sectionIdOrName,
        description: '',
        isMandatory: true,
        instructions: `Complete all questions in ${sectionIdOrName}.`,
        timeLimitMinutes: 15,
        passingMarks: question.points || 20,
        randomizeQuestions: true,
        questions: []
      };
      activeAssess.sections.push(targetSection);
    }

    targetSection.questions.push(question);
    this.notify();
  }

  public updateQuestion(questionId: string, updated: Partial<Question>) {
    const idx = this.state.questionBank.findIndex(q => q.id === questionId);
    if (idx !== -1) {
      this.state.questionBank[idx] = { ...this.state.questionBank[idx], ...updated };
      this.notify();
    }
  }

  public deleteQuestion(questionId: string) {
    this.state.questionBank = this.state.questionBank.filter(q => q.id !== questionId);
    // Remove from active assessment sections
    const activeAssess = this.getActiveAssessment();
    if (activeAssess) {
      activeAssess.sections.forEach(sec => {
        sec.questions = sec.questions.filter(q => q.id !== questionId);
      });
    }
    this.notify();
  }

  // Assessment Section CRUD Operations
  public addAssessmentSection(section: any) {
    const activeAssess = this.getActiveAssessment();
    if (activeAssess) {
      activeAssess.sections.push(section);
      this.notify();
    }
  }

  public updateAssessmentSection(sectionId: string, updated: any) {
    const activeAssess = this.getActiveAssessment();
    if (activeAssess) {
      const idx = activeAssess.sections.findIndex(s => s.id === sectionId);
      if (idx !== -1) {
        activeAssess.sections[idx] = { ...activeAssess.sections[idx], ...updated };
        this.notify();
      }
    }
  }

  public deleteAssessmentSection(sectionId: string) {
    const activeAssess = this.getActiveAssessment();
    if (activeAssess && activeAssess.sections.length > 1) {
      activeAssess.sections = activeAssess.sections.filter(s => s.id !== sectionId);
      this.notify();
    }
  }
}

export const store = new Store();
