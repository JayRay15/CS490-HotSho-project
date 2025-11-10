module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Exclude server entry point
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // Ignore manual test scripts and tooling from coverage
  coveragePathIgnorePatterns: ['<rootDir>/src/test_scripts/','<rootDir>/utils/__tests__'],
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testTimeout: 60000, // Increased to 60s for integration tests with database
  verbose: true,
};
