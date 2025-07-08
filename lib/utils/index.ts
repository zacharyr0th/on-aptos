// Type definitions
export * from './types';

// Simple cache for rate-limited APIs only
export {
  SimpleCache,
  coinGeckoCache,
  cmcCache,
  panoraCache,
  portfolioCache,
  getCachedData,
  setCachedData,
  cacheFirst,
  cacheFirstWithFallback,
  type CacheInstanceName,
  type CacheFirstOptions,
} from './simple-cache';

// Response builders and error helpers (combined functionality)
export {
  buildTRPCResponse,
  buildCachedResponse,
  buildFreshResponse,
  buildFallbackResponse,
  type ResponseMetrics,
  // Error handling helpers (formerly from error-helpers.ts)
  formatApiError,
  handleApiError,
  withErrorHandling,
  withErrorHandlingAndFallback,
  type ErrorContext,
} from './response-builder';

// HTTP utilities
export {
  enhancedFetch,
  fetchWithRetry, // backward compatibility
  graphQLRequest,
  apiRequest,
  batchRequests,
} from './fetch-utils';

// Client-safe API utilities (now in fetch-utils)
export {
  getClientSecurityHeaders,
  parseRateLimitHeaders,
  isRateLimited,
  getRetryDelay,
} from './fetch-utils';

// Formatting utilities (includes former currency.ts functionality)
export {
  formatNumber,
  formatCurrencyValue,
  formatQuantity,
  formatQuantityValue,
  formatCurrencyBigInt,
  formatNumberBigInt,
  formatBigIntWithDecimals,
  formatPercentage,
  formatRelativeTime,
  convertRawTokenAmount,
  calculateMarketShare,
  // Currency functions
  formatCurrency,
  formatAmount,
  formatAmountFull,
  formatLargeNumber,
  getDecimalPlaces,
  isValidCurrencyCode,
  getSupportedFiatCurrencies,
  isFiatCurrency,
  // Currency conversion functions removed - not implemented
} from './format';

// Re-export currency types for convenience
export type { Currency, FiatCurrency } from './format';

// General utilities (includes former constants.ts)
export {
  cn,
  safeStringify,
  delay,
  safeJsonParse,
  truncate,
  capitalize,
  debounce,
  throttle,
  isEmpty,
  pick,
  omit,
  generateId,
  // Constants (formerly from constants.ts)
  knownAptosRelatedAddresses,
} from './utils';

// ===== SERVER-SIDE ONLY EXPORTS =====
// IMPORTANT: For server-only utilities, import from '@/lib/utils/server' instead
