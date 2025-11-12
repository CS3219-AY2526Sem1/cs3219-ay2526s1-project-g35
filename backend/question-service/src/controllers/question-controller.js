const Question = require('../models/question-model');
const cache = require('../utils/cacheService');

/**
 * Question Controller
 * Handles HTTP requests and responses for question endpoints
 * Includes Redis caching for improved performance
 */

/**
 * Helper function to enrich question data with starter code templates
 * @param {Object} question - Question document
 * @returns {Object} - Enriched question with starterCode field
 */
function enrichQuestionWithStarterCode(question) {
  if (!question) return question;

  const questionObj = question.toObject ? question.toObject() : question;

  // Only generate starter code if functionSignature exists
  if (questionObj.functionSignature) {
    questionObj.starterCode = {
      python: Question.generateStarterCode(questionObj.functionSignature, 'python'),
      javascript: Question.generateStarterCode(questionObj.functionSignature, 'javascript'),
      java: Question.generateStarterCode(questionObj.functionSignature, 'java'),
      cpp: Question.generateStarterCode(questionObj.functionSignature, 'cpp'),
    };
  }

  return questionObj;
}

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
   * Get the 10 most recently updated questions
   * GET /api/questions/recent10
   */
  async getRecentTenQuestions(req, res) {
    try {
      const questions = await Question.getFirstTen();
      res.status(200).json({
        success: true,
        count: questions.length,
        data: questions,
      });
    } catch (error) {
      console.error('Error getting first 10 questions', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve questions',
      });
    }
  },

  /**
   * Search questions with optional filters
   * GET /api/questions/search
   */
  async searchQuestions(req, res) {
    try {
      const parseToArray = (value) => {
        if (!value) return [];
        const rawValues = Array.isArray(value) ? value : [value];
        return rawValues
          .flatMap((item) => item.split(','))
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      };

      const searchText = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const difficulties = parseToArray(req.query.difficulty ?? req.query.difficulties);
      const topics = parseToArray(req.query.topic ?? req.query.topics);
      const tags = parseToArray(req.query.tag ?? req.query.tags);

      const questions = await Question.searchQuestions({
        searchText,
        difficulties,
        topics,
        tags,
      });

      res.status(200).json({
        success: true,
        count: questions.length,
        data: questions,
      });
    } catch (error) {
      console.error('Error searching questions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search questions',
      });
    }
  },

  /**
   * Get a single question by ID
   * GET /api/questions/:id
   * Uses Redis cache for improved performance
   * Returns question with starter code templates
   */
  async getQuestionById(req, res, next) {
    try {
      const { id } = req.params;

      // Try to get from cache first
      const cachedQuestion = await cache.getQuestion(id);
      if (cachedQuestion) {
        const enrichedQuestion = enrichQuestionWithStarterCode(cachedQuestion);
        return res.status(200).json({
          success: true,
          data: enrichedQuestion,
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

      // Enrich with starter code before returning
      const enrichedQuestion = enrichQuestionWithStarterCode(question);

      res.status(200).json({
        success: true,
        data: enrichedQuestion,
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
      const {
        title,
        description,
        difficulty,
        topics,
        tags,
        testCases,
        constraints,
        functionSignature,
      } = req.body;

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
        functionSignature: functionSignature || undefined,
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
      const {
        title,
        description,
        difficulty,
        topics,
        tags,
        testCases,
        constraints,
        functionSignature,
      } = req.body;

      const updatedQuestion = await Question.updateQuestion(id, {
        title,
        description,
        difficulty,
        topics,
        tags,
        testCases,
        constraints,
        functionSignature,
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
   * Get random question by topics and difficulty (for matching)
   * GET /api/questions/random?topics=Arrays,Strings&difficulty=Easy
   * Supports multiple topics (comma-separated)
   * Returns question ID and caches full question for efficient retrieval
   */
  async getRandomQuestion(req, res) {
    try {
      const { topics, difficulty } = req.query;

      // Both topics and difficulty are required
      if (!topics || !difficulty) {
        return res.status(400).json({
          success: false,
          error: 'Please provide both topics and difficulty as query parameters',
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

      // Parse topics - support both comma-separated string and array
      let topicsArray = [];
      if (typeof topics === 'string') {
        topicsArray = topics
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      } else if (Array.isArray(topics)) {
        topicsArray = topics;
      }

      // Validate that at least one topic is provided
      if (topicsArray.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one topic is required',
        });
      }

      // Create cache key based on topics and difficulty
      const cacheKey = `${topicsArray.sort().join(',')}_${difficulty}`;

      // Check if we have a cached random question ID
      const cachedQuestionId = await cache.getRandomQuestion(cacheKey, difficulty);
      if (cachedQuestionId) {
        return res.status(200).json({
          success: true,
          questionId: cachedQuestionId,
          cached: true,
        });
      }

      // Get a random question from database
      const question = await Question.getRandomByTopicsAndDifficulty(topicsArray, difficulty);

      if (!question) {
        return res.status(404).json({
          success: false,
          error: `No questions found with topics "${topicsArray.join(', ')}" and difficulty "${difficulty}"`,
        });
      }

      const questionId = question._id.toString();

      // Cache both the question ID (for random selection) and full question (for retrieval)
      await cache.setRandomQuestion(cacheKey, difficulty, questionId);
      await cache.setQuestion(questionId, question);

      res.status(200).json({
        success: true,
        questionId,
        topics: topicsArray,
        difficulty,
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
