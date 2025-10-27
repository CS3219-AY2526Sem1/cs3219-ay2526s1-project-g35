const express = require('express');
const router = express.Router();
const QuestionController = require('../controllers/question-controller');
const { verifyToken, verifyAdmin } = require('../middleware/jwtAuth'); // Changed from auth.js to jwtAuth.js

/**
 * Question Routes
 * RESTful API endpoints for question management
 *
 * All routes require JWT authentication (verifyToken)
 * Admin-only routes also require admin privileges (verifyAdmin)
 *
 * Supports Functional Requirements:
 * - CRUD operations on questions
 * - Filter by difficulty and topic
 * - Random question selection for matching
 *
 * Authentication:
 * - ALL routes require valid JWT token (logged-in user)
 * - POST/PUT/DELETE routes require admin privileges
 */

// ============================================
// Public Routes (Authenticated Users)
// ============================================

// GET /api/questions - Get all questions
router.get('/', verifyToken, QuestionController.getAllQuestions);

// GET /api/questions/random - Get random question by topic and difficulty (for matching)
// Query params: ?topic=Arrays&difficulty=Easy
router.get('/random', verifyToken, QuestionController.getRandomQuestion);

// GET /api/questions/difficulty/:difficulty - Get questions by difficulty
router.get('/difficulty/:difficulty', verifyToken, QuestionController.getQuestionsByDifficulty);

// GET /api/questions/topic/:topic - Get questions by topic
router.get('/topic/:topic', verifyToken, QuestionController.getQuestionsByTopic);

// GET /api/questions/random/difficulty/:difficulty - Get random question by difficulty
router.get(
  '/random/difficulty/:difficulty',
  verifyToken,
  QuestionController.getRandomQuestionByDifficulty,
);

// GET /api/questions/categories - Get all categories/topics
router.get('/categories', verifyToken, QuestionController.getAllCategories);

// GET /api/questions/difficulties - Get all difficulty levels
router.get('/difficulties', verifyToken, QuestionController.getAllDifficulties);

// GET /api/questions/:id - Get a single question by ID
router.get('/:id', verifyToken, QuestionController.getQuestionById);

// ============================================
// Admin-Only Routes
// ============================================

// POST /api/questions - Create a new question (Admin only)
router.post('/', verifyToken, verifyAdmin, QuestionController.createQuestion);

// PUT /api/questions/:id - Update a question by ID (Admin only)
router.put('/:id', verifyToken, verifyAdmin, QuestionController.updateQuestion);

// DELETE /api/questions/:id - Delete a question by ID (Admin only)
router.delete('/:id', verifyToken, verifyAdmin, QuestionController.deleteQuestion);

module.exports = router;
