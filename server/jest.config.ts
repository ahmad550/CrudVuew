import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  globalSetup: './tests/setup/globalSetup.ts',
  globalTeardown: './tests/setup/globalTeardown.ts',
  testEnvironmentOptions: {},
  // Env vars set here are available in both globalSetup and test workers
  setupFiles: ['<rootDir>/tests/setup/env.ts'],
  moduleNameMapper: {
    '^.*/logger$': '<rootDir>/tests/__mocks__/logger.ts'
  }
}

export default config
