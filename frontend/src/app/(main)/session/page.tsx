'use client';

import { Button } from '@/components/ui/button';
import MonacoCodeEditor from '@/components/MonacoCodeEditor';
import socketService from '@/services/socketService';
import React, { useState, useEffect, useRef } from 'react';

// Original React Code made by Basil - Enhanced with Collaboration

type Sender = 'me' | 'partner';

interface Message {
  id: number;
  text: string;
  sender: Sender;
}

interface TestCase {
  id: string;
  nums: string;
  target: string;
  expected?: string;
}

const Session = (): React.ReactElement => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('java');
  const [activeTab, setActiveTab] = useState<'testCases' | 'testResults'>('testCases');
  const [selectedTestCase, setSelectedTestCase] = useState<string>('Case 1');
  const [code, setCode] = useState<string>(`class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[0];
    }
}`);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hello! Nice to meet you!', sender: 'me' },
    {
      id: 2,
      text: "Hi! Let's get started! I'm thinking that we can probably use a HashMap for this question, what do you think?",
      sender: 'partner',
    },
    {
      id: 3,
      text: "Yeah I think that's a good idea, let's try it! So I guess the next step for us would be to see how we can minimise the number of times we have to look through the array.",
      sender: 'me',
    },
  ]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [sessionId] = useState<string>('session-' + Date.now());
  const [userId] = useState<string>('user-' + Math.random().toString(36).substr(2, 9));
  const [partnerInfo, setPartnerInfo] = useState<{ userId: string; username: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const languages: string[] = ['C++', 'Java', 'Python', 'JavaScript'];
  const languageMap: Record<string, string> = {
    'C++': 'cpp',
    'Java': 'java',
    'Python': 'python',
    'JavaScript': 'javascript',
  };

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize collaboration session
  useEffect(() => {
    const initCollaboration = async () => {
      try {
        // Connect to collaboration service
        const socket = socketService.connect('test-token', userId);
        
        if (socket) {
          // Join the session
          await socketService.joinSession(sessionId, userId, { username: 'SessionUser' });
          setIsConnected(true);
          
          // Set up event listeners
          setupSocketListeners();
        }
      } catch (error) {
        console.error('Failed to initialize collaboration:', error);
      }
    };

    initCollaboration();

    // Cleanup on unmount
    return () => {
      if (isConnected) {
        socketService.leaveSession();
        socketService.disconnect();
      }
    };
  }, []);

  // Set up socket event listeners
  const setupSocketListeners = () => {
    // Listen for code updates from partner
    socketService.onCodeUpdate((data) => {
      if (data.userId !== userId) {
        setCode(data.code);
      }
    });

    // Listen for language changes from partner
    socketService.onLanguageUpdate((data) => {
      if (data.userId !== userId) {
        const langKey = Object.keys(languageMap).find(key => languageMap[key] === data.language);
        if (langKey) {
          setSelectedLanguage(data.language);
        }
      }
    });

    // Listen for chat messages from partner
    socketService.onChatMessage((data) => {
      if (data.userId !== userId) {
        const newMessage: Message = {
          id: messages.length + 1,
          text: data.message,
          sender: 'partner',
        };
        setMessages(prev => [...prev, newMessage]);
        setPartnerInfo({ userId: data.userId, username: data.username });
      }
    });

    // Listen for user joining
    socketService.onUserJoined((data) => {
      if (data.userId !== userId) {
        setPartnerInfo({ userId: data.userId, username: data.username });
        const welcomeMessage: Message = {
          id: messages.length + 1,
          text: `${data.username} joined the session!`,
          sender: 'partner',
        };
        setMessages(prev => [...prev, welcomeMessage]);
      }
    });

    // Listen for user leaving
    socketService.onUserLeft((data) => {
      if (data.userId !== userId) {
        const leaveMessage: Message = {
          id: messages.length + 1,
          text: `${data.username} left the session.`,
          sender: 'partner',
        };
        setMessages(prev => [...prev, leaveMessage]);
        setPartnerInfo(null);
      }
    });
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const testCases: TestCase[] = [
    {
      id: 'Case 1',
      nums: '[2,7,11,15]',
      target: '9',
      expected: '[0,1]',
    },
    {
      id: 'Case 2',
      nums: '[3,2,4]',
      target: '6',
      expected: '[1,2]',
    },
    {
      id: 'Case 3',
      nums: '[3,3]',
      target: '6',
      expected: '[0,1]',
    },
  ];

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
      const nextId = (prev?.length ?? 0) + 1;
      const next: Message = { id: nextId, text: messageToSend, sender: 'me' };
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
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-blue-700">
              {isConnected ? 'Connected to collaboration service' : 'Connecting to collaboration service...'}
            </span>
          </div>
          <div className="text-blue-600">
            Session ID: {sessionId}
          </div>
        </div>
      </div>
      
      <div className="flex h-full">
        {/* Left Panel - Problem Description and Chat */}
        <div className="min-w-[350px] max-w-[500px] w-1/3 h-full border-r border-border flex flex-col">
          {/* Problem Description */}
          <div className="h-3/5 min-h-[400px] overflow-y-auto border-b border-border">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-muted h-15">
              <h3 className="text-base font-semibold">Description</h3>
              <div className="text-lg cursor-pointer">☰</div>
            </div>

            <div className="p-5">
              <h2 className="text-2xl font-bold mb-4">Two Sum</h2>
              <p className="text-sm text-secondary-foreground mb-5">
                Given an an array of integers nums and an integer target, return indices of the two
                numbers such that they add up to target. You may assume that each input would have
                exactly one solution, and you may not use the same element twice. You can return the
                answer in any order.
              </p>

              <div className="mb-5">
                <h4 className="text-base font-semibold mb-2">Example 1:</h4>
                <div className="bg-muted p-3 rounded border-l-4 border-attention">
                  <p className="text-sm mb-2">
                    <strong>Input:</strong> nums = [2,7,11,15], target = 9
                  </p>
                  <p className="text-sm mb-2">
                    <strong>Output:</strong> [0,1]
                  </p>
                  <p className="text-sm">
                    <strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-base font-semibold mb-2">Example 2:</h4>
                <div className="bg-muted p-3 rounded border-l-4 border-attention">
                  <p className="text-sm mb-2">
                    <strong>Input:</strong> nums = [3,2,4], target = 6
                  </p>
                  <p className="text-sm">
                    <strong>Output:</strong> [1,2]
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-muted h-15">
              <h3 className="text-base font-semibold">Messages</h3>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
                {partnerInfo && (
                  <span className="text-xs text-blue-600">
                    • {partnerInfo.username}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
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

            <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
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
                if (isConnected) {
                  socketService.runCode();
                }
                console.log('Running code:', code);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 rounded text-sm hover:bg-green-600 text-primary-foreground"
            >
              <span className="text-sm">▶</span>
              Run
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto">
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
                <div className="flex items-center mb-3">
                  <span className="mr-2 text-secondary-foreground font-medium">nums =</span>
                  <span className="font-mono px-2 py-1">{currentTestCase.nums}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 text-secondary-foreground font-medium">target =</span>
                  <span className="font-mono px-2 py-1">{currentTestCase.target}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Session;
