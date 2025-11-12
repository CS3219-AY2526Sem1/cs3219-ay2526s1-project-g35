const { getRedisClient } = require('../config/redis');

/**
 * Cache Service for Question Data
 * Handles caching and retrieval of questions from Redis
 */

// Cache TTL configurations (in seconds)
const CACHE_TTL = {
  QUESTION: 3600, // 1 hour for individual questions
  RANDOM: 3, // 5 minutes for random question results
  LIST: 600, // 10 minutes for question lists
};

// Cache key prefixes
const CACHE_KEYS = {
  QUESTION: 'question',
  RANDOM: 'random',
  LIST: 'list',
};

/**
 * Generate cache key for a question
 */
const getQuestionKey = (questionId) => {
  return `${CACHE_KEYS.QUESTION}:${questionId}`;
};

/**
 * Generate cache key for random question
 */
const getRandomKey = (topic, difficulty) => {
  return `${CACHE_KEYS.RANDOM}:${topic}:${difficulty}`;
};

/**
 * Generate cache key for question list
 */
const getListKey = (filter) => {
  return `${CACHE_KEYS.LIST}:${filter || 'all'}`;
};

/**
 * Get question from cache
 */
const getQuestion = async (questionId) => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) {
      return null;
    }

    const key = getQuestionKey(questionId);
    const cached = await client.get(key);

    if (cached) {
      console.log(`[Cache HIT] Question ${questionId}`);
      return JSON.parse(cached);
    }

    console.log(`[Cache MISS] Question ${questionId}`);
    return null;
  } catch (error) {
    console.error('Redis get error:', error.message);
    return null; // Graceful degradation
  }
};

/**
 * Set question in cache
 */
const setQuestion = async (questionId, questionData, ttl = CACHE_TTL.QUESTION) => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) {
      return false;
    }

    const key = getQuestionKey(questionId);
    await client.setEx(key, ttl, JSON.stringify(questionData));
    console.log(`[Cache SET] Question ${questionId} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    console.error('Redis set error:', error.message);
    return false;
  }
};

/**
 * Delete question from cache
 */
const deleteQuestion = async (questionId) => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) {
      return false;
    }

    const key = getQuestionKey(questionId);
    await client.del(key);
    console.log(`[Cache DELETE] Question ${questionId}`);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error.message);
    return false;
  }
};

/**
 * Cache random question ID
 */
const setRandomQuestion = async (topic, difficulty, questionId) => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) {
      return false;
    }

    const key = getRandomKey(topic, difficulty);
    await client.setEx(key, CACHE_TTL.RANDOM, questionId);
    console.log(`[Cache SET] Random ${topic}/${difficulty} -> ${questionId}`);
    return true;
  } catch (error) {
    console.error('Redis set random error:', error.message);
    return false;
  }
};

/**
 * Get cached random question ID
 */
const getRandomQuestion = async (topic, difficulty) => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) {
      return null;
    }

    const key = getRandomKey(topic, difficulty);
    const cached = await client.get(key);

    if (cached) {
      console.log(`[Cache HIT] Random ${topic}/${difficulty}`);
      return cached;
    }

    console.log(`[Cache MISS] Random ${topic}/${difficulty}`);
    return null;
  } catch (error) {
    console.error('Redis get random error:', error.message);
    return null;
  }
};

/**
 * Invalidate all caches for a specific filter
 * Useful when questions are created/updated/deleted
 */
const invalidatePattern = async (pattern) => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) {
      return false;
    }

    // Get all keys matching pattern
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`[Cache INVALIDATE] ${keys.length} keys matching ${pattern}`);
    }
    return true;
  } catch (error) {
    console.error('Redis invalidate error:', error.message);
    return false;
  }
};

/**
 * Invalidate all random question caches
 * Call this when any question is created/updated/deleted
 */
const invalidateRandomCaches = async () => {
  return await invalidatePattern(`${CACHE_KEYS.RANDOM}:*`);
};

/**
 * Invalidate all list caches
 */
const invalidateListCaches = async () => {
  return await invalidatePattern(`${CACHE_KEYS.LIST}:*`);
};

/**
 * Clear all question-related caches
 * Use sparingly - only when major data changes occur
 */
const clearAllCaches = async () => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) {
      return false;
    }

    await client.flushDb();
    console.log('[Cache FLUSH] All caches cleared');
    return true;
  } catch (error) {
    console.error('Redis flush error:', error.message);
    return false;
  }
};

/**
 * Get cache statistics (for monitoring)
 */
const getCacheStats = async () => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) {
      return { connected: false };
    }

    const info = await client.info('stats');
    const dbSize = await client.dbSize();

    return {
      connected: true,
      dbSize,
      info,
    };
  } catch (error) {
    console.error('Redis stats error:', error.message);
    return { connected: false, error: error.message };
  }
};

module.exports = {
  // Question caching
  getQuestion,
  setQuestion,
  deleteQuestion,

  // Random question caching
  getRandomQuestion,
  setRandomQuestion,

  // Invalidation
  invalidateRandomCaches,
  invalidateListCaches,
  clearAllCaches,

  // Utilities
  getCacheStats,
  CACHE_TTL,
};
