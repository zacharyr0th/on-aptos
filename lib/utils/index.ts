// Type definitions
export * from './types';

// Cache management (includes former cache-helpers.ts functionality)
export {
  EnhancedLRUCache,
  cacheInstances,
  getCachedData,
  setCachedData,
  hasCachedData,
  isNearingExpiration,
  isStale,
  getCacheStats,
  startCacheCleanup,
  stopCacheCleanup,
  type CacheInstanceName,
  // Cache helpers (formerly from cache-helpers.ts)
  cacheFirst,
  cacheFirstWithFallback,
  type CacheFirstOptions,
} from './cache-manager';

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
  getDecimalPlaces,
  isValidCurrencyCode,
  getSupportedFiatCurrencies,
  isFiatCurrency,
  // Currency conversion functions removed - not implemented
} from './formatting';

// Re-export currency types for convenience
export type { Currency, FiatCurrency } from './types';

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
