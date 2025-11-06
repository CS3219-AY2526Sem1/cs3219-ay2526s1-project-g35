const express = require('express');
const router = express.Router();
const HistoryController = require('../controllers/historyController');
const { verifyToken, optionalAuth, requireAdmin } = require('../middleware/jwtAuth');
const { schemas, validateBody, validateQuery, sanitizeInput } = require('../middleware/validation');

/**
 * History Routes
 * Defines all endpoints for the History Service with validation and authentication
 */

// Apply input sanitization to all routes
router.use(sanitizeInput);

/**
 * @swagger
 * /history:
 *   post:
 *     summary: Create a new history entry
 *     tags: [History]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - question_title
 *               - difficulty
 *               - category
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: User ID from the user service
 *               question_title:
 *                 type: string
 *                 description: Title of the question attempted
 *               difficulty:
 *                 type: string
 *                 enum: [Easy, Medium, Hard]
 *                 description: Difficulty level of the question
 *               category:
 *                 type: string
 *                 description: Category/topic of the question
 *     responses:
 *       201:
 *         description: History entry created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/history', validateBody(schemas.createHistory), HistoryController.createHistory);

/**
 * @swagger
 * /history:
 *   get:
 *     summary: Get history for a user
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to fetch history for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           minimum: 1
 *           maximum: 1000
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of records to skip
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [Easy, Medium, Hard]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date (ISO format)
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to date (ISO format)
 *     responses:
 *       200:
 *         description: User history retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get(
  '/history',
  verifyToken,
  validateQuery(schemas.getUserHistory),
  HistoryController.getUserHistory
);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get comprehensive admin statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/admin/stats', verifyToken, requireAdmin, HistoryController.getAdminStats);

/**
 * @swagger
 * /admin/stats/category:
 *   get:
 *     summary: Get statistics by category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category statistics retrieved successfully
 */
router.get(
  '/admin/stats/category',
  verifyToken,
  requireAdmin,
  HistoryController.getStatsByCategory
);

/**
 * @swagger
 * /admin/stats/difficulty:
 *   get:
 *     summary: Get statistics by difficulty
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Difficulty statistics retrieved successfully
 */
router.get(
  '/admin/stats/difficulty',
  verifyToken,
  requireAdmin,
  HistoryController.getStatsByDifficulty
);

/**
 * @swagger
 * /admin/stats/user:
 *   get:
 *     summary: Get statistics by user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 */
router.get('/admin/stats/user', verifyToken, requireAdmin, HistoryController.getStatsByUser);

module.exports = router;
