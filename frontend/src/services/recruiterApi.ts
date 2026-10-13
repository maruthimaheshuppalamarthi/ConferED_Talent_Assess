import { authApi } from './authApi';
import { Assessment, Candidate, CandidateResult, Question, QuestionCategory, Section } from '../types';

/** Stage slug used in /recruiter/pipeline/stages/{slug}. */
export type PipelineStageSlug =
  | 'applied' | 'screened' | 'assessment-sent' | 'completed'
  | 'under-review' | 'selected' | 'rejected';

export const STAGE_SLUGS: { status: Candidate['status']; slug: PipelineStageSlug; countKey: keyof PipelineCounts }[] = [
  { status: 'Applied', slug: 'applied', countKey: 'applied' },
  { status: 'Screened', slug: 'screened', countKey: 'screened' },
  { status: 'Assessment Sent', slug: 'assessment-sent', countKey: 'assessmentSent' },
  { status: 'Completed', slug: 'completed', countKey: 'completed' },
  { status: 'Under Review', slug: 'under-review', countKey: 'underReview' },
  { status: 'Selected', slug: 'selected', countKey: 'selected' },
  { status: 'Rejected', slug: 'rejected', countKey: 'rejected' },
];

export interface PipelineCounts {
  all: number;
  applied: number;
  screened: number;
  assessmentSent: number;
  completed: number;
  underReview: number;
  selected: number;
  rejected: number;
}

/** Excel-sheet row returned by pipeline endpoints. */
export interface CandidateRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  experienceYears: number;
  skills: string[];
  status: Candidate['status'];
  assessmentId: string;
  invitedAt: string;
  otpVerified: boolean;
  systemCheckPassed: boolean;
  assessmentCompleted: boolean;
  livePhotoUrl?: string | null;
  idProofUrl?: string | null;
  idDocumentType?: string | null;
  identityStatus?: string | null;
  organization?: string | null;
  roleTitle?: string | null;
  source?: string | null;
  totalScore: number | null;
  maxScore: number | null;
  percentage: number | null;
  passStatus: 'Pass' | 'Fail' | null;
  mcq: string | null;
  sql: string | null;
  coding: string | null;
  essay: string | null;
  violations: number;
  sectionScores?: CandidateResult['sectionScores'] | null;
  result?: CandidateResult | null;
  paper?: {
    id?: string;
    name: string;
    questions: {
      id?: string;
      number: number;
      title: string;
      content?: string;
      points?: number;
      explanation?: string;
      difficulty?: string;
      type: string;
      options: { id?: string; text: string; correct: boolean }[];
      candidateAnswer?: any;
      correctAnswers?: string[];
      sampleCode?: any;
      language?: string;
      testCases?: any;
    }[];
  }[] | null;
}

export interface PipelineResponse {
  items: CandidateRow[];
  total: number;
  counts: PipelineCounts;
  stage?: string;
  slug?: string;
}

const get = <T>(path: string) => authApi.fetchJson<T>(path, 'GET');
const post = <T>(path: string, body?: unknown) => authApi.fetchJson<T>(path, 'POST', body);
const put = <T>(path: string, body: unknown) => authApi.fetchJson<T>(path, 'PUT', body);
const patch = <T>(path: string, body: unknown) => authApi.fetchJson<T>(path, 'PATCH', body);
const del = (path: string) => authApi.fetchJson<void>(path, 'DELETE');

export interface BulkInviteRow {
  id: string;
  rowNumber: number;
  name: string;
  email: string;
  registrationNumber?: string | null;
  organization?: string | null;
  roleTitle?: string | null;
  phone?: string | null;
  validationErrors: string[];
  dedupeReason?: string | null;
  action: string;
  deliveryStatus: string;
  errorMessage?: string | null;
  inviteId?: string | null;
  candidateId?: string | null;
  sentAt?: string | null;
}

export interface BulkInviteBatch {
  batchId: string;
  assessmentId: string;
  filename: string;
  status: string;
  forceResend?: boolean;
  expiresInHours?: number;
  totalRows: number;
  validRows: number;
  duplicateInFile: number;
  duplicateInDb: number;
  queued?: number;
  sent?: number;
  failed?: number;
  skipped: number;
  createdAt?: string | null;
  completedAt?: string | null;
  rows: BulkInviteRow[];
}

export interface JobRoleItem {
  id: string;
  name: string;
  description?: string | null;
  sortOrder: number;
}

export type JobStatus = 'draft' | 'open' | 'closed';

/** A hiring job. Each job owns one exam (assessmentId). */
export interface JobItem {
  id: string;
  title: string;
  description: string;
  status: JobStatus;
  assessmentId: string;
  sectionCount: number;
  totalDurationMinutes?: number;
  scheduledDate?: string | null;
  startTime?: string | null;
  createdAt?: string | null;
}

export interface BulkQuestionImportResult {
  filename: string;
  totalRows: number;
  created: number;
  failed: number;
  items: { rowNumber: number; id: string; title: string; type: string; jobRole?: string | null }[];
  errors: { rowNumber: number; title: string; errors: string[] }[];
}

export const recruiterApi = {
  pipeline: (jobId?: string) => {
    const qs = jobId ? `?job_id=${encodeURIComponent(jobId)}` : '';
    return get<PipelineResponse>(`/recruiter/pipeline${qs}`);
  },
  pipelineStage: (slug: PipelineStageSlug, jobId?: string) => {
    const qs = jobId ? `?job_id=${encodeURIComponent(jobId)}` : '';
    return get<PipelineResponse>(`/recruiter/pipeline/stages/${slug}${qs}`);
  },

  candidate: (id: string) => get<CandidateRow>(`/recruiter/candidates/${id}`),
  setDecision: (id: string, decision: CandidateResult['recruiterDecision'], notes: string) =>
    patch<CandidateRow>(`/recruiter/candidates/${id}/decision`, { decision, notes }),

  jobs: () => get<{ items: JobItem[]; total: number }>('/recruiter/jobs'),
  job: (id: string) => get<JobItem>(`/recruiter/jobs/${id}`),
  createJob: (body: { title: string; description?: string; status?: JobStatus; totalDurationMinutes?: number; scheduledDate?: string; startTime?: string }) =>
    post<JobItem>('/recruiter/jobs', body),
  updateJob: (id: string, body: { title?: string; description?: string; status?: JobStatus; totalDurationMinutes?: number; scheduledDate?: string; startTime?: string }) =>
    patch<JobItem>(`/recruiter/jobs/${id}`, body),
  deleteJob: (id: string) => del(`/recruiter/jobs/${id}`),
  jobCategories: (jobId: string) =>
    get<{ items: QuestionCategory[] }>(`/recruiter/jobs/${jobId}/categories`),
  createJobCategory: (jobId: string, label: string) =>
    post<QuestionCategory>(`/recruiter/jobs/${jobId}/categories`, { label }),
  createCategory: (label: string) =>
    post<QuestionCategory>('/recruiter/question-categories', { label }),
  createJobSection: (jobId: string, body: { name: string; instructions?: string; timeLimitMinutes?: number; passingMarks?: number }) =>
    post<Section>(`/recruiter/jobs/${jobId}/sections`, body),
  deleteJobCategory: (jobId: string, categoryId: string) =>
    del(`/recruiter/jobs/${jobId}/categories/${categoryId}`),
  jobQuestions: (jobId: string, params?: { category?: string; type?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.type) qs.set('type', params.type);
    const suffix = qs.toString() ? `?${qs}` : '';
    return get<{ items: Question[]; total: number }>(`/recruiter/jobs/${jobId}/questions${suffix}`);
  },
  createJobQuestion: (jobId: string, body: Partial<Question> & { type: string; title: string }) =>
    post<Question>(`/recruiter/jobs/${jobId}/questions`, body),

  assessments: () => get<{ items: Assessment[]; total: number }>('/recruiter/assessments'),
  assessment: (id: string) => get<Assessment>(`/recruiter/assessments/${id}`),
  createAssessment: (body: Partial<Assessment> & { title: string }) =>
    post<Assessment>('/recruiter/assessments', body),
  updateAssessment: (id: string, body: Partial<Assessment>) =>
    patch<Assessment>(`/recruiter/assessments/${id}`, body),
  deleteAssessment: (id: string) => del(`/recruiter/assessments/${id}`),

  questions: (params?: { category?: string; type?: string; difficulty?: string; q?: string; jobRole?: string; jobId?: string; scope?: 'all' }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.type) qs.set('type', params.type);
    if (params?.difficulty) qs.set('difficulty', params.difficulty);
    if (params?.q) qs.set('q', params.q);
    if (params?.jobRole) qs.set('jobRole', params.jobRole);
    if (params?.jobId) qs.set('jobId', params.jobId);
    if (params?.scope) qs.set('scope', params.scope);
    const suffix = qs.toString() ? `?${qs}` : '';
    return get<{ items: Question[]; total: number }>(`/recruiter/questions${suffix}`);
  },
  questionCategories: () => get<{ items: QuestionCategory[] }>('/recruiter/question-categories'),
  jobRoles: () => get<{ items: JobRoleItem[]; names: string[] }>('/recruiter/job-roles'),
  createJobRole: (body: { name: string; description?: string }) =>
    post<JobRoleItem>('/recruiter/job-roles', body),
  deleteJobRole: (id: string) => del(`/recruiter/job-roles/${id}`),

  questionBanks: () => get<{ items: Array<{ id: string; name: string; description: string; jobId?: string | null; jobTitle?: string | null; badgeTone?: string; createdAt?: string; isDefault?: boolean }> }>('/recruiter/question-banks'),
  createQuestionBank: (body: { name: string; description?: string; jobId?: string | null; jobTitle?: string | null; badgeTone?: string }) =>
    post<{ id: string; name: string; description: string; jobId?: string | null; jobTitle?: string | null; badgeTone?: string; createdAt?: string; isDefault?: boolean }>('/recruiter/question-banks', body),
  updateQuestionBank: (id: string, body: { name?: string; description?: string; jobId?: string | null; jobTitle?: string | null; badgeTone?: string }) =>
    put<{ id: string; name: string; description: string; jobId?: string | null; jobTitle?: string | null; badgeTone?: string; createdAt?: string; isDefault?: boolean }>(`/recruiter/question-banks/${id}`, body),
  deleteQuestionBank: (id: string) => del(`/recruiter/question-banks/${id}`),

  question: (id: string) => get<Question>(`/recruiter/questions/${id}`),
  createQuestion: (body: Partial<Question> & { type: string; title: string }) =>
    post<Question>('/recruiter/questions', body),
  updateQuestion: (id: string, body: Partial<Question>) =>
    patch<Question>(`/recruiter/questions/${id}`, body),
  deleteQuestion: (id: string) => del(`/recruiter/questions/${id}`),
  bulkImportQuestions: async (file: File, jobId?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (jobId) form.append('jobId', jobId);
    return authApi.uploadForm<BulkQuestionImportResult>(
      '/recruiter/questions/bulk/import',
      form,
    );
  },
  downloadQuestionSample: () => {
    const csv = [
      'Question,Section,Category,Content,Difficulty,Points,Options,CorrectAnswer,Job',
      'What is 2+2?,Quantitative Aptitude,MCQ,Select the correct sum,easy,5,3|4|5|6,2,',
      'Which figure comes next?,Logical Reasoning,MCQ,Choose the next figure in the series,medium,5,Circle|Square|Triangle,2,',
      'Choose the correct sentence,English,MCQ,Pick the grammatically correct sentence,easy,5,He go home|He goes home|He going home,2,',
      'What does JVM stand for?,Technical,MCQ,Choose the right expansion,easy,5,Java Virtual Machine|Java Variable Method|Just Virtual Memory,1,',
      'Reverse a string,Technical,Coding,Write a function that returns the reversed string,medium,20,,,',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_bank_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  },

  updateSection: (assessmentId: string, sectionId: string, body: Partial<Section> & Record<string, unknown>) =>
    put<Section>(`/recruiter/assessments/${assessmentId}/sections/${sectionId}`, body),
  eligibleQuestions: (assessmentId: string, sectionId: string, q?: string) => {
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    return get<{ items: Question[]; total: number }>(
      `/recruiter/assessments/${assessmentId}/sections/${sectionId}/eligible-questions${qs}`,
    );
  },
  attachSectionQuestions: (assessmentId: string, sectionId: string, questionIds: string[]) =>
    post<Section>(`/recruiter/assessments/${assessmentId}/sections/${sectionId}/questions`, { questionIds }),

  bulkPreview: async (assessmentId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return authApi.uploadForm<BulkInviteBatch>(
      `/recruiter/assessments/${assessmentId}/invites/bulk/preview`,
      form,
    );
  },
  bulkConfirm: (batchId: string, body: { forceResend?: boolean; expiresInHours?: number }) =>
    post<BulkInviteBatch>(`/recruiter/invites/batches/${batchId}/confirm`, body),
  bulkStatus: (batchId: string) => get<BulkInviteBatch>(`/recruiter/invites/batches/${batchId}`),
  bulkRetryFailed: (batchId: string) =>
    post<BulkInviteBatch>(`/recruiter/invites/batches/${batchId}/retry-failed`),
};
