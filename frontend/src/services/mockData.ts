import { Assessment, Candidate, CandidateResult, Question, SystemSettings } from '../types';

export const initialSettings: SystemSettings = {
  maxTabSwitches: 3,
  maxViolationsBeforeTerminate: 5,
  proctoringSensitivity: 'high',
  requireCamera: true,
  requireMicrophone: true,
  requireScreenShare: false,
  detectPhone: true,
  detectMultipleFaces: true,
  detectFaceMissing: true,
  enableFullscreenLock: true,
  otpMethod: 'both',
  linkExpirationHours: 48,
  allowSectionRevisit: false,
};

export const sampleQuestions: Question[] = [
  {
    id: 'q-mcq-1',
    type: 'mcq',
    title: 'Python Memory Management',
    content: 'Which module in Python can be used to inspect memory allocation and reference counts?',
    options: [
      { id: 'opt-1', text: 'sys' },
      { id: 'opt-2', text: 'gc' },
      { id: 'opt-3', text: 'tracemalloc' },
      { id: 'opt-4', text: 'All of the above' }
    ],
    correctAnswers: ['opt-4'],
    difficulty: 'medium',
    points: 10,
    category: 'Python',
    tags: ['Core Python', 'Memory', 'Performance']
  },
  {
    id: 'q-sql-1',
    type: 'sql',
    title: 'Employee Department Salary Ranking',
    content: 'Write an SQL query to retrieve the top 2 highest paid employees in each department using Window Functions.',
    difficulty: 'hard',
    points: 20,
    category: 'SQL Database',
    tags: ['PostgreSQL', 'Window Functions', 'Analytics'],
    sampleCode: {
      sql: `-- Write your SQL query below\nSELECT department_id, employee_id, salary\nFROM (\n  SELECT department_id, employee_id, salary,\n         DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank\n  FROM employees\n) sub\nWHERE rank <= 2;`
    }
  },
  {
    id: 'q-coding-1',
    type: 'coding',
    title: 'Two Sum Variant: Maximum Subarray Product',
    content: 'Given an integer array `nums`, find a contiguous non-empty subarray within the array that has the largest product, and return *the product*.\n\n### Example 1:\n**Input:** `nums = [2,3,-2,4]`  \n**Output:** `6`  \n**Explanation:** `[2,3]` has the largest product 6.',
    difficulty: 'medium',
    points: 25,
    category: 'Algorithms',
    tags: ['Dynamic Programming', 'Array', 'Algorithms'],
    language: 'python',
    sampleCode: {
      python: `def max_product(nums: list[int]) -> int:\n    # Write your solution here\n    if not nums:\n        return 0\n    \n    res = max_num = min_num = nums[0]\n    for i in range(1, len(nums)):\n        n = nums[i]\n        if n < 0:\n            max_num, min_num = min_num, max_num\n        max_num = max(n, max_num * n)\n        min_num = min(n, min_num * n)\n        res = max(res, max_num)\n        \n    return res\n\n# Test call\nprint(max_product([2,3,-2,4]))`,
      javascript: `function maxProduct(nums) {\n    if (!nums || nums.length === 0) return 0;\n    let res = nums[0], maxNum = nums[0], minNum = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        let n = nums[i];\n        if (n < 0) {\n            let temp = maxNum;\n            maxNum = minNum;\n            minNum = temp;\n        }\n        maxNum = Math.max(n, maxNum * n);\n        minNum = Math.min(n, minNum * n);\n        res = Math.max(res, maxNum);\n    }\n    return res;\n}\nconsole.log(maxProduct([2,3,-2,4]));`
    },
    testCases: [
      { id: 'tc-1', input: '[2,3,-2,4]', expectedOutput: '6', isHidden: false, weight: 5 },
      { id: 'tc-2', input: '[-2,0,-1]', expectedOutput: '0', isHidden: false, weight: 5 },
      { id: 'tc-3', input: '[-2,3,-4]', expectedOutput: '24', isHidden: true, weight: 10 },
      { id: 'tc-4', input: '[0, 2]', expectedOutput: '2', isHidden: true, weight: 5 }
    ]
  },
  {
    id: 'q-essay-1',
    type: 'essay',
    title: 'Microservice Architecture vs Monolith Design',
    content: 'Discuss the architectural trade-offs between a modular monolithic system and an event-driven microservices architecture. Highlight aspects of deployment complexity, data consistency (CAP theorem / Saga pattern), and operational costs.',
    essayMinWords: 150,
    essayMaxWords: 500,
    difficulty: 'hard',
    points: 20,
    category: 'System Design',
    tags: ['Architecture', 'Microservices', 'Distributed Systems']
  }
];

export const sampleAssessments: Assessment[] = [
  {
    id: 'assess-101',
    title: 'Senior Full Stack & AI Engineer Assessment',
    roleTitle: 'Senior Software Engineer',
    description: 'Comprehensive technical evaluation covering Quantitative Logic, Python/JS Algorithmic Coding, SQL Querying, and System Design Architecture.',
    totalDurationMinutes: 60,
    totalQuestions: 4,
    passingPercentage: 70,
    status: 'active',
    createdDate: '2026-07-20',
    sections: [
      {
        id: 'sec-1',
        name: 'Technical MCQs & Aptitude',
        description: 'Core concepts in Python memory, async logic, and data structures.',
        instructions: 'Select the best answer for each question. Negative marking is disabled for this section.',
        timeLimitMinutes: 10,
        passingMarks: 10,
        questions: [sampleQuestions[0]],
        isMandatory: true
      },
      {
        id: 'sec-2',
        name: 'Database & SQL Engineering',
        description: 'Complex aggregation, window functions, and schema optimization.',
        instructions: 'Write production-ready SQL queries. Test against the provided table schemas.',
        timeLimitMinutes: 15,
        passingMarks: 15,
        questions: [sampleQuestions[1]],
        isMandatory: true
      },
      {
        id: 'sec-3',
        name: 'Algorithmic Coding Challenge',
        description: 'Data Structures and Dynamic Programming problem solving.',
        instructions: 'Write efficient code. Pay attention to time complexity and edge cases.',
        timeLimitMinutes: 20,
        passingMarks: 20,
        questions: [sampleQuestions[2]],
        isMandatory: true
      },
      {
        id: 'sec-4',
        name: 'Architectural Essay',
        description: 'System design principles, microservices, and high-availability systems.',
        instructions: 'Ensure minimum word count requirement of 150 words.',
        timeLimitMinutes: 15,
        passingMarks: 15,
        questions: [sampleQuestions[3]],
        isMandatory: false
      }
    ]
  }
];

const demoLivePhoto = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 24 24' fill='%231e293b' stroke='%233b82f6' stroke-width='1.5'><rect width='24' height='24' rx='3' fill='%230f172a'/><circle cx='12' cy='9' r='4'/><path d='M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1'/></svg>";
const demoIdProof = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 24 24' fill='%230f172a' stroke='%23a855f7' stroke-width='1.5'><rect width='24' height='24' rx='3' fill='%230f172a'/><rect x='3' y='4' width='18' height='16' rx='2' fill='%231e293b'/><circle cx='8' cy='11' r='2.5'/><path d='M14 9h4m-4 4h4m-8 3h8'/></svg>";

export const sampleCandidates: Candidate[] = [
  {
    id: 'cand-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    phone: '+1-555-0192',
    experienceYears: 6,
    skills: ['Python', 'FastAPI', 'TypeScript', 'PostgreSQL', 'Docker'],
    status: 'Completed',
    assessmentId: 'assess-101',
    invitedAt: '2026-07-28',
    otpVerified: true,
    systemCheckPassed: true,
    assessmentCompleted: true,
    livePhotoUrl: demoLivePhoto,
    idProofUrl: demoIdProof,
    identityStatus: 'approved'
  },
  {
    id: 'cand-2',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91-98765-43210',
    experienceYears: 8,
    skills: ['Java', 'Spring Boot', 'Microservices', 'SQL', 'Kubernetes'],
    status: 'Under Review',
    assessmentId: 'assess-101',
    invitedAt: '2026-07-29',
    otpVerified: true,
    systemCheckPassed: true,
    assessmentCompleted: true,
    livePhotoUrl: demoLivePhoto,
    idProofUrl: demoIdProof,
    identityStatus: 'approved'
  },
  {
    id: 'cand-3',
    name: 'Marcus Vance',
    email: 'marcus.vance@example.com',
    phone: '+44-7700-900077',
    experienceYears: 4,
    skills: ['React', 'Node.js', 'GraphQL', 'Tailwind', 'MongoDB'],
    status: 'Assessment Sent',
    assessmentId: 'assess-101',
    invitedAt: '2026-07-30',
    otpVerified: false,
    systemCheckPassed: false,
    assessmentCompleted: false,
    livePhotoUrl: demoLivePhoto,
    idProofUrl: demoIdProof,
    identityStatus: 'pending_verification'
  },
  {
    id: 'cand-4',
    name: 'Sophia Chen',
    email: 'sophia.chen@example.com',
    phone: '+1-555-0144',
    experienceYears: 5,
    skills: ['Python', 'PyTorch', 'FastAPI', 'Docker', 'AWS'],
    status: 'Selected',
    assessmentId: 'assess-101',
    invitedAt: '2026-07-25',
    otpVerified: true,
    systemCheckPassed: true,
    assessmentCompleted: true,
    livePhotoUrl: demoLivePhoto,
    idProofUrl: demoIdProof,
    identityStatus: 'approved'
  }
];

export const sampleCandidateResults: Record<string, CandidateResult> = {
  'cand-1': {
    id: 'res-1',
    candidateId: 'cand-1',
    assessmentId: 'assess-101',
    completedAt: '2026-07-28T16:45:00Z',
    totalScore: 68,
    maxScore: 75,
    percentage: 90.6,
    passStatus: 'Pass',
    sectionScores: {
      'Technical MCQs & Aptitude': { score: 10, maxScore: 10, percentage: 100 },
      'Database & SQL Engineering': { score: 20, maxScore: 20, percentage: 100 },
      'Algorithmic Coding Challenge': { score: 25, maxScore: 25, percentage: 100 },
      'Architectural Essay': { score: 13, maxScore: 20, percentage: 65 }
    },
    aiConfidenceScore: 94.5,
    totalViolations: 1,
    proctoringLogs: [
      {
        id: 'viol-1',
        candidateId: 'cand-1',
        timestamp: '16:12:04',
        type: 'Tab Switch',
        severity: 'low',
        description: 'Candidate switched window for 2 seconds (Warning issued)'
      }
    ],
    recruiterNotes: 'Exceptional coding speed and SQL window function expertise. Essay demonstrates solid understanding of Saga pattern trade-offs.',
    recruiterDecision: 'Selected'
  },
  'cand-2': {
    id: 'res-2',
    candidateId: 'cand-2',
    assessmentId: 'assess-101',
    completedAt: '2026-07-29T11:20:00Z',
    totalScore: 54,
    maxScore: 75,
    percentage: 72.0,
    passStatus: 'Pass',
    sectionScores: {
      'Technical MCQs & Aptitude': { score: 10, maxScore: 10, percentage: 100 },
      'Database & SQL Engineering': { score: 15, maxScore: 20, percentage: 75 },
      'Algorithmic Coding Challenge': { score: 15, maxScore: 25, percentage: 60 },
      'Architectural Essay': { score: 14, maxScore: 20, percentage: 70 }
    },
    aiConfidenceScore: 88.0,
    totalViolations: 2,
    proctoringLogs: [
      {
        id: 'viol-2',
        candidateId: 'cand-2',
        timestamp: '11:05:12',
        type: 'Looking Away',
        severity: 'low',
        description: 'Gaze moved off-screen for 4 seconds.'
      },
      {
        id: 'viol-3',
        candidateId: 'cand-2',
        timestamp: '11:15:40',
        type: 'Background Voice',
        severity: 'medium',
        description: 'Background audio detected above threshold.'
      }
    ],
    recruiterNotes: 'Passed baseline cutoff. Requires technical interview follow-up on algorithmic edge cases.',
    recruiterDecision: 'Under Review'
  }
};
