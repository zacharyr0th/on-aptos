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
  BATCH_SIZE: 10,
  RATE_LIMIT_DELAY: 100, // 100ms between batches
} as const;

// Re-export consolidated error messages for backward compatibility
export { ERROR_MESSAGES } from "../errors";
