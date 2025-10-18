import { baseRedisService } from './redis-base-service.js';

class OTPRedisService {
  constructor(baseService) {
    this.baseService = baseService;
  }

  /**
   * Generate OTP key for identifier and purpose
   */
  otpKeyString(identifier, purpose) {
    return `otp:${String(purpose)}:${String(identifier)}`;
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
   * Store OTP data in Redis with TTL
   */
  async storeOTP(identifier, otpData, purpose = 'verification') {
    if (!(await this.isClientAvailable())) {
      console.warn('Caching Service not available - OTP storage disabled');
      return false;
    }
    try {
      const key = this.otpKeyString(identifier, purpose);
      const serializedData = JSON.stringify(otpData);
      const ttl = otpData.ttl;
      const client = this.getClient();

      await client.setEx(key, ttl, serializedData);
      console.log(`OTP stored for ${identifier} with purpose ${purpose}, TTL: ${ttl}s`);
      return true;
    } catch (error) {
      console.error('Error storing OTP:', error);
      return false;
    }
  }

  /**
   * Retrieve OTP data from Redis
   */
  async getOTP(identifier, purpose = 'verification') {
    if (!(await this.isClientAvailable())) {
      console.warn('Caching Service not available - OTP retrieval disabled');
      return null;
    }
    try {
      const key = this.otpKeyString(identifier, purpose);
      const client = this.getClient();
      const serializedData = await client.get(key);

      if (!serializedData) {
        return null;
      }

      return JSON.parse(serializedData);
    } catch (error) {
      console.error('Error retrieving OTP:', error);
      return null;
    }
  }

  /**
   * Delete OTP from Redis
   */
  async deleteOTP(identifier, purpose = 'verification') {
    if (!(await this.isClientAvailable())) {
      console.warn('Caching Service not available - OTP deletion disabled');
      return false;
    }

    try {
      const key = this.otpKeyString(identifier, purpose);
      const client = this.getClient();
      const result = await client.del(key);

      console.log(`OTP deleted for ${identifier} with purpose ${purpose}`);
      return result > 0;
    } catch (error) {
      console.error('Error deleting OTP:', error);
      return false;
    }
  }

  /**
   * Increment OTP attempt counter
   */
  async incrementOTPAttempts(identifier, purpose = 'verification') {
    if (!(await this.isClientAvailable())) {
      console.warn('Caching Service not available - OTP attempt increment disabled');
      return null;
    }
    try {
      const key = this.otpKeyString(identifier, purpose);
      const client = this.getClient();
      const serializedData = await client.get(key);

      if (!serializedData) {
        return null;
      }

      const otpData = JSON.parse(serializedData);
      otpData.attempts = (otpData.attempts || 0) + 1;

      const ttl = await client.ttl(key);
      if (ttl > 0) {
        await client.setEx(key, ttl, JSON.stringify(otpData));
      }
      console.log(`OTP attempts incremented for ${identifier}, now: ${otpData.attempts}`);
      return otpData;
    } catch (error) {
      console.error('Error incrementing OTP attempts:', error);
      return null;
    }
  }

  /**
   * Get remaining TTL for OTP
   */
  async getOTPTTL(identifier, purpose = 'verification') {
    if (!(await this.isClientAvailable())) {
      console.warn('Caching Service not available - OTP TTL check disabled');
      return -1;
    }

    try {
      const key = this.otpKeyString(identifier, purpose);
      const client = this.getClient();
      return await client.ttl(key);
    } catch (error) {
      console.error('Error getting OTP TTL:', error);
      return -1;
    }
  }

  /**
   * Check if OTP exists for identifier and purpose
   */
  async hasOTP(identifier, purpose = 'verification') {
    if (!(await this.isClientAvailable())) {
      return false;
    }

    try {
      const key = this.otpKeyString(identifier, purpose);
      const client = this.getClient();
      const exists = await client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Error checking OTP existence:', error);
      return false;
    }
  }
}

export const otpRedisService = new OTPRedisService(baseRedisService);
