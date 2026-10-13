import { describe, it, expect } from 'vitest';
import { sanitizeQuestionForCandidate, sanitizeAssessmentQuestions } from '../services/questionSanitize';
import { Question } from '../types';

describe('questionSanitize', () => {
  it('strips isCorrect flags from MCQ options', () => {
    const rawQuestion: Question = {
      id: 'q-mcq-1',
      title: 'Python Complexity',
      content: 'What is average case lookup in dict?',
      type: 'mcq',
      difficulty: 'easy',
      category: 'programming',
      tags: ['python', 'ds'],
      points: 5,
      options: [
        { id: 'opt-1', text: 'O(1)', isCorrect: true },
        { id: 'opt-2', text: 'O(n)', isCorrect: false },
        { id: 'opt-3', text: 'O(log n)', isCorrect: false },
      ],
      correctAnswers: ['opt-1'],
      explanation: 'Dicts are hash tables.',
    };

    const sanitized = sanitizeQuestionForCandidate(rawQuestion);

    expect(sanitized.options).toHaveLength(3);
    sanitized.options?.forEach((opt) => {
      expect(opt.isCorrect).toBeUndefined();
    });
    expect(sanitized.correctAnswers).toBeUndefined();
    expect(sanitized.explanation).toBeUndefined();
  });

  it('masks inputs and expectedOutputs for hidden test cases while preserving visible ones', () => {
    const rawCodingQuestion: Question = {
      id: 'q-code-1',
      title: 'Two Sum',
      content: 'Find two indices summing to target',
      type: 'coding',
      difficulty: 'medium',
      category: 'algorithms',
      tags: ['arrays'],
      points: 20,
      testCases: [
        {
          id: 'tc-vis-1',
          input: '[2,7,11,15], 9',
          inputs: ['[2,7,11,15]', '9'],
          expectedOutput: '[0,1]',
          isHidden: false,
          weight: 10,
        },
        {
          id: 'tc-hidden-1',
          input: '[3,2,4], 6',
          inputs: ['[3,2,4]', '6'],
          expectedOutput: '[1,2]',
          isHidden: true,
          weight: 10,
        },
      ],
    };

    const sanitized = sanitizeQuestionForCandidate(rawCodingQuestion);

    expect(sanitized.testCases).toHaveLength(2);
    // Visible test case retains full details
    expect(sanitized.testCases?.[0].input).toBe('[2,7,11,15], 9');
    expect(sanitized.testCases?.[0].expectedOutput).toBe('[0,1]');
    expect(sanitized.testCases?.[0].isHidden).toBe(false);

    // Hidden test case must be stripped clean
    expect(sanitized.testCases?.[1].input).toBe('');
    expect(sanitized.testCases?.[1].inputs).toEqual([]);
    expect(sanitized.testCases?.[1].expectedOutput).toBe('');
    expect(sanitized.testCases?.[1].isHidden).toBe(true);
  });

  it('sanitizes questions across all sections of an assessment recursively', () => {
    const q1: Question = {
      id: 'q-1',
      title: 'Binary Tree',
      content: 'Tree balance check',
      type: 'mcq',
      difficulty: 'easy',
      category: 'programming',
      tags: ['trees'],
      points: 5,
      options: [
        { id: 'o-1', text: 'Tree is balanced', isCorrect: true },
        { id: 'o-2', text: 'Tree is skewed', isCorrect: false },
      ],
      correctAnswers: ['o-1'],
    };

    const q2: Question = {
      id: 'q-2',
      title: 'Fibonacci Stream',
      content: 'Compute nth fibonacci',
      type: 'coding',
      difficulty: 'hard',
      category: 'algorithms',
      tags: ['recursion'],
      points: 15,
      testCases: [
        {
          id: 'tc-secret',
          input: 'n=100',
          inputs: ['100'],
          expectedOutput: '354224848179261915075',
          isHidden: true,
          weight: 15,
        },
      ],
    };

    const rawAssessment = {
      id: 'assess-101',
      title: 'Senior Fullstack Assessment',
      sections: [
        {
          id: 'sec-1',
          name: 'Computer Science Fundamentals',
          questions: [q1],
        },
        {
          id: 'sec-2',
          name: 'Live Coding Challenge',
          questions: [q2],
        },
      ],
    };

    const sanitized = sanitizeAssessmentQuestions(rawAssessment);

    const firstSecQuestions = sanitized.sections?.[0]?.questions;
    expect(firstSecQuestions).toBeDefined();
    expect(firstSecQuestions?.[0]?.options?.[0]?.isCorrect).toBeUndefined();
    expect(firstSecQuestions?.[0]?.correctAnswers).toBeUndefined();

    const secondSecQuestions = sanitized.sections?.[1]?.questions;
    expect(secondSecQuestions).toBeDefined();
    expect(secondSecQuestions?.[0]?.testCases?.[0]?.input).toBe('');
    expect(secondSecQuestions?.[0]?.testCases?.[0]?.expectedOutput).toBe('');
  });
});
