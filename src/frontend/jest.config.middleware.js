const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/middleware.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Keine Setup-Dateien für diese Tests
  setupFilesAfterEnv: [],
  verbose: true,
  // Ignore punycode warnings
  silent: false,
}

module.exports = createJestConfig(customJestConfig);