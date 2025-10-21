#!/bin/bash

# Simple curl-based tests for Collaboration Service
# Make sure your services are running: docker-compose up -d

echo "🧪 Testing Collaboration Service Integration with curl"
echo "=================================================="

COLLAB_URL="http://localhost:8002"

# Test 1: Health check
echo "1️⃣ Testing health check..."
curl -s "${COLLAB_URL}/health" | jq '.' || echo "❌ Health check failed"
echo ""

# Test 2: Service health check
echo "2️⃣ Testing service health check..."
curl -s "${COLLAB_URL}/api/services/health" | jq '.' || echo "⚠️ Service health check failed (expected if other services not running)"
echo ""

# Test 3: Create matched session
echo "3️⃣ Testing matched session creation..."
SESSION_RESPONSE=$(curl -s -X POST "${COLLAB_URL}/api/sessions/matched" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["test-user-1", "test-user-2"],
    "questionId": "q-two-sum"
  }')

echo "Response:"
echo "$SESSION_RESPONSE" | jq '.' || echo "$SESSION_RESPONSE"

# Extract session ID if successful
SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.sessionId // empty')

if [ -n "$SESSION_ID" ]; then
  echo "✅ Session created with ID: $SESSION_ID"
  echo ""

  # Test 4: Check pending sessions
  echo "4️⃣ Testing pending sessions..."
  curl -s "${COLLAB_URL}/api/sessions/pending" | jq '.' || echo "❌ Pending sessions check failed"
  echo ""

  # Test 5: Get session by user ID
  echo "5️⃣ Testing get session by user ID..."
  curl -s "${COLLAB_URL}/api/sessions/user/test-user-1" | jq '.' || echo "❌ Get user session failed"
  echo ""

  # Test 6: Get session details
  echo "6️⃣ Testing get session details..."
  curl -s "${COLLAB_URL}/api/sessions/${SESSION_ID}" | jq '.' || echo "❌ Get session details failed"
  echo ""

else
  echo "❌ Session creation failed"
fi

echo "🎉 curl tests completed!"
echo ""
echo "📋 To test WebSocket connections, use the Node.js test script:"
echo "   node test-integration.js"
