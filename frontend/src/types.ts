/** Account roles. Staff roles are assigned by a System Admin; each has its own portal. */
export type UserRole = 'Candidate' | 'System Admin' | 'Recruiter' | 'Proctor';
export type StaffRole = Exclude<UserRole, 'Candidate'>;

/** The three staff portals (URL: /admin, /recruiter, /proctor). */
export type Portal = 'admin' | 'recruiter' | 'proctor';

export interface LiveCandidate {
  candidateId: string;
  name: string;
  role: string;
  sectionName: string;
  timeRemaining: string;
  violations: number;
  status: 'normal' | 'warning';
  lastEvent: string;
}

export interface SystemSettings {
  maxTabSwitches: number;
  maxViolationsBeforeTerminate: number;
  proctoringSensitivity: 'low' | 'medium' | 'high';
  requireCamera: boolean;
  requireMicrophone: boolean;
  requireScreenShare: boolean;
  detectPhone: boolean;
  detectMultipleFaces: boolean;
  detectFaceMissing: boolean;
  enableFullscreenLock: boolean;
  otpMethod: 'email' | 'phone' | 'both';
  linkExpirationHours: number;
  allowSectionRevisit: boolean;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface TestCase {
  id: string;
  /** Joined stdin, kept so older readers still see one block. */
  input: string;
  /** Separate values for this case. Each one is one line of stdin, in order. */
  inputs?: string[];
  expectedOutput: string;
  isHidden: boolean;
  weight: number;
}

/** Locked code the candidate must write between. Empty sides mean that side is absent. */
export interface LanguageStarter {
  before: string;
  after: string;
}

export type QuestionType =
  | 'mcq'
  | 'msq'
  | 'true_false'
  | 'fill_blank'
  | 'essay'
  | 'coding'
  | 'sql'
  | 'drag_drop';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  content: string;
  options?: QuestionOption[];
  correctAnswers?: string[];
  sampleCode?: Record<string, string | LanguageStarter>;
  language?: string;
  /** Recruiter-only solution note. Never shown on the candidate exam. */
  explanation?: string;
  testCases?: TestCase[];
  essayMinWords?: number;
  essayMaxWords?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  category: string;
  sectionCategory?: string;
  jobRole?: string | null;
  /** Set when the question belongs to one job's bank. Empty for the company library. */
  jobId?: string | null;
  selectionMode?: 'single' | 'multi';
  stemFormat?: 'plain' | 'markdown';
  codingMeta?: Record<string, unknown>;
  constraints?: string;
  ioFormat?: string;
  timeLimitMs?: number;
  memoryLimitKb?: number;
  rubric?: string;
  status?: 'draft' | 'published';
  tags: string[];
}

export interface QuestionCategory {
  id: string;
  label: string;
  allowedTypes: string[];
  sortOrder: number;
  jobId?: string | null;
}

export interface Section {
  id: string;
  name: string;
  description: string;
  instructions: string;
  timeLimitMinutes: number;
  passingMarks: number;
  questions: Question[];
  isMandatory: boolean;
  randomizeQuestions?: boolean;
  allowedTypes?: string[];
  allowedCategories?: string[];
  poolSize?: number;
  pickCount?: number | null;
  jobRole?: string | null;
}

export interface Assessment {
  id: string;
  title: string;
  roleTitle: string;
  description: string;
  totalDurationMinutes: number;
  totalQuestions: number;
  passingPercentage: number;
  sections: Section[];
  createdDate: string;
  status: 'active' | 'draft' | 'archived';
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  experienceYears: number;
  skills: string[];
  status: 'Applied' | 'Screened' | 'Assessment Sent' | 'Completed' | 'Under Review' | 'Selected' | 'Rejected';
  assessmentId: string;
  invitedAt: string;
  otpVerified: boolean;
  systemCheckPassed: boolean;
  assessmentCompleted: boolean;
  livePhotoUrl?: string;
  idProofUrl?: string;
  identityStatus?: 'pending_verification' | 'approved' | 'rejected';
}

export interface ProctoringViolation {
  id: string;
  candidateId: string;
  timestamp: string;
  type: 'Tab Switch' | 'No Face Detected' | 'Multiple Faces' | 'Mobile Phone Detected' | 'Object Detected' | 'Background Voice' | 'Fullscreen Exit' | 'DevTools Opened' | 'Looking Away';
  severity: 'low' | 'medium' | 'high';
  snapshotUrl?: string;
  description: string;
}

export interface ExecutionResult {
  passed: boolean;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  memoryUsedKb: number;
  testResults: {
    testCaseId: string;
    passed: boolean;
    input: string;
    inputs?: string[];
    expected: string;
    actual: string;
    isHidden: boolean;
  }[];
}

export interface CandidateResult {
  id: string;
  candidateId: string;
  assessmentId: string;
  completedAt: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passStatus: 'Pass' | 'Fail';
  sectionScores: Record<string, { score: number; maxScore: number; percentage: number }>;
  aiConfidenceScore: number;
  totalViolations: number;
  proctoringLogs: ProctoringViolation[];
  recruiterNotes: string;
  recruiterDecision: 'Selected' | 'Rejected' | 'Shortlisted' | 'Under Review';
}
