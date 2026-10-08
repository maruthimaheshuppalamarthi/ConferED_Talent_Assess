export type UserRole = 'Candidate' | 'Recruiter' | 'Admin' | 'Super Admin' | 'Question Reviewer' | 'HR' | 'System Auditor';

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
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  weight: number;
}

export type QuestionType = 
  | 'mcq' 
  | 'msq' 
  | 'true_false' 
  | 'fill_blank' 
  | 'essay' 
  | 'coding' 
  | 'sql';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  content: string;
  options?: QuestionOption[];
  correctAnswers?: string[];
  sampleCode?: Record<string, string>;
  language?: string;
  testCases?: TestCase[];
  essayMinWords?: number;
  essayMaxWords?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  category: string;
  tags: string[];
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
  type: 'Tab Switch' | 'No Face Detected' | 'Multiple Faces' | 'Mobile Phone Detected' | 'Background Voice' | 'Fullscreen Exit' | 'DevTools Opened' | 'Looking Away';
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
