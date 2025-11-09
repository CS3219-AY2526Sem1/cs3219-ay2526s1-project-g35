const { Sequelize } = require('sequelize');

/**
 * PostgreSQL Database Configuration
 * Manages connection to PostgreSQL database using Sequelize ORM
 */

let sequelize;

/**
 * Initialize Sequelize instance with database connection
 * Supports both connection string and individual parameters
 */
function createSequelizeInstance() {
  const connectionString = process.env.DB_CONNECTION_STRING;

  if (connectionString) {
    // Use connection string (recommended for production with Secret Manager)
    console.log('Connecting to PostgreSQL using connection string...');
    sequelize = new Sequelize(connectionString, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: {
        ssl:
          process.env.NODE_ENV === 'production'
            ? {
                require: true,
                rejectUnauthorized: false, // Required for Cloud SQL
              }
            : false,
      },
    });
  } else {
    // Use individual parameters (for local development)
    console.log('Connecting to PostgreSQL using individual parameters...');
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'historydb',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      dialect: process.env.DB_DIALECT || 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: {
        ssl:
          process.env.DB_SSL === 'true'
            ? {
                require: true,
                rejectUnauthorized: false,
              }
            : false,
      },
    };

    sequelize = new Sequelize(dbConfig);
  }

  return sequelize;
}

/**
 * Connect to PostgreSQL database
 * Tests the connection and initializes models
 */
async function connectDB() {
  try {
    if (!sequelize) {
      createSequelizeInstance();
    }

    // Test the connection
    await sequelize.authenticate();
    console.log('PostgreSQL Connected Successfully!');
    console.log(`Database: ${sequelize.config.database}`);

    // Sync models in development (creates tables if they don't exist)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('Database models synchronized');
    }

    // Handle application termination
    process.on('SIGINT', async () => {
      await sequelize.close();
      console.log('PostgreSQL connection closed due to app termination');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await sequelize.close();
      console.log('PostgreSQL connection closed due to app termination');
      process.exit(0);
    });
  } catch (error) {
    console.error('PostgreSQL connection failed:', error.message);
    throw error;
  }
}

/**
 * Get the Sequelize instance
 * @returns {Sequelize} - Sequelize instance
 */
function getSequelize() {
  if (!sequelize) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return sequelize;
}

/**
 * Close the database connection
 */
async function closeDB() {
  if (sequelize) {
    await sequelize.close();
    console.log('PostgreSQL connection closed');
  }
}

module.exports = { connectDB, getSequelize, closeDB };
