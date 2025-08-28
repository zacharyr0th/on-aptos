/**
 * Error Messages
 * Consolidated from all services
 */

export const ERROR_MESSAGES = {
  // General errors
  FETCH_FAILED: "Failed to fetch data",
  CACHE_ERROR: "Cache operation failed",
  TIMEOUT: "Request timeout",
  NO_DATA: "No data available",
  RATE_LIMITED: "Rate limit exceeded",
  NETWORK_ERROR: "Network request failed",
  PARSE_ERROR: "Failed to parse response",
  VALIDATION_ERROR: "Data validation failed",

  // API specific errors
  INVALID_TOKEN: "Invalid token address",
  INVALID_ADDRESS: "Invalid wallet address",
  INDEXER_ERROR: "Aptos indexer request failed",
  PRICE_FETCH_FAILED: "Failed to fetch price data",

  // GraphQL specific
  GRAPHQL_ERROR: "GraphQL query failed",

  // Asset specific errors
  SUPPLY_FETCH_ERROR: "Failed to fetch supply data",
} as const;
