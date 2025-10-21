/**
 * Service Integration Module
 * Handles communication with other microservices
 */

const axios = require('axios');

class ServiceIntegration {
  constructor() {
    // Service URLs - can be configured via environment variables
    this.questionServiceUrl = process.env.QUESTION_SERVICE_URL || 'http://question-service:8001';
    this.matchingServiceUrl = process.env.MATCHING_SERVICE_URL || 'http://matching-service:8003';
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:8000';

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
  }

  /**
   * Fetch question details from question service
   */
  async getQuestionDetails(questionId) {
    try {
      console.log(`Fetching question details for ID: ${questionId}`);

      const response = await this.questionServiceClient.get(`/api/questions/${questionId}`);

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
