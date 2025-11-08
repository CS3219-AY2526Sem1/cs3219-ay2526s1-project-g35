const request = require('supertest');
const app = require('../src/index');
const { connectDB, closeDB } = require('../config/database');

/**
 * Test setup file
 * Initializes database connection before tests
 */

beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_NAME = 'historydb_test';
  process.env.DB_USER = 'postgres';
  process.env.DB_PASSWORD = 'postgres';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.USE_SECRET_MANAGER = 'false';

  // Connect to test database
  try {
    await connectDB();
  } catch (error) {
    console.error('Failed to connect to test database:', error);
  }
});

afterAll(async () => {
  // Close database connection
  await closeDB();
});

module.exports = {
  app,
  request,
};
