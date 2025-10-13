import React, { useState } from 'react';
import './CollaborationPage.css';

const CollaborationPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('C++');
  const [activeTab, setActiveTab] = useState('testCases');
  const [selectedTestCase, setSelectedTestCase] = useState('Case 1');
  const [code, setCode] = useState(`class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {

    }
};`);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! Nice to meet you!", sender: 'me' },
    { id: 2, text: "Hi! Let's get started! I'm thinking that we can probably use a HashMap for this question, what do you think?", sender: 'partner' },
    { id: 3, text: "Yeah I think that's a good idea, let's try it! So I guess the next step for us would be to see how we can minimise the number of times we have to look through the array.", sender: 'me' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const languages = ['C++', 'Java', 'Python', 'JavaScript'];
  const testCases = [
    {
      id: 'Case 1',
      nums: '[2,7,11,15]',
      target: '9',
      expected: '[0,1]'
    },
    {
      id: 'Case 2',
      nums: '[3,2,4]',
      target: '6',
      expected: '[1,2]'
    },
    {
      id: 'Case 3',
      nums: '[3,3]',
      target: '6',
      expected: '[0,1]'
    }
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setMessages([...messages, { 
        id: messages.length + 1, 
        text: newMessage, 
        sender: 'me' 
      }]);
      setNewMessage('');
    }
  };

  const currentTestCase = testCases.find(tc => tc.id === selectedTestCase);

  return (
    <div className="collaboration-page">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1 className="brand">PeerPrep</h1>
        </div>
        <div className="header-right">
          <div className="partner-status">
            <div className="status-indicator"></div>
            <span>Partner 1</span>
          </div>
          <button className="leave-session-btn">Leave Session</button>
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
                Given an an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.
              </p>
              
              <div className="example">
                <h4>Example 1:</h4>
                <div className="example-content">
                  <p><strong>Input:</strong> nums = [2,7,11,15], target = 9</p>
                  <p><strong>Output:</strong> [0,1]</p>
                  <p><strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].</p>
                </div>
              </div>

              <div className="example">
                <h4>Example 2:</h4>
                <div className="example-content">
                  <p><strong>Input:</strong> nums = [3,2,4], target = 6</p>
                  <p><strong>Output:</strong> [1,2]</p>
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
              {messages.map(message => (
                <div key={message.id} className={`message ${message.sender}`}>
                  {message.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
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
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="language-dropdown"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="code-editor">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="code-textarea"
              spellCheck={false}
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
              {testCases.map(testCase => (
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
