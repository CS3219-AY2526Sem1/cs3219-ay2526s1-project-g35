const Question = require('../models/question-model');

/**
 * Question Controller
 * Handles HTTP requests and responses for question endpoints
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
        data: questions
      });
    } catch (error) {
      console.error('Error getting all questions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve questions'
      });
    }
  },

  /**
   * Get a single question by ID
   * GET /api/questions/:id
   */
  async getQuestionById(req, res, next) {
    try {
      const { id } = req.params;
      const question = await Question.getById(id);

      if (!question) {
        return res.status(404).json({
          success: false,
          error: `Question with id ${id} not found`
        });
      }

      res.status(200).json({
        success: true,
        data: question
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
          error: 'Please provide title, description, difficulty, topics, and testCases'
        });
      }

      // Validate topics is an array
      if (!Array.isArray(topics) || topics.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Topics must be a non-empty array'
        });
      }

      // Validate testCases is an array
      if (!Array.isArray(testCases) || testCases.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Test cases must be a non-empty array'
        });
      }

      const newQuestion = await Question.createQuestion({
        title,
        description,
        difficulty,
        topics,
        tags: tags || [],
        testCases,
        constraints: constraints || []
      });

      res.status(201).json({
        success: true,
        message: 'Question created successfully',
        data: newQuestion
      });
    } catch (error) {
      console.error('Error creating question:', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create question'
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
        constraints
      });

      if (!updatedQuestion) {
        return res.status(404).json({
          success: false,
          error: `Question with id ${id} not found`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Question updated successfully',
        data: updatedQuestion
      });
    } catch (error) {
      console.error('Error updating question:', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update question'
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
          error: `Question with id ${id} not found`
        });
      }

      res.status(200).json({
        success: true,
        message: `Question with id ${id} deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete question'
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
          error: 'Difficulty must be Easy, Medium, or Hard'
        });
      }

      const questions = await Question.getByDifficulty(difficulty);

      res.status(200).json({
        success: true,
        count: questions.length,
        data: questions
      });
    } catch (error) {
      console.error('Error getting questions by difficulty:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve questions by difficulty'
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
        data: questions
      });
    } catch (error) {
      console.error('Error getting questions by topic:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve questions by topic'
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
          error: 'Difficulty must be Easy, Medium, or Hard'
        });
      }

      const question = await Question.getRandomByDifficulty(difficulty);

      if (!question) {
        return res.status(404).json({
          success: false,
          error: `No questions found with difficulty ${difficulty}`
        });
      }

      res.status(200).json({
        success: true,
        data: question
      });
    } catch (error) {
      console.error('Error getting random question by difficulty:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve random question'
      });
    }
  },

  /**
   * Get random question by topic and difficulty (for matching)
   * GET /api/questions/random?topic=X&difficulty=Y
   */
  async getRandomQuestion(req, res) {
    try {
      const { topic, difficulty } = req.query;

      if (!topic || !difficulty) {
        return res.status(400).json({
          success: false,
          error: 'Please provide both topic and difficulty as query parameters'
        });
      }

      // Validate difficulty
      const validDifficulties = ['Easy', 'Medium', 'Hard'];
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({
          success: false,
          error: 'Difficulty must be Easy, Medium, or Hard'
        });
      }

      const question = await Question.getRandomByTopicAndDifficulty(topic, difficulty);

      if (!question) {
        return res.status(404).json({
          success: false,
          error: `No questions found with topic "${topic}" and difficulty "${difficulty}"`
        });
      }

      res.status(200).json({
        success: true,
        data: question
      });
    } catch (error) {
      console.error('Error getting random question:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve random question'
      });
    }
  }
};

module.exports = QuestionController;
