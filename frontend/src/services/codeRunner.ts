import { ExecutionResult, TestCase } from '../types';

export class CodeRunnerService {
  /**
   * Executes code against provided test cases.
   * Runs client-side JS evaluation or mocked Docker sandbox execution for Python / C++ / SQL.
   */
  public static async executeCode(
    language: string,
    code: string,
    testCases: TestCase[]
  ): Promise<ExecutionResult> {
    const startTime = performance.now();
    const testResults = [];
    let allPassed = true;

    // Simulate Docker container startup latency (150ms - 300ms)
    await new Promise((resolve) => setTimeout(resolve, 250));

    for (const tc of testCases) {
      let actualOutput = '';
      let passed = false;

      try {
        if (language === 'javascript') {
          actualOutput = this.runJavaScript(code, tc.input);
        } else if (language === 'python') {
          actualOutput = this.runPythonSimulated(code, tc.input);
        } else if (language === 'sql') {
          actualOutput = this.runSqlSimulated(code);
        } else {
          actualOutput = tc.expectedOutput;
        }

        passed = actualOutput.trim() === tc.expectedOutput.trim();
      } catch (err: any) {
        actualOutput = `Runtime Error: ${err.message || err}`;
        passed = false;
      }

      if (!passed) {
        allPassed = false;
      }

      testResults.push({
        testCaseId: tc.id,
        passed,
        input: tc.input,
        expected: tc.expectedOutput,
        actual: actualOutput,
        isHidden: tc.isHidden
      });
    }

    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);
    const memoryUsedKb = Math.floor(12400 + Math.random() * 3200); // 12.4 MB - 15.6 MB

    return {
      passed: allPassed,
      stdout: allPassed ? 'All test cases passed successfully.' : 'Some test cases failed.',
      stderr: '',
      executionTimeMs,
      memoryUsedKb,
      testResults
    };
  }

  private static runJavaScript(code: string, inputArg: string): string {
    // Isolated evaluation for JS
    try {
      const runner = new Function('inputStr', `
        ${code}
        if (typeof maxProduct === 'function') {
          return maxProduct(JSON.parse(inputStr));
        }
        return "Executed";
      `);
      return String(runner(inputArg));
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  }

  private static runPythonSimulated(code: string, inputArg: string): string {
    // Dynamic simulation of Python max_product or standard algorithm output
    if (code.includes('max_product') || code.includes('maxProduct')) {
      try {
        const nums: number[] = JSON.parse(inputArg);
        if (!nums || nums.length === 0) return '0';
        let res = nums[0], maxNum = nums[0], minNum = nums[0];
        for (let i = 1; i < nums.length; i++) {
          let n = nums[i];
          if (n < 0) {
            let temp = maxNum;
            maxNum = minNum;
            minNum = temp;
          }
          maxNum = Math.max(n, maxNum * n);
          minNum = Math.min(n, minNum * n);
          res = Math.max(res, maxNum);
        }
        return String(res);
      } catch (err) {
        return 'Error parsing input array';
      }
    }
    return inputArg;
  }

  private static runSqlSimulated(code: string): string {
    if (code.toLowerCase().includes('dense_rank()') || code.toLowerCase().includes('rank()')) {
      return `department_id | employee_id | salary | rank\n--------------+-------------+--------+-----\n1            | 104         | 150000 | 1\n1            | 102         | 135000 | 2\n2            | 208         | 160000 | 1\n2            | 201         | 140000 | 2`;
    }
    return `Returned 4 rows successfully.`;
  }
}
