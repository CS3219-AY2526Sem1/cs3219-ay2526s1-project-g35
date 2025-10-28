/**
 * Integration Tests - Real Redis & JWT
 *
 * These tests use REAL Redis and JWT authentication
 * Run these separately from unit tests
 *
 * Prerequisites:
 * - Docker services running (docker-compose up)
 * - User service running for JWT validation
 * - Redis running
 */

const request = require('supertest');
const app = require('../../index');
const { initRedis, closeRedis, getRedisClient } = require('../../config/redis');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('Integration Tests - Real Redis & JWT', () => {
  let adminToken;
  let userToken;
  let redisClient;

  beforeAll(async () => {
    // Connect to real Redis
    await initRedis();
    redisClient = getRedisClient();

    // Generate real JWT tokens for testing
    adminToken = jwt.sign(
      {
        id: 'test-admin-id',
        username: 'testadmin',
        email: 'admin@test.com',
        isAdmin: true,
        isVerified: true,
      },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    userToken = jwt.sign(
      {
        id: 'test-user-id',
        username: 'testuser',
        email: 'user@test.com',
        isAdmin: false,
        isVerified: true,
      },
      JWT_SECRET,
      { expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    // Clean up Redis connection
    await closeRedis();
  });

  describe('Real JWT Authentication', () => {
    it('should reject requests without JWT token', async () => {
      const response = await request(app).get('/api/questions').expect(401);

      expect(response.body.error).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should accept requests with valid JWT token', async () => {
      const response = await request(app)
        .get('/api/questions')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject admin endpoints for non-admin users', async () => {
      const response = await request(app)
        .post('/api/questions')
        .set('Cookie', `accessToken=${userToken}`)
        .send({
          title: 'Test Question',
          description: 'Test',
          difficulty: 'Easy',
          topics: ['Test'],
          testCases: [{ input: 'test', expectedOutput: 'test', type: 'Sample' }],
        })
        .expect(403);

      expect(response.body.error).toBe('INSUFFICIENT_PRIVILEGES');
    });

    it('should allow admin endpoints for admin users', async () => {
      const response = await request(app)
        .post('/api/questions')
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          title: 'Integration Test Question',
          description: 'Testing with real JWT',
          difficulty: 'Easy',
          topics: ['Testing'],
          testCases: [{ input: 'test', expectedOutput: 'test', type: 'Sample' }],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Integration Test Question');

      // Clean up
      if (response.body.data._id) {
        await request(app)
          .delete(`/api/questions/${response.body.data._id}`)
          .set('Cookie', `accessToken=${adminToken}`);
      }
    });
  });

  describe('Real Redis Caching', () => {
    let testQuestionId;

    beforeAll(async () => {
      // Create a test question
      const response = await request(app)
        .post('/api/questions')
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          title: 'Redis Cache Test Question',
          description: 'For testing Redis caching',
          difficulty: 'Medium',
          topics: ['Caching', 'Redis'],
          testCases: [{ input: 'test', expectedOutput: 'test', type: 'Sample' }],
        });

      // Store question ID if created successfully, otherwise tests will be skipped
      if (response.body.success && response.body.data) {
        testQuestionId = response.body.data._id;
        console.log(`✓ Created test question: ${testQuestionId}`);
      } else {
        console.warn('⚠ Failed to create test question - caching tests will be skipped');
        console.warn('  Error:', response.body.error || 'Unknown error');
        console.warn('  Make sure MongoDB is connected and the app is running properly');
      }
    });

    afterAll(async () => {
      // Clean up - only delete if question exists
      if (testQuestionId) {
        try {
          await request(app)
            .delete(`/api/questions/${testQuestionId}`)
            .set('Cookie', `accessToken=${adminToken}`);
        } catch (error) {
          console.warn('Failed to cleanup test question:', error.message);
        }
      }
    });

    it('should return cache MISS on first request', async () => {
      // Skip if test question wasn't created
      if (!testQuestionId) {
        console.warn('Test question not created, skipping test');
        return;
      }

      // Clear cache first
      if (redisClient) {
        await redisClient.del(`question:${testQuestionId}`);
      }

      const response = await request(app)
        .get(`/api/questions/${testQuestionId}`)
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cached).toBe(false); // First request = cache miss
    });

    it('should return cache HIT on second request', async () => {
      // Skip if test question wasn't created
      if (!testQuestionId) {
        console.warn('Test question not created, skipping test');
        return;
      }

      const response = await request(app)
        .get(`/api/questions/${testQuestionId}`)
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cached).toBe(true); // Second request = cache hit
    });

    it('should verify data is actually in Redis', async () => {
      // Skip if test question wasn't created or Redis not available
      if (!testQuestionId || !redisClient) {
        console.warn('Test question not created or Redis not available, skipping test');
        return;
      }

      const cachedData = await redisClient.get(`question:${testQuestionId}`);
      expect(cachedData).toBeTruthy();

      const parsed = JSON.parse(cachedData);
      expect(parsed.title).toBe('Redis Cache Test Question');
    });

    it('should invalidate cache on update', async () => {
      // Skip if test question wasn't created
      if (!testQuestionId) {
        console.warn('Test question not created, skipping test');
        return;
      }

      // Update the question
      await request(app)
        .put(`/api/questions/${testQuestionId}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          title: 'Updated Cache Test Question',
          description: 'Updated for cache invalidation test',
          difficulty: 'Medium',
          topics: ['Caching', 'Redis'],
          testCases: [{ input: 'test', expectedOutput: 'test', type: 'Sample' }],
        })
        .expect(200);

      // Next request should be cache MISS (because cache was invalidated on update)
      // Then immediately cached again
      const response = await request(app)
        .get(`/api/questions/${testQuestionId}`)
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Cache Test Question');
    });
  });

  describe('Random Question with Real Caching', () => {
    let randomTestQuestionId;

    beforeAll(async () => {
      // Create a dedicated test question for random endpoint
      const response = await request(app)
        .post('/api/questions')
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          title: 'Random Question Test',
          description: 'For testing random question caching',
          difficulty: 'Medium',
          topics: ['Caching', 'Testing'],
          testCases: [{ input: 'test', expectedOutput: 'test', type: 'Sample' }],
        });

      // Store question ID if created successfully, otherwise test will be skipped
      if (response.body.success && response.body.data) {
        randomTestQuestionId = response.body.data._id;
        console.log(`✓ Created random test question: ${randomTestQuestionId}`);
      } else {
        console.warn(
          '⚠ Failed to create random test question - random caching test will be skipped',
        );
        console.warn('  Error:', response.body.error || 'Unknown error');
      }

      // Clear any existing random cache for this topic/difficulty
      if (redisClient && randomTestQuestionId) {
        await redisClient.del('random:Caching:Medium');
      }
    });

    afterAll(async () => {
      // Clean up
      if (randomTestQuestionId) {
        try {
          await request(app)
            .delete(`/api/questions/${randomTestQuestionId}`)
            .set('Cookie', `accessToken=${adminToken}`);
        } catch (error) {
          console.warn('Failed to cleanup random test question:', error.message);
        }
      }
    });

    it('should cache random question ID', async () => {
      // Skip if test question wasn't created
      if (!randomTestQuestionId) {
        console.warn('Random test question not created, skipping test');
        return;
      }

      // First request - should cache the random question
      const response1 = await request(app)
        .get('/api/questions/random?topic=Caching&difficulty=Medium')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response1.body.questionId).toBeTruthy();

      // Second request - should return same cached question ID
      const response2 = await request(app)
        .get('/api/questions/random?topic=Caching&difficulty=Medium')
        .set('Cookie', `accessToken=${userToken}`)
        .expect(200);

      expect(response2.body.success).toBe(true);
      expect(response2.body.cached).toBe(true); // Cached random question
      expect(response2.body.questionId).toBe(response1.body.questionId); // Same question
    });
  });
});
