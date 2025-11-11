/**
 * SessionManager - Manages collaboration sessions
 * Handles session creation, user joining/leaving, and session state
 */
class SessionManager {
  constructor(serviceIntegration = null) {
    // Store active sessions in memory
    // Structure: { sessionId: { users: [], code: '', language: '', createdAt: timestamp } }
    this.sessions = new Map();
    this.userToSession = new Map(); // Track which session each user is in
    this.MAX_USERS_PER_SESSION = 2;

    // Track pending sessions waiting for users to join
    this.pendingSessions = new Map(); // sessionId -> { userIds: [], questionId, createdAt }

    // Service integration for creating history entries
    this.serviceIntegration = serviceIntegration;
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
      allUsers: [], // Track all users who have joined (for history tracking)
      code: initialData.code || '',
      language: initialData.language || 'javascript',
      problem: initialData.problem || null,
      questionId: initialData.questionId || null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      allTestsPassed: false, // Track if all tests have passed
      lastTestPassTime: null, // Track when all tests passed
    });

    console.log(`Session created: ${sessionId}`);
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

    // Determine the default language (prefer python)
    const defaultLanguage = questionDetails?.preferredLanguage || 'python';

    // Get starter code for the selected language
    // starterCode can be either a string (old format) or an object with language keys (new format)
    let initialCode = '';
    if (questionDetails?.starterCode) {
      if (typeof questionDetails.starterCode === 'string') {
        // Old format: starterCode is a string
        initialCode = questionDetails.starterCode;
      } else if (typeof questionDetails.starterCode === 'object') {
        // New format: starterCode is an object with language keys
        initialCode =
          questionDetails.starterCode[defaultLanguage] ||
          questionDetails.starterCode.python ||
          questionDetails.starterCode.javascript ||
          '';
      }
    }

    // Create the session
    this.sessions.set(sessionId, {
      id: sessionId,
      users: [],
      allUsers: [], // Track all users who have joined (for history tracking)
      code: initialCode,
      language: defaultLanguage,
      problem: questionDetails,
      questionId: questionId,
      testCases: questionDetails?.testCases || [],
      matchedUserIds: userIds, // Store the matched user IDs
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isMatchedSession: true,
      allTestsPassed: false, // Track if all tests have passed
      lastTestPassTime: null, // Track when all tests passed
    });

    console.log(
      `Created matched session with ${questionDetails?.testCases?.length || 0} test cases`,
    );

    // Store as pending session until users join
    this.pendingSessions.set(sessionId, {
      userIds: [...userIds],
      questionId: questionId,
      createdAt: Date.now(),
    });

    console.log(
      `Matched session created: ${sessionId} for users [${userIds.join(', ')}] with question ${questionId}`,
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
    console.log(
      `joinSession called: sessionId=${sessionId}, userId=${userId}, socketId=${socketId}`,
    );

    // Check if session exists, create if it doesn't
    if (!this.sessions.has(sessionId)) {
      console.log(`Creating new session: ${sessionId}`);
      this.createSession(sessionId);
    }

    const session = this.sessions.get(sessionId);

    // For matched sessions, check if user is authorized
    if (session.isMatchedSession && !this.isUserAuthorizedForSession(sessionId, userId)) {
      console.error(
        `Authorization failed for matched session ${sessionId}: userId ${userId} not in matchedUserIds ${session.matchedUserIds}`,
      );
      return {
        success: false,
        error: 'User not authorized for this matched session',
      };
    }

    // Check if user is already in this session (reconnect scenario)
    const existingUser = session.users.find((u) => u.userId === userId);
    if (existingUser) {
      // Update socket ID (user reconnecting)
      // Update the mapping for the old socket ID
      const oldSocketId = existingUser.socketId;
      this.userToSession.delete(oldSocketId);

      existingUser.socketId = socketId;
      existingUser.reconnectedAt = Date.now();

      // Ensure user is tracked in allUsers
      if (!session.allUsers.some((u) => u.userId === userId)) {
        session.allUsers.push({
          userId,
          username: existingUser.username,
          joinedAt: existingUser.joinedAt,
        });
      }

      console.log(
        `User reconnected: ${userId} to session ${sessionId}, updating from socket ${oldSocketId} to ${socketId}`,
      );

      // Track the new socket
      this.userToSession.set(socketId, sessionId);
      console.log(
        `Mapped socket ${socketId} to session ${sessionId} for user ${userId} (reconnected)`,
      );
      session.lastActivity = Date.now();

      // If this is a matched session and both users have joined, remove from pending
      if (session.isMatchedSession && session.users.length === 2) {
        this.pendingSessions.delete(sessionId);
        console.log(`Matched session ${sessionId} is now active with both users`);
      }

      return {
        success: true,
        session: this.getSessionData(sessionId),
        userCount: session.users.length,
        isMatchedSession: session.isMatchedSession || false,
        isReconnect: true,
      };
    }

    // User is new - check if session is full
    if (session.users.length >= this.MAX_USERS_PER_SESSION) {
      console.error(
        `Session ${sessionId} is full (${session.users.length}/${this.MAX_USERS_PER_SESSION}), cannot add user ${userId}`,
      );
      return {
        success: false,
        error: 'Session is full',
        maxUsers: this.MAX_USERS_PER_SESSION,
      };
    }

    // Add new user
    const userData = {
      userId,
      socketId,
      username: userInfo.username || `User${userId}`,
      joinedAt: Date.now(),
    };
    session.users.push(userData);

    // Track user in allUsers if not already there
    if (!session.allUsers.some((u) => u.userId === userId)) {
      session.allUsers.push({ userId, username: userData.username, joinedAt: userData.joinedAt });
    }

    console.log(`User joined: ${userId} to session ${sessionId}`);

    // Track user's session
    this.userToSession.set(socketId, sessionId);
    console.log(`Mapped socket ${socketId} to session ${sessionId} for user ${userId}`);
    session.lastActivity = Date.now();

    // If this is a matched session and both users have joined, remove from pending
    if (session.isMatchedSession && session.users.length === 2) {
      this.pendingSessions.delete(sessionId);
      console.log(`Matched session ${sessionId} is now active with both users`);
    }

    return {
      success: true,
      session: this.getSessionData(sessionId),
      userCount: session.users.length,
      isMatchedSession: session.isMatchedSession || false,
      isReconnect: false,
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
      console.log(`User left: ${removedUser.userId} from session ${sessionId}`);
    }

    this.userToSession.delete(socketId);
    session.lastActivity = Date.now();

    // If session is now empty (all users left), create history entries
    if (session.users.length === 0) {
      // Create history entries for all users who were in the session
      // Do this before cleanup to ensure we have session data
      this.createHistoryForSession(sessionId, session).catch((error) => {
        console.error(`Failed to create history for session ${sessionId}:`, error);
      });

      // Clean up empty sessions after 5 minutes of inactivity
      setTimeout(
        () => {
          const currentSession = this.sessions.get(sessionId);
          if (currentSession && currentSession.users.length === 0) {
            this.sessions.delete(sessionId);
            console.log(`Empty session deleted: ${sessionId}`);
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
   * Create history entries for all users in a session
   * Called when a session ends (all users have left)
   * @param {string} sessionId - Session ID
   * @param {Object} session - Session data
   */
  async createHistoryForSession(sessionId, session) {
    // Only create history if we have question information and service integration
    if (!this.serviceIntegration || !session.questionId || !session.problem) {
      console.log(
        `Skipping history creation for session ${sessionId}: missing question info or service integration`,
      );
      return;
    }

    // Get question details from session
    const question = session.problem;
    const questionTitle = question.title || 'Unknown Question';
    const difficulty = question.difficulty || 'Medium';
    // Use first topic as category, or default to 'General'
    const category = question.topics && question.topics.length > 0 ? question.topics[0] : 'General';

    // Get all users who were in the session (including those who just left)
    // Use allUsers to track all participants, fallback to matchedUserIds or current users
    const userIds =
      session.allUsers?.map((u) => u.userId) ||
      session.matchedUserIds ||
      session.users.map((u) => u.userId);

    if (!userIds || userIds.length === 0) {
      console.log(`No users found for session ${sessionId}, skipping history creation`);
      return;
    }

    // Create history entries for each user
    const historyPromises = userIds.map(async (userId) => {
      try {
        // Determine status: if all tests passed, mark as 'completed', otherwise 'attempted'
        const status = session.allTestsPassed ? 'completed' : 'attempted';

        const result = await this.serviceIntegration.createHistoryEntry({
          user_id: userId,
          session_id: sessionId,
          question_title: questionTitle,
          difficulty: difficulty,
          category: category,
          status: status,
        });

        if (result.success) {
          console.log(`History entry created for user ${userId} in session ${sessionId}`);
        } else {
          console.error(
            `Failed to create history entry for user ${userId} in session ${sessionId}: ${result.error}`,
          );
        }
      } catch (error) {
        console.error(`Error creating history entry for user ${userId}:`, error.message);
      }
    });

    await Promise.allSettled(historyPromises);
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
    const sessionId = this.userToSession.get(socketId);
    if (!sessionId) {
      console.warn(`No session found for socketId ${socketId}`);
    }
    return sessionId;
  }

  /**
   * Get all users in a session
   */
  getSessionUsers(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? session.users : [];
  }

  /**
   * Get session by session ID
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
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
