/**
 * Portfolio Configuration
 * Consolidated from lib/constants/portfolio/* and lib/services/portfolio/constants*
 */

// Query Limits
export const PORTFOLIO_QUERY_LIMITS = {
  NFT: 25,
  TRANSACTIONS: 50,
  ASSETS: 100,
  ACTIVITIES: 100,
  DEFAULT: 1000,
  TRANSACTIONS_MAX: 500,
  NFTS_MAX: 100,
  ASSETS_MAX: 200,
} as const;

// Display Thresholds
export const PORTFOLIO_THRESHOLDS = {
  // Balance display thresholds
  MIN_BALANCE_DISPLAY: 0.000001, // Don't display balances smaller than this
  MIN_VALUE_USD: 0.01, // Don't display USD values smaller than this
  MIN_NFT_VALUE: 0.1, // Minimum NFT value to display

  // Asset value thresholds
  MIN_ASSET_VALUE: 0.01, // Minimum USD value to consider an asset
  DUST_THRESHOLD: 0.001, // Assets below this are considered dust
  PORTFOLIO_MIN_VALUE: 1, // Minimum portfolio value to display

  // Phantom detection
  PHANTOM_DETECTION_MIN_VALUE: 1,

  // Retry limits
  MAX_RETRIES: 3,
} as const;

// API Configuration - Use CACHE_CONFIG timeout for consistency
export const PORTFOLIO_API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds (matches CACHE_CONFIG.TIMEOUT.PORTFOLIO)
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  BATCH_SIZE: 10,
  RATE_LIMIT_DELAY: 100, // 100ms between batches
} as const;

// Token Decimals
export const PORTFOLIO_DECIMALS = {
  DEFAULT: 8,
  APT: 8,
  BTC: 8,
  USDC: 6,
  USDT: 6,
} as const;

// Cache TTL Settings - Use CACHE_CONFIG from cache.ts for consistency
// These are kept for backward compatibility but import from cache.ts is preferred
export const PORTFOLIO_CACHE_TTL = {
  PORTFOLIO_DATA: 60000, // 1 minute
  PRICE_DATA: 30000, // 30 seconds
  NFT_DATA: 120000, // 2 minutes
  TRANSACTION_DATA: 60000, // 1 minute
} as const;

// Aptos Indexer Configuration
export const PORTFOLIO_INDEXER = {
  URL: process.env.NEXT_PUBLIC_APTOS_INDEXER_URL || "https://api.mainnet.aptoslabs.com/v1/graphql",
} as const;

// UI component dimensions and pagination settings
export const UI_CONSTANTS = {
  // Virtualized list settings
  ITEM_HEIGHT: 80,
  PAGE_SIZE: 5000,

  // Default list heights
  MIN_LIST_HEIGHT: 600,
  VIEWPORT_OFFSET: 400, // window.innerHeight - this value = list height
} as const;

// Error Messages
export const PORTFOLIO_ERROR_MESSAGES = {
  INDEXER_ERROR: "Aptos Indexer API error",
  NETWORK_ERROR: "Network request failed",
  INVALID_ADDRESS: "Invalid wallet address format",
  NO_DATA: "No data available",
  TIMEOUT: "Request timeout",
  GRAPHQL_ERROR: "GraphQL query failed",
  TIMEOUT_ERROR: "Request timeout",
  PARSE_ERROR: "Failed to parse response",
  VALIDATION_ERROR: "Data validation failed",
  CACHE_ERROR: "Cache operation failed",
} as const;
