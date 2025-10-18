/**
 * Socket.IO Client Service for Real-time Collaboration
 */

import { io, Socket } from 'socket.io-client';

// Type definitions

interface JoinSessionData {
  sessionId: string;
  userId: string;
  userInfo?: { username?: string };
}

interface JoinSessionResponse {
  success: boolean;
  session?: {
    code?: string;
    language?: string;
    users?: Array<{ userId: string; username: string }>;
  };
  error?: string;
}

interface CodeChangeData {
  sessionId: string;
  userId: string;
  code: string;
  cursorPosition?: { line: number; column: number };
}

interface CursorPositionData {
  sessionId: string;
  userId: string;
  position: { line: number; column: number };
}

interface LanguageChangeData {
  sessionId: string;
  userId: string;
  language: string;
}

interface ChatMessageData {
  sessionId: string;
  userId: string;
  username: string;
  message: string;
}

interface TypingData {
  sessionId: string;
  userId: string;
  username?: string;
}

interface RunCodeData {
  sessionId: string;
  userId: string;
}

interface RequestSyncData {
  sessionId: string;
}

interface RequestSyncResponse {
  success: boolean;
  session?: {
    code?: string;
    language?: string;
    users?: Array<{ userId: string; username: string }>;
  };
  error?: string;
}

interface LeaveSessionData {
  sessionId: string;
}

interface LeaveSessionResponse {
  success: boolean;
}

class SocketService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private userId: string | null = null;
  private listeners: Map<string, (...args: unknown[]) => void> = new Map();

  /**
   * Connect to the collaboration service
   */
  connect(token: string, userId: string): Socket | undefined {
    const serverUrl = process.env.NEXT_PUBLIC_COLLABORATION_SERVICE_URL || 'http://localhost:8000';

    this.userId = userId;

    this.socket = io(serverUrl, {
      auth: {
        token: token || '',
        userId: userId,
      },
      query: {
        token: token || '',
        userId: userId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupConnectionHandlers();
    return this.socket;
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to collaboration service:', this.socket?.id);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Connection error:', error.message);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 Disconnected:', reason);
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      // Rejoin session if we were in one
      if (this.sessionId && this.userId) {
        this.joinSession(this.sessionId, this.userId);
      }
    });
  }

  /**
   * Join a collaboration session
   */
  joinSession(sessionId: string, userId: string, userInfo: { username?: string } = {}): Promise<JoinSessionResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket not connected'));
      }

      this.sessionId = sessionId;
      this.userId = userId;

      const data: JoinSessionData = { sessionId, userId, userInfo };
      
      this.socket.emit('join-session', data, (response: JoinSessionResponse) => {
        if (response.success) {
          console.log('✅ Joined session:', sessionId);
          resolve(response);
        } else {
          console.error('❌ Failed to join session:', response.error);
          reject(new Error(response.error || 'Failed to join session'));
        }
      });
    });
  }

  /**
   * Leave the current session
   */
  leaveSession(): Promise<LeaveSessionResponse> {
    return new Promise((resolve) => {
      if (!this.socket || !this.sessionId) {
        return resolve({ success: false });
      }

      const data: LeaveSessionData = { sessionId: this.sessionId };
      
      this.socket.emit('leave-session', data, (response: LeaveSessionResponse) => {
        this.sessionId = null;
        resolve(response);
      });
    });
  }

  /**
   * Send code changes
   */
  sendCodeChange(code: string, cursorPosition?: { line: number; column: number }): void {
    if (!this.socket || !this.sessionId || !this.userId) return;

    const data: CodeChangeData = {
      sessionId: this.sessionId,
      userId: this.userId,
      code,
      cursorPosition,
    };

    this.socket.emit('code-change', data);
  }

  /**
   * Send cursor position
   */
  sendCursorPosition(position: { line: number; column: number }): void {
    if (!this.socket || !this.sessionId || !this.userId) return;

    const data: CursorPositionData = {
      sessionId: this.sessionId,
      userId: this.userId,
      position,
    };

    this.socket.emit('cursor-position', data);
  }

  /**
   * Change programming language
   */
  changeLanguage(language: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.sessionId || !this.userId) {
        return reject(new Error('Not connected to session'));
      }

      const data: LanguageChangeData = {
        sessionId: this.sessionId,
        userId: this.userId,
        language,
      };

      this.socket.emit('language-change', data, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to change language'));
        }
      });
    });
  }

  /**
   * Send chat message
   */
  sendChatMessage(message: string, username: string): void {
    if (!this.socket || !this.sessionId || !this.userId) return;

    const data: ChatMessageData = {
      sessionId: this.sessionId,
      userId: this.userId,
      username,
      message,
    };

    this.socket.emit('chat-message', data);
  }

  /**
   * Send typing indicator
   */
  sendTypingStart(username: string): void {
    if (!this.socket || !this.sessionId || !this.userId) return;
    
    const data: TypingData = {
      sessionId: this.sessionId,
      userId: this.userId,
      username,
    };
    
    this.socket.emit('typing-start', data);
  }

  sendTypingStop(): void {
    if (!this.socket || !this.sessionId || !this.userId) return;
    
    const data: TypingData = {
      sessionId: this.sessionId,
      userId: this.userId,
    };
    
    this.socket.emit('typing-stop', data);
  }

  /**
   * Run code
   */
  runCode(): void {
    if (!this.socket || !this.sessionId || !this.userId) return;
    
    const data: RunCodeData = {
      sessionId: this.sessionId,
      userId: this.userId,
    };
    
    this.socket.emit('run-code', data);
  }

  /**
   * Request session sync
   */
  requestSync(): Promise<RequestSyncResponse['session']> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.sessionId) {
        return reject(new Error('Not connected to session'));
      }

      const data: RequestSyncData = { sessionId: this.sessionId };
      
      this.socket.emit('request-sync', data, (response: RequestSyncResponse) => {
        if (response.success) {
          resolve(response.session);
        } else {
          reject(new Error(response.error || 'Failed to sync session'));
        }
      });
    });
  }

  /**
   * Event listeners
   */
  onCodeUpdate(callback: (data: CodeChangeData) => void): void {
    this.socket?.on('code-update', callback);
  }

  onLanguageUpdate(callback: (data: LanguageChangeData) => void): void {
    this.socket?.on('language-update', callback);
  }

  onCursorUpdate(callback: (data: CursorPositionData) => void): void {
    this.socket?.on('cursor-update', callback);
  }

  onChatMessage(callback: (data: ChatMessageData) => void): void {
    this.socket?.on('chat-message', callback);
  }

  onUserJoined(callback: (data: { userId: string; username: string }) => void): void {
    this.socket?.on('user-joined', callback);
  }

  onUserLeft(callback: (data: { userId: string; username: string }) => void): void {
    this.socket?.on('user-left', callback);
  }

  onUserDisconnected(callback: (data: { userId: string; username: string }) => void): void {
    this.socket?.on('user-disconnected', callback);
  }

  onUserTyping(callback: (data: TypingData) => void): void {
    this.socket?.on('user-typing', callback);
  }

  onCodeRunning(callback: (data: { sessionId: string; userId: string }) => void): void {
    this.socket?.on('code-running', callback);
  }

  /**
   * Remove event listener
   */
  off(eventName: string, callback?: (...args: unknown[]) => void): void {
    if (callback) {
      this.socket?.off(eventName, callback);
    } else {
      this.socket?.off(eventName);
    }
  }

  /**
   * Disconnect from the service
   */
  disconnect(): void {
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
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.sessionId;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;

