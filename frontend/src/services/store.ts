import { Assessment, Candidate, CandidateResult, LiveCandidate, Portal, Question, SystemSettings, ProctoringViolation } from '../types';
import { initialSettings, sampleAssessments, sampleCandidateResults, sampleCandidates, sampleLiveCandidates, sampleQuestions } from './mockData';
import { authApi, AuthUser, CandidateSession } from './authApi';
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
  currentSectionIndex: number;
  currentQuestionIndex: number;
  sectionTimeRemainingSeconds: number;
  candidateAnswers: Record<string, any>; // questionId -> answer
  codeSubmissions: Record<string, { code: string; language: string; executionTimeMs?: number; passedCount?: number; totalCount?: number }>;
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
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      sectionTimeRemainingSeconds: 600,
      candidateAnswers: {},
      codeSubmissions: {},
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
    if (this.state.assessments.some(a => a.id === session.candidate.assessmentId)) {
      this.state.activeAssessmentId = session.candidate.assessmentId;
    }
    this.state.otpVerified = true;
    this.notify();
    void this.loadPolicy('candidate');
    void this.loadCandidateAssessment(session.candidate.assessmentId);
  }

  /** Load sanitized assessment from API (no correct answers). Falls back to local sanitized mock. */
  public async loadCandidateAssessment(assessmentId: string) {
    try {
      const data = await authApi.fetchJson<Assessment>('/candidate/assessment', 'GET', undefined, 'candidate');
      const sanitized = sanitizeAssessmentQuestions(data);
      const idx = this.state.assessments.findIndex(a => a.id === sanitized.id || a.id === assessmentId);
      if (idx >= 0) this.state.assessments[idx] = sanitized;
      else this.state.assessments.unshift(sanitized);
      this.state.activeAssessmentId = sanitized.id;
      this.notify();
    } catch {
      // Offline / API miss: still strip keys from any local copy before the exam UI runs.
      this.state.assessments = this.state.assessments.map(a =>
        a.id === assessmentId || a.id === this.state.activeAssessmentId
          ? sanitizeAssessmentQuestions(a)
          : a,
      );
      this.notify();
    }
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
    this.state.examStarted = true;
    this.state.examCompleted = false;
    const currentSection = this.getActiveAssessment()?.sections[0];
    if (currentSection) {
      this.state.sectionTimeRemainingSeconds = currentSection.timeLimitMinutes * 60;
    }
    this.notify();
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
    if (shouldNotify) {
      this.notify();
    }
  }

  public setCodeSubmission(questionId: string, submission: { code: string; language: string; executionTimeMs?: number; passedCount?: number; totalCount?: number }) {
    this.state.codeSubmissions[questionId] = submission;
    this.notify();
  }

  public toggleFlagQuestion(questionId: string) {
    if (this.state.flaggedQuestions.has(questionId)) {
      this.state.flaggedQuestions.delete(questionId);
    } else {
      this.state.flaggedQuestions.add(questionId);
    }
    this.notify();
  }

  public nextQuestion() {
    const section = this.getActiveAssessment()?.sections[this.state.currentSectionIndex];
    if (section && this.state.currentQuestionIndex < section.questions.length - 1) {
      this.state.currentQuestionIndex++;
      this.notify();
    }
  }

  public prevQuestion() {
    if (this.state.currentQuestionIndex > 0) {
      this.state.currentQuestionIndex--;
      this.notify();
    }
  }

  public nextSection() {
    const assessment = this.getActiveAssessment();
    if (assessment && this.state.currentSectionIndex < assessment.sections.length - 1) {
      this.state.currentSectionIndex++;
      this.state.currentQuestionIndex = 0;
      const newSection = assessment.sections[this.state.currentSectionIndex];
      this.state.sectionTimeRemainingSeconds = newSection.timeLimitMinutes * 60;
      this.notify();
    } else {
      this.submitAssessment();
    }
  }

  public submitAssessment() {
    this.state.examStarted = false;
    this.state.examCompleted = true;

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

    // Server grades objective items; candidate UI never receives scores/keys.
    void authApi.fetchJson('/candidate/submit', 'POST', {
      answers: this.state.candidateAnswers,
    }, 'candidate').catch(() => null);

    this.notify();
  }

  public async saveCandidateFeedback(rating: number, feedbackText: string) {
    await authApi.fetchJson('/candidate/feedback', 'POST', {
      rating,
      comment: feedbackText,
    }, 'candidate');
    this.state.candidateFeedback = {
      rating,
      feedbackText,
      tags: [],
      submittedAt: new Date().toISOString()
    };
    const { candidateAssist } = await import('./candidateAssist');
    candidateAssist.reportFinished();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    this.notify();
  }

  public logProctoringViolation(type: ProctoringViolation['type'], description: string, severity: 'low' | 'medium' | 'high' = 'medium') {
    this.state.violationCount++;
    const violation: ProctoringViolation = {
      id: `viol-${Date.now()}`,
      candidateId: this.state.activeCandidateId || 'cand-3',
      timestamp: new Date().toLocaleTimeString(),
      type,
      severity,
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

    if (this.state.violationCount >= this.state.settings.maxViolationsBeforeTerminate) {
      this.state.liveProctoringAlert = `EXAM TERMINATED: Violation limit exceeded (${this.state.violationCount}/${this.state.settings.maxViolationsBeforeTerminate})`;
      setTimeout(() => {
        this.submitAssessment();
      }, 3000);
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
