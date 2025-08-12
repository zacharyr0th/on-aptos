/**
 * Portfolio API Configuration
 * Consolidated from portfolio services
 */

export const PORTFOLIO_API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  BATCH_SIZE: 10,
  RATE_LIMIT_DELAY: 100, // 100ms between batches
} as const;
