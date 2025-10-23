// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
  ],
  testTimeout: 30000, // 30 seconds for database tests
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
