const request = require('supertest');
const app = require('../index');
const Question = require('../models/question-model');

/**
 * Mock the jwtAuth middleware to bypass authentication in tests
 * This allows us to test the functionality without needing actual tokens
 */
jest.mock('../middleware/jwtAuth', () => ({
  verifyToken: (req, res, next) => {
    // Mock authenticated user data
    req.user = {
      id: 'mock-user-id',
      username: 'testuser',
      email: 'test@test.com',
      isAdmin: false,
      isVerified: true,
    };
    req.userId = 'mock-user-id';
    next();
  },
  verifyAdmin: (req, res, next) => {
    // Mock admin user data
    req.user = {
      id: 'mock-admin-id',
      username: 'admin',
      email: 'admin@test.com',
      isAdmin: true,
      isVerified: true,
    };
    req.userId = 'mock-admin-id';
    next();
  },
}));

/**
 * Mock the Redis cache service to avoid Redis dependency in tests
 * All cache operations return null/false to simulate cache misses
 */
jest.mock('../utils/cacheService', () => ({
  getQuestion: jest.fn().mockResolvedValue(null),
  setQuestion: jest.fn().mockResolvedValue(true),
  deleteQuestion: jest.fn().mockResolvedValue(true),
  getRandomQuestion: jest.fn().mockResolvedValue(null),
  setRandomQuestion: jest.fn().mockResolvedValue(true),
  invalidateRandomCaches: jest.fn().mockResolvedValue(true),
  invalidateListCaches: jest.fn().mockResolvedValue(true),
  clearAllCaches: jest.fn().mockResolvedValue(true),
  getCacheStats: jest.fn().mockResolvedValue({ connected: false }),
}));

/**
 * Question API Integration Tests
 * Tests all REST endpoints
 */

describe('Question API Tests', () => {
  // Sample question data
  const sampleQuestion = {
    title: 'Two Sum',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    difficulty: 'Easy',
    topics: ['Arrays', 'Hash Table'],
    tags: ['leetcode'],
    testCases: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        expectedOutput: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9',
        type: 'Sample',
      },
    ],
    constraints: ['2 <= nums.length <= 10^4'],
  };

  describe('POST /api/questions', () => {
    it('should create a new question with valid data', async () => {
      const response = await request(app).post('/api/questions').send(sampleQuestion).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.title).toBe(sampleQuestion.title);
      expect(response.body.data.difficulty).toBe(sampleQuestion.difficulty);
    });

    it('should fail when required fields are missing', async () => {
      const invalidQuestion = {
        title: 'Incomplete Question',
        // missing description, difficulty, topics, testCases
      };

      const response = await request(app).post('/api/questions').send(invalidQuestion).expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid difficulty level', async () => {
      const invalidQuestion = {
        ...sampleQuestion,
        difficulty: 'SuperHard', // Invalid difficulty
      };

      const response = await request(app).post('/api/questions').send(invalidQuestion).expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail when topics array is empty', async () => {
      const invalidQuestion = {
        ...sampleQuestion,
        topics: [], // Empty topics
      };

      const response = await request(app).post('/api/questions').send(invalidQuestion).expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail when testCases array is empty', async () => {
      const invalidQuestion = {
        ...sampleQuestion,
        testCases: [], // Empty test cases
      };

      const response = await request(app).post('/api/questions').send(invalidQuestion).expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/questions', () => {
    beforeEach(async () => {
      // Create test questions
      await Question.createQuestion(sampleQuestion);
      await Question.createQuestion({
        ...sampleQuestion,
        title: 'Reverse String',
        difficulty: 'Medium',
        topics: ['Strings'],
      });
    });

    it('should get all questions', async () => {
      const response = await request(app).get('/api/questions').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/questions/:id', () => {
    let questionId;

    beforeEach(async () => {
      const question = await Question.createQuestion(sampleQuestion);
      questionId = question._id;
    });

    it('should get a question by valid ID', async () => {
      const response = await request(app).get(`/api/questions/${questionId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(sampleQuestion.title);
    });

    it('should return 404 for non-existent question', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

      const response = await request(app).get(`/api/questions/${fakeId}`).expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app).get('/api/questions/invalid-id').expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_ID');
    });
  });

  describe('PUT /api/questions/:id', () => {
    let questionId;

    beforeEach(async () => {
      const question = await Question.createQuestion(sampleQuestion);
      questionId = question._id;
    });

    it('should update a question with valid data', async () => {
      const updates = {
        title: 'Two Sum - Updated',
        difficulty: 'Medium',
      };

      const response = await request(app)
        .put(`/api/questions/${questionId}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updates.title);
      expect(response.body.data.difficulty).toBe(updates.difficulty);
    });

    it('should return 404 when updating non-existent question', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/questions/${fakeId}`)
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/questions/:id', () => {
    let questionId;

    beforeEach(async () => {
      const question = await Question.createQuestion(sampleQuestion);
      questionId = question._id;
    });

    it('should delete a question by ID', async () => {
      const response = await request(app).delete(`/api/questions/${questionId}`).expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const deleted = await Question.getById(questionId);
      expect(deleted).toBeNull();
    });

    it('should return 404 when deleting non-existent question', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app).delete(`/api/questions/${fakeId}`).expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/questions/difficulty/:difficulty', () => {
    beforeEach(async () => {
      await Question.createQuestion({ ...sampleQuestion, difficulty: 'Easy' });
      await Question.createQuestion({ ...sampleQuestion, title: 'Medium Q', difficulty: 'Medium' });
      await Question.createQuestion({ ...sampleQuestion, title: 'Hard Q', difficulty: 'Hard' });
    });

    it('should get all Easy questions', async () => {
      const response = await request(app).get('/api/questions/difficulty/Easy').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].difficulty).toBe('Easy');
    });

    it('should get all Medium questions', async () => {
      const response = await request(app).get('/api/questions/difficulty/Medium').expect(200);

      expect(response.body.count).toBe(1);
    });

    it('should return 400 for invalid difficulty', async () => {
      const response = await request(app).get('/api/questions/difficulty/SuperHard').expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/questions/topic/:topic', () => {
    beforeEach(async () => {
      await Question.createQuestion({ ...sampleQuestion, topics: ['Arrays'] });
      await Question.createQuestion({ ...sampleQuestion, title: 'String Q', topics: ['Strings'] });
    });

    it('should get questions by topic', async () => {
      const response = await request(app).get('/api/questions/topic/Arrays').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
      expect(response.body.data[0].topics).toContain('Arrays');
    });

    it('should return empty array for non-existent topic', async () => {
      const response = await request(app).get('/api/questions/topic/NonExistent').expect(200);

      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/questions/random', () => {
    beforeEach(async () => {
      await Question.createQuestion({
        ...sampleQuestion,
        difficulty: 'Easy',
        topics: ['Arrays'],
      });
    });

    it('should get random question by topic and difficulty', async () => {
      const response = await request(app)
        .get('/api/questions/random?topic=Arrays&difficulty=Easy')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.questionId).toBeDefined();
      expect(typeof response.body.questionId).toBe('string');
    });

    it('should return 400 when topic is missing', async () => {
      const response = await request(app).get('/api/questions/random?difficulty=Easy').expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when difficulty is missing', async () => {
      const response = await request(app).get('/api/questions/random?topic=Arrays').expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 when no matching questions found', async () => {
      const response = await request(app)
        .get('/api/questions/random?topic=NonExistent&difficulty=Easy')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app).get('/api/undefined-route').expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ROUTE_NOT_FOUND');
    });
  });
});
