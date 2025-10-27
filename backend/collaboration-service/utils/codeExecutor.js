const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Code Executor Utility
 * Executes user code and runs test cases
 *
 * WARNING: This is a simple implementation for development.
 * For production, use a proper sandboxed execution environment.
 */

class CodeExecutor {
  /**
   * Execute code for a specific language
   * @param {string} code - The user's code
   * @param {string} language - Programming language
   * @param {Array} testCases - Test cases to run
   * @returns {Promise<Object>} Execution results
   */
  async execute(code, language, testCases) {
    try {
      const results = {
        success: false,
        passed: 0,
        failed: 0,
        total: testCases.length,
        testResults: [],
        output: '',
        error: null,
      };

      // Parse test cases based on question type
      const parsedTestCases = this.parseTestCases(testCases);

      switch (language) {
        case 'python':
          return await this.executePython(code, parsedTestCases);
        case 'java':
          return await this.executeJava(code, parsedTestCases);
        case 'cpp':
        case 'c++':
          return await this.executeCpp(code, parsedTestCases);
        case 'javascript':
        case 'js':
          return await this.executeJavaScript(code, parsedTestCases);
        default:
          return {
            success: false,
            error: `Language "${language}" is not supported yet`,
          };
      }
    } catch (error) {
      console.error('Code execution error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Parse test cases into structured format
   */
  parseTestCases(testCases) {
    return testCases.map((tc) => {
      // For Two Sum problem
      if (tc.nums && tc.target !== undefined) {
        // Legacy format with separate nums and target fields
        return {
          input: JSON.parse(tc.nums),
          target: parseInt(tc.target),
          expected: tc.expected ? JSON.parse(tc.expected) : null,
        };
      } else if (tc.input && tc.input.includes('nums =') && tc.input.includes('target =')) {
        // Parse input string like "nums = [2,7,11,15], target = 9"
        const numsMatch = tc.input.match(/nums\s*=\s*\[(.*?)\]/);
        const targetMatch = tc.input.match(/target\s*=\s*(\d+)/);

        if (numsMatch && targetMatch) {
          const nums = numsMatch[1].split(',').map((n) => parseInt(n.trim()));
          const target = parseInt(targetMatch[1]);

          return {
            input: nums,
            target: target,
            expected: tc.expectedOutput ? JSON.parse(tc.expectedOutput) : null,
          };
        }
      }

      return tc;
    });
  }

  /**
   * Execute Python code
   */
  async executePython(code, testCases) {
    const results = {
      success: false,
      passed: 0,
      failed: 0,
      total: testCases.length,
      testResults: [],
      output: '',
      error: null,
    };

    try {
      // Create a temporary Python file
      const tempFile = path.join('/tmp', `code_${crypto.randomBytes(8).toString('hex')}.py`);

      // Wrap the code with test execution
      const wrappedCode = this.wrapPythonCode(code, testCases);

      await fs.writeFile(tempFile, wrappedCode);

      // No need for separate syntax check - Python will handle errors during execution

      // Execute the Python file
      const output = await this.executeCommand(`python3 ${tempFile}`, 10000);

      // Parse results
      try {
        const result = JSON.parse(output.stdout);
        results.success = true;
        results.passed = result.passed || 0;
        results.failed = result.failed || 0;
        results.testResults = result.testResults || [];
        results.output = result.output || '';

        // Check if there are errors in test results
        if (result.testResults && result.testResults.some((tr) => tr.status === 'ERROR')) {
          results.error = result.testResults.find((tr) => tr.status === 'ERROR')?.error;
        }
      } catch (parseError) {
        // Failed to parse - check if there's actual error output
        results.success = false;
        results.error = output.stderr || output.stdout || parseError.message;
        results.testResults = [
          {
            test: 1,
            status: 'ERROR',
            error:
              output.stderr || output.stdout || parseError.message || 'Compilation/runtime error',
          },
        ];
      }

      // Clean up
      await fs.unlink(tempFile).catch(() => {});
    } catch (error) {
      // Catch execution errors (timeout, file errors, etc.)
      results.success = false;
      results.error = error.stderr || error.message || 'Code execution failed';
      results.testResults = [
        {
          test: 1,
          status: 'ERROR',
          error: error.stderr || error.message || 'Code execution failed',
        },
      ];

      // Clean up on error
      try {
        const tempFile = path.join('/tmp', `code_${crypto.randomBytes(8).toString('hex')}.py`);
        await fs.unlink(tempFile).catch(() => {});
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    return results;
  }

  /**
   * Wrap Python code with test execution logic
   */
  wrapPythonCode(code, testCases) {
    const testCasesStr = JSON.stringify(testCases).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `
import sys
import json

# User's code
${code}

# Test execution
try:
    testCasesJson = '''${testCasesStr}'''
    testCases = json.loads(testCasesJson)
    passed = 0
    failed = 0
    testResults = []
    output = ""
    
    for i, test in enumerate(testCases):
        try:
            nums = test['input']
            target = test['target']
            expected = test.get('expected')
            
            # Call user's solution
            result = twoSum(nums, target)
            
            if expected is not None:
                # Check if result is correct
                isCorrect = sorted(result) == sorted(expected)
                status = "PASSED" if isCorrect else "FAILED"
                
                if isCorrect:
                    passed += 1
                else:
                    failed += 1
                
                testResults.append({
                    "test": i + 1,
                    "input": nums,
                    "target": target,
                    "expected": expected,
                    "got": result,
                    "status": status
                })
            else:
                # Just print the result if no expected value
                output += f"Test {i+1}: {result}\\n"
                passed += 1
                testResults.append({
                    "test": i + 1,
                    "input": nums,
                    "target": target,
                    "got": result,
                    "status": "EXECUTED"
                })
        except Exception as e:
            failed += 1
            error_msg = str(e)
            testResults.append({
                "test": i + 1,
                "status": "ERROR",
                "error": error_msg
            })
            output += f"Test {i+1} error: {error_msg}\\n"
    
    result = {
        "passed": passed,
        "failed": failed,
        "testResults": testResults,
        "output": output
    }
    
    print(json.dumps(result))
except Exception as e:
    error_result = {
        "error": str(e),
        "passed": 0,
        "failed": len(testCases),
        "testResults": []
    }
    print(json.dumps(error_result))
`;
  }

  /**
   * Execute Java code
   */
  async executeJava(code, testCases) {
    const results = {
      success: false,
      passed: 0,
      failed: 0,
      total: testCases.length,
      testResults: [],
      output: '',
      error: null,
    };

    try {
      // Create temporary directory
      const tempDir = path.join('/tmp', `java_${crypto.randomBytes(8).toString('hex')}`);
      await fs.mkdir(tempDir, { recursive: true });

      // Create Java file with user's class and test runner
      const javaFile = path.join(tempDir, 'Solution.java');
      const wrappedCode = this.wrapJavaCode(code, testCases);
      await fs.writeFile(javaFile, wrappedCode);

      try {
        // Compile Java code
        await this.executeCommand(`javac ${javaFile}`, 15000);

        // Execute compiled Java code
        const output = await this.executeCommand(`java -cp ${tempDir} SolutionTests`, 10000);

        // Parse results
        const result = JSON.parse(output.stdout);
        results.success = true;
        results.passed = result.passed || 0;
        results.failed = result.failed || 0;
        results.testResults = result.testResults || [];
        results.output = result.output || '';
      } catch (execError) {
        results.success = false;
        results.error = execError.stderr || execError.message;
        results.testResults = [
          {
            test: 1,
            status: 'ERROR',
            error: execError.stderr || execError.message || 'Compilation or runtime error',
          },
        ];
      }

      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    } catch (error) {
      results.success = false;
      results.error = error.message;
      results.testResults = [
        {
          test: 1,
          status: 'ERROR',
          error: error.message,
        },
      ];
    }

    return results;
  }

  /**
   * Wrap Java code with test execution logic
   */
  wrapJavaCode(code, testCases) {
    // Helper function to convert JS array to Java array syntax
    const toJavaArray = (arr) => {
      return `new int[]{${arr.join(',')}}`;
    };

    return `
${code}

class SolutionTests {
    public static void main(String[] args) {
        try {
            Solution solution = new Solution();
            int passed = 0;
            int failed = 0;
            
            ${testCases
              .map(
                (tc, idx) => `
            // Test ${idx + 1}
            int[] test${idx}_nums = ${toJavaArray(tc.input)};
            int test${idx}_target = ${tc.target};
            int[] test${idx}_expected = ${toJavaArray(tc.expected)};
            int[] test${idx}_result = solution.twoSum(test${idx}_nums, test${idx}_target);
            boolean test${idx}_matches = (test${idx}_result.length == 2 && test${idx}_expected.length == 2) &&
                                        ((test${idx}_result[0] == test${idx}_expected[0] && test${idx}_result[1] == test${idx}_expected[1]) ||
                                         (test${idx}_result[0] == test${idx}_expected[1] && test${idx}_result[1] == test${idx}_expected[0]));
            if (test${idx}_matches) passed++; else failed++;
            `,
              )
              .join('')}
            
            // Build JSON output
            System.out.print("{");
            System.out.print("\\"passed\\":" + passed + ",");
            System.out.print("\\"failed\\":" + failed + ",");
            System.out.print("\\"testResults\\":[");
            ${testCases
              .map(
                (tc, idx) => `
            ${idx > 0 ? 'System.out.print(",");' : ''}
            System.out.print("{\\"test\\":" + ${idx + 1} + ",\\"status\\":\\"" + (test${idx}_matches ? "PASSED" : "FAILED") + "\\"}");
            `,
              )
              .join('')}
            System.out.print("],\\"output\\":\\"\\"");
            System.out.println("}");
            
        } catch (Exception e) {
            System.out.println("{\\"error\\":\\"" + e.getMessage().replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"") + "\\",\\"passed\\":0,\\"failed\\":" + ${testCases.length} + ",\\"testResults\\":[]}");
        }
    }
}
`;
  }

  /**
   * Execute C++ code
   */
  async executeCpp(code, testCases) {
    const results = {
      success: false,
      passed: 0,
      failed: 0,
      total: testCases.length,
      testResults: [],
      output: '',
      error: null,
    };

    try {
      // Create temporary directory
      const tempDir = path.join('/tmp', `cpp_${crypto.randomBytes(8).toString('hex')}`);
      await fs.mkdir(tempDir, { recursive: true });

      // Create C++ file
      const cppFile = path.join(tempDir, 'solution.cpp');
      const wrappedCode = this.wrapCppCode(code, testCases);
      await fs.writeFile(cppFile, wrappedCode);

      try {
        // Compile C++ code
        await this.executeCommand(`g++ -o ${tempDir}/solution ${cppFile} -std=c++11`, 15000);

        // Execute compiled C++ code
        const output = await this.executeCommand(`${tempDir}/solution`, 10000);

        // Parse results
        const result = JSON.parse(output.stdout);
        results.success = true;
        results.passed = result.passed || 0;
        results.failed = result.failed || 0;
        results.testResults = result.testResults || [];
        results.output = result.output || '';
      } catch (execError) {
        results.success = false;
        results.error = execError.stderr || execError.message;
        results.testResults = [
          {
            test: 1,
            status: 'ERROR',
            error: execError.stderr || execError.message || 'Compilation or runtime error',
          },
        ];
      }

      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    } catch (error) {
      results.success = false;
      results.error = error.message;
      results.testResults = [
        {
          test: 1,
          status: 'ERROR',
          error: error.message,
        },
      ];
    }

    return results;
  }

  /**
   * Wrap C++ code with test execution logic
   */
  wrapCppCode(code, testCases) {
    const testCasesStr = JSON.stringify(testCases);
    return `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>

using namespace std;

${code}

int main() {
    // Note: This is a simplified test runner
    // For production, implement proper JSON parsing
    cout << "${testCasesStr}" << endl;
    return 0;
}
`;
  }

  /**
   * Execute JavaScript code
   */
  async executeJavaScript(code, testCases) {
    const results = {
      success: false,
      passed: 0,
      failed: 0,
      total: testCases.length,
      testResults: [],
      output: '',
      error: null,
    };

    try {
      // Create a temporary JavaScript file
      const tempFile = path.join('/tmp', `code_${crypto.randomBytes(8).toString('hex')}.js`);

      // Wrap the code with test execution
      const wrappedCode = this.wrapJavaScriptCode(code, testCases);

      await fs.writeFile(tempFile, wrappedCode);

      try {
        // Execute the JavaScript file
        const output = await this.executeCommand(`node ${tempFile}`, 10000);

        // Parse results
        const result = JSON.parse(output.stdout);
        results.success = true;
        results.passed = result.passed || 0;
        results.failed = result.failed || 0;
        results.testResults = result.testResults || [];
        results.output = result.output || '';
      } catch (execError) {
        results.success = false;
        results.error = execError.stderr || execError.message;
        results.testResults = [
          {
            test: 1,
            status: 'ERROR',
            error: execError.stderr || execError.message || 'Runtime error',
          },
        ];
      }

      // Clean up
      await fs.unlink(tempFile).catch(() => {});
    } catch (error) {
      results.success = false;
      results.error = error.message;
      results.testResults = [
        {
          test: 1,
          status: 'ERROR',
          error: error.message,
        },
      ];
    }

    return results;
  }

  /**
   * Wrap JavaScript code with test execution logic
   */
  wrapJavaScriptCode(code, testCases) {
    const testCasesStr = JSON.stringify(testCases).replace(/\\/g, '\\\\').replace(/`/g, '\\`');
    return `
const testCases = ${JSON.stringify(testCases)};

${code}

// Test execution
try {
    let passed = 0;
    let failed = 0;
    const testResults = [];
    
    for (let i = 0; i < testCases.length; i++) {
        try {
            const test = testCases[i];
            const nums = test.input;
            const target = test.target;
            const expected = test.expected;
            
            const result = twoSum(nums, target);
            
            if (expected !== undefined && expected !== null) {
                // Sort arrays for comparison
                const sortedResult = [...result].sort((a, b) => a - b);
                const sortedExpected = [...expected].sort((a, b) => a - b);
                
                const isCorrect = JSON.stringify(sortedResult) === JSON.stringify(sortedExpected);
                const status = isCorrect ? 'PASSED' : 'FAILED';
                
                if (isCorrect) {
                    passed++;
                } else {
                    failed++;
                }
                
                testResults.push({
                    test: i + 1,
                    input: nums,
                    target: target,
                    expected: expected,
                    got: result,
                    status: status
                });
            } else {
                passed++;
                testResults.push({
                    test: i + 1,
                    input: nums,
                    target: target,
                    got: result,
                    status: 'EXECUTED'
                });
            }
        } catch (error) {
            failed++;
            testResults.push({
                test: i + 1,
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    const result = {
        passed: passed,
        failed: failed,
        testResults: testResults,
        output: ''
    };
    
    console.log(JSON.stringify(result));
} catch (error) {
    const errorResult = {
        error: error.message,
        passed: 0,
        failed: testCases.length,
        testResults: []
    };
    console.log(JSON.stringify(errorResult));
}
`;
  }

  /**
   * Execute shell command with timeout
   */
  executeCommand(command, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const proc = exec(command, { timeout }, (error, stdout, stderr) => {
        if (error) {
          // Return both stdout and stderr even on error
          const errorOutput = {
            stdout: stdout || '',
            stderr: stderr || '',
            error: error.message,
            code: error.code,
          };
          reject(errorOutput);
        } else {
          resolve({ stdout, stderr });
        }
      });

      // Kill process if it exceeds timeout
      setTimeout(() => {
        proc.kill();
        reject({
          stdout: '',
          stderr: '',
          error: 'Execution timeout',
        });
      }, timeout);
    });
  }
}

module.exports = new CodeExecutor();
