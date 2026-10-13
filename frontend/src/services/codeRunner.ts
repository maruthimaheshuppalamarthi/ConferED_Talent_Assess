import { authApi } from './authApi';
import { ExecutionResult } from '../types';

export class CodeRunnerService {
  /**
   * Compiles and runs the program on the server with the question's real test cases.
   * Hidden cases come back as pass/fail only.
   */
  public static executeCode(language: string, code: string, questionId: string): Promise<ExecutionResult> {
    return authApi.fetchJson<ExecutionResult>('/candidate/run', 'POST', {
      questionId,
      language,
      code,
    }, 'candidate');
  }
}
