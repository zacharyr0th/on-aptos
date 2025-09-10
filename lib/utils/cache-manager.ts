import { PERFORMANCE_THRESHOLDS, SERVICE_CONFIG } from "@/lib/config/cache";
import { logger } from "@/lib/utils/core/logger";

import type { CacheEntry, CacheStats } from "./types";

export class EnhancedLRUCache<T = unknown> {
  private map = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly ttl: number;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(maxSize: number, ttl: number) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): {
    value: T;
    timestamp: number;
    isNearingExpiration: boolean;
    isStale: boolean;
  } | null {
    const entry = this.map.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if entry has expired
    if (age >= this.ttl) {
      this.map.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.lastAccessed = now;
    entry.hits++;
    this.stats.hits++;

    // Move to end (most recently used)
    this.map.delete(key);
    this.map.set(key, entry);

    const isNearingExpiration = age >= this.ttl * PERFORMANCE_THRESHOLDS.CACHE_NEAR_EXPIRATION;
    const isStale = age >= this.ttl * PERFORMANCE_THRESHOLDS.STALE_WHILE_REVALIDATE;

    return {
      value: entry.value,
      timestamp: entry.timestamp,
      isNearingExpiration,
      isStale,
    };
  }

  set(key: string, value: T): void {
    const now = Date.now();

    // If at capacity and adding new key, evict LRU
    if (this.map.size >= this.maxSize && !this.map.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      lastAccessed: now,
      hits: 0,
    };

    this.map.set(key, entry);
  }

  private evictLRU(): void {
    if (this.map.size === 0) return;

    // Find the least recently used entry
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.map.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.map.delete(lruKey);
      this.stats.evictions++;
    }
  }

  has(key: string): boolean {
    const entry = this.map.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp >= this.ttl) {
      this.map.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
    this.resetStats();
  }

  get size(): number {
    return this.map.size;
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.map.entries()) {
      if (now - entry.timestamp >= this.ttl) {
        this.map.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Get all keys sorted by access time (most recent first)
  getKeys(): string[] {
    return Array.from(this.map.keys());
  }

  // Get cache entries for debugging
  getEntries(): Array<[string, { age: number; hits: number; size: number }]> {
    const now = Date.now();
    return Array.from(this.map.entries()).map(([key, entry]) => [
      key,
      {
        age: now - entry.timestamp,
        hits: entry.hits,
        size: JSON.stringify(entry.value).length,
      },
    ]);
  }
}

// Global cache instances for different services - now using SERVICE_CONFIG
export const cacheInstances = {
  stables: new EnhancedLRUCache(SERVICE_CONFIG.stables.maxSize, SERVICE_CONFIG.stables.ttl),
  prices: new EnhancedLRUCache(SERVICE_CONFIG.prices.maxSize, SERVICE_CONFIG.prices.ttl),
  btc: new EnhancedLRUCache(SERVICE_CONFIG.btc.maxSize, SERVICE_CONFIG.btc.ttl),
  lst: new EnhancedLRUCache(SERVICE_CONFIG.lst.maxSize, SERVICE_CONFIG.lst.ttl),
  apiService: new EnhancedLRUCache(
    SERVICE_CONFIG.apiService.maxSize,
    SERVICE_CONFIG.apiService.ttl
  ),
} as const;

export type CacheInstanceName = keyof typeof cacheInstances;

// Cleanup scheduler
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCacheCleanup(): void {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(
    () => {
      let totalCleaned = 0;

      for (const [name, cache] of Object.entries(cacheInstances)) {
        const cleaned = cache.cleanExpired();
        totalCleaned += cleaned;

        if (cleaned > 0) {
          logger.debug(`Cache cleanup: ${name} removed ${cleaned} expired entries`);
        }
      }

      if (totalCleaned > 0) {
        logger.debug(`Total cache cleanup: ${totalCleaned} entries removed`);
      }
    },
    5 * 60 * 1000
  ); // Run every 5 minutes
}

export function stopCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Helper functions with improved type safety
export function getCachedData<T>(cacheName: CacheInstanceName, key: string): T | null {
  const cached = cacheInstances[cacheName].get(key);
  return cached ? (cached.value as T) : null;
}

export function setCachedData<T>(cacheName: CacheInstanceName, key: string, data: T): void {
  cacheInstances[cacheName].set(key, data);
}

export function hasCachedData(cacheName: CacheInstanceName, key: string): boolean {
  return cacheInstances[cacheName].has(key);
}

export function isNearingExpiration(cacheName: CacheInstanceName, key: string): boolean {
  const cached = cacheInstances[cacheName].get(key);
  return cached?.isNearingExpiration === true;
}

export function isStale(cacheName: CacheInstanceName, key: string): boolean {
  const cached = cacheInstances[cacheName].get(key);
  return cached?.isStale === true;
}

export function getCacheStats(
  cacheName?: CacheInstanceName
): CacheStats | Record<string, CacheStats> {
  if (cacheName) {
    return cacheInstances[cacheName].getStats();
  }

  // Return stats for all caches
  const allStats: Record<string, CacheStats> = {};
  for (const [name, cache] of Object.entries(cacheInstances)) {
    allStats[name] = cache.getStats();
  }
  return allStats;
}

// Auto-start cleanup only in production
if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
  startCacheCleanup();
}

// Cleanup on process exit
if (typeof process !== "undefined") {
  process.on("exit", stopCacheCleanup);
  process.on("SIGINT", stopCacheCleanup);
  process.on("SIGTERM", stopCacheCleanup);
}

// ===== CACHE HELPERS (formerly from cache-helpers.ts) =====

export interface CacheFirstOptions<T> {
  namespace: CacheInstanceName;
  cacheKey: string;
  fetchFn: () => Promise<T>;
  startTime: number;
  forceRefresh?: boolean;
  apiCallCount?: number;
}

/**
 * Centralized cache-first pattern to eliminate repeated cache checking logic
 */
export async function cacheFirst<T>(options: CacheFirstOptions<T>) {
  const {
    namespace,
    cacheKey,
    fetchFn,
    startTime,
    forceRefresh = false,
    apiCallCount = 1,
  } = options;

  // Check cache first unless forcing refresh
  if (!forceRefresh) {
    const cachedData = getCachedData<T>(namespace, cacheKey);
    if (cachedData !== null) {
      // Import response builder functions locally to avoid circular dependency
      const { buildCachedResponse } = await import("./api/response");
      return buildCachedResponse(cachedData, startTime);
    }
  }

  try {
    // Fetch fresh data
    const freshData = await fetchFn();

    // Cache the result
    setCachedData(namespace, cacheKey, freshData);

    const { buildFreshResponse } = await import("./api/response");
    return buildFreshResponse(freshData, startTime, apiCallCount);
  } catch (error) {
    // Try fallback to cache on error
    const cachedData = getCachedData<T>(namespace, cacheKey);
    if (cachedData !== null) {
      logger.info("Fetch error, serving cached data as fallback");
      const { buildCachedResponse } = await import("./api/response");
      return buildCachedResponse(cachedData, startTime);
    }

    // Re-throw error if no cache available
    throw error;
  }
}

/**
 * Cache-first pattern with fallback data for critical endpoints
 */
export async function cacheFirstWithFallback<T>(options: CacheFirstOptions<T>, fallbackData: T) {
  try {
    return await cacheFirst(options);
  } catch (error) {
    logger.error(error, `Failed to fetch data for ${options.cacheKey}, using fallback:`);
    const { buildFallbackResponse } = await import("./api/response");
    return buildFallbackResponse(fallbackData, options.startTime);
  }
}
