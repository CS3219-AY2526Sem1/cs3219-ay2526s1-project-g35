import { createClient } from "redis";

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
        retry_strategy: options => {
          if (options.error && options.error.code === "ECONNREFUSED") {
            return new Error("The server refused the connection");
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error("Retry time exhausted");
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        },
      });

      this.client.on("error", err => {
        console.error("Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("Connected to Redis");
        this.isConnected = true;
      });

      this.client.on("disconnect", () => {
        console.log("Disconnected from Redis");
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      this.isConnected = false;
    }
  }

  /**
   * Store token in whitelist for a user
   * Key: whitelist:userId
   * Value: current valid access token
   * TTL: matches JWT expiration time
   */
  async storeWhitelistToken(userId, token, expiryInSeconds) {
    if (!this.isConnected || !this.client) {
      console.warn("Redis not available - token whitelisting disabled");
      return false;
    }

    try {
      const key = `whitelist:${userId}`;
      await this.client.setEx(key, expiryInSeconds, token);
      console.log(
        `Token whitelisted for user ${userId} with TTL ${expiryInSeconds}s`
      );
      return true;
    } catch (error) {
      console.error("Error storing whitelist token:", error);
      return false;
    }
  }

  /**
   * Check if token is whitelisted for a user
   * Returns true if the token matches the stored token for the user
   */
  async isTokenWhitelisted(userId, token) {
    if (!this.isConnected || !this.client) {
      console.warn("Service not available");
      return true;
    }

    try {
      const key = `whitelist:${userId}`;
      const storedToken = await this.client.get(key);
      return storedToken === token;
    } catch (error) {
      console.error("Error checking token whitelist:", error);
      return false;
    }
  }

  /**
   * Remove token from whitelist (logout)
   */
  async removeWhitelistToken(userId) {
    if (!this.isConnected || !this.client) {
      console.warn("Service not available - token removal disabled");
      return false;
    }

    try {
      const key = `whitelist:${userId}`;
      const result = await this.client.del(key);
      console.log(`Token removed from whitelist for user ${userId}`);
      return result > 0;
    } catch (error) {
      console.error("Error removing whitelist token:", error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a whitelisted token
   */
  async getWhitelistTokenTTL(userId) {
    if (!this.isConnected || !this.client) {
      return -1;
    }
    try {
      const key = `whitelist:${userId}`;
      return await this.client.ttl(key);
    } catch (error) {
      console.error("Error getting whitelist token TTL:", error);
      return -1;
    }
  }

  /**
   * Get whitelisted token for a user
   */
  async getWhitelistToken(userId) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const key = `whitelist:${userId}`;
      return await this.client.get(key);
    } catch (error) {
      console.error("Error getting whitelist token:", error);
      return null;
    }
  }

  /**
   * Reset TTL for an existing whitelisted token to a specific value
   */
  async resetWhitelistTokenTTL(userId, newTTLSeconds) {
    if (!this.isConnected || !this.client) {
      console.warn("Service not available - token TTL reset disabled");
      return false;
    }
    try {
      const key = `whitelist:${userId}`;
      const tokenExists = await this.client.exists(key);
      if (!tokenExists) {
        console.warn(`No whitelisted token found for user ${userId}`);
        return false;
      }
      const result = await this.client.expire(key, newTTLSeconds);

      if (result) {
        console.log(`Reset token TTL for user ${userId} to ${newTTLSeconds}s`);
      }

      return result === 1;
    } catch (error) {
      console.error("Error resetting whitelist token TTL:", error);
      return false;
    }
  }

  /**
   * Clear all whitelisted tokens
   */
  async clearWhitelist() {
    if (!this.isConnected || !this.client) {
      return false;
    }
    try {
      const keys = await this.client.keys("whitelist:*");
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`Cleared ${keys.length} whitelisted tokens`);
      }
      return true;
    } catch (error) {
      console.error("Error clearing whitelist:", error);
      return false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      client: !!this.client,
    };
  }
}

export const redisService = new RedisService();
