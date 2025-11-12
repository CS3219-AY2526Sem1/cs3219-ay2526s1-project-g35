/*
 * AI Assistance Disclosure:
 * Tool: Claude 3.5 Sonnet (via Cursor), ChatGPT / Claude, Date: 2025-11-11
 * Scope: 
 *   - prepareTestCaseParams for dynamic parameter construction (Johannsen Lum)
 *   - ListNode class and construct_linked_list helper for Python (Johannsen Lum)
 *   - wrapPythonCode and wrapJavaScriptCode for params-based execution (Johannsen Lum)
 *   - C++ code execution with compilation and test framework (Basil)
 * Author review: Complex type construction logic validated, C++ execution tested,
 *                all implementations verified by respective authors
 */

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
   * New format: { params: [...], expected: ..., explanation: '', type: '' }
   */
  parseTestCases(testCases) {
    // Test cases are already in the correct format from the question service
    // No parsing needed - just pass them through
    return testCases;
  }

  /**
   * Prepare test case parameters based on function signature
   * Handles construction of complex data structures (LinkedList, Tree, Graph)
   */
  prepareTestCaseParams(testCase, functionSignature) {
    if (!functionSignature || !functionSignature.parameters) {
      // No signature metadata - use params as-is (backward compatibility)
      return testCase.params || [];
    }

    const preparedParams = [];

    functionSignature.parameters.forEach((paramDef, index) => {
      const rawValue = testCase.params[index];

      switch (paramDef.type) {
        case 'ListNode':
          // For linked lists: params[0] is array, params[1] is cycle position
          preparedParams.push({
            type: 'ListNode',
            values: rawValue,
            cyclePos: testCase.params[index + 1] !== undefined ? testCase.params[index + 1] : -1,
          });
          break;

        case 'TreeNode':
          // For trees: construct from level-order array
          preparedParams.push({
            type: 'TreeNode',
            values: rawValue,
          });
          break;

        case 'Graph':
          // For graphs: adjacency list representation
          preparedParams.push({
            type: 'Graph',
            values: rawValue,
          });
          break;

        default:
          // Simple types (number, string, boolean, array, object)
          preparedParams.push(rawValue);
          break;
      }
    });

    return preparedParams;
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
      await fs.unlink(tempFile).catch(() => { });
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
        await fs.unlink(tempFile).catch(() => { });
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

# ListNode class for linked list problems
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# Helper function to construct linked list
def construct_linked_list(values, cycle_pos=-1):
    if not values:
        return None
    
    head = ListNode(values[0])
    current = head
    nodes = [head]
    
    for val in values[1:]:
        current.next = ListNode(val)
        current = current.next
        nodes.append(current)
    
    # Create cycle if specified
    if cycle_pos >= 0 and cycle_pos < len(nodes):
        current.next = nodes[cycle_pos]
    
    return head

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
            params = test.get('params', [])
            expected = test.get('expected')
            
            # Prepare parameters - construct complex data structures if needed
            prepared_params = []
            for param in params:
                if isinstance(param, dict) and param.get('type') == 'ListNode':
                    # Construct linked list
                    head = construct_linked_list(param.get('values', []), param.get('cyclePos', -1))
                    prepared_params.append(head)
                else:
                    prepared_params.append(param)
            
            # Call user's solution function
            result = solution(*prepared_params)
            
            if expected is not None:
                # Check if result is correct
                if isinstance(result, list) and isinstance(expected, list):
                    isCorrect = json.dumps(sorted(result), sort_keys=True) == json.dumps(sorted(expected), sort_keys=True)
                else:
                    isCorrect = json.dumps(result, sort_keys=True) == json.dumps(expected, sort_keys=True)
                
                status = "PASSED" if isCorrect else "FAILED"
                
                if isCorrect:
                    passed += 1
                else:
                    failed += 1
                
                testResults.append({
                    "test": i + 1,
                    "expected": expected,
                    "got": result,
                    "status": status
                })
            else:
                output += f"Test {i+1}: {result}\\n"
                passed += 1
                testResults.append({
                    "test": i + 1,
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
        "failed": len(testCases) if 'testCases' in locals() else 0,
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
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => { });
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
    const testCasesJson = JSON.stringify(testCases).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    return `
import com.google.gson.*;
import java.util.*;

${code}

class SolutionTests {
    public static void main(String[] args) {
        try {
            Solution solutionInstance = new Solution();
            Gson gson = new Gson();
            
            String testCasesJson = "${testCasesJson}";
            JsonArray testCases = JsonParser.parseString(testCasesJson).getAsJsonArray();
            
            int passed = 0;
            int failed = 0;
            JsonArray testResults = new JsonArray();
            
            for (int i = 0; i < testCases.size(); i++) {
                JsonObject testResult = new JsonObject();
                testResult.addProperty("test", i + 1);
                
                try {
                    JsonObject test = testCases.get(i).getAsJsonObject();
                    JsonArray params = test.getAsJsonArray("params");
                    JsonElement expected = test.get("expected");
                    
                    // NOTE: This is a simplified version
                    // For full Java support, you'd need reflection or method generation
                    // For now, this provides a framework
                    
                    testResult.addProperty("status", "ERROR");
                    testResult.addProperty("error", "Java dynamic execution requires method signature matching");
                    failed++;
                } catch (Exception e) {
                    testResult.addProperty("status", "ERROR");
                    testResult.addProperty("error", e.getMessage());
                    failed++;
                }
                
                testResults.add(testResult);
            }
            
            JsonObject result = new JsonObject();
            result.addProperty("passed", passed);
            result.addProperty("failed", failed);
            result.add("testResults", testResults);
            result.addProperty("output", "");
            
            System.out.println(gson.toJson(result));
            
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
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => { });
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
    const testCasesJson = JSON.stringify(testCases).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    return `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

using namespace std;

${code}

int main() {
    // NOTE: C++ dynamic execution is complex
    // This is a placeholder that indicates C++ test execution needs implementation
    // For production, you would need:
    // 1. JSON parsing library (like nlohmann/json)
    // 2. Template-based or reflection-like mechanism for dynamic calls
    // 3. Type inference from test cases
    
    cout << "{\\"error\\":\\"C++ dynamic execution not fully implemented\\",\\"passed\\":0,\\"failed\\":${testCases.length},\\"testResults\\":[]}" << endl;
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
      await fs.unlink(tempFile).catch(() => { });
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
            const params = test.params || [];
            const expected = test.expected;
            
            // Call user's solution function dynamically with params
            const result = solution(...params);
            
            if (expected !== undefined && expected !== null) {
                // Compare results - handle arrays and other types
                let isCorrect;
                if (Array.isArray(result) && Array.isArray(expected)) {
                    // For arrays, compare JSON strings (normalized)
                    isCorrect = JSON.stringify(result) === JSON.stringify(expected);
                } else {
                    // For other types, direct comparison
                    isCorrect = JSON.stringify(result) === JSON.stringify(expected);
                }
                
                const status = isCorrect ? 'PASSED' : 'FAILED';
                
                if (isCorrect) {
                    passed++;
                } else {
                    failed++;
                }
                
                testResults.push({
                    test: i + 1,
                    params: params,
                    expected: expected,
                    got: result,
                    status: status
                });
            } else {
                passed++;
                testResults.push({
                    test: i + 1,
                    params: params,
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
