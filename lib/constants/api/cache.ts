/**
 * Cache TTL Configuration
 * Consolidated cache timeout settings for all services
 */

export const CACHE_TTL = {
  // Asset services - longer caches for stable data
  BTC_SUPPLY: 300, // 5 minutes
  LST_SUPPLY: 300, // 5 minutes
  STABLECOIN_SUPPLY: 600, // 10 minutes
  RWA_SUPPLY: 900, // 15 minutes
  FARMING_APR: 180, // 3 minutes

  // Portfolio services - shorter caches for dynamic data
  ASSETS: 60, // 1 minute
  PRICES: 300, // 5 minutes
  NFT: 300, // 5 minutes
  DEFI: 180, // 3 minutes
  TRANSACTIONS: 60, // 1 minute
  ANS: 3600, // 1 hour

  // Default fallback
  DEFAULT: 300, // 5 minutes
} as const;

/**
 * Query Limits Configuration
 * Standard limits for different types of queries
 */
export const QUERY_LIMITS = {
  // Asset queries
  ASSETS: 100,
  DEFAULT: 100,
  MAX_BATCH: 50,
  PAGINATION: 25,

  // Portfolio queries
  NFT: 100,
  TRANSACTIONS: 50,
} as const;
