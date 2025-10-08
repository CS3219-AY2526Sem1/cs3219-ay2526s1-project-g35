import { baseRedisService } from "./redis-base-service.js";
import { TOKEN_CHECK_AND_REUSE_SCRIPT } from "./redis-lua-scripts.js";

/**
 * Whitelist Redis Service
 * Handles token whitelisting and user data caching operations
 */
class WhitelistRedisService {
  constructor(baseService) {
    this.baseService = baseService;
  }

  /**
   * Generate whitelist key for a user
   */
  whitelistKeyString(userId) {
    return `whitelist:${String(userId)}`;
  }

  /**
   * Check if Redis client is available
   */
  async isClientAvailable() {
    return this.baseService.isClientAvailable();
  }

  /**
   * Get Redis client instance
   */
  getClient() {
    return this.baseService.getClient();
  }

  /**
   * Store token in whitelist for a user with cached user data
   */
  async storeWhitelistToken(userId, token, expiryInSeconds, userData) {
    if (!(await this.isClientAvailable())) {
      console.warn(
        "Caching Service not available - token whitelisting disabled"
      );
      return false;
    }

    try {
      const key = this.whitelistKeyString(userId);
      const value = JSON.stringify({ token, user: userData });
      const client = this.getClient();
      
      await client.setEx(key, expiryInSeconds, value);
      console.log(
        `Token whitelisted for user ${userId} with TTL ${expiryInSeconds}s (with user data cache)`
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
    if (!(await this.isClientAvailable())) {
      console.warn("Caching Service not available");
      return true;
    }

    try {
      const key = this.whitelistKeyString(userId);
      const client = this.getClient();
      const storedValue = await client.get(key);
      
      if (!storedValue) {
        return false;
      }

      const parsed = JSON.parse(storedValue);
      return parsed.token === token;
    } catch (error) {
      console.error("Error checking token whitelist:", error);
      return false;
    }
  }

  /**
   * Get cached user data from whitelist if available
   * Returns user data if token matches, null otherwise
   */
  async getCachedUserData(userId, token) {
    if (!(await this.isClientAvailable())) {
      return null;
    }

    try {
      const key = this.whitelistKeyString(userId);
      const client = this.getClient();
      const storedValue = await client.get(key);
      
      if (!storedValue) {
        return null;
      }

      const parsed = JSON.parse(storedValue);
      if (parsed.token === token && parsed.user) {
        return parsed.user;
      }

      return null;
    } catch (error) {
      console.error("Error getting cached user data:", error);
      return null;
    }
  }

  /**
   * Remove token from whitelist
   */
  async removeWhitelistToken(userId) {
    if (!(await this.isClientAvailable())) {
      console.warn("Caching Service not available - token removal disabled");
      return false;
    }

    try {
      const key = this.whitelistKeyString(userId);
      const client = this.getClient();
      const result = await client.del(key);
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
    if (!(await this.isClientAvailable())) {
      return -1;
    }
    try {
      const key = this.whitelistKeyString(userId);
      const client = this.getClient();
      return await client.ttl(key);
    } catch (error) {
      console.error("Error getting whitelist token TTL:", error);
      return -1;
    }
  }

  /**
   * Get whitelisted token for a user
   */
  async getWhitelistToken(userId) {
    if (!(await this.isClientAvailable())) {
      return null;
    }

    try {
      const key = this.whitelistKeyString(userId);
      const client = this.getClient();
      const storedValue = await client.get(key);
      
      if (!storedValue) {
        return null;
      }

      const parsed = JSON.parse(storedValue);
      return parsed.token;
    } catch (error) {
      console.error("Error getting whitelist token:", error);
      return null;
    }
  }

  /**
   * Reset TTL for an existing whitelisted token to a specific value
   */
  async resetWhitelistTokenTTL(userId, newTTLSeconds) {
    if (!(await this.isClientAvailable())) {
      console.warn("Caching Service not available - token TTL reset disabled");
      return false;
    }
    try {
      const key = this.whitelistKeyString(userId);
      const client = this.getClient();
      const tokenExists = await client.exists(key);
      if (!tokenExists) {
        console.warn(`No whitelisted token found for user ${userId}`);
        return false;
      }
      const result = await client.expire(key, newTTLSeconds);

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
    if (!(await this.isClientAvailable())) {
      return false;
    }
    try {
      const client = this.getClient();
      const keys = await client.keys("whitelist:*");
      if (keys.length > 0) {
        await client.del(keys);
        console.log(`Cleared ${keys.length} whitelisted tokens`);
      }
      return true;
    } catch (error) {
      console.error("Error clearing whitelist:", error);
      return false;
    }
  }

  /**
   * Atomically store or reuse whitelisted token using Lua script
   * Prevents race conditions during concurrent login attempts
   */
  async storeOrReuseWhitelistToken(userId, newToken, userData, expiryInSeconds, minRemainingTime = 300) {
    if (!(await this.isClientAvailable())) {
      console.warn(
        "Caching Service not available - token whitelisting disabled"
      );
      return {
        token: newToken,
        user: userData,
        wasStored: false,
        wasReused: false
      };
    }

    try {
      const key = this.whitelistKeyString(userId);
      const newValue = JSON.stringify({ token: newToken, user: userData });
      const client = this.getClient();
      
      const result = await client.eval(TOKEN_CHECK_AND_REUSE_SCRIPT, {
        keys: [key],
        arguments: [newValue, expiryInSeconds.toString(), minRemainingTime.toString()]
      });
      
      const [resultValue, action, ttl] = result;
      const parsed = JSON.parse(resultValue);
      const wasReused = action === 'reused';
      
      if (wasReused) {
        console.log(`Reusing existing token for user ${userId} (${ttl}s remaining)`);
      } else {
        console.log(`Token whitelisted for user ${userId} with TTL ${expiryInSeconds}s (with user data cache)`);
      }
      
      return {
        token: parsed.token,
        user: parsed.user,
        wasStored: !wasReused,
        wasReused,
        ttl
      };
    } catch (error) {
      console.error("Error storing/reusing whitelist token:", error);
      return {
        token: newToken,
        user: userData,
        wasStored: false,
        wasReused: false,
        error
      };
    }
  }

  /**
   * Update only the user data in whitelist (keep same token)
   * Useful when user data changes but token should remain valid
   */
  async updateWhitelistUserData(userId, userData) {
    if (!(await this.isClientAvailable())) {
      return false;
    }

    try {
      const key = this.whitelistKeyString(userId);
      const client = this.getClient();
      const storedValue = await client.get(key);
      
      if (!storedValue) {
        console.warn(`No whitelisted token found for user ${userId} to update`);
        return false;
      }

      const ttl = await client.ttl(key);
      if (ttl <= 0) {
        console.warn(`Whitelisted token expired for user ${userId}`);
        return false;
      }
      const parsed = JSON.parse(storedValue);
      const token = parsed.token;

      const newValue = JSON.stringify({ token, user: userData });
      await client.setEx(key, ttl, newValue);
      console.log(`Whitelist user data updated for user ${userId}`);
      return true;
    } catch (error) {
      console.error("Error updating whitelist user data:", error);
      return false;
    }
  }
}

// Export singleton instance
export const whitelistRedisService = new WhitelistRedisService(baseRedisService);
