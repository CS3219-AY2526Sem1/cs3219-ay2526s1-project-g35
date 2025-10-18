/**
 * Central Error Exports
 * Import all error types from here
 */

const baseErrors = require('./base-errors');
const questionErrors = require('./question-errors');

module.exports = {
  // Base errors
  ...baseErrors,

  // Question-specific errors
  ...questionErrors,
};
