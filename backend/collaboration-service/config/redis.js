/**
 * Redis Configuration for Session Persistence
 * Allows sessions to persist across service restarts
 */

const redis = require('redis');

let redisClient = null;

/**
 * Initialize Redis connection
 */
const initRedis = async () => {
  try {
    if (process.env.REDIS_ENABLED !== 'true') {
      console.log('Redis disabled - sessions will be stored in memory only');
      return null;
    }

    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection limit reached');
          }
          return retries * 100; // Exponential backoff
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis connecting...');
    });

    redisClient.on('ready', () => {
      console.log('Redis connected and ready');
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message);
    console.log('Continuing without Redis - sessions will be in-memory only');
    return null;
  }
};

/**
 * Save session to Redis
 */
const saveSession = async (sessionId, sessionData) => {
  if (!redisClient || !redisClient.isOpen) {
    return false;
  }

  try {
    const key = `session:${sessionId}`;
    const value = JSON.stringify(sessionData);
    await redisClient.setEx(key, 86400, value); // 24 hour TTL
    return true;
  } catch (error) {
    console.error('Error saving session to Redis:', error);
    return false;
  }
};

/**
 * Get session from Redis
 */
const getSession = async (sessionId) => {
  if (!redisClient || !redisClient.isOpen) {
    return null;
  }

  try {
    const key = `session:${sessionId}`;
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error getting session from Redis:', error);
    return null;
  }
};

/**
 * Delete session from Redis
 */
const deleteSession = async (sessionId) => {
  if (!redisClient || !redisClient.isOpen) {
    return false;
  }

  try {
    const key = `session:${sessionId}`;
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Error deleting session from Redis:', error);
    return false;
  }
};

/**
 * Get all session keys
 */
const getAllSessions = async () => {
  if (!redisClient || !redisClient.isOpen) {
    return [];
  }

  try {
    const keys = await redisClient.keys('session:*');
    return keys;
  } catch (error) {
    console.error('Error getting all sessions from Redis:', error);
    return [];
  }
};

/**
 * Close Redis connection
 */
const closeRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('Redis connection closed');
  }
};

/**
 * Get Redis client instance
 */
const getRedisClient = () => {
  return redisClient;
};

module.exports = {
  initRedis,
  saveSession,
  getSession,
  deleteSession,
  getAllSessions,
  closeRedis,
  getRedisClient,
};
