module.exports = {
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['/node_modules/'],
    testTimeout: 30000, // 30 seconds for integration tests
    testMatch: ['**/src/test/integration/**/*.test.js'],
    verbose: true,
    collectCoverage: false,
};

