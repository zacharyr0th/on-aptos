// ===== CORE UTILITIES =====
// Re-export all core utilities

// ===== API UTILITIES =====
// Legacy API exports for backward compatibility
export * from "./api";
export {
  fetchFromPanora as fetchFromPanoraNew,
  getPanoraPrices,
  getPanoraTokenList,
  panoraClient,
} from "./api/panora-client";

// Export unified API systems (NEW - use for new code) - after legacy to avoid conflicts
export {
  buildCachedResponse as buildCachedResponseNew,
  buildFallbackResponse as buildFallbackResponseNew,
  buildFreshResponse as buildFreshResponseNew,
  CACHE_HEADERS,
  type CacheResponseOptions,
  CORS_HEADERS,
  type ErrorResponse as UnifiedErrorResponse,
  errorResponse,
  type PaginationMeta,
  type ResponseMeta,
  type StandardResponse,
  successResponse,
  UnifiedResponseBuilder,
} from "./api/unified-response-builder";
// Request deduplication exports
export * from "./cache/request-deduplication";
// ===== CACHE UTILITIES =====
// Export unified cache system (NEW - use for new code)
export {
  type CacheFirstOptions,
  type CacheInstanceName,
  type CacheOptions,
  type CacheStats as UnifiedCacheStats,
  cacheFirst,
  cacheFirstWithFallback,
  cacheInstances,
  clearCache,
  EnhancedLRUCache,
  getCachedData,
  getCacheStats as getUnifiedCacheStats,
  hasCachedData,
  isNearingExpiration,
  isStale,
  SimpleCache,
  setCachedData,
  startCacheCleanup,
  stopCacheCleanup,
  UnifiedCache,
} from "./cache/unified-cache";
export * from "./core";
export {
  ERROR_CODES,
  logError,
  sleep,
  UnifiedError,
  type UnifiedErrorContext,
  UnifiedErrorHandler,
  type UnifiedRetryOptions,
  type UnifiedTimeoutOptions,
  validateRequired as validateRequiredParams,
  withFallback,
  withRetry,
  withRetryAndTimeout,
  withTimeout,
  wrapError,
} from "./error-handling/unified-error-handler";
// Legacy format exports for backward compatibility (specific exports to avoid conflicts)
export {
  type Currency,
  convertRawTokenAmount,
  formatAmount,
  formatAmountFull,
  formatBigIntWithDecimals,
  formatCompactNumber,
  formatCurrency,
  formatCurrencyMobile,
  formatLargeNumber,
  formatNumber,
  formatPercentage,
} from "./format";
// ===== FORMAT UTILITIES =====
// Export unified formatters (NEW - use for new code)
export {
  AssetFormatters,
  clearFormatCache,
  formatAPTAmount,
  formatAPTAmountWithCommas,
  formatAPY,
  formatBalance,
  formatBTCAmount,
  formatBTCAmountWithCommas,
  formatDollarAmount,
  formatMarketCap,
  formatPercentageFast,
  formatSmartPrice,
  formatTokenAmount,
  formatTokenAmountWithCommas,
  formatTokenSupply,
  getFormatCacheStats,
  UnifiedFormatters,
} from "./formatting/unified-formatters";
// ===== INFRASTRUCTURE UTILITIES =====
// Re-export infrastructure utilities (selective export for client safety)
export { setupGracefulShutdown } from "./infrastructure/graceful-shutdown";
export {
  extractIPFSHash,
  IPFS_GATEWAYS,
  resolveIPFSUrl,
} from "./infrastructure/ipfs-gateway-fallback";
// ===== TOKEN UTILITIES =====
// Re-export all token utilities
export * from "./token";
// sitemap is server-only, not exported here

// ===== SERVER-SIDE ONLY EXPORTS =====
// IMPORTANT: For server-only utilities, import from '@/lib/utils/server' instead
