// Portfolio service constants
export const QUERY_LIMITS = {
  NFT: 25,
  TRANSACTIONS: 50,
  ASSETS: 100,
  ACTIVITIES: 100,
} as const;

export const DECIMALS = {
  DEFAULT: 8,
  USDC: 6,
  USDT: 6,
  APT: 8,
} as const;

export const THRESHOLDS = {
  MIN_BALANCE_DISPLAY: 0.000001, // Don't display balances smaller than this
  MIN_VALUE_USD: 0.01, // Don't display USD values smaller than this
  MIN_NFT_VALUE: 0.1, // Minimum NFT value to display
  MAX_RETRIES: 3,
} as const;

export const APTOS_INDEXER_URL = "https://api.mainnet.aptoslabs.com/v1/graphql";

export const ERROR_MESSAGES = {
  INDEXER_ERROR: "Aptos Indexer API error",
  NETWORK_ERROR: "Network request failed",
  INVALID_ADDRESS: "Invalid wallet address format",
  NO_DATA: "No data available",
  TIMEOUT: "Request timeout",
} as const;

export const CACHE_TTL = {
  PORTFOLIO_DATA: 60000, // 1 minute
  PRICE_DATA: 30000, // 30 seconds
  NFT_DATA: 120000, // 2 minutes
  TRANSACTION_DATA: 60000, // 1 minute
} as const;

export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  BATCH_SIZE: 10,
  RATE_LIMIT_DELAY: 100, // 100ms between batches
} as const;
