const { app, request } = require('./setup');

/**
 * History API Tests
 * Tests for the History Service endpoints
 */

describe('History Service API', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('History Service is running');
    });
  });

  describe('GET /', () => {
    it('should return service information', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe('History Service');
    });
  });

  describe('POST /history', () => {
    it('should create a new history entry', async () => {
      const historyData = {
        user_id: 'test-user-123',
        question_title: 'Two Sum',
        difficulty: 'Easy',
        category: 'Arrays',
      };

      const response = await request(app).post('/history').send(historyData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(historyData.user_id);
      expect(response.body.data.question_title).toBe(historyData.question_title);
      expect(response.body.data.difficulty).toBe(historyData.difficulty);
      expect(response.body.data.category).toBe(historyData.category);
    });

    it('should return 400 for missing fields', async () => {
      const invalidData = {
        user_id: 'test-user-123',
        // Missing required fields
      };

      const response = await request(app).post('/history').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid difficulty', async () => {
      const invalidData = {
        user_id: 'test-user-123',
        question_title: 'Test Question',
        difficulty: 'Invalid', // Should be Easy, Medium, or Hard
        category: 'Arrays',
      };

      const response = await request(app).post('/history').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /history', () => {
    beforeEach(async () => {
      // Create a test history entry
      await request(app).post('/history').send({
        user_id: 'test-user-456',
        question_title: 'Test Question',
        difficulty: 'Medium',
        category: 'Strings',
      });
    });

    it('should get user history', async () => {
      const response = await request(app).get('/history?user_id=test-user-456');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 400 for missing user_id', async () => {
      const response = await request(app).get('/history');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api-docs', () => {
    it('should return Swagger documentation page', async () => {
      const response = await request(app).get('/api-docs/');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api-docs.json', () => {
    it('should return OpenAPI JSON spec', async () => {
      const response = await request(app).get('/api-docs.json');

      expect(response.status).toBe(200);
      expect(response.body.openapi).toBe('3.0.0');
      expect(response.body.info.title).toBe('History Service API');
    });
  });
});
