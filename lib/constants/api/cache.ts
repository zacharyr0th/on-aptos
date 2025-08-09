/**
 * Cache TTL Configuration
 * Consolidated cache timeout settings for all services
 */

export const CACHE_TTL = {
  // Asset services - consolidated from asset services constants
  BTC_SUPPLY: 15 * 60 * 1000, // 15 minutes (from asset services)
  LST_SUPPLY: 10 * 60 * 1000, // 10 minutes (from asset services)
  STABLECOIN_SUPPLY: 15 * 60 * 1000, // 15 minutes (from asset services)
  RWA_DATA: 30 * 60 * 1000, // 30 minutes (from asset services)
  PRICE_DATA: 5 * 60 * 1000, // 5 minutes (from asset services)

  // Portfolio services - shorter caches for dynamic data
  ASSETS: 60, // 1 minute
  PRICES: 300, // 5 minutes
  NFT: 300, // 5 minutes
  DEFI: 180, // 3 minutes
  TRANSACTIONS: 60, // 1 minute
  ANS: 3600, // 1 hour

  // Default fallback
  DEFAULT: 5 * 60 * 1000, // 5 minutes (from asset services)
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
