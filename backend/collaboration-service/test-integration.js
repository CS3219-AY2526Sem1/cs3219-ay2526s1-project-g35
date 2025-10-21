#!/usr/bin/env node

/**
 * Test script for Collaboration Service integration
 * Simulates Matching Service calling Collaboration Service
 */

const axios = require('axios');

const COLLABORATION_SERVICE_URL = 'http://localhost:8002';
const QUESTION_SERVICE_URL = 'http://localhost:8001';

async function testCollaborationService() {
  console.log('🧪 Testing Collaboration Service Integration\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await axios.get(`${COLLABORATION_SERVICE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Service health check
    console.log('2️⃣ Testing service health check...');
    try {
      const serviceHealthResponse = await axios.get(`${COLLABORATION_SERVICE_URL}/api/services/health`);
      console.log('✅ Service health check passed:', serviceHealthResponse.data);
    } catch (error) {
      console.log('⚠️ Service health check failed (expected if other services not running):', error.response?.data || error.message);
    }
    console.log('');

    // Test 3: Create matched session (simulate Matching Service)
    console.log('3️⃣ Testing matched session creation...');
    const matchedSessionData = {
      userIds: ['test-user-1', 'test-user-2'],
      questionId: '68ebb93667c84a099513124d' // Assuming this question exists
    };

    try {
      const sessionResponse = await axios.post(
        `${COLLABORATION_SERVICE_URL}/api/sessions/matched`,
        matchedSessionData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      console.log('✅ Matched session created successfully!');
      console.log('Session ID:', sessionResponse.data.sessionId);
      console.log('Matched Users:', sessionResponse.data.matchedUserIds);
      console.log('Question ID:', sessionResponse.data.questionId);
      console.log('Question Details:', sessionResponse.data.questionDetails ? '✅ Fetched' : '❌ Not fetched');
      console.log('Notification Sent:', sessionResponse.data.notificationSent);
      
      const sessionId = sessionResponse.data.sessionId;
      console.log('');

      // Test 4: Check pending sessions
      console.log('4️⃣ Testing pending sessions...');
      const pendingResponse = await axios.get(`${COLLABORATION_SERVICE_URL}/api/sessions/pending`);
      console.log('✅ Pending sessions:', pendingResponse.data.pendingSessions.length);
      console.log('');

      // Test 5: Get session by user ID
      console.log('5️⃣ Testing get session by user ID...');
      const userSessionResponse = await axios.get(`${COLLABORATION_SERVICE_URL}/api/sessions/user/test-user-1`);
      console.log('✅ User session found:', userSessionResponse.data.sessionId);
      console.log('');

      // Test 6: Get session details
      console.log('6️⃣ Testing get session details...');
      const sessionDetailsResponse = await axios.get(`${COLLABORATION_SERVICE_URL}/api/sessions/${sessionId}`);
      console.log('✅ Session details:', sessionDetailsResponse.data.session);
      console.log('');

      return sessionId;

    } catch (error) {
      console.log('❌ Matched session creation failed:', error.response?.data || error.message);
      return null;
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return null;
  }
}

async function testWebSocketConnection(sessionId) {
  if (!sessionId) {
    console.log('⚠️ Skipping WebSocket test - no session ID available');
    return;
  }

  console.log('7️⃣ Testing WebSocket connection...');
  
  try {
    const { io } = require('socket.io-client');
    const socket = io(COLLABORATION_SERVICE_URL);

    return new Promise((resolve) => {
      socket.on('connect', () => {
        console.log('✅ WebSocket connected');

        // Test joining session
        socket.emit('join-session', {
          sessionId: sessionId,
          userId: 'test-user-1',
          userInfo: { username: 'TestUser1' }
        });

        socket.on('join-session-response', (data) => {
          console.log('✅ Join session response:', data.success);
          if (data.success) {
            console.log('Session type:', data.isMatchedSession ? 'Matched Session' : 'Regular Session');
          }
          socket.disconnect();
          resolve();
        });

        socket.on('error', (error) => {
          console.log('❌ WebSocket error:', error);
          socket.disconnect();
          resolve();
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          console.log('⏰ WebSocket test timeout');
          socket.disconnect();
          resolve();
        }, 5000);
      });

      socket.on('connect_error', (error) => {
        console.log('❌ WebSocket connection failed:', error.message);
        resolve();
      });
    });

  } catch (error) {
    console.log('⚠️ WebSocket test skipped (socket.io-client not available):', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Collaboration Service Integration Tests\n');
  
  const sessionId = await testCollaborationService();
  await testWebSocketConnection(sessionId);
  
  console.log('\n🎉 Test suite completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Start your services: docker-compose up -d');
  console.log('2. Run this test: node test-integration.js');
  console.log('3. Check logs for any errors');
  console.log('4. Test with real Matching Service when ready');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testCollaborationService, testWebSocketConnection };
