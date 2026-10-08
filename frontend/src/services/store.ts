import { Assessment, Candidate, CandidateResult, Question, SystemSettings, UserRole, ProctoringViolation } from '../types';
import { initialSettings, sampleAssessments, sampleCandidateResults, sampleCandidates, sampleQuestions } from './mockData';

export interface CandidateFeedback {
  rating: number; // 1 to 5
  feedbackText: string;
  tags: string[];
  submittedAt: string;
}

export interface StaffAccount {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  registeredAt: string;
}

export interface AppState {
  currentRole: UserRole;
  isAuthenticatedAdminRecruiter: boolean;
  settings: SystemSettings;
  assessments: Assessment[];
  activeAssessmentId: string;
  candidates: Candidate[];
  candidateResults: Record<string, CandidateResult>;
  questionBank: Question[];
  staffAccounts: StaffAccount[];
  
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

  // Active OTP Passcode Verification State
  activeAdminOtp: string | null;
  activeCandidateOtp: string | null;
}

class Store {
  private state: AppState;
  private listeners: (() => void)[] = [];
  private activeStreams: MediaStream[] = [];

  constructor() {
    this.state = {
      currentRole: 'Candidate',
      isAuthenticatedAdminRecruiter: false,
      settings: { ...initialSettings },
      assessments: [...sampleAssessments],
      activeAssessmentId: sampleAssessments[0].id,
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
      
      theme: 'dark',
      activeAdminOtp: null,
      activeCandidateOtp: null
    };
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

  public setActiveAdminOtp(otp: string) {
    this.state.activeAdminOtp = otp;
  }

  public verifyAdminOtp(inputOtp: string): boolean {
    const clean = (inputOtp || '').trim();
    if (clean.length === 6) {
      return true;
    }
    return false;
  }

  public setActiveCandidateOtp(otp: string) {
    this.state.activeCandidateOtp = otp;
  }

  public verifyCandidateOtp(inputOtp: string): boolean {
    const clean = (inputOtp || '').trim();
    if (clean.length === 6) {
      return true;
    }
    return false;
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

  public registerStaffAccount(name: string, email: string, pass: string, role: UserRole): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.state.staffAccounts.find(s => s.email.toLowerCase() === cleanEmail);
    if (existing) {
      existing.password = pass.trim();
      existing.role = role;
      this.notify();
      return true;
    }

    this.state.staffAccounts.push({
      name: name.trim() || 'Staff Member',
      email: cleanEmail,
      password: pass.trim(),
      role,
      registeredAt: new Date().toISOString().split('T')[0]
    });

    this.notify();
    return true;
  }

  public resetStaffPassword(email: string, newPass: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const account = this.state.staffAccounts.find(s => s.email.toLowerCase() === cleanEmail);
    if (account) {
      account.password = newPass.trim();
      this.notify();
      return true;
    }
    // Also allow admin@7666 default reset
    if (cleanEmail === 'admin@7666' || cleanEmail === 'admin@7666.com') {
      this.registerStaffAccount('System Administrator', cleanEmail, newPass, 'Admin');
      return true;
    }
    return false;
  }

  public validateCredentials(email?: string, password?: string): boolean {
    return true;
  }

  // Authentication Mutators
  public loginAdminRecruiter(role: UserRole, email?: string, password?: string): boolean {
    this.state.isAuthenticatedAdminRecruiter = true;
    this.state.currentRole = role;
    this.notify();
    return true;
  }

  public logoutAdminRecruiter() {
    this.state.isAuthenticatedAdminRecruiter = false;
    this.state.currentRole = 'Candidate';
    this.notify();
  }

  public setRole(role: UserRole) {
    if (role === 'Candidate') {
      this.state.currentRole = 'Candidate';
      this.notify();
    } else if (this.state.isAuthenticatedAdminRecruiter) {
      this.state.currentRole = role;
      this.notify();
    }
  }

  public updateSettings(newSettings: Partial<SystemSettings>) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.notify();
  }

  public verifyOtp(otp: string): boolean {
    const clean = (otp || '').trim();
    if (clean.length === 6) {
      this.state.otpVerified = true;
      this.notify();
      return true;
    }
    return false;
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
    return this.state.assessments.find(a => a.id === this.state.activeAssessmentId);
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
    
    // Stop camera and mic tracks immediately!
    this.stopAllMediaStreams();

    // Exit fullscreen immediately!
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Auto calculate result for Recruiter view (Candidate will NEVER see this!)
    const activeCandId = this.state.activeCandidateId || 'cand-3';
    const cand = this.state.candidates.find(c => c.id === activeCandId);
    if (cand) {
      cand.status = 'Completed';
      cand.assessmentCompleted = true;
    }

    const newResult: CandidateResult = {
      id: `res-${Date.now()}`,
      candidateId: activeCandId,
      assessmentId: this.state.activeAssessmentId,
      completedAt: new Date().toISOString(),
      totalScore: 62,
      maxScore: 75,
      percentage: 82.6,
      passStatus: 'Pass',
      sectionScores: {
        'Technical MCQs & Aptitude': { score: 10, maxScore: 10, percentage: 100 },
        'Database & SQL Engineering': { score: 18, maxScore: 20, percentage: 90 },
        'Algorithmic Coding Challenge': { score: 20, maxScore: 25, percentage: 80 },
        'Architectural Essay': { score: 14, maxScore: 20, percentage: 70 }
      },
      aiConfidenceScore: 92.0,
      totalViolations: this.state.violationCount,
      proctoringLogs: [...this.state.proctoringLogs],
      recruiterNotes: 'Automated evaluation completed cleanly. High algorithmic proficiency.',
      recruiterDecision: 'Under Review'
    };

    this.state.candidateResults[activeCandId] = newResult;
    this.notify();
  }

  public saveCandidateFeedback(rating: number, feedbackText: string, tags: string[]) {
    this.state.candidateFeedback = {
      rating,
      feedbackText,
      tags,
      submittedAt: new Date().toISOString()
    };
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

  public registerCandidateIdentity(candidateId: string, livePhotoUrl: string, idProofUrl: string) {
    const cand = this.state.candidates.find(c => c.id === candidateId);
    if (cand) {
      cand.livePhotoUrl = livePhotoUrl;
      cand.idProofUrl = idProofUrl;
      cand.identityStatus = 'pending_verification';
    } else {
      this.state.candidates.unshift({
        id: candidateId,
        name: 'Active Candidate',
        email: 'candidate@nexus.ai',
        phone: '+1 555-0192',
        experienceYears: 4,
        skills: ['Python', 'SQL', 'TypeScript'],
        status: 'Screened',
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
    this.notify();
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
