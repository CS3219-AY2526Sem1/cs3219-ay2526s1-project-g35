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
    // Generate Java code to embed test cases
    const testCasesCode = this.generateJavaTestCasesCode(testCases);
    const testCasesLength = testCases.length;
    
    return `
import java.util.*;
import java.lang.reflect.*;

${code}

class SolutionTests {
    // Helper to escape JSON strings
    private static String escapeJson(String s) {
        if (s == null) return "null";
        return s.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"").replace("\\n", "\\\\n").replace("\\r", "\\\\r").replace("\\t", "\\\\t");
    }
    
    // Helper to convert Object to JSON string
    private static String toJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return "\\"" + escapeJson((String)obj) + "\\"";
        if (obj instanceof Integer || obj instanceof Boolean || obj instanceof Long || obj instanceof Double) return obj.toString();
        if (obj instanceof int[]) {
            int[] arr = (int[])obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(",");
                sb.append(arr[i]);
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof String[]) {
            String[] arr = (String[])obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(",");
                sb.append("\\"").append(escapeJson(arr[i])).append("\\"");
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof List) {
            List<?> list = (List<?>)obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(toJson(list.get(i)));
            }
            sb.append("]");
            return sb.toString();
        }
        return "\\"" + escapeJson(obj.toString()) + "\\"";
    }
    
    // Helper to compare objects deeply
    private static boolean deepEquals(Object a, Object b) {
        if (a == b) return true;
        if (a == null || b == null) return false;
        if (a instanceof int[] && b instanceof int[]) {
            return Arrays.equals((int[])a, (int[])b);
        }
        if (a instanceof String[] && b instanceof String[]) {
            return Arrays.equals((String[])a, (String[])b);
        }
        if (a instanceof List && b instanceof List) {
            List<?> listA = (List<?>)a;
            List<?> listB = (List<?>)b;
            if (listA.size() != listB.size()) return false;
            for (int i = 0; i < listA.size(); i++) {
                if (!deepEquals(listA.get(i), listB.get(i))) return false;
            }
            return true;
        }
        return a.equals(b);
    }
    
    // Convert test case parameter to appropriate Java type
    private static Object convertParam(Object param, Class<?> targetType) {
        if (param == null) return null;
        
        // Handle void type
        if (targetType == void.class || targetType == Void.class) {
            return null;
        }
        
        if (targetType == int.class || targetType == Integer.class) {
            if (param instanceof Number) return ((Number)param).intValue();
            if (param instanceof String) return Integer.parseInt((String)param);
            return Integer.parseInt(param.toString());
        }
        if (targetType == String.class) {
            return param.toString();
        }
        if (targetType == boolean.class || targetType == Boolean.class) {
            if (param instanceof Boolean) return param;
            if (param instanceof String) return Boolean.parseBoolean((String)param);
            return Boolean.parseBoolean(param.toString());
        }
        if (targetType == long.class || targetType == Long.class) {
            if (param instanceof Number) return ((Number)param).longValue();
            if (param instanceof String) return Long.parseLong((String)param);
            return Long.parseLong(param.toString());
        }
        if (targetType == double.class || targetType == Double.class) {
            if (param instanceof Number) return ((Number)param).doubleValue();
            if (param instanceof String) return Double.parseDouble((String)param);
            return Double.parseDouble(param.toString());
        }
        if (targetType.isArray()) {
            if (param instanceof List) {
                List<?> list = (List<?>)param;
                Class<?> componentType = targetType.getComponentType();
                if (componentType == int.class) {
                    int[] arr = new int[list.size()];
                    for (int i = 0; i < list.size(); i++) {
                        Object elem = list.get(i);
                        arr[i] = elem instanceof Number ? ((Number)elem).intValue() : Integer.parseInt(elem.toString());
                    }
                    return arr;
                }
                if (componentType == String.class) {
                    String[] arr = new String[list.size()];
                    for (int i = 0; i < list.size(); i++) {
                        arr[i] = list.get(i).toString();
                    }
                    return arr;
                }
            }
            // If param is already the right array type, return it
            if (targetType.isInstance(param)) {
                return param;
            }
        }
        // For List types, check if param is a List
        if (List.class.isAssignableFrom(targetType)) {
            if (param instanceof List) {
                return param;
            }
        }
        // For other types, try to return as-is or convert to string
        if (targetType.isInstance(param)) {
            return param;
        }
        return param;
    }
    
    public static void main(String[] args) {
        try {
            Solution solution = new Solution();
            
            // Find solution method using reflection
            Method solutionMethod = null;
            Method[] methods = Solution.class.getDeclaredMethods();
            for (Method m : methods) {
                if (m.getName().equals("solution") && Modifier.isPublic(m.getModifiers())) {
                    solutionMethod = m;
                    break;
                }
            }
            
            if (solutionMethod == null) {
                System.out.println("{\\"error\\":\\"Solution class must have a public method named 'solution'\\",\\"passed\\":0,\\"failed\\":${testCasesLength},\\"testResults\\":[]}");
                return;
            }
            
            solutionMethod.setAccessible(true);
            Class<?>[] paramTypes = solutionMethod.getParameterTypes();
            
            // Test cases
            ${testCasesCode}
            
            int passed = 0;
            int failed = 0;
            StringBuilder testResultsJson = new StringBuilder("[");
            
            for (int i = 0; i < testCases.length; i++) {
                if (i > 0) testResultsJson.append(",");
                testResultsJson.append("{");
                testResultsJson.append("\\"test\\":").append(i + 1).append(",");
                
                try {
                    Object[] testCase = testCases[i];
                    Object[] params = (Object[])testCase[0];
                    Object expected = testCase[1];
                    
                    // Validate parameter count
                    if (params.length != paramTypes.length) {
                        throw new IllegalArgumentException("Expected " + paramTypes.length + " parameters, got " + params.length);
                    }
                    
                    // Convert parameters to match method signature
                    Object[] javaParams = new Object[params.length];
                    for (int j = 0; j < params.length; j++) {
                        javaParams[j] = convertParam(params[j], paramTypes[j]);
                    }
                    
                    // Invoke solution method
                    Object result = solutionMethod.invoke(solution, javaParams);
                    
                    // Handle void return type
                    Class<?> returnType = solutionMethod.getReturnType();
                    if (returnType == void.class || returnType == Void.class) {
                        // For void methods, just mark as executed
                        passed++;
                        testResultsJson.append("\\"status\\":\\"EXECUTED\\",");
                        testResultsJson.append("\\"got\\":null");
                    } else {
                        // Compare with expected result
                        Object expectedJava = convertParam(expected, returnType);
                        boolean isCorrect = deepEquals(result, expectedJava);
                        
                        if (isCorrect) {
                            passed++;
                            testResultsJson.append("\\"status\\":\\"PASSED\\",");
                        } else {
                            failed++;
                            testResultsJson.append("\\"status\\":\\"FAILED\\",");
                        }
                        
                        testResultsJson.append("\\"expected\\":").append(toJson(expectedJava)).append(",");
                        testResultsJson.append("\\"got\\":").append(toJson(result));
                    }
                    
                } catch (Exception e) {
                    failed++;
                    String errorMsg = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
                    if (errorMsg == null) errorMsg = e.toString();
                    testResultsJson.append("\\"status\\":\\"ERROR\\",");
                    testResultsJson.append("\\"error\\":\\"").append(escapeJson(errorMsg)).append("\\"");
                }
                
                testResultsJson.append("}");
            }
            
            testResultsJson.append("]");
            
            // Build final JSON result
            StringBuilder resultJson = new StringBuilder("{");
            resultJson.append("\\"passed\\":").append(passed).append(",");
            resultJson.append("\\"failed\\":").append(failed).append(",");
            resultJson.append("\\"testResults\\":").append(testResultsJson.toString()).append(",");
            resultJson.append("\\"output\\":\\"\\"");
            resultJson.append("}");
            
            System.out.println(resultJson.toString());
            
        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.toString();
            String escapedError = escapeJson(errorMsg);
            System.out.println("{\\"error\\":\\"" + escapedError + "\\",\\"passed\\":0,\\"failed\\":${testCasesLength},\\"testResults\\":[]}");
        }
    }
}
`;
  }
  
  /**
   * Generate Java code to represent test cases
   */
  generateJavaTestCasesCode(testCases) {
    let code = 'Object[][] testCases = new Object[][]{\n';
    
    for (let i = 0; i < testCases.length; i++) {
      if (i > 0) code += ',\n';
      const testCase = testCases[i];
      const params = testCase.params || [];
      const expected = testCase.expected;
      
      // Each test case is: [params array, expected value]
      // Structure: new Object[]{params_array, expected_object}
      code += '    new Object[]{\n';
      
      // First element: params array (Object[])
      code += '        new Object[]{';
      if (params.length > 0) {
        for (let j = 0; j < params.length; j++) {
          if (j > 0) code += ', ';
          code += this.javaValueLiteral(params[j], true); // true = in Object array context
        }
      }
      code += '},\n';
      
      // Second element: expected value (Object)
      code += '        ' + this.javaValueLiteral(expected, true) + '\n';
      code += '    }';
    }
    
    code += '\n};';
    return code;
  }
  
  /**
   * Convert JavaScript value to Java literal
   * @param {any} value - The value to convert
   * @param {boolean} inObjectArray - Whether this value is going into an Object array (needs boxing)
   */
  javaValueLiteral(value, inObjectArray = false) {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        // Java auto-boxes primitives in Object arrays, so just use the literal
        return value.toString();
      }
      // For doubles - ensure proper format
      const doubleStr = value.toString();
      return doubleStr.includes('.') || doubleStr.includes('e') || doubleStr.includes('E') 
        ? doubleStr 
        : doubleStr + '.0';
    }
    
    if (typeof value === 'boolean') {
      // Java auto-boxes booleans in Object arrays
      return value.toString();
    }
    
    if (typeof value === 'string') {
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `"${escaped}"`;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        // Empty array - use ArrayList for Object context
        return 'new java.util.ArrayList()';
      }
      // Check if all elements are integers - use ArrayList for Object array context
      if (value.every(v => typeof v === 'number' && Number.isInteger(v))) {
        // Java auto-boxes, so just use literals in ArrayList
        const items = value.map(v => v.toString()).join(', ');
        return `java.util.Arrays.asList(${items})`;
      }
      // Check if all elements are strings
      if (value.every(v => typeof v === 'string')) {
        const items = value.map(v => this.javaValueLiteral(v, false)).join(', ');
        return `new String[]{${items}}`;
      }
      // Mixed types or numbers with decimals - use ArrayList
      const items = value.map(v => this.javaValueLiteral(v, false)).join(', ');
      return `java.util.Arrays.asList(${items})`;
    }
    
    if (typeof value === 'object') {
      // Handle special types like ListNode
      if (value.type === 'ListNode') {
        return this.javaValueLiteral(value.values || [], inObjectArray);
      }
      // For generic objects, convert to Map-like structure
      // But for simplicity, represent as List of key-value pairs
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return 'new java.util.HashMap<String, Object>()';
      }
      // Use ArrayList for object representation
      const pairs = entries.map(([k, v]) => {
        return `java.util.Arrays.asList("${k}", ${this.javaValueLiteral(v)})`;
      }).join(', ');
      return `java.util.Arrays.asList(${pairs})`;
    }
    
    return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
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
    if (!testCases || testCases.length === 0) {
      throw new Error('No test cases provided');
    }
    
    // Check if code uses a Solution class (C++ solutions are class-based)
    // Look for "class Solution" pattern (case-sensitive, with optional whitespace)
    const isClassBased = /\bclass\s+Solution\b/.test(code);
    
    // Infer function signature from first test case
    // All test cases should have the same signature
    const firstTestCase = testCases[0];
    const params = firstTestCase.params || [];
    const expected = firstTestCase.expected;
    
    // Determine parameter and return types from first test case
    const paramTypes = this.inferCppTypes(params);
    const returnType = this.inferCppType(expected);
    
    // Validate that all test cases have the same parameter count
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      if (!testCase.params || testCase.params.length !== params.length) {
        throw new Error(`Test case ${i + 1} has different parameter count`);
      }
    }
    
    // Generate test execution code
    const testExecutionCode = this.generateCppTestExecution(testCases, paramTypes, returnType, isClassBased);
    const testCasesLength = testCases.length;
    
    return `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <cmath>

using namespace std;

${code}

// Helper function to escape JSON strings
string escapeJson(const string& s) {
    string result = "";
    for (char c : s) {
        if (c == '\\\\') result += "\\\\\\\\";
        else if (c == '"') result += "\\\\\\"";
        else if (c == '\\n') result += "\\\\n";
        else if (c == '\\r') result += "\\\\r";
        else if (c == '\\t') result += "\\\\t";
        else result += c;
    }
    return result;
}

// Helper to convert value to JSON string
string toJson(int value) {
    return to_string(value);
}

string toJson(double value) {
    stringstream ss;
    ss << value;
    return ss.str();
}

string toJson(const string& value) {
    return "\\"" + escapeJson(value) + "\\"";
}

string toJson(bool value) {
    return value ? "true" : "false";
}

string toJsonVector(const vector<int>& vec) {
    string result = "[";
    for (size_t i = 0; i < vec.size(); i++) {
        if (i > 0) result += ",";
        result += to_string(vec[i]);
    }
    result += "]";
    return result;
}

string toJsonVector(const vector<string>& vec) {
    string result = "[";
    for (size_t i = 0; i < vec.size(); i++) {
        if (i > 0) result += ",";
        result += "\\"" + escapeJson(vec[i]) + "\\"";
    }
    result += "]";
    return result;
}

string toJsonVector(const vector<double>& vec) {
    string result = "[";
    for (size_t i = 0; i < vec.size(); i++) {
        if (i > 0) result += ",";
        stringstream ss;
        ss << vec[i];
        result += ss.str();
    }
    result += "]";
    return result;
}

// Helper to compare vectors
template<typename T>
bool vectorEquals(const vector<T>& a, const vector<T>& b) {
    if (a.size() != b.size()) return false;
    for (size_t i = 0; i < a.size(); i++) {
        if (a[i] != b[i]) return false;
    }
    return true;
}

int main() {
    try {
        int passed = 0;
        int failed = 0;
        string testResultsJson = "[";
        
        ${testExecutionCode}
        
        testResultsJson += "]";
        
        // Build final result
        string resultJson = "{";
        resultJson += "\\"passed\\":" + to_string(passed) + ",";
        resultJson += "\\"failed\\":" + to_string(failed) + ",";
        resultJson += "\\"testResults\\":" + testResultsJson + ",";
        resultJson += "\\"output\\":\\"\\"";
        resultJson += "}";
        
        cout << resultJson << endl;
        
    } catch (const exception& e) {
        string errorMsg = escapeJson(e.what());
        cout << "{\\"error\\":\\"" + errorMsg + "\\",\\"passed\\":0,\\"failed\\":${testCasesLength},\\"testResults\\":[]}" << endl;
    }
    
    return 0;
}
`;
  }
  
  /**
   * Infer C++ types from JavaScript values
   */
  inferCppTypes(values) {
    return values.map(v => this.inferCppType(v));
  }
  
  /**
   * Infer C++ type from a JavaScript value
   */
  inferCppType(value) {
    if (value === null || value === undefined) {
      return 'int'; // Default to int
    }
    
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'int' : 'double';
    }
    
    if (typeof value === 'string') {
      return 'string';
    }
    
    if (typeof value === 'boolean') {
      return 'bool';
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'vector<int>';
      }
      const firstType = this.inferCppType(value[0]);
      if (firstType === 'int') {
        return 'vector<int>';
      } else if (firstType === 'string') {
        return 'vector<string>';
      } else if (firstType === 'double') {
        return 'vector<double>';
      }
      return 'vector<int>'; // Default
    }
    
    if (typeof value === 'object') {
      if (value.type === 'ListNode') {
        return 'vector<int>';
      }
      return 'string'; // Default objects to string
    }
    
    return 'int'; // Default
  }
  
  /**
   * Generate C++ test execution code
   */
  generateCppTestExecution(testCases, paramTypes, returnType, isClassBased = false) {
    let code = '';
    
    // If class-based, create Solution instance once
    if (isClassBased) {
      code += 'Solution sol;\n        ';
    }
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const params = testCase.params || [];
      const expected = testCase.expected;
      
      if (i > 0) code += '\n        ';
      code += `// Test case ${i + 1}\n        `;
      code += 'try {\n            ';
      if (i > 0) {
        code += 'testResultsJson += ",";\n            ';
      }
      code += 'testResultsJson += "{";\n            ';
      code += `testResultsJson += "\\"test\\":${i + 1},";\n            `;
      
      // Generate parameter values
      const paramValues = params.map((p, idx) => this.cppValueCode(p, paramTypes[idx])).join(', ');
      
      // Generate expected value
      const expectedCode = this.cppValueCode(expected, returnType);
      
      // Call solution function or method
      if (isClassBased) {
        code += `auto result${i} = sol.solution(${paramValues});\n            `;
      } else {
        code += `auto result${i} = solution(${paramValues});\n            `;
      }
      code += `auto expected${i} = ${expectedCode};\n            `;
      
      // Compare results based on return type
      if (returnType === 'vector<int>' || returnType === 'vector<string>' || returnType === 'vector<double>') {
        code += `bool isCorrect${i} = vectorEquals(result${i}, expected${i});\n            `;
      } else {
        code += `bool isCorrect${i} = (result${i} == expected${i});\n            `;
      }
      
      code += `if (isCorrect${i}) {\n                `;
      code += `passed++;\n                `;
      code += `testResultsJson += "\\"status\\":\\"PASSED\\",";\n            `;
      code += `} else {\n                `;
      code += `failed++;\n                `;
      code += `testResultsJson += "\\"status\\":\\"FAILED\\",";\n            `;
      code += `}\n            `;
      
      // Generate JSON for expected and result based on return type
      if (returnType === 'vector<int>') {
        code += `testResultsJson += "\\"expected\\":" + toJsonVector(expected${i}) + ",";\n            `;
        code += `testResultsJson += "\\"got\\":" + toJsonVector(result${i});\n            `;
      } else if (returnType === 'vector<string>') {
        code += `testResultsJson += "\\"expected\\":" + toJsonVector(expected${i}) + ",";\n            `;
        code += `testResultsJson += "\\"got\\":" + toJsonVector(result${i});\n            `;
      } else if (returnType === 'vector<double>') {
        code += `testResultsJson += "\\"expected\\":" + toJsonVector(expected${i}) + ",";\n            `;
        code += `testResultsJson += "\\"got\\":" + toJsonVector(result${i});\n            `;
      } else {
        code += `testResultsJson += "\\"expected\\":" + toJson(expected${i}) + ",";\n            `;
        code += `testResultsJson += "\\"got\\":" + toJson(result${i});\n            `;
      }
      code += `testResultsJson += "}";\n        `;
      code += `} catch (const exception& e) {\n            `;
      code += `failed++;\n            `;
      if (i > 0) {
        code += 'testResultsJson += ",";\n            ';
      }
      code += `testResultsJson += "{";\n            `;
      code += `testResultsJson += "\\"test\\":${i + 1},";\n            `;
      code += `testResultsJson += "\\"status\\":\\"ERROR\\",";\n            `;
      code += `testResultsJson += "\\"error\\":\\"" + escapeJson(e.what()) + "\\"";\n            `;
      code += `testResultsJson += "}";\n        `;
      code += '}';
    }
    
    return code;
  }
  
  /**
   * Generate C++ code for a value
   */
  cppValueCode(value, cppType) {
    if (value === null || value === undefined) {
      return cppType === 'string' ? '""' : '0';
    }
    
    if (cppType === 'int') {
      return Math.floor(Number(value)).toString();
    }
    
    if (cppType === 'double') {
      return Number(value).toString();
    }
    
    if (cppType === 'bool') {
      return value ? 'true' : 'false';
    }
    
    if (cppType === 'string') {
      const escaped = String(value)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `"${escaped}"`;
    }
    
    if (cppType === 'vector<int>') {
      const arr = Array.isArray(value) ? value : (value.values || []);
      if (arr.length === 0) {
        return '{}';
      }
      const items = arr.map(v => Math.floor(Number(v)).toString()).join(', ');
      return `{${items}}`;
    }
    
    if (cppType === 'vector<string>') {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) {
        return '{}';
      }
      const items = arr.map(v => {
        const escaped = String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
        return `"${escaped}"`;
      }).join(', ');
      return `{${items}}`;
    }
    
    if (cppType === 'vector<double>') {
      const arr = Array.isArray(value) ? value : [];
      if (arr.length === 0) {
        return '{}';
      }
      const items = arr.map(v => Number(v).toString()).join(', ');
      return `{${items}}`;
    }
    
    // Default fallback
    return String(value);
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
