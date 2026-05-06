export const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}

export const httpLogger = (_req: any, _res: any, next: any) => next()
