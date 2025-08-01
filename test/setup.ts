import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
vi.stubEnv('NODE_ENV', 'test')
vi.stubEnv('APTOS_BUILD_SECRET', 'test-secret')
vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
vi.stubEnv('CMC_API_KEY', 'test-cmc-key')

// Mock logger globally
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  apiLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  serviceLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  errorLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js headers
vi.mock('next/headers', () => ({
  headers: () => new Map(),
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}))

// Mock fetch for API tests
global.fetch = vi.fn()

// Mock Aptos wallet adapter
vi.mock('@aptos-labs/wallet-adapter-react', () => ({
  useWallet: () => ({
    connected: false,
    account: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    signAndSubmitTransaction: vi.fn(),
  }),
}))

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})