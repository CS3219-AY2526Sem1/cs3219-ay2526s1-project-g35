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
