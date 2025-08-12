/**
 * UI Display Thresholds and Limits
 * Configuration for display cutoffs and filtering
 * NOTE: Portfolio-specific thresholds moved to /portfolio/thresholds.ts
 */

export const UI_DISPLAY_THRESHOLDS = {
  MIN_BALANCE_DISPLAY: 0.00001,
  MIN_VALUE_USD: 0.01,
  PHANTOM_DETECTION_MIN_VALUE: 1,
} as const;

// Re-export for backward compatibility
export const DISPLAY_THRESHOLDS = UI_DISPLAY_THRESHOLDS;
