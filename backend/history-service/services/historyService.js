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

class HistoryService {
  async createHistory(historyData) {
    const { user_id, session_id, question_title, difficulty, category, status } = historyData;

    const history = await getHistoryModel().createHistory({
      user_id,
      session_id: session_id || null,
      question_title,
      difficulty,
      category,
      status: status || 'attempted',
    });

    const historyJson = history.toJSON();
    if (historyJson.created_at instanceof Date) {
      historyJson.created_at = historyJson.created_at.toISOString();
    }

    return historyJson;
  }

  async getUserHistory(userId, options = {}) {
    const { limit = 100, offset = 0, difficulty, category, from_date, to_date } = options;

    const queryOptions = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['created_at', 'DESC']],
    };

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

    const { rows, count } = await getHistoryModel().findAndCountAll(queryOptions);

    const serializedHistories = rows.map((history) => {
      const historyJson = history.toJSON();
      if (historyJson.created_at instanceof Date) {
        historyJson.created_at = historyJson.created_at.toISOString();
      } else if (historyJson.created_at && typeof historyJson.created_at === 'object') {
        historyJson.created_at = new Date(historyJson.created_at).toISOString();
      }
      Object.keys(historyJson).forEach((key) => {
        if (historyJson[key] instanceof Date) {
          historyJson[key] = historyJson[key].toISOString();
        } else if (
          historyJson[key] &&
          typeof historyJson[key] === 'object' &&
          historyJson[key].constructor !== Object
        ) {
          historyJson[key] = String(historyJson[key]);
        }
      });
      return historyJson;
    });

    return {
      histories: serializedHistories,
      totalCount: count,
      limit: queryOptions.limit,
      offset: queryOptions.offset,
      hasMore: offset + rows.length < count,
    };
  }

  async getAdminStats() {
    const stats = await getHistoryModel().getAdminStats();
    return stats;
  }

  async getStatsByCategory() {
    const stats = await getHistoryModel().getStatsByCategory();
    return stats;
  }

  async getStatsByDifficulty() {
    const stats = await getHistoryModel().getStatsByDifficulty();
    return stats;
  }

  async getStatsByUser(options = {}) {
    const { limit = 100, offset = 0 } = options;

    const stats = await getHistoryModel().getStatsByUser({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    return stats;
  }

  async updateHistoryStatus(historyId, status, userId = null) {
    const History = getHistoryModel();

    // Find the history entry
    const history = await History.findByPk(historyId);

    if (!history) {
      throw new Error('History entry not found');
    }

    // If userId is provided, verify ownership
    if (userId && history.user_id !== userId) {
      throw new Error('Unauthorized: Cannot update history for another user');
    }

    // Validate status
    const validStatuses = ['attempted', 'incomplete', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Update status
    history.status = status;
    await history.save();

    const historyJson = history.toJSON();
    if (historyJson.created_at instanceof Date) {
      historyJson.created_at = historyJson.created_at.toISOString();
    }

    return historyJson;
  }

  async updateHistoryBySessionId(sessionId, status, userId = null) {
    const History = getHistoryModel();

    // Find history entries by session_id
    const where = { session_id: sessionId };
    if (userId) {
      where.user_id = userId;
    }

    const histories = await History.findAll({ where });

    if (histories.length === 0) {
      throw new Error('No history entries found for this session');
    }

    // Validate status
    const validStatuses = ['attempted', 'incomplete', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Update all matching histories
    await History.update({ status }, { where });

    // Return updated histories
    const updatedHistories = await History.findAll({ where });
    return updatedHistories.map((h) => {
      const historyJson = h.toJSON();
      if (historyJson.created_at instanceof Date) {
        historyJson.created_at = historyJson.created_at.toISOString();
      }
      return historyJson;
    });
  }

  canAccessUserHistory(requestUser, targetUserId) {
    if (!requestUser) {
      return false;
    }

    if (requestUser.isAdmin === true || requestUser.role === 'admin') {
      return true;
    }

    if (requestUser.id && targetUserId && requestUser.id.toString() === targetUserId.toString()) {
      return true;
    }

    return false;
  }

  isValidDifficulty(difficulty) {
    const validDifficulties = ['Easy', 'Medium', 'Hard'];
    return validDifficulties.includes(difficulty);
  }
}

module.exports = new HistoryService();
