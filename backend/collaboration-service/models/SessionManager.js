/**
 * SessionManager - Manages collaboration sessions
 * Handles session creation, user joining/leaving, and session state
 */
class SessionManager {
  constructor() {
    // Store active sessions in memory
    // Structure: { sessionId: { users: [], code: '', language: '', createdAt: timestamp } }
    this.sessions = new Map();
    this.userToSession = new Map(); // Track which session each user is in
    this.MAX_USERS_PER_SESSION = 2;
  }

  /**
   * Create a new collaboration session
   */
  createSession(sessionId, initialData = {}) {
    if (this.sessions.has(sessionId)) {
      return { success: false, error: 'Session already exists' };
    }

    this.sessions.set(sessionId, {
      id: sessionId,
      users: [],
      code: initialData.code || '',
      language: initialData.language || 'javascript',
      problem: initialData.problem || null,
      createdAt: Date.now(),
      lastActivity: Date.now()
    });

    console.log(`✅ Session created: ${sessionId}`);
    return { success: true, sessionId };
  }

  /**
   * Add a user to a session
   */
  joinSession(sessionId, userId, socketId, userInfo = {}) {
    // Check if session exists, create if it doesn't
    if (!this.sessions.has(sessionId)) {
      this.createSession(sessionId);
    }

    const session = this.sessions.get(sessionId);

    // Check if session is full
    if (session.users.length >= this.MAX_USERS_PER_SESSION) {
      return { 
        success: false, 
        error: 'Session is full',
        maxUsers: this.MAX_USERS_PER_SESSION 
      };
    }

    // Check if user is already in this session
    const existingUser = session.users.find(u => u.userId === userId);
    if (existingUser) {
      // Update socket ID (user reconnecting)
      existingUser.socketId = socketId;
      existingUser.reconnectedAt = Date.now();
      console.log(`🔄 User reconnected: ${userId} to session ${sessionId}`);
    } else {
      // Add new user
      session.users.push({
        userId,
        socketId,
        username: userInfo.username || `User${userId}`,
        joinedAt: Date.now()
      });
      console.log(`👤 User joined: ${userId} to session ${sessionId}`);
    }

    // Track user's session
    this.userToSession.set(socketId, sessionId);
    session.lastActivity = Date.now();

    return { 
      success: true, 
      session: this.getSessionData(sessionId),
      userCount: session.users.length
    };
  }

  /**
   * Remove a user from a session
   */
  leaveSession(socketId) {
    const sessionId = this.userToSession.get(socketId);
    if (!sessionId) {
      return { success: false, error: 'User not in any session' };
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      this.userToSession.delete(socketId);
      return { success: false, error: 'Session not found' };
    }

    // Remove user from session
    const userIndex = session.users.findIndex(u => u.socketId === socketId);
    let removedUser = null;
    
    if (userIndex !== -1) {
      removedUser = session.users.splice(userIndex, 1)[0];
      console.log(`👋 User left: ${removedUser.userId} from session ${sessionId}`);
    }

    this.userToSession.delete(socketId);
    session.lastActivity = Date.now();

    // Clean up empty sessions after 5 minutes of inactivity
    if (session.users.length === 0) {
      setTimeout(() => {
        const currentSession = this.sessions.get(sessionId);
        if (currentSession && currentSession.users.length === 0) {
          this.sessions.delete(sessionId);
          console.log(`🗑️  Empty session deleted: ${sessionId}`);
        }
      }, 5 * 60 * 1000); // 5 minutes
    }

    return { 
      success: true, 
      sessionId, 
      removedUser,
      remainingUsers: session.users.length 
    };
  }

  /**
   * Update code in a session
   */
  updateCode(sessionId, code, cursorPosition = null) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    session.code = code;
    session.lastActivity = Date.now();
    
    if (cursorPosition) {
      session.lastCursorPosition = cursorPosition;
    }

    return { success: true };
  }

  /**
   * Update language in a session
   */
  updateLanguage(sessionId, language) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    session.language = language;
    session.lastActivity = Date.now();

    return { success: true };
  }

  /**
   * Get session data (safe to send to clients)
   */
  getSessionData(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      id: session.id,
      users: session.users.map(u => ({
        userId: u.userId,
        username: u.username,
        joinedAt: u.joinedAt
      })),
      code: session.code,
      language: session.language,
      problem: session.problem,
      userCount: session.users.length,
      maxUsers: this.MAX_USERS_PER_SESSION,
      isFull: session.users.length >= this.MAX_USERS_PER_SESSION
    };
  }

  /**
   * Get session ID by socket ID
   */
  getSessionBySocketId(socketId) {
    return this.userToSession.get(socketId);
  }

  /**
   * Get all users in a session
   */
  getSessionUsers(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? session.users : [];
  }

  /**
   * Check if session exists
   */
  sessionExists(sessionId) {
    return this.sessions.has(sessionId);
  }

  /**
   * Get session statistics
   */
  getStats() {
    return {
      totalSessions: this.sessions.size,
      activeSessions: Array.from(this.sessions.values()).filter(s => s.users.length > 0).length,
      totalUsers: Array.from(this.sessions.values()).reduce((sum, s) => sum + s.users.length, 0)
    };
  }
}

module.exports = SessionManager;


