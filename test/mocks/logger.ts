import { vi } from 'vitest'

export const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}

export const mockApiLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}

export const mockServiceLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}

export const mockErrorLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}

vi.mock('@/lib/utils/logger', () => ({
  logger: mockLogger,
  apiLogger: mockApiLogger,
  serviceLogger: mockServiceLogger,
  errorLogger: mockErrorLogger,
}))