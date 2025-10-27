const Question = require('../models/question-model');
const cache = require('../utils/cacheService');

/**
 * Question Controller
 * Handles HTTP requests and responses for question endpoints
 * Includes Redis caching for improved performance
 */

const QuestionController = {
  /**
   * Get all questions
   * GET /api/questions
   */
  async getAllQuestions(req, res) {
    try {
      const questions = await Question.getAll();
      res.status(200).json({
        success: true,
        count: questions.length,
        data: questions,
      });
    } catch (error) {
      console.error('Error getting all questions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve questions',
      });
    }
  },

  /**
   * Get a single question by ID
   * GET /api/questions/:id
   * Uses Redis cache for improved performance
   */
  async getQuestionById(req, res, next) {
    try {
      const { id } = req.params;

      // Try to get from cache first
      const cachedQuestion = await cache.getQuestion(id);
      if (cachedQuestion) {
        return res.status(200).json({
          success: true,
          data: cachedQuestion,
          cached: true,
        });
      }

      // Cache miss - get from database
      const question = await Question.getById(id);

      if (!question) {
        return res.status(404).json({
          success: false,
          error: `Question with id ${id} not found`,
        });
      }

      // Store in cache for future requests
      await cache.setQuestion(id, question);

      res.status(200).json({
        success: true,
        data: question,
        cached: false,
      });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  },

  /**
   * Create a new question
   * POST /api/questions
   * Body: { title, description, difficulty, topics, tags?, testCases, constraints? }
   */
  async createQuestion(req, res) {
    try {
      const { title, description, difficulty, topics, tags, testCases, constraints } = req.body;

      // Basic validation
      if (!title || !description || !difficulty || !topics || !testCases) {
        return res.status(400).json({
          success: false,
          error: 'Please provide title, description, difficulty, topics, and testCases',
        });
      }

      // Validate topics is an array
      if (!Array.isArray(topics) || topics.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Topics must be a non-empty array',
        });
      }

      // Validate testCases is an array
      if (!Array.isArray(testCases) || testCases.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Test cases must be a non-empty array',
        });
      }

      const newQuestion = await Question.createQuestion({
        title,
        description,
        difficulty,
        topics,
        tags: tags || [],
        testCases,
        constraints: constraints || [],
      });

      // Cache the new question and invalidate random caches
      await cache.setQuestion(newQuestion._id.toString(), newQuestion);
      await cache.invalidateRandomCaches(); // New question affects random selection

      res.status(201).json({
        success: true,
        message: 'Question created successfully',
        data: newQuestion,
      });
    } catch (error) {
      console.error('Error creating question:', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create question',
      });
    }
  },

  /**
   * Update a question by ID
   * PUT /api/questions/:id
   */
  async updateQuestion(req, res) {
    try {
      const { id } = req.params;
      const { title, description, difficulty, topics, tags, testCases, constraints } = req.body;

      const updatedQuestion = await Question.updateQuestion(id, {
        title,
        description,
        difficulty,
        topics,
        tags,
        testCases,
        constraints,
      });

      if (!updatedQuestion) {
        return res.status(404).json({
          success: false,
          error: `Question with id ${id} not found`,
        });
      }

      // Update cache with new data and invalidate random caches
      await cache.setQuestion(id, updatedQuestion);
      await cache.invalidateRandomCaches(); // Updated question may affect random selection

      res.status(200).json({
        success: true,
        message: 'Question updated successfully',
        data: updatedQuestion,
      });
    } catch (error) {
      console.error('Error updating question:', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update question',
      });
    }
  },

  /**
   * Delete a question by ID
   * DELETE /api/questions/:id
   */
  async deleteQuestion(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Question.deleteQuestion(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: `Question with id ${id} not found`,
        });
      }

      // Remove from cache and invalidate random caches
      await cache.deleteQuestion(id);
      await cache.invalidateRandomCaches(); // Deleted question affects random selection

      res.status(200).json({
        success: true,
        message: `Question with id ${id} deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete question',
      });
    }
  },

  /**
   * Get questions by difficulty
   * GET /api/questions/difficulty/:difficulty
   */
  async getQuestionsByDifficulty(req, res) {
    try {
      const { difficulty } = req.params;

      // Validate difficulty
      const validDifficulties = ['Easy', 'Medium', 'Hard'];
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({
          success: false,
          error: 'Difficulty must be Easy, Medium, or Hard',
        });
      }

      const questions = await Question.getByDifficulty(difficulty);

      res.status(200).json({
        success: true,
        count: questions.length,
        data: questions,
      });
    } catch (error) {
      console.error('Error getting questions by difficulty:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve questions by difficulty',
      });
    }
  },

  /**
   * Get questions by topic
   * GET /api/questions/topic/:topic
   */
  async getQuestionsByTopic(req, res) {
    try {
      const { topic } = req.params;
      const questions = await Question.getByTopic(topic);

      res.status(200).json({
        success: true,
        count: questions.length,
        data: questions,
      });
    } catch (error) {
      console.error('Error getting questions by topic:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve questions by topic',
      });
    }
  },

  /**
   * Get random question by difficulty
   * GET /api/questions/random/difficulty/:difficulty
   */
  async getRandomQuestionByDifficulty(req, res) {
    try {
      const { difficulty } = req.params;

      // Validate difficulty
      const validDifficulties = ['Easy', 'Medium', 'Hard'];
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({
          success: false,
          error: 'Difficulty must be Easy, Medium, or Hard',
        });
      }

      const question = await Question.getRandomByDifficulty(difficulty);

      if (!question) {
        return res.status(404).json({
          success: false,
          error: `No questions found with difficulty ${difficulty}`,
        });
      }

      res.status(200).json({
        success: true,
        data: question,
      });
    } catch (error) {
      console.error('Error getting random question by difficulty:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve random question',
      });
    }
  },

  /**
   * Get random question by topic and difficulty (for matching)
   * GET /api/questions/random?topic=X&difficulty=Y
   * Returns question ID and caches full question for efficient retrieval
   */
  async getRandomQuestion(req, res) {
    try {
      const { topic, difficulty } = req.query;

      if (!topic || !difficulty) {
        return res.status(400).json({
          success: false,
          error: 'Please provide both topic and difficulty as query parameters',
        });
      }

      // Validate difficulty
      const validDifficulties = ['Easy', 'Medium', 'Hard'];
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({
          success: false,
          error: 'Difficulty must be Easy, Medium, or Hard',
        });
      }

      // Check if we have a cached random question ID
      const cachedQuestionId = await cache.getRandomQuestion(topic, difficulty);
      if (cachedQuestionId) {
        return res.status(200).json({
          success: true,
          questionId: cachedQuestionId,
          cached: true,
        });
      }

      // Get a random question from database
      const question = await Question.getRandomByTopicAndDifficulty(topic, difficulty);

      if (!question) {
        return res.status(404).json({
          success: false,
          error: `No questions found with topic "${topic}" and difficulty "${difficulty}"`,
        });
      }

      const questionId = question._id.toString();

      // Cache both the question ID (for random selection) and full question (for retrieval)
      await cache.setRandomQuestion(topic, difficulty, questionId);
      await cache.setQuestion(questionId, question);

      res.status(200).json({
        success: true,
        questionId,
        cached: false,
      });
    } catch (error) {
      console.error('Error getting random question:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve random question',
      });
    }
  },

  /**
   * Get all categories/topics
   * GET /api/questions/categories
   */
  async getAllCategories(req, res) {
    try {
      const categories = await Question.getAllCategories();
      res.status(200).json({
        success: true,
        count: categories.length,
        data: categories,
      });
    } catch (error) {
      console.error('Error getting all categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve categories',
      });
    }
  },

  /**
   * Get all difficulty levels
   * GET /api/questions/difficulties
   */
  async getAllDifficulties(req, res) {
    try {
      const difficulties = await Question.getAllDifficulties();
      res.status(200).json({
        success: true,
        count: difficulties.length,
        data: difficulties,
      });
    } catch (error) {
      console.error('Error getting all difficulties:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve difficulties',
      });
    }
  },
};

module.exports = QuestionController;
