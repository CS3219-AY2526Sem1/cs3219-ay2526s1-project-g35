const express = require('express');
const router = express.Router();
const QuestionController = require('../controllers/question-controller');

/**
 * Question Routes
 * RESTful API endpoints for question management
 *
 * Supports Functional Requirements:
 * - CRUD operations on questions
 * - Filter by difficulty and topic
 * - Random question selection for matching
 */

// GET /api/questions - Get all questions
router.get('/', QuestionController.getAllQuestions);

// GET /api/questions/random - Get random question by topic and difficulty (for matching)
// Query params: ?topic=Arrays&difficulty=Easy
router.get('/random', QuestionController.getRandomQuestion);

// GET /api/questions/difficulty/:difficulty - Get questions by difficulty
router.get('/difficulty/:difficulty', QuestionController.getQuestionsByDifficulty);

// GET /api/questions/topic/:topic - Get questions by topic
router.get('/topic/:topic', QuestionController.getQuestionsByTopic);

// GET /api/questions/random/difficulty/:difficulty - Get random question by difficulty
router.get('/random/difficulty/:difficulty', QuestionController.getRandomQuestionByDifficulty);

// GET /api/questions/:id - Get a single question by ID
router.get('/:id', QuestionController.getQuestionById);

// POST /api/questions - Create a new question
router.post('/', QuestionController.createQuestion);

// PUT /api/questions/:id - Update a question by ID
router.put('/:id', QuestionController.updateQuestion);

// DELETE /api/questions/:id - Delete a question by ID
router.delete('/:id', QuestionController.deleteQuestion);

module.exports = router;
