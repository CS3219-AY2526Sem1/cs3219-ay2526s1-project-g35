# Testing Guide for Collaboration Service Integration

## 🚀 **Quick Start Testing**

### **1. Start All Services**
```bash
cd /path/to/CS3219\ PeerPrep
docker-compose up -d --build
```

### **2. Run Automated Tests**
```bash
cd backend/collaboration-service

# Option A: Node.js comprehensive test
node test-integration.js

# Option B: Simple curl tests
./test-curl.sh
```

---

## 🧪 **Manual Testing Steps**

### **Step 1: Verify Services are Running**
```bash
# Check if services are up
docker-compose ps

# Check collaboration service health
curl http://localhost:8002/health
```

### **Step 2: Test Service Integration**
```bash
# Test service health (will fail if other services not running - that's OK)
curl http://localhost:8002/api/services/health
```

### **Step 3: Simulate Matching Service Call**
```bash
curl -X POST http://localhost:8002/api/sessions/matched \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user1", "user2"],
    "questionId": "q-two-sum"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "sessionId": "session-1703123456789-abc123def",
  "matchedUserIds": ["user1", "user2"],
  "questionId": "q-two-sum",
  "questionDetails": { ... },
  "notificationSent": false
}
```

### **Step 4: Test Session Management**
```bash
# Get pending sessions
curl http://localhost:8002/api/sessions/pending

# Get session by user ID (use sessionId from step 3)
curl http://localhost:8002/api/sessions/user/user1

# Get session details
curl http://localhost:8002/api/sessions/{sessionId}
```

---

## 🔌 **WebSocket Testing**

### **Using Browser Console:**
```javascript
// Connect to collaboration service
const socket = io('http://localhost:8002');

// Join a session (use sessionId from API test)
socket.emit('join-session', {
  sessionId: 'session-1703123456789-abc123def',
  userId: 'user1',
  userInfo: { username: 'TestUser' }
});

// Listen for responses
socket.on('join-session-response', (data) => {
  console.log('Join response:', data);
});

socket.on('matched-session-ready', (data) => {
  console.log('Session ready:', data);
});
```

### **Using Node.js Test Script:**
```bash
node test-integration.js
```

---

## 🐛 **Troubleshooting**

### **Common Issues:**

#### **1. Services Not Starting**
```bash
# Check logs
docker-compose logs collaboration-service
docker-compose logs question-service
docker-compose logs matching-service

# Restart services
docker-compose down
docker-compose up -d --build
```

#### **2. Question Service Not Available**
- **Expected**: `questionDetails: null` in response
- **Action**: Start question service or check if question ID exists

#### **3. Matching Service Not Available**
- **Expected**: `notificationSent: false` in response
- **Action**: Start matching service or ignore (not critical for testing)

#### **4. WebSocket Connection Failed**
- **Check**: Collaboration service is running on port 8002
- **Check**: No firewall blocking WebSocket connections
- **Test**: `curl http://localhost:8002/health`

---

## 📊 **Test Scenarios**

### **Scenario 1: Happy Path**
1. All services running
2. Valid question ID
3. Two valid user IDs
4. **Expected**: Session created with question details

### **Scenario 2: Question Service Down**
1. Collaboration service running
2. Question service down
3. **Expected**: Session created without question details

### **Scenario 3: Invalid Input**
1. Missing userIds or questionId
2. **Expected**: 400 error with validation message

### **Scenario 4: WebSocket Join**
1. Session created via API
2. User joins via WebSocket
3. **Expected**: Successful join with session data

---

## 🎯 **Integration Testing with Real Services**

### **When Matching Service is Ready:**
1. **Matching Service** calls `POST /api/sessions/matched`
2. **Collaboration Service** fetches question details
3. **Collaboration Service** notifies Matching Service
4. **Users** join via WebSocket using returned sessionId

### **Testing End-to-End:**
1. Start all services
2. Use Matching Service to create a match
3. Verify Collaboration Service receives the call
4. Test WebSocket connection from frontend
5. Verify real-time collaboration works

---

## 📝 **Test Results Checklist**

- [ ] Collaboration service health check passes
- [ ] Service health check works (may fail if other services down)
- [ ] Matched session creation works
- [ ] Session ID is generated correctly
- [ ] Question details are fetched (if question service available)
- [ ] Pending sessions endpoint works
- [ ] Get session by user ID works
- [ ] WebSocket connection works
- [ ] Join session via WebSocket works
- [ ] Session authorization works (only matched users can join)

---

## 🚀 **Next Steps After Testing**

1. **Fix any issues** found during testing
2. **Share test results** with your team
3. **Coordinate with Matching Service team** for integration
4. **Test with real frontend** when ready
5. **Monitor logs** for any runtime issues
