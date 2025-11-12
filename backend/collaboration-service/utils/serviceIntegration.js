/*
 * AI Assistance Disclosure:
 * Tool: ChatGPT / Claude (via Cursor), Date: 2025-11-08 to 2025-11-10
 * Scope: Service-to-service HTTP communication patterns, JWT token extraction and forwarding,
 *        authenticated request handling, error handling for service communication
 * Author review: Integration patterns implemented and tested with history service and JWT
 *                authentication by Basil
 */

/**
 * Service Integration Module
 * Handles communication with other microservices
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

class ServiceIntegration {
  constructor() {
    // Service URLs - can be configured via environment variables
    this.questionServiceUrl = process.env.QUESTION_SERVICE_URL || 'http://question-service:8001';
    this.matchingServiceUrl = process.env.MATCHING_SERVICE_URL || 'http://matching-service:8003';
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:8000';
    this.historyServiceUrl = process.env.HISTORY_SERVICE_URL || 'http://history-service:8004';
    this.serviceName = process.env.SERVICE_NAME || 'collaboration-service';
    this.jwtSecret = process.env.JWT_SECRET;
    this.serviceTokenDefaults = {
      id: process.env.SERVICE_JWT_SUBJECT || `${this.serviceName}-internal`,
      username: process.env.SERVICE_JWT_USERNAME || this.serviceName,
      email:
        process.env.SERVICE_JWT_EMAIL ||
        `${this.serviceName.replace(/[^a-z0-9]/gi, '-')}@internal.peerprep`,
      service: this.serviceName,
      internal: true,
    };
    this.serviceTokenOptions = {
      expiresIn: process.env.SERVICE_JWT_TTL || '5m',
      issuer: process.env.SERVICE_JWT_ISSUER || this.serviceName,
      audience: process.env.SERVICE_JWT_AUDIENCE || 'question-service',
    };
    this.jwtWarningLogged = false;

    // Create axios instances with default configs
    this.questionServiceClient = axios.create({
      baseURL: this.questionServiceUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.matchingServiceClient = axios.create({
      baseURL: this.matchingServiceUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.userServiceClient = axios.create({
      baseURL: this.userServiceUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.historyServiceClient = axios.create({
      baseURL: this.historyServiceUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch question details from question service
   * @param {string} questionId - The question ID to fetch
   * @param {string} token - JWT token for authentication (optional)
   */
  async getQuestionDetails(questionId, token = null) {
    try {
      console.log(`Fetching question details for ID: ${questionId}`);

      // Prepare headers with token if provided or generated
      const headers = {};
      let resolvedToken = token;

      if (!resolvedToken) {
        resolvedToken = this.generateServiceToken({
          scope: 'question:read',
          questionId,
        });
      }

      if (resolvedToken) {
        headers.Authorization = `Bearer ${resolvedToken}`;
        headers.Cookie = `accessToken=${resolvedToken}`;
        console.log('Using service JWT token for question service request');
      } else {
        console.warn('Proceeding without JWT token for question service request');
      }

      const response = await this.questionServiceClient.get(`/api/questions/${questionId}`, {
        headers,
      });

      if (response.data && response.data.success) {
        console.log(`Question details fetched successfully`);
        return {
          success: true,
          question: response.data.data, // Question data is in "data" field
        };
      } else {
        throw new Error('Invalid response format from question service');
      }
    } catch (error) {
      console.error('Error fetching question details:', error.message);

      if (error.response) {
        // Server responded with error status
        return {
          success: false,
          error: `Question service error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`,
        };
      } else if (error.request) {
        // Request was made but no response received
        return {
          success: false,
          error: 'Question service is unavailable',
        };
      } else {
        // Something else happened
        return {
          success: false,
          error: `Request error: ${error.message}`,
        };
      }
    }
  }

  /**
   * Generate a short-lived service-to-service JWT
   * @param {Object} payloadOverrides - Additional payload fields
   * @returns {string|null} - Signed JWT or null if unavailable
   */
  generateServiceToken(payloadOverrides = {}) {
    if (!this.jwtSecret) {
      if (!this.jwtWarningLogged) {
        console.error(
          'JWT_SECRET is not configured for collaboration service. Unable to generate service token.',
        );
        this.jwtWarningLogged = true;
      }
      return null;
    }

    try {
      return jwt.sign(
        {
          ...this.serviceTokenDefaults,
          ...payloadOverrides,
        },
        this.jwtSecret,
        this.serviceTokenOptions,
      );
    } catch (error) {
      console.error('Failed to generate service JWT token:', error.message);
      return null;
    }
  }

  /**
   * Get user details from user service
   */
  async getUserDetails(userId) {
    try {
      console.log(`Fetching user details for ID: ${userId}`);

      const response = await this.userServiceClient.get(`/api/users/${userId}`);

      if (response.data && response.data.success) {
        console.log(`User details fetched successfully`);
        return {
          success: true,
          user: response.data.user,
        };
      } else {
        throw new Error('Invalid response format from user service');
      }
    } catch (error) {
      console.error('Error fetching user details:', error.message);

      if (error.response) {
        return {
          success: false,
          error: `User service error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`,
        };
      } else if (error.request) {
        return {
          success: false,
          error: 'User service is unavailable',
        };
      } else {
        return {
          success: false,
          error: `Request error: ${error.message}`,
        };
      }
    }
  }

  /**
   * Notify matching service that session is ready
   */
  async notifySessionReady(sessionId, userIds, questionId) {
    try {
      console.log(`Notifying matching service that session ${sessionId} is ready`);

      const response = await this.matchingServiceClient.post('/api/sessions/ready', {
        sessionId,
        userIds,
        questionId,
        timestamp: Date.now(),
      });

      if (response.data && response.data.success) {
        console.log(`Matching service notified successfully`);
        return {
          success: true,
          message: 'Matching service notified',
        };
      } else {
        throw new Error('Invalid response format from matching service');
      }
    } catch (error) {
      console.error('Error notifying matching service:', error.message);

      if (error.response) {
        return {
          success: false,
          error: `Matching service error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`,
        };
      } else if (error.request) {
        return {
          success: false,
          error: 'Matching service is unavailable',
        };
      } else {
        return {
          success: false,
          error: `Request error: ${error.message}`,
        };
      }
    }
  }

  /**
   * Create history entry for a collaboration session
   * @param {Object} historyData - History entry data
   * @param {string} historyData.user_id - User ID
   * @param {string} historyData.session_id - Session ID
   * @param {string} historyData.question_title - Question title
   * @param {string} historyData.difficulty - Question difficulty (Easy, Medium, Hard)
   * @param {string} historyData.category - Question category/topic
   * @returns {Promise<Object>} Result of history creation
   */
  async createHistoryEntry(historyData) {
    try {
      console.log(
        `Creating history entry for user ${historyData.user_id} and session ${historyData.session_id}`,
      );

      const response = await this.historyServiceClient.post('/history', {
        user_id: historyData.user_id,
        session_id: historyData.session_id,
        question_title: historyData.question_title,
        difficulty: historyData.difficulty,
        category: historyData.category,
      });

      if (response.data && response.data.success) {
        console.log(`History entry created successfully for user ${historyData.user_id}`);
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        throw new Error('Invalid response format from history service');
      }
    } catch (error) {
      console.error('Error creating history entry:', error.message);

      if (error.response) {
        return {
          success: false,
          error: `History service error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`,
        };
      } else if (error.request) {
        return {
          success: false,
          error: 'History service is unavailable',
        };
      } else {
        return {
          success: false,
          error: `Request error: ${error.message}`,
        };
      }
    }
  }

  /**
   * Health check for all services
   */
  async healthCheck() {
    const services = [
      {
        name: 'Question Service',
        client: this.questionServiceClient,
        url: this.questionServiceUrl,
      },
      {
        name: 'Matching Service',
        client: this.matchingServiceClient,
        url: this.matchingServiceUrl,
      },
      { name: 'User Service', client: this.userServiceClient, url: this.userServiceUrl },
      {
        name: 'History Service',
        client: this.historyServiceClient,
        url: this.historyServiceUrl,
      },
    ];

    const results = {};

    for (const service of services) {
      try {
        const response = await service.client.get('/health');
        results[service.name] = {
          status: 'healthy',
          responseTime: response.headers['x-response-time'] || 'unknown',
        };
      } catch (error) {
        results[service.name] = {
          status: 'unhealthy',
          error: error.message,
        };
      }
    }

    return results;
  }
}

module.exports = ServiceIntegration;
