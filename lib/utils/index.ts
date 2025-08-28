// ===== CORE UTILITIES =====
// Re-export all core utilities
export * from "./core";

// ===== API UTILITIES =====
// Legacy API exports for backward compatibility
export * from "./api";

// Export unified API systems (NEW - use for new code) - after legacy to avoid conflicts
export {
  UnifiedResponseBuilder,
  successResponse,
  errorResponse,
  buildCachedResponse as buildCachedResponseNew,
  buildFreshResponse as buildFreshResponseNew,
  buildFallbackResponse as buildFallbackResponseNew,
  CACHE_HEADERS,
  CORS_HEADERS,
  type StandardResponse,
  type ResponseMeta,
  type PaginationMeta,
  type ErrorResponse as UnifiedErrorResponse,
  type CacheResponseOptions,
} from "./api/unified-response-builder";
export {
  panoraClient,
  fetchFromPanora as fetchFromPanoraNew,
  getPanoraTokenList,
  getPanoraPrices,
} from "./api/panora-client";
export {
  UnifiedError,
  UnifiedErrorHandler,
  ERROR_CODES,
  sleep,
  withRetry,
  withTimeout,
  withRetryAndTimeout,
  withFallback,
  validateRequired as validateRequiredParams,
  wrapError,
  logError,
  type UnifiedRetryOptions,
  type UnifiedTimeoutOptions,
  type UnifiedErrorContext,
} from "./error-handling/unified-error-handler";

// ===== CACHE UTILITIES =====
// Export unified cache system (NEW - use for new code)
export {
  UnifiedCache,
  type CacheOptions,
  type CacheStats as UnifiedCacheStats,
  cacheInstances,
  getCachedData,
  setCachedData,
  hasCachedData,
  clearCache,
  getCacheStats as getUnifiedCacheStats,
  cacheFirst,
  cacheFirstWithFallback,
  type CacheInstanceName,
  type CacheFirstOptions,
  startCacheCleanup,
  stopCacheCleanup,
  SimpleCache,
  EnhancedLRUCache,
  isNearingExpiration,
  isStale,
} from "./cache/unified-cache";

// Request deduplication exports
export * from "./cache/request-deduplication";

// ===== FORMAT UTILITIES =====
// Export unified formatters (NEW - use for new code)
export {
  UnifiedFormatters,
  AssetFormatters,
  formatTokenAmount,
  formatTokenAmountWithCommas,
  formatPercentageFast,
  formatMarketCap,
  formatTokenSupply,
  formatBalance,
  formatDollarAmount,
  formatAPY,
  formatSmartPrice,
  clearFormatCache,
  getFormatCacheStats,
  formatBTCAmount,
  formatBTCAmountWithCommas,
  formatAPTAmount,
  formatAPTAmountWithCommas,
} from "./formatting/unified-formatters";

// Legacy format exports for backward compatibility (specific exports to avoid conflicts)
export {
  formatAmount,
  formatAmountFull,
  formatCurrency,
  formatCurrencyMobile,
  formatNumber,
  formatCompactNumber,
  formatLargeNumber,
  convertRawTokenAmount,
  formatPercentage,
  formatBigIntWithDecimals,
  type Currency,
} from "./format";

// ===== TOKEN UTILITIES =====
// Re-export all token utilities
export * from "./token";

// ===== INFRASTRUCTURE UTILITIES =====
// Re-export infrastructure utilities (selective export for client safety)
export { setupGracefulShutdown } from "./infrastructure/graceful-shutdown";
export {
  extractIPFSHash,
  resolveIPFSUrl,
  IPFS_GATEWAYS,
} from "./infrastructure/ipfs-gateway-fallback";
// sitemap is server-only, not exported here

// ===== SERVER-SIDE ONLY EXPORTS =====
// IMPORTANT: For server-only utilities, import from '@/lib/utils/server' instead
