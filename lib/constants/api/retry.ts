/**
 * Retry and Timeout Configuration
 * Standard retry policies and timeout settings
 */

export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  BACKOFF_FACTOR: 2,
} as const;

export const TIMEOUT_CONFIG = {
  DEFAULT: 30000, // 30 seconds
  FAST: 10000, // 10 seconds
  SLOW: 60000, // 60 seconds
} as const;

export const SERVICE_DEFAULTS = {
  CACHE_ENABLED: true,
  FALLBACK_ENABLED: true,
  TIMEOUT: TIMEOUT_CONFIG.DEFAULT,
} as const;

/**
 * Error Messages
 * Standardized error messages for API operations
 */
export const ERROR_MESSAGES = {
  // General errors
  FETCH_FAILED: 'Failed to fetch data',
  CACHE_ERROR: 'Cache operation failed',
  TIMEOUT: 'Request timeout',
  NO_DATA: 'No data available',
  RATE_LIMITED: 'Rate limit exceeded',

  // Specific errors
  INVALID_TOKEN: 'Invalid token address',
  INVALID_ADDRESS: 'Invalid wallet address',
  INDEXER_ERROR: 'Aptos indexer request failed',
  PRICE_FETCH_FAILED: 'Failed to fetch price data',
} as const;
