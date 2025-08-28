// Unified cache system (NEW - consolidated all cache functionality)
export {
  UnifiedCache,
  type CacheOptions,
  type CacheStats,
} from "./unified-cache";

// Legacy cache system for backward compatibility
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
} from "./unified-cache";

// Request deduplication
export * from "./request-deduplication";
