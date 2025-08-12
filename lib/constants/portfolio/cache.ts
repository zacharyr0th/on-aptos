/**
 * Portfolio Cache Configuration
 * Consolidated from portfolio services
 */

export const PORTFOLIO_CACHE_TTL = {
  PORTFOLIO_DATA: 60000, // 1 minute
  PRICE_DATA: 30000, // 30 seconds
  NFT_DATA: 120000, // 2 minutes
  TRANSACTION_DATA: 60000, // 1 minute
} as const;
