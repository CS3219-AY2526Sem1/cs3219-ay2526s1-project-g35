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

    // Track pending sessions waiting for users to join
    this.pendingSessions = new Map(); // sessionId -> { userIds: [], questionId, createdAt }
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
      questionId: initialData.questionId || null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });

    console.log(`✅ Session created: ${sessionId}`);
    return { success: true, sessionId };
  }

  /**
   * Create a pre-matched session from matching service
   * Generates a unique sessionId internally
   */
  createMatchedSession(userIds, questionId, questionDetails = null) {
    if (!userIds || !Array.isArray(userIds) || userIds.length !== 2) {
      return { success: false, error: 'Exactly 2 user IDs are required' };
    }

    if (!questionId) {
      return { success: false, error: 'Question ID is required' };
    }

    // Generate unique session ID
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create the session
    this.sessions.set(sessionId, {
      id: sessionId,
      users: [],
      code: questionDetails?.starterCode || '',
      language: questionDetails?.preferredLanguage || 'javascript',
      problem: questionDetails,
      questionId: questionId,
      matchedUserIds: userIds, // Store the matched user IDs
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isMatchedSession: true,
    });

    // Store as pending session until users join
    this.pendingSessions.set(sessionId, {
      userIds: [...userIds],
      questionId: questionId,
      createdAt: Date.now(),
    });

    console.log(
      `✅ Matched session created: ${sessionId} for users [${userIds.join(', ')}] with question ${questionId}`,
    );
    return {
      success: true,
      sessionId,
      matchedUserIds: userIds,
      questionId: questionId,
    };
  }

  /**
   * Check if a user is authorized to join a matched session
   */
  isUserAuthorizedForSession(sessionId, userId) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isMatchedSession) {
      return true; // Non-matched sessions allow any user
    }

    return session.matchedUserIds && session.matchedUserIds.includes(userId);
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

    // For matched sessions, check if user is authorized
    if (session.isMatchedSession && !this.isUserAuthorizedForSession(sessionId, userId)) {
      return {
        success: false,
        error: 'User not authorized for this matched session',
      };
    }

    // Check if session is full
    if (session.users.length >= this.MAX_USERS_PER_SESSION) {
      return {
        success: false,
        error: 'Session is full',
        maxUsers: this.MAX_USERS_PER_SESSION,
      };
    }

    // Check if user is already in this session
    const existingUser = session.users.find((u) => u.userId === userId);
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
        joinedAt: Date.now(),
      });
      console.log(`👤 User joined: ${userId} to session ${sessionId}`);
    }

    // Track user's session
    this.userToSession.set(socketId, sessionId);
    session.lastActivity = Date.now();

    // If this is a matched session and both users have joined, remove from pending
    if (session.isMatchedSession && session.users.length === 2) {
      this.pendingSessions.delete(sessionId);
      console.log(`🎉 Matched session ${sessionId} is now active with both users`);
    }

    return {
      success: true,
      session: this.getSessionData(sessionId),
      userCount: session.users.length,
      isMatchedSession: session.isMatchedSession || false,
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
    const userIndex = session.users.findIndex((u) => u.socketId === socketId);
    let removedUser = null;

    if (userIndex !== -1) {
      removedUser = session.users.splice(userIndex, 1)[0];
      console.log(`👋 User left: ${removedUser.userId} from session ${sessionId}`);
    }

    this.userToSession.delete(socketId);
    session.lastActivity = Date.now();

    // Clean up empty sessions after 5 minutes of inactivity
    if (session.users.length === 0) {
      setTimeout(
        () => {
          const currentSession = this.sessions.get(sessionId);
          if (currentSession && currentSession.users.length === 0) {
            this.sessions.delete(sessionId);
            console.log(`🗑️  Empty session deleted: ${sessionId}`);
          }
        },
        5 * 60 * 1000,
      ); // 5 minutes
    }

    return {
      success: true,
      sessionId,
      removedUser,
      remainingUsers: session.users.length,
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
      users: session.users.map((u) => ({
        userId: u.userId,
        username: u.username,
        joinedAt: u.joinedAt,
      })),
      code: session.code,
      language: session.language,
      problem: session.problem,
      questionId: session.questionId,
      userCount: session.users.length,
      maxUsers: this.MAX_USERS_PER_SESSION,
      isFull: session.users.length >= this.MAX_USERS_PER_SESSION,
      isMatchedSession: session.isMatchedSession || false,
      matchedUserIds: session.matchedUserIds || null,
    };
  }

  /**
   * Get pending sessions (sessions waiting for users to join)
   */
  getPendingSessions() {
    const pending = [];
    for (const [sessionId, data] of this.pendingSessions.entries()) {
      const session = this.sessions.get(sessionId);
      if (session) {
        pending.push({
          sessionId,
          userIds: data.userIds,
          questionId: data.questionId,
          createdAt: data.createdAt,
          joinedUsers: session.users.map((u) => u.userId),
          waitingForUsers: data.userIds.filter((id) => !session.users.some((u) => u.userId === id)),
        });
      }
    }
    return pending;
  }

  /**
   * Get session by user ID (for matched sessions)
   */
  getSessionByUserId(userId) {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (
        session.isMatchedSession &&
        session.matchedUserIds &&
        session.matchedUserIds.includes(userId)
      ) {
        return sessionId;
      }
    }
    return null;
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
      activeSessions: Array.from(this.sessions.values()).filter((s) => s.users.length > 0).length,
      pendingSessions: this.pendingSessions.size,
      matchedSessions: Array.from(this.sessions.values()).filter((s) => s.isMatchedSession).length,
      totalUsers: Array.from(this.sessions.values()).reduce((sum, s) => sum + s.users.length, 0),
    };
  }
}

module.exports = SessionManager;
