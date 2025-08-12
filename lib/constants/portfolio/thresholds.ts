/**
 * Portfolio Display Thresholds
 * Consolidated from portfolio services and existing thresholds
 */

export const PORTFOLIO_THRESHOLDS = {
  // Balance display thresholds
  MIN_BALANCE_DISPLAY: 0.000001, // Don't display balances smaller than this
  MIN_VALUE_USD: 0.01, // Don't display USD values smaller than this
  MIN_NFT_VALUE: 0.1, // Minimum NFT value to display

  // Asset value thresholds
  MIN_ASSET_VALUE: 0.01, // Minimum USD value to consider an asset
  DUST_THRESHOLD: 0.001, // Assets below this are considered dust
  PORTFOLIO_MIN_VALUE: 1, // Minimum portfolio value to display

  // Phantom detection (from existing ui/thresholds.ts)
  PHANTOM_DETECTION_MIN_VALUE: 1,

  // Retry limits
  MAX_RETRIES: 3,
} as const;
