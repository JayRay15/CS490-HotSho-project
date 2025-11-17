module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['<rootDir>/src/utils/__tests__/interviewReminders.test.fixed.js'],
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testTimeout: 60000, // Increased to 60s for integration tests with database
  verbose: true,
};
