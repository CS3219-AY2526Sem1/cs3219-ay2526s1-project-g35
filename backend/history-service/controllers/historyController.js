const historyService = require('../services/historyService');

/**
 * History Controller
 * Handles HTTP requests and responses for history endpoints
 * Delegates business logic to HistoryService
 */

const HistoryController = {
  /**
   * Create a new history entry
   * POST /history
   * Body: { user_id, question_title, difficulty, category, ... }
   */
  async createHistory(req, res, next) {
    try {
      const history = await historyService.createHistory(req.body);

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
   * Query params: user_id (required), limit, offset, difficulty, category, from_date, to_date
   */
  async getUserHistory(req, res, next) {
    try {
      const { user_id, limit, offset, difficulty, category, from_date, to_date } = req.query;

      console.log('getUserHistory - Request user:', JSON.stringify(req.user));
      console.log('getUserHistory - Target user_id:', user_id);

      if (!historyService.canAccessUserHistory(req.user, user_id)) {
        console.log(
          'getUserHistory - Access denied for user:',
          req.user?.id,
          'trying to access:',
          user_id
        );
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only view your own history.',
        });
      }

      const result = await historyService.getUserHistory(user_id, {
        limit,
        offset,
        difficulty,
        category,
        from_date,
        to_date,
      });

      res.status(200).json({
        success: true,
        count: result.histories.length,
        totalCount: result.totalCount,
        data: result.histories,
        pagination: {
          limit: result.limit,
          offset: result.offset,
          hasMore: result.hasMore,
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
      const stats = await historyService.getAdminStats();

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
      const stats = await historyService.getStatsByCategory();

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
      const stats = await historyService.getStatsByDifficulty();

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
      const { limit, offset } = req.query;

      const stats = await historyService.getStatsByUser({
        limit,
        offset,
      });

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
