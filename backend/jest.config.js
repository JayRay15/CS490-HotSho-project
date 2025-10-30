const isCI = !!process.env.CI;
const hasDb = !!process.env.MONGODB_URI;

export default {
  // Use Node environment for backend tests
  testEnvironment: 'node',

  // Transform ES modules for Jest
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Exclude server entry point
    // Exclude thin wiring/glue and infra utilities from coverage to focus on Sprint 1 logic
    '!src/routes/**/*.js',
    '!src/utils/cleanupDeletedUsers.js',
    '!src/utils/db.js',
    '!src/utils/emailService.js',
    '!src/utils/email.js',
    '!src/models/User.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**',
  ],

  // Coverage thresholds (conditionally enforced)
  coverageThreshold: isCI && !hasDb
    ? undefined // Disable strict coverage on CI when DB suites are skipped
    : {
        global: {
          lines: 90,
          statements: 90,
        },
      },

  // Coverage reporters
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js',
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],

  // Module paths
  moduleDirectories: ['node_modules', 'src'],

  // Timeout for tests
  testTimeout: 30000,

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/', 'src/__tests__/unit/cleanupDeletedUsers.test.js'],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // ES Module support
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
