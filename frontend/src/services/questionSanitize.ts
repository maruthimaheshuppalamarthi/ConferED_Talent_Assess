import { Question, TestCase } from '../types';

/** Strip answer keys / hidden expected outputs before showing questions to a candidate. */
export function sanitizeQuestionForCandidate(q: Question): Question {
  const options = (q.options || []).map(o => ({
    id: o.id,
    text: o.text,
    // never forward isCorrect
  }));
  const testCases: TestCase[] = (q.testCases || []).map(tc => {
    if (tc.isHidden) {
      return { id: tc.id, input: '', expectedOutput: '', isHidden: true, weight: tc.weight };
    }
    return { ...tc };
  });
  const { correctAnswers: _c, rubric: _r, ...rest } = q as Question & { rubric?: string };
  return {
    ...rest,
    options,
    testCases,
    correctAnswers: undefined,
  };
}

export function sanitizeAssessmentQuestions<T extends { sections?: { questions: Question[] }[] }>(assessment: T): T {
  if (!assessment?.sections) return assessment;
  return {
    ...assessment,
    sections: assessment.sections.map(sec => ({
      ...sec,
      questions: (sec.questions || []).map(sanitizeQuestionForCandidate),
    })),
  };
}
