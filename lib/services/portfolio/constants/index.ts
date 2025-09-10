// Portfolio service constants

export const QUERY_LIMITS = {
  DEFAULT: 1000,
  TRANSACTIONS: 500,
  NFTS: 100,
  ASSETS: 200,
} as const;

export const DECIMALS = {
  DEFAULT: 8,
  APT: 8,
  BTC: 8,
  USDC: 6,
  USDT: 6,
} as const;

export const THRESHOLDS = {
  MIN_ASSET_VALUE: 0.01, // Minimum USD value to consider an asset
  DUST_THRESHOLD: 0.001, // Assets below this are considered dust
  PORTFOLIO_MIN_VALUE: 1, // Minimum portfolio value to display
} as const;

export const APTOS_INDEXER_URL =
  process.env.NEXT_PUBLIC_APTOS_INDEXER_URL || "https://api.mainnet.aptoslabs.com/v1/graphql";

export const ERROR_MESSAGES = {
  GRAPHQL_ERROR: "GraphQL query failed",
  NETWORK_ERROR: "Network request failed",
  TIMEOUT_ERROR: "Request timeout",
  PARSE_ERROR: "Failed to parse response",
  VALIDATION_ERROR: "Data validation failed",
  CACHE_ERROR: "Cache operation failed",
  INDEXER_ERROR: "Indexer query failed",
} as const;
