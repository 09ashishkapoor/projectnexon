module.exports = {
  testMatch: ['**/tests/**/*.test.js'],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'json'],
  transform: {},
  setupFiles: ['<rootDir>/jest.setup.js'],
};