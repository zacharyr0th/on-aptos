/**
 * UI Display Thresholds and Limits
 * Configuration for display cutoffs and filtering
 * @deprecated - Use portfolio/thresholds.ts for portfolio-specific thresholds
 */

// Re-export from portfolio thresholds for backward compatibility
import { PORTFOLIO_THRESHOLDS } from "../portfolio/thresholds";

export const UI_DISPLAY_THRESHOLDS = {
  MIN_BALANCE_DISPLAY: PORTFOLIO_THRESHOLDS.MIN_BALANCE_DISPLAY,
  MIN_VALUE_USD: PORTFOLIO_THRESHOLDS.MIN_VALUE_USD,
  PHANTOM_DETECTION_MIN_VALUE: PORTFOLIO_THRESHOLDS.PHANTOM_DETECTION_MIN_VALUE,
} as const;

// Re-export for backward compatibility
export const DISPLAY_THRESHOLDS = UI_DISPLAY_THRESHOLDS;
