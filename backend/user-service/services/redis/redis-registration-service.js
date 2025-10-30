import { baseRedisService } from './redis-base-service.js';

/**
 * Redis service for storing temporary registration data
 * Used to store user registration details before email verification
 */
class RegistrationRedisService {
  constructor(baseService) {
    this.baseService = baseService;
    this.defaultTTL = 1800; // 30 minutes
  }

  /**
   * Generate Redis key for pending registration
   */
  registrationKeyString(email) {
    return `registration:pending:${email.toLowerCase()}`;
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
   * Store pending registration data in Redis with TTL
   */
  async storePendingRegistration(email, registrationData, ttl = this.defaultTTL) {
    if (!(await this.isClientAvailable())) {
      console.warn('Caching Service not available - Registration storage disabled');
      return false;
    }
    try {
      const key = this.registrationKeyString(email);
      const serializedData = JSON.stringify(registrationData);
      const client = this.getClient();

      await client.setEx(key, ttl, serializedData);
      console.log(`Pending registration stored for ${email}, TTL: ${ttl}s`);
      return true;
    } catch (error) {
      console.error('Error storing pending registration:', error);
      return false;
    }
  }

  /**
   * Retrieve pending registration data from Redis
   */
  async getPendingRegistration(email) {
    if (!(await this.isClientAvailable())) {
      console.warn('Caching Service not available - Registration retrieval disabled');
      return null;
    }
    try {
      const key = this.registrationKeyString(email);
      const client = this.getClient();
      const serializedData = await client.get(key);

      if (!serializedData) {
        return null;
      }

      return JSON.parse(serializedData);
    } catch (error) {
      console.error('Error retrieving pending registration:', error);
      return null;
    }
  }

  /**
   * Delete pending registration from Redis
   */
  async deletePendingRegistration(email) {
    if (!(await this.isClientAvailable())) {
      console.warn('Caching Service not available - Registration deletion disabled');
      return false;
    }

    try {
      const key = this.registrationKeyString(email);
      const client = this.getClient();
      const result = await client.del(key);

      console.log(`Pending registration deleted for ${email}`);
      return result > 0;
    } catch (error) {
      console.error('Error deleting pending registration:', error);
      return false;
    }
  }

  /**
   * Check if pending registration exists
   */
  async hasPendingRegistration(email) {
    if (!(await this.isClientAvailable())) {
      return false;
    }

    try {
      const key = this.registrationKeyString(email);
      const client = this.getClient();
      const exists = await client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Error checking pending registration existence:', error);
      return false;
    }
  }

  /**
   * Get remaining TTL for pending registration
   */
  async getRegistrationTTL(email) {
    if (!(await this.isClientAvailable())) {
      console.warn('Caching Service not available - Registration TTL check disabled');
      return -1;
    }

    try {
      const key = this.registrationKeyString(email);
      const client = this.getClient();
      return await client.ttl(key);
    } catch (error) {
      console.error('Error getting registration TTL:', error);
      return -1;
    }
  }
}

export const registrationRedisService = new RegistrationRedisService(baseRedisService);
