/**
 * Session Cache Layer using Redis
 * Provides persistence and scalability for collaboration sessions
 */

const { getRedisClient } = require('../config/redis');

class SessionCache {
  constructor() {
    this.redis = null;
    this.SESSION_TTL = 3600; // 1 hour
    this.CODE_HISTORY_LIMIT = 10;
  }

  /**
   * Initialize Redis connection
   */
  async init() {
    this.redis = getRedisClient();
    return this.redis !== null;
  }

  /**
   * Check if Redis is available
   */
  isAvailable() {
    return this.redis && this.redis.isOpen;
  }

  /**
   * Cache session data
   */
  async cacheSession(sessionId, sessionData) {
    if (!this.isAvailable()) return false;

    try {
      const key = `session:${sessionId}`;
      await this.redis.setEx(
        key,
        this.SESSION_TTL,
        JSON.stringify(sessionData)
      );
      return true;
    } catch (error) {
      console.error('Error caching session:', error);
      return false;
    }
  }

  /**
   * Get cached session
   */
  async getSession(sessionId) {
    if (!this.isAvailable()) return null;

    try {
      const key = `session:${sessionId}`;
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cached session:', error);
      return null;
    }
  }

  /**
   * Delete cached session
   */
  async deleteSession(sessionId) {
    if (!this.isAvailable()) return false;

    try {
      const key = `session:${sessionId}`;
      await this.redis.del(key);
      
      // Also delete related data
      await this.redis.del(`session:${sessionId}:users`);
      await this.redis.del(`session:${sessionId}:history`);
      
      return true;
    } catch (error) {
      console.error('Error deleting cached session:', error);
      return false;
    }
  }

  /**
   * Add user to session participant list
   */
  async addUserToSession(sessionId, userId, username) {
    if (!this.isAvailable()) return false;

    try {
      // Add to session's user set
      await this.redis.sAdd(`session:${sessionId}:users`, userId);
      
      // Store user metadata
      await this.redis.hSet(
        `session:${sessionId}:user:${userId}`,
        {
          username,
          joinedAt: Date.now().toString()
        }
      );
      
      // Set expiration
      await this.redis.expire(`session:${sessionId}:users`, this.SESSION_TTL);
      await this.redis.expire(`session:${sessionId}:user:${userId}`, this.SESSION_TTL);
      
      // Map user to session
      await this.redis.setEx(`user:${userId}:session`, this.SESSION_TTL, sessionId);
      
      return true;
    } catch (error) {
      console.error('Error adding user to session:', error);
      return false;
    }
  }

  /**
   * Remove user from session
   */
  async removeUserFromSession(sessionId, userId) {
    if (!this.isAvailable()) return false;

    try {
      await this.redis.sRem(`session:${sessionId}:users`, userId);
      await this.redis.del(`session:${sessionId}:user:${userId}`);
      await this.redis.del(`user:${userId}:session`);
      return true;
    } catch (error) {
      console.error('Error removing user from session:', error);
      return false;
    }
  }

  /**
   * Get session user count
   */
  async getSessionUserCount(sessionId) {
    if (!this.isAvailable()) return 0;

    try {
      return await this.redis.sCard(`session:${sessionId}:users`);
    } catch (error) {
      console.error('Error getting session user count:', error);
      return 0;
    }
  }

  /**
   * Check if session is full (max 2 users)
   */
  async isSessionFull(sessionId) {
    const count = await this.getSessionUserCount(sessionId);
    return count >= 2;
  }

  /**
   * Get user's current session
   */
  async getUserSession(userId) {
    if (!this.isAvailable()) return null;

    try {
      return await this.redis.get(`user:${userId}:session`);
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  }

  /**
   * Cache code snapshot (for history/undo)
   */
  async cacheCodeHistory(sessionId, code) {
    if (!this.isAvailable()) return false;

    try {
      const snapshot = JSON.stringify({
        code,
        timestamp: Date.now()
      });

      // Add to history list (newest first)
      await this.redis.lPush(`session:${sessionId}:history`, snapshot);
      
      // Keep only last N versions
      await this.redis.lTrim(`session:${sessionId}:history`, 0, this.CODE_HISTORY_LIMIT - 1);
      
      // Set expiration
      await this.redis.expire(`session:${sessionId}:history`, this.SESSION_TTL);
      
      return true;
    } catch (error) {
      console.error('Error caching code history:', error);
      return false;
    }
  }

  /**
   * Get code history
   */
  async getCodeHistory(sessionId, limit = 10) {
    if (!this.isAvailable()) return [];

    try {
      const snapshots = await this.redis.lRange(`session:${sessionId}:history`, 0, limit - 1);
      return snapshots.map(s => JSON.parse(s));
    } catch (error) {
      console.error('Error getting code history:', error);
      return [];
    }
  }

  /**
   * Get all active sessions
   */
  async getAllActiveSessions() {
    if (!this.isAvailable()) return [];

    try {
      const keys = await this.redis.keys('session:*');
      // Filter out user keys and history keys
      return keys
        .filter(key => !key.includes(':users') && !key.includes(':history') && !key.includes(':user:'))
        .map(key => key.replace('session:', ''));
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }

  /**
   * Extend session TTL (keep alive)
   */
  async extendSessionTTL(sessionId) {
    if (!this.isAvailable()) return false;

    try {
      await this.redis.expire(`session:${sessionId}`, this.SESSION_TTL);
      await this.redis.expire(`session:${sessionId}:users`, this.SESSION_TTL);
      return true;
    } catch (error) {
      console.error('Error extending session TTL:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.isAvailable()) {
      return { available: false };
    }

    try {
      const sessions = await this.getAllActiveSessions();
      const totalUsers = await this.redis.dbSize();
      
      return {
        available: true,
        totalSessions: sessions.length,
        totalKeys: totalUsers,
        uptime: 'N/A' // Can add Redis uptime if needed
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { available: false, error: error.message };
    }
  }
}

// Export singleton instance
const sessionCache = new SessionCache();

module.exports = sessionCache;



