import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import socketService from '../services/socketService';
import './CollaborationPage.css';

const CollaborationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get session ID from URL params or generate one
  const sessionId = searchParams.get('sessionId') || `session-${Date.now()}`;
  const userId = searchParams.get('userId') || `user-${Math.random().toString(36).substr(2, 9)}`;
  const username = searchParams.get('username') || 'Anonymous';

  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [activeTab, setActiveTab] = useState('testCases');
  const [selectedTestCase, setSelectedTestCase] = useState('Case 1');
  const [code, setCode] = useState(`function twoSum(nums, target) {
    // Your code here
    
}`);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  const codeChangeDebounce = useRef(null);
  const typingTimeout = useRef(null);

  const languages = ['javascript', 'python', 'java', 'cpp'];
  const languageLabels = {
    javascript: 'JavaScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
  };

  const testCases = [
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

  // Initialize socket connection on mount
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        // Connect to socket service
        const token = localStorage.getItem('authToken') || '';
        socketService.connect(token, userId);

        // Join the collaboration session
        const result = await socketService.joinSession(sessionId, userId, { username });

        setIsConnected(true);
        setConnectionStatus('Connected');

        // Load initial session data
        if (result.session) {
          if (result.session.code) setCode(result.session.code);
          if (result.session.language) setSelectedLanguage(result.session.language);

          // Set partner info if there's another user
          const partner = result.session.users?.find((u) => u.userId !== userId);
          if (partner) {
            setPartnerInfo(partner);
          }
        }

        console.log('Joined session:', result);
      } catch (error) {
        console.error('Failed to join session:', error);
        setConnectionStatus('Connection failed');
      }
    };

    initializeSocket();

    // Setup socket event listeners
    setupSocketListeners();

    // Cleanup on unmount
    return () => {
      socketService.leaveSession();
      removeSocketListeners();
    };
  }, [sessionId, userId, username]);

  // Setup socket event listeners
  const setupSocketListeners = () => {
    // Code updates from partner
    socketService.onCodeUpdate((data) => {
      if (data.userId !== userId) {
        setCode(data.code);
      }
    });

    // Language changes
    socketService.onLanguageUpdate((data) => {
      if (data.userId !== userId) {
        setSelectedLanguage(data.language);
      }
    });

    // Chat messages
    socketService.onChatMessage((data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: data.message,
          sender: data.userId === userId ? 'me' : 'partner',
          username: data.username,
          timestamp: data.timestamp,
        },
      ]);
    });

    // User joined
    socketService.onUserJoined((data) => {
      if (data.userId !== userId) {
        setPartnerInfo({ userId: data.userId, username: data.username });
        setConnectionStatus(`Connected with ${data.username}`);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: `${data.username} joined the session`,
            sender: 'system',
            timestamp: data.timestamp,
          },
        ]);
      }
    });

    // User left
    socketService.onUserLeft((data) => {
      if (data.userId !== userId) {
        setPartnerInfo(null);
        setConnectionStatus('Partner left');
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: `${data.username} left the session`,
            sender: 'system',
            timestamp: data.timestamp,
          },
        ]);
      }
    });

    // User disconnected
    socketService.onUserDisconnected((data) => {
      if (data.userId !== userId) {
        setPartnerInfo(null);
        setConnectionStatus('Partner disconnected');
      }
    });

    // Typing indicator
    socketService.onUserTyping((data) => {
      if (data.userId !== userId) {
        setIsPartnerTyping(data.isTyping);
      }
    });
  };

  // Remove socket listeners
  const removeSocketListeners = () => {
    socketService.off('code-update');
    socketService.off('language-update');
    socketService.off('chat-message');
    socketService.off('user-joined');
    socketService.off('user-left');
    socketService.off('user-disconnected');
    socketService.off('user-typing');
  };

  // Handle code changes with debouncing
  const handleCodeChange = (newCode) => {
    setCode(newCode);

    // Debounce code changes to avoid sending too many updates
    if (codeChangeDebounce.current) {
      clearTimeout(codeChangeDebounce.current);
    }

    codeChangeDebounce.current = setTimeout(() => {
      socketService.sendCodeChange(newCode);
    }, 300);
  };

  // Handle language change
  const handleLanguageChange = async (newLanguage) => {
    setSelectedLanguage(newLanguage);
    try {
      await socketService.changeLanguage(newLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  // Handle sending chat message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socketService.sendChatMessage(newMessage, username);
      setNewMessage('');

      // Stop typing indicator
      socketService.sendTypingStop();
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    }
  };

  // Handle typing in chat
  const handleChatInputChange = (e) => {
    setNewMessage(e.target.value);

    // Send typing indicator
    socketService.sendTypingStart(username);

    // Clear existing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Stop typing indicator after 2 seconds of no input
    typingTimeout.current = setTimeout(() => {
      socketService.sendTypingStop();
    }, 2000);
  };

  // Handle leaving session
  const handleLeaveSession = async () => {
    if (window.confirm('Are you sure you want to leave this session?')) {
      await socketService.leaveSession();
      socketService.disconnect();
      navigate('/');
    }
  };

  const currentTestCase = testCases.find((tc) => tc.id === selectedTestCase);

  return (
    <div className="collaboration-page">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1 className="brand">PeerPrep</h1>
          <span className="session-id">Session: {sessionId.substring(0, 8)}...</span>
        </div>
        <div className="header-right">
          <div className="partner-status">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
            <span>{partnerInfo ? partnerInfo.username : connectionStatus}</span>
          </div>
          <button className="leave-session-btn" onClick={handleLeaveSession}>
            Leave Session
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Panel - Problem Description and Chat */}
        <div className="left-panel">
          {/* Problem Description */}
          <div className="problem-section">
            <div className="section-header">
              <h3>Description</h3>
              <div className="menu-icon">☰</div>
            </div>
            <div className="problem-content">
              <h2 className="problem-title">Two Sum</h2>
              <p className="problem-statement">
                Given an an array of integers nums and an integer target, return indices of the two
                numbers such that they add up to target. You may assume that each input would have
                exactly one solution, and you may not use the same element twice. You can return the
                answer in any order.
              </p>

              <div className="example">
                <h4>Example 1:</h4>
                <div className="example-content">
                  <p>
                    <strong>Input:</strong> nums = [2,7,11,15], target = 9
                  </p>
                  <p>
                    <strong>Output:</strong> [0,1]
                  </p>
                  <p>
                    <strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].
                  </p>
                </div>
              </div>

              <div className="example">
                <h4>Example 2:</h4>
                <div className="example-content">
                  <p>
                    <strong>Input:</strong> nums = [3,2,4], target = 6
                  </p>
                  <p>
                    <strong>Output:</strong> [1,2]
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="chat-section">
            <div className="section-header">
              <h3>Messages</h3>
              <div className="chat-indicator">
                <div className="status-dot"></div>
              </div>
            </div>
            <div className="chat-messages">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.sender}`}>
                  {message.sender === 'system' ? (
                    <em className="system-message">{message.text}</em>
                  ) : (
                    <>
                      <span className="message-username">{message.username || 'You'}: </span>
                      {message.text}
                    </>
                  )}
                </div>
              ))}
              {isPartnerTyping && (
                <div className="typing-indicator">
                  <em>{partnerInfo?.username || 'Partner'} is typing...</em>
                </div>
              )}
            </div>
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                value={newMessage}
                onChange={handleChatInputChange}
                placeholder="Type a message..."
                className="chat-input"
              />
            </form>
          </div>
        </div>

        {/* Center Panel - Code Editor */}
        <div className="center-panel">
          <div className="section-header">
            <h3>Code</h3>
            <div className="language-selector">
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="language-dropdown"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {languageLabels[lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="code-editor">
            <textarea
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="code-textarea"
              spellCheck={false}
              placeholder="Start typing your code here... Changes will be synced in real-time!"
            />
          </div>
        </div>

        {/* Right Panel - Test Cases */}
        <div className="right-panel">
          <div className="section-header">
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'testCases' ? 'active' : ''}`}
                onClick={() => setActiveTab('testCases')}
              >
                Test Cases
              </button>
              <button
                className={`tab ${activeTab === 'testResults' ? 'active' : ''}`}
                onClick={() => setActiveTab('testResults')}
              >
                Test Results
              </button>
            </div>
            <button className="run-btn">
              <span className="run-icon">▶</span>
              Run
            </button>
          </div>

          <div className="test-cases">
            <div className="test-case-selector">
              {testCases.map((testCase) => (
                <button
                  key={testCase.id}
                  className={`test-case-btn ${selectedTestCase === testCase.id ? 'active' : ''}`}
                  onClick={() => setSelectedTestCase(testCase.id)}
                >
                  {testCase.id}
                </button>
              ))}
            </div>

            {currentTestCase && (
              <div className="test-case-details">
                <div className="input-field">
                  <label>nums =</label>
                  <span className="input-value">{currentTestCase.nums}</span>
                </div>
                <div className="input-field">
                  <label>target =</label>
                  <span className="input-value">{currentTestCase.target}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPage;
