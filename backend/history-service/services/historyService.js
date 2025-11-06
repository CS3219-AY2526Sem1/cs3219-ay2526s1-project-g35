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
 * History Service
 * Contains business logic for history operations
 * Separated from controllers for better testability and maintainability
 */

class HistoryService {
  /**
   * Create a new history entry
   * @param {Object} historyData - History entry data
   * @returns {Promise<Object>} Created history entry
   */
  async createHistory(historyData) {
    const { user_id, question_title, difficulty, category } = historyData;

    // Business logic: Create history entry
    const history = await getHistoryModel().createHistory({
      user_id,
      question_title,
      difficulty,
      category,
    });

    return history;
  }

  /**
   * Get history for a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, offset, filters)
   * @returns {Promise<Object>} User history with metadata
   */
  async getUserHistory(userId, options = {}) {
    const { limit = 100, offset = 0, difficulty, category, from_date, to_date } = options;

    // Build query options
    const queryOptions = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['created_at', 'DESC']],
    };

    // Add filters if provided
    const where = { user_id: userId };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (category) {
      where.category = category;
    }

    if (from_date || to_date) {
      where.created_at = {};
      if (from_date) {
        where.created_at[getSequelize().Sequelize.Op.gte] = new Date(from_date);
      }
      if (to_date) {
        where.created_at[getSequelize().Sequelize.Op.lte] = new Date(to_date);
      }
    }

    queryOptions.where = where;

    // Fetch history entries
    const { rows, count } = await getHistoryModel().findAndCountAll(queryOptions);

    return {
      histories: rows,
      totalCount: count,
      limit: queryOptions.limit,
      offset: queryOptions.offset,
      hasMore: offset + rows.length < count,
    };
  }

  /**
   * Get comprehensive admin statistics
   * @returns {Promise<Object>} Admin statistics
   */
  async getAdminStats() {
    const stats = await getHistoryModel().getAdminStats();
    return stats;
  }

  /**
   * Get statistics grouped by category
   * @returns {Promise<Array>} Category statistics
   */
  async getStatsByCategory() {
    const stats = await getHistoryModel().getStatsByCategory();
    return stats;
  }

  /**
   * Get statistics grouped by difficulty
   * @returns {Promise<Array>} Difficulty statistics
   */
  async getStatsByDifficulty() {
    const stats = await getHistoryModel().getStatsByDifficulty();
    return stats;
  }

  /**
   * Get statistics grouped by user
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User statistics
   */
  async getStatsByUser(options = {}) {
    const { limit = 100, offset = 0 } = options;

    const stats = await getHistoryModel().getStatsByUser({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    return stats;
  }

  /**
   * Check if user can access history
   * @param {Object} requestUser - Authenticated user from JWT
   * @param {string} targetUserId - User ID being accessed
   * @returns {boolean} Whether access is allowed
   */
  canAccessUserHistory(requestUser, targetUserId) {
    // No user authenticated
    if (!requestUser) {
      return false;
    }

    // Admin can access any user's history
    if (requestUser.isAdmin === true || requestUser.role === 'admin') {
      return true;
    }

    // User can access their own history
    // Compare as strings to handle different formats
    if (requestUser.id && targetUserId && requestUser.id.toString() === targetUserId.toString()) {
      return true;
    }

    return false;
  }

  /**
   * Validate difficulty value
   * @param {string} difficulty - Difficulty level
   * @returns {boolean} Whether difficulty is valid
   */
  isValidDifficulty(difficulty) {
    const validDifficulties = ['Easy', 'Medium', 'Hard'];
    return validDifficulties.includes(difficulty);
  }
}

module.exports = new HistoryService();
