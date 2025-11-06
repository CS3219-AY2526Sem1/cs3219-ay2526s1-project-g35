const { getSequelize } = require('../config/database');
const initHistoryModel = require('../models/History');

let History;

function getHistoryModel() {
  if (!History) {
    const sequelize = getSequelize();
    History = initHistoryModel(sequelize);
  }
  return History;
}

/**
 * History Controller
 * Handles HTTP requests and responses for history endpoints
 */

const HistoryController = {
  /**
   * Create a new history entry
   * POST /history
   * Body: { user_id, question_title, difficulty, category }
   */
  async createHistory(req, res, next) {
    try {
      const { user_id, question_title, difficulty, category } = req.body;

      // Validation
      if (!user_id || !question_title || !difficulty || !category) {
        return res.status(400).json({
          success: false,
          error: 'Please provide user_id, question_title, difficulty, and category',
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

      // Create history entry
      const history = await getHistoryModel().createHistory({
        user_id,
        question_title,
        difficulty,
        category,
      });

      res.status(201).json({
        success: true,
        message: 'History entry created successfully',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get history for authenticated user
   * GET /history
   * Query params: user_id (required), limit, offset
   */
  async getUserHistory(req, res, next) {
    try {
      const { user_id, limit, offset } = req.query;

      // Validate user_id is provided
      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'Please provide user_id as a query parameter',
        });
      }

      // If user is authenticated, ensure they can only access their own history
      // (unless they're an admin)
      if (req.user && req.user.role !== 'admin') {
        if (req.user.id !== user_id) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. You can only view your own history.',
          });
        }
      }

      // Parse limit and offset
      const options = {
        limit: limit ? parseInt(limit, 10) : 100,
        offset: offset ? parseInt(offset, 10) : 0,
        order: [['created_at', 'DESC']],
      };

      // Validate pagination parameters
      if (options.limit < 1 || options.limit > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 1000',
        });
      }

      if (options.offset < 0) {
        return res.status(400).json({
          success: false,
          error: 'Offset must be non-negative',
        });
      }

      // Fetch user history
      const histories = await getHistoryModel().getByUserId(user_id, options);

      res.status(200).json({
        success: true,
        count: histories.length,
        data: histories,
        pagination: {
          limit: options.limit,
          offset: options.offset,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get admin statistics
   * GET /admin/stats
   * Requires admin authentication
   */
  async getAdminStats(req, res, next) {
    try {
      const stats = await getHistoryModel().getAdminStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get statistics by category
   * GET /admin/stats/category
   */
  async getStatsByCategory(req, res, next) {
    try {
      const stats = await getHistoryModel().getStatsByCategory();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get statistics by difficulty
   * GET /admin/stats/difficulty
   */
  async getStatsByDifficulty(req, res, next) {
    try {
      const stats = await getHistoryModel().getStatsByDifficulty();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get statistics by user
   * GET /admin/stats/user
   */
  async getStatsByUser(req, res, next) {
    try {
      const stats = await getHistoryModel().getStatsByUser();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = HistoryController;
