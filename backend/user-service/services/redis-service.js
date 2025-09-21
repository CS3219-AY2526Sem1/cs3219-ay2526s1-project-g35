import { createClient } from "redis";

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  whitelistKeyString(userId) {
    return `whitelist:${String(userId)}`;
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
        console.error("Caching Service Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("Connected to Caching Service");
        this.isConnected = true;
      });

      this.client.on("disconnect", () => {
        console.log("Disconnected from Caching Service");
        this.isConnected = false;
      });
      await this.client.connect();
    } catch (error) {
      console.error("Failed to connect to Caching Service:", error);
      this.isConnected = false;
    }
  }

  async isClientAvailable() {
    return this.isConnected && !!this.client;
  }

  /**
   * Store token in whitelist for a user
   * Key: whitelist:userId
   * Value: current valid access token
   * TTL: matches JWT expiration time
   */
  async storeWhitelistToken(userId, token, expiryInSeconds) {
    if (!this.isClientAvailable()) {
      console.warn(
        "Caching Service not available - token whitelisting disabled"
      );
      return false;
    }

    try {
      const key = this.whitelistKeyString(userId);
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
    if (!this.isClientAvailable()) {
      console.warn("Caching Service not available");
      return true;
    }

    try {
      const key = this.whitelistKeyString(userId);
      const storedToken = await this.client.get(key);
      return storedToken === token;
    } catch (error) {
      console.error("Error checking token whitelist:", error);
      return false;
    }
  }

  /**
   * Remove token from whitelist
   */
  async removeWhitelistToken(userId) {
    if (!this.isClientAvailable()) {
      console.warn("Caching Service not available - token removal disabled");
      return false;
    }

    try {
      const key = this.whitelistKeyString(userId);
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
    if (!this.isClientAvailable()) {
      return -1;
    }
    try {
      const key = this.whitelistKeyString(userId);
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
    if (!this.isClientAvailable()) {
      return null;
    }

    try {
      const key = this.whitelistKeyString(userId);
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
    if (!this.isClientAvailable()) {
      console.warn("Caching Service not available - token TTL reset disabled");
      return false;
    }
    try {
      const key = this.whitelistKeyString(userId);
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
    if (!this.isClientAvailable()) {
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

  otpKeyString(identifier, purpose) {
    return `otp:${String(purpose)}:${String(identifier)}`;
  }

  /**
   * Store OTP data in Redis with TTL
   * Key: otp:purpose:identifier (e.g., otp:verification:userId123 or otp:registration:user@example.com)
   */
  async storeOTP(identifier, otpData, purpose = "verification") {
    if (!this.isClientAvailable()) {
      console.warn("Caching Service not available - OTP storage disabled");
      return false;
    }
    try {
      const key = this.otpKeyString(identifier, purpose);
      const serializedData = JSON.stringify(otpData);
      const ttl = otpData.ttl;
      await this.client.setEx(key, ttl, serializedData);
      console.log(
        `OTP stored for ${identifier} with purpose ${purpose}, TTL: ${ttl}s`
      );
      return true;
    } catch (error) {
      console.error("Error storing OTP:", error);
      return false;
    }
  }

  /**
   * Retrieve OTP data from Redis
   */
  async getOTP(identifier, purpose = "verification") {
    if (!this.isClientAvailable()) {
      console.warn("Caching Service not available - OTP retrieval disabled");
      return null;
    }
    try {
      const key = this.otpKeyString(identifier, purpose);
      const serializedData = await this.client.get(key);
      if (!serializedData) {
        return null;
      }

      return JSON.parse(serializedData);
    } catch (error) {
      console.error("Error retrieving OTP:", error);
      return null;
    }
  }

  /**
   * Delete OTP from Redis
   */
  async deleteOTP(identifier, purpose = "verification") {
    if (!this.isClientAvailable()) {
      console.warn("Caching Service not available - OTP deletion disabled");
      return false;
    }

    try {
      const key = this.otpKeyString(identifier, purpose);
      const result = await this.client.del(key);

      console.log(`OTP deleted for ${identifier} with purpose ${purpose}`);
      return result > 0;
    } catch (error) {
      console.error("Error deleting OTP:", error);
      return false;
    }
  }

  /**
   * Increment OTP attempt counter
   */
  async incrementOTPAttempts(identifier, purpose = "verification") {
    if (!this.isClientAvailable()) {
      console.warn(
        "Caching Service not available - OTP attempt increment disabled"
      );
      return null;
    }
    try {
      const key = this.otpKeyString(identifier, purpose);
      const serializedData = await this.client.get(key);

      if (!serializedData) {
        return null;
      }

      const otpData = JSON.parse(serializedData);
      otpData.attempts = (otpData.attempts || 0) + 1;

      const ttl = await this.client.ttl(key);
      if (ttl > 0) {
        await this.client.setEx(key, ttl, JSON.stringify(otpData));
      }
      console.log(
        `OTP attempts incremented for ${identifier}, now: ${otpData.attempts}`
      );
      return otpData;
    } catch (error) {
      console.error("Error incrementing OTP attempts:", error);
      return null;
    }
  }

  /**
   * Get remaining TTL for OTP
   */
  async getOTPTTL(identifier, purpose = "verification") {
    if (!this.isClientAvailable()) {
      console.warn("Caching Service not available - OTP TTL check disabled");
      return -1;
    }

    try {
      const key = this.otpKeyString(identifier, purpose);
      return await this.client.ttl(key);
    } catch (error) {
      console.error("Error getting OTP TTL:", error);
      return -1;
    }
  }

  /**
   * Check if OTP exists for identifier and purpose
   */
  async hasOTP(identifier, purpose = "verification") {
    if (!this.isClientAvailable()) {
      return false;
    }

    try {
      const key = this.otpKeyString(identifier, purpose);
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error("Error checking OTP existence:", error);
      return false;
    }
  }

  /**
   * Clean up expired OTPs (maintenance function)
   * This is automatically handled by Redis TTL, but can be called manually
   */
  async cleanupExpiredOTPs(purpose = null) {
    if (!this.isClientAvailable()) {
      console.warn("Caching Service not available - OTP cleanup disabled");
      return 0;
    }

    try {
      const pattern = purpose ? `otp:${purpose}:*` : "otp:*";
      const keys = await this.client.keys(pattern);

      let cleanedCount = 0;
      for (const key of keys) {
        const ttl = await this.client.ttl(key);
        if (ttl === -2) {
          cleanedCount++;
        }
      }

      console.log(`OTP cleanup completed: ${cleanedCount} expired keys found`);
      return cleanedCount;
    } catch (error) {
      console.error("Error during OTP cleanup:", error);
      return 0;
    }
  }
}

export const redisService = new RedisService();
