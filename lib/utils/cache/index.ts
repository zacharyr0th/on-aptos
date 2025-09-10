// Unified cache system (NEW - consolidated all cache functionality)

// Request deduplication
export * from "./request-deduplication";
export {
  type CacheFirstOptions,
  type CacheInstanceName,
  type CacheOptions,
  type CacheStats,
  cacheFirst,
  cacheFirstWithFallback,
  cacheInstances,
  EnhancedLRUCache,
  getCachedData,
  getCacheStats,
  hasCachedData,
  isNearingExpiration,
  isStale,
  setCachedData,
  UnifiedCache,
} from "./unified-cache";
