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
          // reconnect after
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
   * Add token to blacklist
   */
  async blacklistToken(token, expiryInSeconds) {
    if (!this.isConnected || !this.client) {
      console.warn("Redis not available - token blacklisting disabled");
      return false;
    }

    try {
      const key = `blacklist:${token}`;
      await this.client.setEx(key, expiryInSeconds, "blacklisted");
      return true;
    } catch (error) {
      console.error("Error blacklisting token:", error);
      return false;
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const key = `blacklist:${token}`;
      const result = await this.client.get(key);
      return result === "blacklisted";
    } catch (error) {
      console.error("Error checking token blacklist:", error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a blacklisted token
   */
  async getTokenTTL(token) {
    if (!this.isConnected || !this.client) {
      return -1;
    }

    try {
      const key = `blacklist:${token}`;
      return await this.client.ttl(key);
    } catch (error) {
      console.error("Error getting token TTL:", error);
      return -1;
    }
  }

  /**
   * Clear all blacklisted tokens (for testing)
   */
  async clearBlacklist() {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys("blacklist:*");
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error("Error clearing blacklist:", error);
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

// Export singleton instance
export const redisService = new RedisService();
