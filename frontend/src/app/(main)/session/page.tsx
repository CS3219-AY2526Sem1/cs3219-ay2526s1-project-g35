'use client';

import { Button } from '@/components/ui/button';
import MonacoCodeEditor from '@/components/MonacoCodeEditor';
import socketService from '@/services/socketService';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Original React Code made by Basil - Enhanced with Collaboration

type Sender = 'me' | 'partner';

interface Message {
  id: number;
  text: string;
  sender: Sender;
}

interface TestCase {
  id: string;
  input?: string;
  expected?: string;
  explanation?: string;
}

interface QuestionExample {
  input?: string;
  output?: string;
  explanation?: string;
}

interface QuestionData {
  title?: string;
  description?: string;
  starterCode?: string;
  examples?: QuestionExample[];
  testCases?: Array<{
    input?: string;
    expected?: string;
    explanation?: string;
  }>;
}

interface MatchedSessionData {
  question?: QuestionData;
  sessionId?: string;
  questionId?: string;
  users?: Array<{ userId: string; username: string }>;
}

interface TestResult {
  test: number;
  status: string;
  got?: unknown;
  expected?: unknown;
  input?: unknown;
  target?: unknown;
  error?: string;
}

const Session = (): React.ReactElement => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');
  const [activeTab, setActiveTab] = useState<'testCases' | 'testResults'>('testCases');
  const [selectedTestCase, setSelectedTestCase] = useState<string>('Case 1');
  const [code, setCode] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [userId] = useState<string>(() => {
    // Try to get the matched user ID from session storage (set when match found)
    const matchedUserId = sessionStorage.getItem('matchedUserId');
    if (matchedUserId) {
      return matchedUserId;
    }
    // Fallback to search userId from waiting room
    const matchingSearchStr = sessionStorage.getItem('matchingSearch');
    if (matchingSearchStr) {
      try {
        const searchData = JSON.parse(matchingSearchStr);
        if (searchData.userId) {
          return searchData.userId;
        }
      } catch (e) {
        console.warn('Failed to parse matchingSearch:', e);
      }
    }
    // Last resort: random user ID for development
    return 'user-' + Math.random().toString(36).substr(2, 9);
  });
  const [partnerInfo, setPartnerInfo] = useState<{ userId: string; username: string } | null>(null);
  const [questionTitle, setQuestionTitle] = useState<string>('Two Sum');
  const [questionDescription, setQuestionDescription] = useState<string>(
    'Given an an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
  );
  const [questionExamples, setQuestionExamples] = useState<QuestionExample[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [executionResults, setExecutionResults] = useState<{
    success: boolean;
    passed?: number;
    failed?: number;
    total?: number;
    testResults?: TestResult[];
    error?: string;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const languages: string[] = ['C++', 'Java', 'Python', 'JavaScript'];
  const languageMap: Record<string, string> = useMemo(
    () => ({
      'C++': 'cpp',
      Java: 'java',
      Python: 'python',
      JavaScript: 'javascript',
    }),
    [],
  );

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Set up socket event listeners
  const setupSocketListeners = useCallback(() => {
    // Remove all existing listeners first to prevent duplicates
    socketService.off('code-update');
    socketService.off('language-update');
    socketService.off('chat-message');
    socketService.off('user-joined');
    socketService.off('user-left');

    // Listen for matched session ready with question data
    socketService.on('matched-session-ready', (data) => {
      console.log('Matched session ready with question data:', data);
      const matchedData = data as MatchedSessionData;

      if (matchedData.question) {
        // Update question title and description
        setQuestionTitle(matchedData.question.title || 'Two Sum');
        setQuestionDescription(matchedData.question.description || '');

        // Update code with starter code if available
        if (matchedData.question.starterCode) {
          setCode(matchedData.question.starterCode);
        }

        // Update examples if available
        if (matchedData.question.examples && Array.isArray(matchedData.question.examples)) {
          setQuestionExamples(matchedData.question.examples);
        }

        // Update test cases if available
        if (matchedData.question.testCases && Array.isArray(matchedData.question.testCases)) {
          setTestCases(
            matchedData.question.testCases.map((tc, index: number) => ({
              id: `Case ${index + 1}`,
              input: tc.input || '',
              expected: tc.expected || '',
              explanation: tc.explanation || '',
            })),
          );
        }
      }
    });

    // Listen for code updates from partner
    socketService.onCodeUpdate((data) => {
      if (data.userId !== userId) {
        setCode(data.code);
      }
    });

    // Listen for language changes from partner
    socketService.onLanguageUpdate((data) => {
      if (data.userId !== userId) {
        const langKey = Object.keys(languageMap).find((key) => languageMap[key] === data.language);
        if (langKey) {
          setSelectedLanguage(data.language);
        }
      }
    });

    // Listen for chat messages from partner
    socketService.onChatMessage((data) => {
      if (data.userId !== userId) {
        const newMessage: Message = {
          id: Date.now(), // Use timestamp for unique IDs
          text: data.message,
          sender: 'partner',
        };
        setMessages((prev) => [...prev, newMessage]);
        setPartnerInfo({ userId: data.userId, username: data.username });
      }
    });

    // Listen for user joining
    socketService.onUserJoined((data) => {
      if (data.userId !== userId) {
        setPartnerInfo({ userId: data.userId, username: data.username });
        const welcomeMessage: Message = {
          id: Date.now(), // Use timestamp for unique IDs
          text: `${data.username} joined the session!`,
          sender: 'partner',
        };
        setMessages((prev) => [...prev, welcomeMessage]);
      }
    });

    // Listen for user leaving
    socketService.onUserLeft((data) => {
      if (data.userId !== userId) {
        const leaveMessage: Message = {
          id: Date.now(), // Use timestamp for unique IDs
          text: `${data.username} left the session.`,
          sender: 'partner',
        };
        setMessages((prev) => [...prev, leaveMessage]);
        setPartnerInfo(null);
      }
    });

    // Listen for code execution results
    socketService.on('code-execution-result', (data: unknown) => {
      console.log('Code execution result:', data);
      const rawResult = data as {
        success: boolean;
        passed?: number;
        failed?: number;
        total?: number;
        testResults?: Array<Record<string, unknown>>;
        error?: string;
      };
      const result = {
        ...rawResult,
        testResults: rawResult.testResults as TestResult[] | undefined,
      };
      setExecutionResults(result);
      setIsExecuting(false);
    });
  }, [userId, languageMap]);

  // Initialize collaboration session
  useEffect(() => {
    const initCollaboration = async () => {
      try {
        // Get session ID from URL parameters, sessionStorage, or create a test session
        const urlParams = new URLSearchParams(window.location.search);
        const sessionIdFromUrl = urlParams.get('sessionId');
        const sessionIdFromStorage = sessionStorage.getItem('collaborationSessionId');

        let finalSessionId;
        if (sessionIdFromUrl) {
          finalSessionId = sessionIdFromUrl;
        } else if (sessionIdFromStorage) {
          finalSessionId = sessionIdFromStorage;
        } else {
          // Create a test session for development
          finalSessionId = 'test-session-' + Date.now();
        }

        // Set the session ID
        setSessionId(finalSessionId);

        // Connect to collaboration service
        const socket = socketService.connect('test-token', userId);

        if (socket) {
          // Wait for connection to be established before joining session
          const waitForConnection = () => {
            return new Promise<void>((resolve) => {
              const checkConnection = () => {
                if (socketService.isConnected()) {
                  setIsConnected(true);
                  resolve();
                } else {
                  setTimeout(checkConnection, 100);
                }
              };
              checkConnection();
            });
          };

          try {
            // Wait for connection to be established
            await waitForConnection();
            console.log('Connection established, attempting to join session:', finalSessionId);

            // Join the session with the determined session ID - use userId directly
            await socketService.joinSession(finalSessionId, userId, { username: userId });
            console.log('Successfully joined session:', finalSessionId);

            // Set up event listeners
            setupSocketListeners();
          } catch (error) {
            console.error('Failed to join session:', error);
            // Still try to set up listeners even if join fails
            setupSocketListeners();
          }
        }
      } catch (error) {
        console.error('Failed to initialize collaboration:', error);
      }
    };

    initCollaboration();

    // Cleanup on unmount
    return () => {
      // Remove all listeners
      socketService.off('code-update');
      socketService.off('language-update');
      socketService.off('chat-message');
      socketService.off('user-joined');
      socketService.off('user-left');
      socketService.off('matched-session-ready');

      if (isConnected) {
        socketService.leaveSession();
        socketService.disconnect();
      }
    };
  }, [userId, setupSocketListeners, isConnected]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  // Handle code changes with real-time sync
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);

    // Send code change to collaboration service
    if (isConnected) {
      socketService.sendCodeChange(newCode);
    }
  };

  // Handle language changes with real-time sync
  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);

    // Send language change to collaboration service
    if (isConnected) {
      socketService.changeLanguage(newLanguage).catch(console.error);
    }
  };

  // Handle sending chat messages
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageToSend = newMessage.trim();

    // Add message to local state
    setMessages((prev) => {
      const next: Message = { id: Date.now(), text: messageToSend, sender: 'me' };
      return [...prev, next];
    });

    // Send message to collaboration service
    if (isConnected) {
      socketService.sendChatMessage(messageToSend, 'SessionUser');
    }

    setNewMessage('');
  };

  const currentTestCase = testCases.find((t) => t.id === selectedTestCase);

  return (
    <div className="h-(--hscreen) w-full">
      {/* Connection Status Bar */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-blue-700">
              {isConnected
                ? 'Connected to collaboration service'
                : 'Connecting to collaboration service...'}
            </span>
          </div>
          <div className="text-blue-600">Session ID: {sessionId}</div>
        </div>
      </div>

      <div className="flex h-full">
        {/* Left Panel - Problem Description and Chat */}
        <div className="min-w-[350px] max-w-[500px] w-1/3 h-full border-r border-border flex flex-col">
          {/* Problem Description */}
          <div className="h-3/5 min-h-[400px] overflow-y-auto border-b border-border">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-muted h-15">
              <h3 className="text-base font-semibold">Description</h3>
              <div className="text-lg cursor-pointer">&equiv;</div>
            </div>

            <div className="p-5">
              <h2 className="text-2xl font-bold mb-4">{questionTitle}</h2>
              <p className="text-sm text-secondary-foreground mb-5 whitespace-pre-wrap">
                {questionDescription}
              </p>

              {questionExamples.map((example, index: number) => (
                <div key={index} className="mb-5">
                  <h4 className="text-base font-semibold mb-2">Example {index + 1}:</h4>
                  <div className="bg-muted p-3 rounded border-l-4 border-attention">
                    {example.input && (
                      <p className="text-sm mb-2">
                        <strong>Input:</strong> {example.input}
                      </p>
                    )}
                    {example.output && (
                      <p className="text-sm mb-2">
                        <strong>Output:</strong> {example.output}
                      </p>
                    )}
                    {example.explanation && (
                      <p className="text-sm">
                        <strong>Explanation:</strong> {example.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-muted h-15 flex-shrink-0">
              <h3 className="text-base font-semibold">Messages</h3>
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
                {partnerInfo && (
                  <span className="text-xs text-blue-600">• {partnerInfo.username}</span>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-6 ${
                    message.sender === 'me'
                      ? 'bg-muted self-end ml-auto'
                      : 'bg-attention text-primary-foreground self-start'
                  }`}
                >
                  {message.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex-shrink-0">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:border-attention"
              />
            </form>
          </div>
        </div>

        {/* Center Panel - Code Editor */}
        <div className="flex-1 h-full flex flex-col border-r border-border">
          <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-muted h-15">
            <h3 className="text-base font-semibold">Code</h3>
            <div className="flex items-center">
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-2 py-1 border border-border rounded text-sm"
              >
                {languages.map((lang) => (
                  <option key={lang} value={languageMap[lang]}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 p-5">
            <MonacoCodeEditor
              value={code}
              language={selectedLanguage}
              onChange={handleCodeChange}
              theme="vs-dark"
              height="100%"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                automaticLayout: true,
                theme: 'vs-dark',
              }}
            />
          </div>
        </div>

        {/* Right Panel - Test Cases */}
        <div className="w-1/3 h-full flex flex-col max-w-[400px]">
          <div className="flex justify-between items-center px-4 h-15 border-b border-border bg-muted">
            <div className="flex gap-0">
              <button
                className={`px-4 py-2 text-sm cursor-pointer transition ${
                  activeTab === 'testCases'
                    ? 'text-attention border-b-2 border-attention font-semibold'
                    : 'text-muted-foreground hover:text-secondary-foreground'
                }`}
                onClick={() => setActiveTab('testCases')}
              >
                Test Cases
              </button>
              <button
                className={`px-4 py-2 text-sm cursor-pointer transition ${
                  activeTab === 'testResults'
                    ? 'text-attention border-b-2 border-attention font-semibold'
                    : 'text-muted-foreground hover:text-secondary-foreground'
                }`}
                onClick={() => setActiveTab('testResults')}
              >
                Test Results
              </button>
            </div>
            <button
              onClick={() => {
                if (isConnected && !isExecuting) {
                  setIsExecuting(true);
                  setActiveTab('testResults');
                  socketService.runCode();
                }
                console.log('Running code:', code);
              }}
              disabled={isExecuting || !isConnected}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                isExecuting || !isConnected
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              } text-primary-foreground`}
            >
              <span className="text-sm">{isExecuting ? '...' : '>'}</span>
              {isExecuting ? 'Running...' : 'Run'}
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto">
            {activeTab === 'testCases' && (
              <>
                <div className="flex gap-2 mb-4">
                  {testCases.map((testCase) => (
                    <Button
                      key={testCase.id}
                      onClick={() => setSelectedTestCase(testCase.id)}
                      variant={selectedTestCase === testCase.id ? 'attention' : 'outline'}
                    >
                      {testCase.id}
                    </Button>
                  ))}
                </div>

                {currentTestCase && (
                  <div className="bg-muted p-4 rounded-2xl">
                    {currentTestCase.input && (
                      <div className="mb-3">
                        <p className="text-sm text-secondary-foreground mb-1">Input:</p>
                        <p className="font-mono text-sm whitespace-pre-wrap">{currentTestCase.input}</p>
                      </div>
                    )}
                    {currentTestCase.expected && (
                      <div className="mb-3">
                        <p className="text-sm text-secondary-foreground mb-1">Expected Output:</p>
                        <p className="font-mono text-sm">{currentTestCase.expected}</p>
                      </div>
                    )}
                    {currentTestCase.explanation && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm text-secondary-foreground mb-1">Explanation:</p>
                        <p className="text-sm">{currentTestCase.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'testResults' && (
              <div className="space-y-4">
                {isExecuting ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-attention mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Running tests...</p>
                    </div>
                  </div>
                ) : executionResults ? (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-sm">
                        <span className="text-green-600 font-semibold">
                          {executionResults.passed || 0}
                        </span>{' '}
                        passed
                      </div>
                      <div className="text-sm">
                        <span className="text-red-600 font-semibold">
                          {executionResults.failed || 0}
                        </span>{' '}
                        failed
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">{executionResults.total || 0}</span>{' '}
                        total
                      </div>
                    </div>

                    {executionResults.error ? (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Error:</p>
                        <p className="text-sm text-red-700 dark:text-red-300 font-mono">
                          {executionResults.error}
                        </p>
                      </div>
                    ) : null}

                    {executionResults.testResults && executionResults.testResults.length > 0 ? (
                      <div className="space-y-2">
                        {executionResults.testResults.map(
                          (testResult: TestResult, index: number) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border ${
                                testResult.status === 'PASSED'
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold">Test {testResult.test}</span>
                                <span
                                  className={`text-sm px-2 py-1 rounded ${
                                    testResult.status === 'PASSED'
                                      ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                                      : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                                  }`}
                                >
                                  {testResult.status}
                                </span>
                              </div>
                              {testResult.got !== undefined && (
                                <div className="text-sm font-mono">
                                  Output: {JSON.stringify(testResult.got)}
                                </div>
                              )}
                              {testResult.error !== undefined && testResult.error && (
                                <div className="text-sm text-red-600 dark:text-red-400">
                                  {String(testResult.error)}
                                </div>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    No test results yet. Click Run to execute your code.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Session;
