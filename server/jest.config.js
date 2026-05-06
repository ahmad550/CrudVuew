/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  globalSetup: './tests/setup/globalSetup.ts',
  globalTeardown: './tests/setup/globalTeardown.ts',
  setupFiles: ['<rootDir>/tests/setup/env.ts'],
  moduleNameMapper: {
    '^.*/logger$': '<rootDir>/tests/__mocks__/logger.ts'
  }
}
