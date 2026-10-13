/** Browser copy of an in-progress attempt. Survives refresh in this tab. */

const SNAP_KEY = 'confered.examSnapshot';

export interface CodeDraft {
  language: string;
  files: Record<string, string>;
}

export interface ExamSnapshot {
  inviteToken: string;
  savedAt: number;
  candidateId: string | null;
  assessmentId: string;
  otpVerified: boolean;
  systemCheckCompleted: boolean;
  examStarted: boolean;
  examCompleted: boolean;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  sectionEndsAtMs: number | null;
  answers: Record<string, unknown>;
  codeDrafts: Record<string, CodeDraft>;
  flagged: string[];
}

export function writeExamSnapshot(snap: ExamSnapshot): void {
  try {
    sessionStorage.setItem(SNAP_KEY, JSON.stringify(snap));
  } catch {
    /* storage full or blocked; the server copy is the fallback */
  }
}

export function readExamSnapshot(): ExamSnapshot | null {
  try {
    const raw = sessionStorage.getItem(SNAP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExamSnapshot;
    if (!parsed || typeof parsed !== 'object' || !parsed.inviteToken) return null;
    return parsed;
  } catch {
    return null;
  }
}
