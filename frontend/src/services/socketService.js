/**
 * Socket.IO Client Service for Real-time Collaboration
 */

import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.sessionId = null;
    this.userId = null;
    this.listeners = new Map();
  }

  /**
   * Connect to the collaboration service
   */
  connect(token, userId) {
    const serverUrl = process.env.REACT_APP_COLLABORATION_SERVICE_URL || 'http://localhost:8000';
    
    this.userId = userId;

    this.socket = io(serverUrl, {
      auth: {
        token: token || '',
        userId: userId
      },
      query: {
        token: token || '',
        userId: userId
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupConnectionHandlers();
    return this.socket;
  }

  /**
   * Setup connection event handlers
   */
  setupConnectionHandlers() {
    this.socket.on('connect', () => {
      console.log('✅ Connected to collaboration service:', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      // Rejoin session if we were in one
      if (this.sessionId) {
        this.joinSession(this.sessionId, this.userId);
      }
    });
  }

  /**
   * Join a collaboration session
   */
  joinSession(sessionId, userId, userInfo = {}) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket not connected'));
      }

      this.sessionId = sessionId;
      this.userId = userId;

      this.socket.emit('join-session', 
        { sessionId, userId, userInfo },
        (response) => {
          if (response.success) {
            console.log('✅ Joined session:', sessionId);
            resolve(response);
          } else {
            console.error('❌ Failed to join session:', response.error);
            reject(new Error(response.error));
          }
        }
      );
    });
  }

  /**
   * Leave the current session
   */
  leaveSession() {
    return new Promise((resolve) => {
      if (!this.socket || !this.sessionId) {
        return resolve({ success: false });
      }

      this.socket.emit('leave-session', 
        { sessionId: this.sessionId },
        (response) => {
          this.sessionId = null;
          resolve(response);
        }
      );
    });
  }

  /**
   * Send code changes
   */
  sendCodeChange(code, cursorPosition = null) {
    if (!this.socket || !this.sessionId) return;

    this.socket.emit('code-change', {
      sessionId: this.sessionId,
      userId: this.userId,
      code,
      cursorPosition
    });
  }

  /**
   * Send cursor position
   */
  sendCursorPosition(position) {
    if (!this.socket || !this.sessionId) return;

    this.socket.emit('cursor-position', {
      sessionId: this.sessionId,
      userId: this.userId,
      position
    });
  }

  /**
   * Change programming language
   */
  changeLanguage(language) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.sessionId) {
        return reject(new Error('Not connected to session'));
      }

      this.socket.emit('language-change',
        { sessionId: this.sessionId, userId: this.userId, language },
        (response) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });
  }

  /**
   * Send chat message
   */
  sendChatMessage(message, username) {
    if (!this.socket || !this.sessionId) return;

    this.socket.emit('chat-message', {
      sessionId: this.sessionId,
      userId: this.userId,
      username,
      message
    });
  }

  /**
   * Send typing indicator
   */
  sendTypingStart(username) {
    if (!this.socket || !this.sessionId) return;
    this.socket.emit('typing-start', {
      sessionId: this.sessionId,
      userId: this.userId,
      username
    });
  }

  sendTypingStop() {
    if (!this.socket || !this.sessionId) return;
    this.socket.emit('typing-stop', {
      sessionId: this.sessionId,
      userId: this.userId
    });
  }

  /**
   * Run code
   */
  runCode() {
    if (!this.socket || !this.sessionId) return;
    this.socket.emit('run-code', {
      sessionId: this.sessionId,
      userId: this.userId
    });
  }

  /**
   * Request session sync
   */
  requestSync() {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.sessionId) {
        return reject(new Error('Not connected to session'));
      }

      this.socket.emit('request-sync',
        { sessionId: this.sessionId },
        (response) => {
          if (response.success) {
            resolve(response.session);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });
  }

  /**
   * Event listeners
   */
  onCodeUpdate(callback) {
    this.socket?.on('code-update', callback);
  }

  onLanguageUpdate(callback) {
    this.socket?.on('language-update', callback);
  }

  onCursorUpdate(callback) {
    this.socket?.on('cursor-update', callback);
  }

  onChatMessage(callback) {
    this.socket?.on('chat-message', callback);
  }

  onUserJoined(callback) {
    this.socket?.on('user-joined', callback);
  }

  onUserLeft(callback) {
    this.socket?.on('user-left', callback);
  }

  onUserDisconnected(callback) {
    this.socket?.on('user-disconnected', callback);
  }

  onUserTyping(callback) {
    this.socket?.on('user-typing', callback);
  }

  onCodeRunning(callback) {
    this.socket?.on('code-running', callback);
  }

  /**
   * Remove event listener
   */
  off(eventName, callback) {
    this.socket?.off(eventName, callback);
  }

  /**
   * Disconnect from the service
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.sessionId = null;
      console.log('🔴 Disconnected from collaboration service');
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId() {
    return this.sessionId;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;


