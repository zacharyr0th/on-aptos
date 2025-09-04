// Shared constants for all asset pages

// Common cache settings
export const DEFAULT_CACHE_SIZE = 2000;
export const CACHE_TTL_MS = 300000; // 5 minutes
export const PERFORMANCE_THRESHOLD_MS = 50;

// Decimal places for different asset types
export const DECIMAL_PLACES = {
  STABLECOINS: 6,
  RWA: 6,
  LST: 8,
  BTC: 10,
} as const;

// API endpoints
export const API_ENDPOINTS = {
  STABLES: "/api/tokens/supplies",
  RWA: "/api/tokens/supplies",
  LST: "/api/data/analytics/lst",
  BTC: "/api/data/analytics/btc",
} as const;

// Refresh intervals
export const REFRESH_INTERVALS = {
  PRICE_DATA: 30000, // 30 seconds
  SUPPLY_DATA: 60000, // 1 minute
  CHART_DATA: 120000, // 2 minutes
} as const;

// Chart configuration
export const CHART_CONFIG = {
  MIN_PERCENTAGE_TO_SHOW: 0.01,
  MAX_SEGMENTS: 10,
  OTHER_LABEL: "Other",
} as const;

// Table configuration
export const TABLE_CONFIG = {
  ROWS_PER_PAGE: 10,
  MIN_SEARCH_LENGTH: 2,
} as const;
