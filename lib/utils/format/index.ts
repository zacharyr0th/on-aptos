// Formatting utilities
export {
  calculateMarketShare,
  convertRawTokenAmount,
  formatAmount,
  formatAmountFull,
  formatBigIntWithDecimals,
  formatCompactNumber,
  // Currency functions
  formatCurrency,
  formatCurrencyBigInt,
  formatCurrencyMobile,
  // Legacy exports (deprecated)
  formatCurrencyValue,
  formatLargeNumber,
  formatNumber,
  formatNumberBigInt,
  formatPercentage,
  formatRelativeTime,
  getDecimalPlaces,
  getSupportedFiatCurrencies,
  isFiatCurrency,
  isValidCurrencyCode,
} from "./format";

// Currency types are re-exported from format.ts
export type { Currency, FiatCurrency } from "./format";

// Chart utilities
export * from "./chart-utils";
