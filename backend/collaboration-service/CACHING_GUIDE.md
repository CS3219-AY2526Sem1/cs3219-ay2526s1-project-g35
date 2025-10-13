# Caching Strategy for Collaboration Service

## 📊 Overview

The collaboration service uses a **hybrid caching approach**:
- **In-memory (SessionManager)**: Fast access for active sessions
- **Redis (SessionCache)**: Persistence and horizontal scaling

## 🎯 What Should Be Cached

### ✅ Cache These

| Data | Why | TTL | Storage |
|------|-----|-----|---------|
| **Session State** | Survive restarts, enable scaling | 1 hour | Redis |
| **User → Session Mapping** | Quick lookup, prevent duplicates | 1 hour | Redis |
| **Session Participants** | Capacity checking (max 2) | 1 hour | Redis Set |
| **Code History** | Undo/recovery (last 10 versions) | 1 hour | Redis List |
| **Latest Code** | Session persistence | 1 hour | Redis |

### ❌ Don't Cache These

| Data | Why Not |
|------|---------|
| **Real-time Code Updates** | Too frequent, use WebSocket only |
| **Cursor Positions** | Ephemeral, no persistence value |
| **Typing Indicators** | Real-time only |
| **Individual Chat Messages** | Unless you need history |

## 🚀 Implementation Guide

### Step 1: Initialize Cache in app.js

```javascript
// app.js
const sessionCache = require('./utils/sessionCache');

const startServer = async () => {
  // Initialize Redis cache
  await sessionCache.init();
  
  // Start server
  server.listen(PORT, () => {
    console.log('Server started');
  });
};
```

### Step 2: Update SessionManager to Use Cache

**Hybrid Approach:**
1. Store in memory (fast)
2. Persist to Redis (durability)
3. Read from memory first, Redis as fallback

```javascript
// SessionManager.js
const sessionCache = require('../utils/sessionCache');

class SessionManager {
  async createSession(sessionId, initialData) {
    // Create in memory
    this.sessions.set(sessionId, sessionData);
    
    // Cache in Redis
    await sessionCache.cacheSession(sessionId, sessionData);
    
    return { success: true, sessionId };
  }

  async joinSession(sessionId, userId, socketId, userInfo) {
    // Check Redis for capacity
    const isFull = await sessionCache.isSessionFull(sessionId);
    if (isFull) {
      return { success: false, error: 'Session is full' };
    }

    // Check if user already in another session
    const existingSession = await sessionCache.getUserSession(userId);
    if (existingSession && existingSession !== sessionId) {
      return { success: false, error: 'Already in another session' };
    }

    // Add to memory
    const session = this.sessions.get(sessionId);
    session.users.push({ userId, socketId, username: userInfo.username });

    // Add to Redis
    await sessionCache.addUserToSession(sessionId, userId, userInfo.username);
    await sessionCache.cacheSession(sessionId, session);

    return { success: true, session };
  }

  async updateCode(sessionId, code) {
    // Update memory
    const session = this.sessions.get(sessionId);
    session.code = code;

    // Cache in Redis (with history)
    await sessionCache.cacheSession(sessionId, session);
    await sessionCache.cacheCodeHistory(sessionId, code);

    return { success: true };
  }
}
```

### Step 3: Add Cache Recovery on Restart

```javascript
// app.js - on startup
const recoverSessions = async () => {
  const activeSessions = await sessionCache.getAllActiveSessions();
  
  for (const sessionId of activeSessions) {
    const sessionData = await sessionCache.getSession(sessionId);
    if (sessionData) {
      // Restore to memory (but mark users as disconnected)
      sessionData.users = []; // Users need to reconnect
      sessionManager.sessions.set(sessionId, sessionData);
      console.log(`Recovered session: ${sessionId}`);
    }
  }
};

startServer();
recoverSessions();
```

## 🔧 Configuration

### Redis Settings (env.example)

```env
# Enable Redis caching
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379

# Session TTL (1 hour)
SESSION_TTL=3600

# Code history limit
CODE_HISTORY_LIMIT=10
```

### Development vs Production

**Development:**
```env
REDIS_ENABLED=false  # Use in-memory only
```

**Production:**
```env
REDIS_ENABLED=true
REDIS_URL=redis://production-redis:6379
```

## 📈 Performance Benefits

### Without Caching (Current)
- ❌ Sessions lost on server restart
- ❌ Can't scale horizontally (multiple instances)
- ❌ No session history/undo
- ❌ Users disconnected = session data lost

### With Redis Caching
- ✅ Sessions survive restarts
- ✅ Horizontal scaling (multiple server instances share Redis)
- ✅ Code history for undo/recovery
- ✅ Better user experience (reconnect to existing session)
- ✅ Automatic cleanup with TTL

## 🎯 Cache Hit Optimization

### Hot Path: Session Access

```javascript
// Optimized: Memory first, Redis fallback
getSession(sessionId) {
  // Try memory (fast)
  let session = this.sessions.get(sessionId);
  
  if (!session) {
    // Fallback to Redis
    session = await sessionCache.getSession(sessionId);
    
    if (session) {
      // Restore to memory
      this.sessions.set(sessionId, session);
    }
  }
  
  return session;
}
```

### Write-Through Pattern

```javascript
// Update both memory and Redis
updateCode(sessionId, code) {
  // Write to memory (fast)
  const session = this.sessions.get(sessionId);
  session.code = code;
  
  // Write to Redis (async, non-blocking)
  sessionCache.cacheSession(sessionId, session).catch(err => {
    console.error('Redis write failed:', err);
  });
}
```

## 🔍 Monitoring & Debugging

### Cache Statistics Endpoint

```javascript
// app.js
app.get('/api/cache/stats', async (req, res) => {
  const stats = await sessionCache.getStats();
  res.json(stats);
});
```

**Response:**
```json
{
  "available": true,
  "totalSessions": 5,
  "totalKeys": 23,
  "memoryUsage": "12.5 MB"
}
```

### Debug Cache Misses

```javascript
// Add logging
async getSession(sessionId) {
  const memoryHit = this.sessions.has(sessionId);
  console.log(`Session ${sessionId}: Memory ${memoryHit ? 'HIT' : 'MISS'}`);
  
  if (!memoryHit) {
    const redisSession = await sessionCache.getSession(sessionId);
    console.log(`Session ${sessionId}: Redis ${redisSession ? 'HIT' : 'MISS'}`);
  }
}
```

## 🛠️ Advanced Features

### 1. Code History / Undo

```javascript
// Get last 5 code versions
app.get('/api/sessions/:sessionId/history', async (req, res) => {
  const history = await sessionCache.getCodeHistory(req.params.sessionId, 5);
  res.json(history);
});

// Restore previous version
app.post('/api/sessions/:sessionId/restore', async (req, res) => {
  const { timestamp } = req.body;
  const history = await sessionCache.getCodeHistory(req.params.sessionId);
  const snapshot = history.find(h => h.timestamp === timestamp);
  
  if (snapshot) {
    // Restore code
    sessionManager.updateCode(req.params.sessionId, snapshot.code);
    res.json({ success: true });
  }
});
```

### 2. Session Activity Tracking

```javascript
// Track last activity
await redis.set(`session:${sessionId}:lastActivity`, Date.now());

// Auto-expire inactive sessions (30 min)
if (Date.now() - lastActivity > 1800000) {
  await sessionCache.deleteSession(sessionId);
}
```

### 3. Distributed Locking (Prevent Race Conditions)

```javascript
// When multiple servers try to join same session
const lock = await redis.set(
  `lock:session:${sessionId}`,
  'locked',
  'NX',  // Only set if doesn't exist
  'EX',  // Expire after
  5      // 5 seconds
);

if (lock) {
  // Proceed with join
  // ...
  await redis.del(`lock:session:${sessionId}`);
} else {
  return { error: 'Session locked, try again' };
}
```

## 🐛 Troubleshooting

### Redis Not Working

**Issue:** Cache writes failing

**Debug:**
```javascript
if (!sessionCache.isAvailable()) {
  console.warn('Redis unavailable, using memory only');
  // Fallback to memory-only mode
}
```

### Memory Leaks

**Issue:** In-memory sessions not cleaned up

**Solution:** Periodic cleanup
```javascript
setInterval(() => {
  for (const [sessionId, session] of this.sessions) {
    if (session.users.length === 0 && 
        Date.now() - session.lastActivity > 300000) {
      this.sessions.delete(sessionId);
    }
  }
}, 60000); // Every minute
```

### Cache Inconsistency

**Issue:** Memory and Redis out of sync

**Solution:** Redis as source of truth
```javascript
// On reconnect, always trust Redis
const redisSession = await sessionCache.getSession(sessionId);
if (redisSession) {
  this.sessions.set(sessionId, redisSession);
}
```

## 📊 Cache Key Structure

```
session:{sessionId}                    → Session data (JSON)
session:{sessionId}:users              → User IDs (Set)
session:{sessionId}:user:{userId}      → User metadata (Hash)
session:{sessionId}:history            → Code snapshots (List)
user:{userId}:session                  → User's current session (String)
lock:session:{sessionId}               → Distributed lock (String)
```

## 🎯 Recommendations

### For Development
- Keep `REDIS_ENABLED=false` for simplicity
- Use in-memory only

### For Production
- **Enable Redis** for persistence
- Set up **Redis Cluster** for high availability
- Monitor cache hit rates
- Set appropriate TTLs
- Enable **Redis persistence** (RDB + AOF)

### For Scaling
- Use Redis as **primary data store**
- Memory as **cache layer**
- Implement **read-through** pattern
- Add **connection pooling**

## 🚀 Next Steps

1. **Enable Redis** in `.env`
2. **Update SessionManager** to use sessionCache
3. **Add cache recovery** on startup
4. **Monitor** cache performance
5. **Add code history** endpoint (optional)

---

**With proper caching, your collaboration service will be:**
- ✅ More reliable (survives restarts)
- ✅ More scalable (multiple instances)
- ✅ Better UX (session recovery)
- ✅ More performant (reduced DB queries)



