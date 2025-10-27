const { createClient } = require('redis');

/**
 * Redis Configuration for Question Service Caching
 */

let redisClient = null;

/**
 * Initialize Redis connection
 */
const initRedis = async () => {
  if (redisClient) {
    return redisClient;
  }

  const redisConfig = {
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6380,
    },
  };

  // Add password if provided
  if (process.env.REDIS_PASSWORD) {
    redisConfig.password = process.env.REDIS_PASSWORD;
  }

  redisClient = createClient(redisConfig);

  // Error handling
  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('✓ Connected to Redis on', `${redisConfig.socket.host}:${redisConfig.socket.port}`);
  });

  redisClient.on('ready', () => {
    console.log('✓ Redis client ready');
  });

  redisClient.on('end', () => {
    console.log('Redis client disconnected');
  });

  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Don't throw - allow service to run without cache
    return null;
  }
};

/**
 * Get Redis client instance
 */
const getRedisClient = () => {
  return redisClient;
};

/**
 * Close Redis connection
 */
const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis connection closed');
  }
};

module.exports = {
  initRedis,
  getRedisClient,
  closeRedis,
};
