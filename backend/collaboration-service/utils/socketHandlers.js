/**
 * Socket.IO Event Handlers for Real-time Collaboration
 */

const setupSocketHandlers = (io, sessionManager) => {
  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    /**
     * JOIN_SESSION - User joins a collaboration session
     */
    socket.on('join-session', async (data, callback) => {
      try {
        const { sessionId, userId, userInfo } = data;

        if (!sessionId || !userId) {
          return callback?.({
            success: false,
            error: 'Session ID and User ID are required',
          });
        }

        // Join the session
        const result = sessionManager.joinSession(sessionId, userId, socket.id, userInfo);

        if (!result.success) {
          return callback?.(result);
        }

        // Join the socket.io room
        socket.join(sessionId);

        // Get current session data
        const sessionData = sessionManager.getSessionData(sessionId);

        // Notify others in the room that a new user joined
        socket.to(sessionId).emit('user-joined', {
          userId,
          username: userInfo?.username || `User${userId}`,
          userCount: sessionData.userCount,
          timestamp: Date.now(),
        });

        // Send current session state to the joining user
        callback?.({
          success: true,
          session: sessionData,
          message: `Joined session ${sessionId}`,
          isMatchedSession: result.isMatchedSession || false,
        });

        // If this is a matched session and both users have joined, notify everyone
        if (result.isMatchedSession && sessionData.userCount === 2) {
          io.to(sessionId).emit('matched-session-ready', {
            sessionId,
            questionId: sessionData.questionId,
            question: sessionData.problem,
            users: sessionData.users,
            timestamp: Date.now(),
          });
          console.log(`Matched session ${sessionId} is now ready with both users!`);
        }

        console.log(
          `User ${userId} joined session ${sessionId} (${sessionData.userCount}/${sessionData.maxUsers})${result.isMatchedSession ? ' [MATCHED SESSION]' : ''}`,
        );
      } catch (error) {
        console.error('Error in join-session:', error);
        callback?.({ success: false, error: error.message });
      }
    });

    /**
     * CODE_CHANGE - Broadcast code changes to other users
     */
    socket.on('code-change', async (data) => {
      try {
        const { sessionId, code, cursorPosition, userId } = data;
        const userSessionId = sessionManager.getSessionBySocketId(socket.id);

        // Verify user is in the session they claim to be in
        if (userSessionId !== sessionId) {
          return;
        }

        // Update code in session manager
        sessionManager.updateCode(sessionId, code, cursorPosition);

        // Broadcast to other users in the session
        socket.to(sessionId).emit('code-update', {
          code,
          cursorPosition,
          userId,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Error in code-change:', error);
      }
    });

    /**
     * CURSOR_POSITION - Share cursor position with other users
     */
    socket.on('cursor-position', (data) => {
      try {
        const { sessionId, position, userId } = data;
        const userSessionId = sessionManager.getSessionBySocketId(socket.id);

        if (userSessionId !== sessionId) {
          return;
        }

        // Broadcast cursor position to others
        socket.to(sessionId).emit('cursor-update', {
          userId,
          position,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Error in cursor-position:', error);
      }
    });

    /**
     * LANGUAGE_CHANGE - Update programming language for the session
     */
    socket.on('language-change', (data, callback) => {
      try {
        const { sessionId, language, userId } = data;
        const userSessionId = sessionManager.getSessionBySocketId(socket.id);

        if (userSessionId !== sessionId) {
          return callback?.({ success: false, error: 'Not in session' });
        }

        // Update language in session
        const result = sessionManager.updateLanguage(sessionId, language);

        if (result.success) {
          // Broadcast language change to all users
          io.to(sessionId).emit('language-update', {
            language,
            userId,
            timestamp: Date.now(),
          });
        }

        callback?.(result);
      } catch (error) {
        console.error('Error in language-change:', error);
        callback?.({ success: false, error: error.message });
      }
    });

    /**
     * CHAT_MESSAGE - Send chat messages within the session
     */
    socket.on('chat-message', (data) => {
      try {
        const { sessionId, message, userId, username } = data;
        const userSessionId = sessionManager.getSessionBySocketId(socket.id);

        if (userSessionId !== sessionId) {
          return;
        }

        // Broadcast message to all users in session (including sender)
        io.to(sessionId).emit('chat-message', {
          userId,
          username,
          message,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Error in chat-message:', error);
      }
    });

    /**
     * TYPING_INDICATOR - Show when partner is typing
     */
    socket.on('typing-start', (data) => {
      try {
        const { sessionId, userId, username } = data;
        socket.to(sessionId).emit('user-typing', { userId, username, isTyping: true });
      } catch (error) {
        console.error('Error in typing-start:', error);
      }
    });

    socket.on('typing-stop', (data) => {
      try {
        const { sessionId, userId } = data;
        socket.to(sessionId).emit('user-typing', { userId, isTyping: false });
      } catch (error) {
        console.error('Error in typing-stop:', error);
      }
    });

    /**
     * REQUEST_SYNC - Request current session state
     */
    socket.on('request-sync', (data, callback) => {
      try {
        const { sessionId } = data;
        const sessionData = sessionManager.getSessionData(sessionId);

        if (!sessionData) {
          return callback?.({ success: false, error: 'Session not found' });
        }

        callback?.({ success: true, session: sessionData });
      } catch (error) {
        console.error('Error in request-sync:', error);
        callback?.({ success: false, error: error.message });
      }
    });

    /**
     * LEAVE_SESSION - User explicitly leaves session
     */
    socket.on('leave-session', (data, callback) => {
      try {
        const { sessionId } = data;

        // Leave the socket.io room
        socket.leave(sessionId);

        // Remove from session manager
        const result = sessionManager.leaveSession(socket.id);

        if (result.success) {
          // Notify others that user left
          socket.to(sessionId).emit('user-left', {
            userId: result.removedUser?.userId,
            username: result.removedUser?.username,
            remainingUsers: result.remainingUsers,
            timestamp: Date.now(),
          });
        }

        callback?.(result);
        console.log(`👋 User left session ${sessionId}`);
      } catch (error) {
        console.error('Error in leave-session:', error);
        callback?.({ success: false, error: error.message });
      }
    });

    /**
     * RUN_CODE - Request code execution (can be extended)
     */
    socket.on('run-code', (data) => {
      try {
        const { sessionId, userId } = data;

        // Notify other user that code is being executed
        socket.to(sessionId).emit('code-running', {
          userId,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Error in run-code:', error);
      }
    });

    /**
     * DISCONNECT - Handle disconnection
     */
    socket.on('disconnect', () => {
      try {
        const sessionId = sessionManager.getSessionBySocketId(socket.id);

        if (sessionId) {
          const result = sessionManager.leaveSession(socket.id);

          if (result.success && result.removedUser) {
            // Notify others that user disconnected
            socket.to(sessionId).emit('user-disconnected', {
              userId: result.removedUser.userId,
              username: result.removedUser.username,
              remainingUsers: result.remainingUsers,
              timestamp: Date.now(),
            });

            console.log(`User ${result.removedUser.userId} disconnected from session ${sessionId}`);
          }
        }

        console.log(`Socket disconnected: ${socket.id}`);
      } catch (error) {
        console.error('Error in disconnect:', error);
      }
    });

    /**
     * ERROR - Handle socket errors
     */
    socket.on('error', (error) => {
      console.error(`Socket error on ${socket.id}:`, error);
    });
  });

  // Log session stats periodically
  setInterval(() => {
    const stats = sessionManager.getStats();
    if (stats.totalSessions > 0) {
      console.log(
        `Sessions: ${stats.activeSessions}/${stats.totalSessions} active | Users: ${stats.totalUsers}`,
      );
    }
  }, 60000); // Every minute
};

module.exports = { setupSocketHandlers };
