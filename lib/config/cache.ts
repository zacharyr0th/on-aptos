// Centralized cache configuration
export const CACHE_CONFIG = {
  // TTL configurations (in milliseconds)
  TTL: {
    STABLES: 5 * 60 * 1000, // 5 minutes (frequent updates)
    PRICES: 5 * 60 * 1000, // 5 minutes (price data changes frequently)
    BTC: 10 * 60 * 1000, // 10 minutes (balance between freshness and API calls)
    LST: 30 * 60 * 1000, // 30 minutes (less volatile data)
    RWA: 5 * 60 * 1000, // 5 minutes (RWA data from external APIs, needs frequent updates)
    API_SERVICE: 60 * 60 * 1000, // 1 hour (general API caching)
    PORTFOLIO: 2 * 60 * 1000, // 2 minutes (portfolio data changes frequently)
  },

  // Cache size limits
  SIZE: {
    DEFAULT: 100,
    SMALL: 20,
    LARGE: 200,
  },

  // Rate limiting
  RATE_LIMIT: {
    WINDOW: 60000, // 1 minute
    MAX_REQUESTS: 30, // requests per window
    BURST_LIMIT: 10, // burst requests
    BURST_WINDOW: 10000, // 10 seconds
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 2,
    BASE_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
    BACKOFF_FACTOR: 1.5,
  },

  // Request timeouts
  TIMEOUT: {
    DEFAULT: 10000, // 10 seconds
    FAST: 5000, // 5 seconds for quick APIs
    SLOW: 30000, // 30 seconds for heavy operations
  },
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  CACHE_NEAR_EXPIRATION: 0.8, // 80% of TTL
  STALE_WHILE_REVALIDATE: 0.9, // 90% of TTL
} as const;

// Service-specific configurations
export const SERVICE_CONFIG = {
  stables: {
    ttl: CACHE_CONFIG.TTL.STABLES,
    maxSize: CACHE_CONFIG.SIZE.DEFAULT,
    timeout: CACHE_CONFIG.TIMEOUT.DEFAULT,
    retries: CACHE_CONFIG.RETRY.MAX_ATTEMPTS,
  },
  prices: {
    ttl: CACHE_CONFIG.TTL.PRICES,
    maxSize: CACHE_CONFIG.SIZE.SMALL,
    timeout: CACHE_CONFIG.TIMEOUT.FAST,
    retries: 1, // Prices should fail fast
  },
  btc: {
    ttl: CACHE_CONFIG.TTL.BTC,
    maxSize: CACHE_CONFIG.SIZE.DEFAULT,
    timeout: CACHE_CONFIG.TIMEOUT.DEFAULT,
    retries: CACHE_CONFIG.RETRY.MAX_ATTEMPTS,
  },
  lst: {
    ttl: CACHE_CONFIG.TTL.LST,
    maxSize: CACHE_CONFIG.SIZE.SMALL,
    timeout: CACHE_CONFIG.TIMEOUT.DEFAULT,
    retries: CACHE_CONFIG.RETRY.MAX_ATTEMPTS,
  },
  rwa: {
    ttl: CACHE_CONFIG.TTL.RWA,
    maxSize: CACHE_CONFIG.SIZE.DEFAULT,
    timeout: CACHE_CONFIG.TIMEOUT.DEFAULT,
    retries: CACHE_CONFIG.RETRY.MAX_ATTEMPTS,
  },
  apiService: {
    ttl: CACHE_CONFIG.TTL.API_SERVICE,
    maxSize: CACHE_CONFIG.SIZE.DEFAULT,
    timeout: CACHE_CONFIG.TIMEOUT.DEFAULT,
    retries: CACHE_CONFIG.RETRY.MAX_ATTEMPTS,
  },
  portfolio: {
    ttl: CACHE_CONFIG.TTL.PORTFOLIO,
    maxSize: CACHE_CONFIG.SIZE.DEFAULT,
    timeout: CACHE_CONFIG.TIMEOUT.DEFAULT,
    retries: CACHE_CONFIG.RETRY.MAX_ATTEMPTS,
  },
} as const;
