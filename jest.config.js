/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/views/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
