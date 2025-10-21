# Collaboration Service

A real-time collaboration microservice for PeerPrep that enables two users to code together on programming problems with live synchronization, chat, and session management.

## Features

- **Real-time Code Collaboration** - Live code editing with cursor synchronization
- **Multi-language Support** - JavaScript, Python, Java, C++, and more
- **Chat System** - In-session messaging between users
- **Typing Indicators** - Show when partner is typing
- **Session Management** - Create, join, and manage collaboration sessions
- **Question Integration** - Pre-loaded with problem details from Question Service
- **Matched Sessions** - Pre-authorized sessions created by Matching Service
- **Health Monitoring** - Service status and dependency health checks
- **Auto Cleanup** - Empty sessions automatically deleted after 5 minutes

## Architecture

### Core Components
- **SessionManager** - Manages session state, user joining/leaving
- **ServiceIntegration** - HTTP communication with other microservices
- **SocketHandlers** - Real-time WebSocket event management
- **SocketAuth** - WebSocket authentication middleware
- **Redis** - Optional caching and session persistence

### External Dependencies
- **Question Service** - Fetches problem details
- **Matching Service** - Receives matched users & notifies when ready
- **User Service** - Fetches user details
- **Redis** - Session caching and persistence

## API Endpoints

### REST Endpoints

#### Health & Monitoring
```http
GET  /health                    # Service health check
GET  /api/services/health       # Health check for all services
```

#### Session Management
```http
GET  /api/sessions              # Get all sessions stats (admin)
GET  /api/sessions/pending      # Get pending sessions (debugging)
GET  /api/sessions/user/:userId # Get session by user ID
GET  /api/sessions/:sessionId   # Get specific session details
POST /api/sessions              # Create new session
POST /api/sessions/matched      # Create matched session (called by Matching Service)
```

### WebSocket Events

#### Connection Events
```javascript
// Incoming Events (from clients)
'join-session'      // User joins a session
'leave-session'     // User leaves session
'disconnect'        // User disconnects
'error'            // Socket error handling
```

#### Collaboration Events
```javascript
// Incoming Events (from clients)
'code-change'       // User changes code
'cursor-position'   // User moves cursor
'language-change'   // User changes programming language
'request-sync'      // User requests session state
'run-code'         // User runs code
```

#### Communication Events
```javascript
// Incoming Events (from clients)
'chat-message'      // User sends chat message
'typing-start'      // User starts typing
'typing-stop'       // User stops typing
```

#### Outgoing Events (to clients)
```javascript
// Broadcast Events (to all users in session)
'user-joined'           // New user joined
'user-left'            // User left
'user-disconnected'    // User disconnected
'code-update'          // Code changed
'cursor-update'        // Cursor moved
'language-update'      // Language changed
'chat-message'         // Chat message
'user-typing'          // Typing indicator
'matched-session-ready' // Both users joined matched session
'code-running'         // Code execution started
```

## Usage Examples

### REST API Usage

#### 1. Health Check
```bash
curl http://localhost:8002/health
```

#### 2. Create Matched Session (Matching Service)
```bash
curl -X POST http://localhost:8002/api/sessions/matched \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user1", "user2"],
    "questionId": "68ebb93667c84a099513124d"
  }'
```

#### 3. Get Session Details
```bash
curl http://localhost:8002/api/sessions/session-123
```

#### 4. Get Pending Sessions
```bash
curl http://localhost:8002/api/sessions/pending
```

### WebSocket Usage

#### 1. Connect and Join Session
```javascript
const socket = io('http://localhost:8002');

// Join a session
socket.emit('join-session', {
  sessionId: 'session-123',
  userId: 'user1',
  userInfo: { username: 'Alice' }
}, (response) => {
  console.log('Joined:', response);
});

// Listen for events
socket.on('user-joined', (data) => {
  console.log('User joined:', data);
});

socket.on('code-update', (data) => {
  console.log('Code updated:', data);
});
```

#### 2. Send Code Changes
```javascript
socket.emit('code-change', {
  sessionId: 'session-123',
  code: 'function solve() { return 42; }',
  cursorPosition: { line: 1, column: 20 },
  userId: 'user1'
});
```

#### 3. Send Chat Messages
```javascript
socket.emit('chat-message', {
  sessionId: 'session-123',
  message: 'Hello partner!',
  userId: 'user1',
  username: 'Alice'
});
```

#### 4. Change Programming Language
```javascript
socket.emit('language-change', {
  sessionId: 'session-123',
  language: 'python',
  userId: 'user1'
}, (response) => {
  console.log('Language changed:', response);
});
```

## Session Lifecycle

### 1. Session Creation
- **Matching Service** calls `POST /api/sessions/matched`
- **Collaboration Service** fetches question details from Question Service
- **Session** created with generated `sessionId` and stored in `pendingSessions`
- **Matching Service** notified that session is ready

### 2. User Connection
- **Users** navigate to frontend session page
- **Frontend** connects to WebSocket (`ws://localhost:8002`)
- **Users** join session via `join-session` event
- **Session** validates user authorization (for matched sessions)

### 3. Active Collaboration
- **Real-time code editing** with `code-change` events
- **Cursor synchronization** with `cursor-position` events
- **Chat messaging** with `chat-message` events
- **Language switching** with `language-change` events
- **Typing indicators** with `typing-start/stop` events

### 4. Session Cleanup
- **Empty sessions** automatically deleted after 5 minutes
- **User disconnections** handled gracefully
- **Session state** maintained for reconnections

## Development

### Prerequisites
- Node.js 18+
- Redis (optional)
- Docker & Docker Compose

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Format code
npm run format
```

### Docker
```bash
# Build image
docker build -t collaboration-service .

# Run container
docker run -p 8002:8002 collaboration-service
```

## Session Data Structure

```javascript
{
  id: "session-123",
  users: [
    {
      userId: "user1",
      socketId: "socket123",
      username: "Alice",
      joinedAt: 1234567890
    }
  ],
  code: "function solve() { ... }",
  language: "javascript",
  problem: {
    title: "Two Sum",
    description: "Given an array of integers...",
    difficulty: "Easy",
    testCases: [...],
    constraints: [...]
  },
  questionId: "q123",
  matchedUserIds: ["user1", "user2"],
  isMatchedSession: true,
  createdAt: 1234567890,
  lastActivity: 1234567890
}
```

## Security

### Authentication
- **Production**: JWT token validation for WebSocket connections
- **Development**: Authentication disabled for testing

### Authorization
- **Matched Sessions**: Only users in `matchedUserIds` can join
- **Session Validation**: Users must be in the session they claim to be in
- **Rate Limiting**: Built-in protection against abuse

## Monitoring

### Health Checks
- **Service Health**: `GET /health` - Basic service status
- **Dependencies**: `GET /api/services/health` - External service status
- **Session Stats**: Real-time session and user counts

### Logging
- **Connection Events**: User joins, leaves, disconnects
- **Session Events**: Creation, activation, cleanup
- **Error Handling**: Comprehensive error logging and recovery

## Deployment

### Docker Compose
```yaml
collaboration-service:
  build: ./backend/collaboration-service
  ports:
    - "8002:8002"
  env_file:
    - ./backend/collaboration-service/.env.docker
  depends_on:
    redis:
      condition: service_healthy
    matching-service:
      condition: service_healthy
    question-service:
      condition: service_healthy
  networks:
    - peerprep-network
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8002/health"]
    interval: 30s
    timeout: 3s
    retries: 3
    start_period: 10s
  restart: unless-stopped
```

### Production Considerations
- **Redis**: Enable for session persistence and horizontal scaling
- **Load Balancing**: Multiple instances can share Redis sessions
- **Monitoring**: Set up health check monitoring
- **Logging**: Configure structured logging for production

## Integration

### With Matching Service
1. **Matching Service** calls `POST /api/sessions/matched`
2. **Collaboration Service** creates session and fetches question details
3. **Collaboration Service** notifies **Matching Service** that session is ready
4. **Matching Service** redirects users to frontend session page

### With Question Service
1. **Collaboration Service** calls `GET /api/questions/{questionId}`
2. **Question Service** returns problem details
3. **Collaboration Service** includes question in session data

### With Frontend
1. **Frontend** connects to WebSocket
2. **Frontend** joins session via `join-session` event
3. **Real-time collaboration** begins with bidirectional communication

## Troubleshooting

### Common Issues

#### WebSocket Connection Failed
- Check if service is running on port 8002
- Verify CORS settings
- Check authentication tokens

#### Session Not Found
- Verify session ID is correct
- Check if session has expired
- Ensure user is authorized for matched sessions

#### Question Details Not Loading
- Check Question Service connectivity
- Verify question ID exists
- Check service health endpoints

### Debug Endpoints
- `GET /api/sessions/pending` - View pending sessions
- `GET /api/services/health` - Check service dependencies
- `GET /health` - Basic service status

---

**Collaboration Service** - Powering real-time coding collaboration for PeerPrep! 
