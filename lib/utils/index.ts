// Type definitions
export * from "./types";

// Error classes and utilities
export {
  AppError,
  ApiError,
  RateLimitError,
  TimeoutError,
  sanitizeError,
  logError,
} from "./errors";

// Cache management
export {
  EnhancedLRUCache,
  cacheInstances,
  getCachedData,
  setCachedData,
  hasCachedData,
  isNearingExpiration,
  isStale,
  getCacheStats,
  cacheFirst,
  cacheFirstWithFallback,
  type CacheInstanceName,
  type CacheFirstOptions,
} from "./cache-manager";


// API response utilities (use these for new code)
export {
  buildSuccessResponse,
  buildErrorResponse,
  APIResponses,
  withAPIHandler,
  createCacheHeaders,
} from "./api-response";

// Legacy response builders (for backward compatibility with tRPC)
export {
  buildTRPCResponse,
  buildCachedResponse,
  buildFreshResponse,
  buildFallbackResponse,
  formatApiError,
  handleApiError,
  withErrorHandling,
  withErrorHandlingAndFallback,
  type ResponseMetrics,
  type ErrorContext,
} from "./response-builder";

// HTTP utilities
export {
  enhancedFetch,
  fetchWithRetry, // backward compatibility
  graphQLRequest,
  apiRequest,
  batchRequests,
} from "./fetch-utils";

// Client-safe API utilities (now in fetch-utils)
export {
  getClientSecurityHeaders,
  parseRateLimitHeaders,
  isRateLimited,
  getRetryDelay,
} from "./fetch-utils";

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
  formatCurrencyMobile,
  formatAmount,
  formatAmountFull,
  formatLargeNumber,
  formatCompactNumber,
  getDecimalPlaces,
  isValidCurrencyCode,
  getSupportedFiatCurrencies,
  isFiatCurrency,
  // Currency conversion functions removed - not implemented
} from "./format";

// Re-export currency types for convenience
export type { Currency, FiatCurrency } from "./format";

// Unified token utilities (consolidates token-logos.ts, token-categorization.ts, portfolio-utils.ts)
export {
  getTokenSymbol,
  getSymbolFromAssetType,
  isStablecoin,
  isLST,
  categorizeToken,
  processAllocationData,
  getAssetDecimals,
  isAptAsset,
  getTokenLogoUrl,
  getTokenLogoUrlSync,
  getTokenLogoUrlWithFallback,
  getTokenLogoUrlWithFallbackSync,
  preloadTokenList,
  type TokenCategory,
  type CategorizedToken,
  type CategoryAllocation,
} from "./token-utils";

// Validation utilities (consolidates validation functions from multiple files)
export {
  validateAptosAddress,
  validateWalletAddress,
  validatePagination,
  isValidUrl,
  isValidHttpUrl,
  isValidEmail,
  isPositiveNumber,
  isNonNegativeNumber,
  isInteger,
  isValidLength,
  isRequired,
  sanitizeString,
  validateQueryParam,
} from "./validation";

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
} from "./utils";

// ===== SERVER-SIDE ONLY EXPORTS =====
// IMPORTANT: For server-only utilities, import from '@/lib/utils/server' instead
