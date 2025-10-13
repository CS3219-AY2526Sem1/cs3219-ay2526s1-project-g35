import { createClient } from "redis";
class BaseRedisService {
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
        url: process.env.REDIS_URL,
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

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  /**
   * Check if Redis client is available
   */
  async isClientAvailable() {
    return this.isConnected && !!this.client;
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

  /**
   * Get Redis client instance
   */
  getClient() {
    return this.client;
  }
}
export const baseRedisService = new BaseRedisService();
