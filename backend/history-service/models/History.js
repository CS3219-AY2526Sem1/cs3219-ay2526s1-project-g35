const { DataTypes } = require('sequelize');

/**
 * History Model
 * Represents a user's question attempt/submission history
 */

/**
 * Initialize the History model
 * @param {Sequelize} sequelize - Sequelize instance
 * @returns {Model} - History model
 */
function initHistoryModel(sequelize) {
  const History = sequelize.define(
    'History',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'User ID from the user service',
        validate: {
          notEmpty: {
            msg: 'User ID cannot be empty',
          },
        },
      },
      session_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Session ID from the collaboration service',
        validate: {
          len: {
            args: [1, 255],
            msg: 'Session ID must be between 1 and 255 characters',
          },
        },
      },
      question_title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Question title cannot be empty',
          },
          len: {
            args: [1, 500],
            msg: 'Question title must be between 1 and 500 characters',
          },
        },
      },
      difficulty: {
        type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
        allowNull: false,
        validate: {
          isIn: {
            args: [['Easy', 'Medium', 'Hard']],
            msg: 'Difficulty must be Easy, Medium, or Hard',
          },
        },
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Category cannot be empty',
          },
          len: {
            args: [1, 100],
            msg: 'Category must be between 1 and 100 characters',
          },
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
    },
    {
      tableName: 'histories',
      timestamps: false, // We're manually managing created_at
      indexes: [
        {
          name: 'idx_user_id',
          fields: ['user_id'],
        },
        {
          name: 'idx_session_id',
          fields: ['session_id'],
        },
        {
          name: 'idx_difficulty',
          fields: ['difficulty'],
        },
        {
          name: 'idx_category',
          fields: ['category'],
        },
        {
          name: 'idx_created_at',
          fields: ['created_at'],
        },
        {
          name: 'idx_user_created',
          fields: ['user_id', 'created_at'],
        },
      ],
    }
  );

  /**
   * Model methods for business logic
   */

  /**
   * Create a new history entry
   * @param {Object} data - History data
   * @returns {Promise<History>} - Created history record
   */
  History.createHistory = async function (data) {
    try {
      const history = await this.create({
        user_id: data.user_id,
        session_id: data.session_id || null,
        question_title: data.question_title,
        difficulty: data.difficulty,
        category: data.category,
        created_at: new Date(),
      });
      return history;
    } catch (error) {
      console.error('Error creating history:', error);
      throw error;
    }
  };

  /**
   * Get all history entries for a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, offset, order)
   * @returns {Promise<Array>} - Array of history records
   */
  History.getByUserId = async function (userId, options = {}) {
    try {
      const { limit = 100, offset = 0, order = [['created_at', 'DESC']] } = options;

      const histories = await this.findAll({
        where: { user_id: userId },
        limit,
        offset,
        order,
      });
      return histories;
    } catch (error) {
      console.error('Error fetching user history:', error);
      throw error;
    }
  };

  /**
   * Get statistics by category
   * @returns {Promise<Array>} - Array of category stats
   */
  History.getStatsByCategory = async function () {
    try {
      const { QueryTypes } = require('sequelize');

      const stats = await sequelize.query(
        `
      SELECT 
        category,
        COUNT(*) as attempt_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM histories
      GROUP BY category
      ORDER BY attempt_count DESC
    `,
        { type: QueryTypes.SELECT }
      );

      return stats;
    } catch (error) {
      console.error('Error fetching category stats:', error);
      throw error;
    }
  };

  /**
   * Get statistics by difficulty
   * @returns {Promise<Array>} - Array of difficulty stats
   */
  History.getStatsByDifficulty = async function () {
    try {
      const { QueryTypes } = require('sequelize');

      const stats = await sequelize.query(
        `
      SELECT 
        difficulty,
        COUNT(*) as attempt_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM histories
      GROUP BY difficulty
      ORDER BY 
        CASE difficulty
          WHEN 'Easy' THEN 1
          WHEN 'Medium' THEN 2
          WHEN 'Hard' THEN 3
        END
    `,
        { type: QueryTypes.SELECT }
      );

      return stats;
    } catch (error) {
      console.error('Error fetching difficulty stats:', error);
      throw error;
    }
  };

  /**
   * Get statistics by user
   * @returns {Promise<Array>} - Array of user stats
   */
  History.getStatsByUser = async function () {
    try {
      const { QueryTypes } = require('sequelize');

      const stats = await sequelize.query(
        `
      SELECT 
        user_id,
        COUNT(*) as total_attempts,
        COUNT(DISTINCT category) as unique_categories,
        COUNT(DISTINCT difficulty) as unique_difficulties,
        MIN(created_at) as first_attempt,
        MAX(created_at) as last_attempt
      FROM histories
      GROUP BY user_id
      ORDER BY total_attempts DESC
    `,
        { type: QueryTypes.SELECT }
      );

      return stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  };

  /**
   * Get comprehensive admin statistics
   * @returns {Promise<Object>} - Object containing all statistics
   */
  History.getAdminStats = async function () {
    try {
      const [categoryStats, difficultyStats, userStats] = await Promise.all([
        this.getStatsByCategory(),
        this.getStatsByDifficulty(),
        this.getStatsByUser(),
      ]);

      const totalAttempts = await this.count();
      const uniqueUsers = await this.count({
        distinct: true,
        col: 'user_id',
      });

      return {
        overview: {
          total_attempts: totalAttempts,
          unique_users: uniqueUsers,
        },
        by_category: categoryStats,
        by_difficulty: difficultyStats,
        by_user: userStats,
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  };

  return History;
}

module.exports = initHistoryModel;
