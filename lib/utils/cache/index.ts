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

// Simple cache
export * from "./simple-cache";

// Request deduplication
export * from "./request-deduplication";