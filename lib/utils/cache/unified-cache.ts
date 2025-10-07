/**
 * Unified cache system - consolidates all cache implementations
 * Replaces SimpleCache, EnhancedLRUCache, and cache-manager
 */

import { logger } from "@/lib/utils/core/logger";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
  hits: number;
  prev?: CacheNode<T>;
  next?: CacheNode<T>;
}

interface CacheNode<T> {
  key: string;
  entry: CacheEntry<T>;
  prev: CacheNode<T> | null;
  next: CacheNode<T> | null;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

export interface CacheOptions {
  maxSize?: number;
  ttl: number;
  enableLRU?: boolean;
  enableStats?: boolean;
}

export class UnifiedCache<T = any> {
  private cache = new Map<string, CacheNode<T>>();
  private head: CacheNode<T> | null = null; // Most recently used
  private tail: CacheNode<T> | null = null; // Least recently used
  private readonly maxSize: number;
  public readonly ttl: number;
  private readonly enableLRU: boolean;
  private readonly enableStats: boolean;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(options: CacheOptions) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl;
    this.enableLRU = options.enableLRU ?? true;
    this.enableStats = options.enableStats ?? true;
  }

  private moveToHead(node: CacheNode<T>): void {
    if (node === this.head) return;

    // Remove from current position
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.tail) this.tail = node.prev;

    // Move to head
    node.prev = null;
    node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  private removeTail(): void {
    if (!this.tail) return;

    const key = this.tail.key;
    if (this.tail.prev) {
      this.tail.prev.next = null;
      this.tail = this.tail.prev;
    } else {
      this.head = null;
      this.tail = null;
    }
    this.cache.delete(key);
    if (this.enableStats) this.stats.evictions++;
  }

  get<U = T>(key: string): U | null {
    const node = this.cache.get(key);
    if (!node) {
      if (this.enableStats) this.stats.misses++;
      return null;
    }

    const now = Date.now();
    const age = now - node.entry.timestamp;

    // Check if entry has expired
    if (age >= this.ttl) {
      this.delete(key);
      if (this.enableStats) this.stats.misses++;
      return null;
    }

    // Update access statistics
    if (this.enableStats) {
      node.entry.lastAccessed = now;
      node.entry.hits++;
      this.stats.hits++;
    }

    // Move to head (most recently used) for LRU - O(1)
    if (this.enableLRU) {
      this.moveToHead(node);
    }

    return node.entry.data as unknown as U;
  }

  set(key: string, data: T, customTTL?: number): void {
    const now = Date.now();
    const existingNode = this.cache.get(key);

    // If updating existing key
    if (existingNode) {
      existingNode.entry.data = data;
      existingNode.entry.timestamp = now;
      existingNode.entry.lastAccessed = now;
      if (this.enableLRU) this.moveToHead(existingNode);
      return;
    }

    // If at capacity, evict LRU (tail) - O(1)
    if (this.enableLRU && this.cache.size >= this.maxSize) {
      this.removeTail();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      lastAccessed: now,
      hits: 0,
    };

    const node: CacheNode<T> = {
      key,
      entry,
      prev: null,
      next: this.head,
    };

    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;

    this.cache.set(key, node);

    // Auto-cleanup for custom TTL
    if (customTTL) {
      setTimeout(() => {
        const currentNode = this.cache.get(key);
        if (currentNode && Date.now() - currentNode.entry.timestamp >= customTTL) {
          this.delete(key);
        }
      }, customTTL);
    }
  }

  has(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    const now = Date.now();
    if (now - node.entry.timestamp >= this.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    // Remove from linked list
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.head) this.head = node.next;
    if (node === this.tail) this.tail = node.prev;

    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    if (this.enableStats) this.resetStats();
  }

  get size(): number {
    return this.cache.size;
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

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, node] of this.cache.entries()) {
      if (now - node.entry.timestamp >= this.ttl) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Additional methods for compatibility
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  getEntries(): Array<[string, { age: number; hits: number; size: number }]> {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([key, node]) => [
      key,
      {
        age: now - node.entry.timestamp,
        hits: node.entry.hits,
        size: JSON.stringify(node.entry.data).length,
      },
    ]);
  }

  // Public method to get entry details (fixes private property access)
  getEntryDetails(key: string): { timestamp: number; lastAccessed: number; hits: number } | null {
    const node = this.cache.get(key);
    if (!node) return null;
    return {
      timestamp: node.entry.timestamp,
      lastAccessed: node.entry.lastAccessed,
      hits: node.entry.hits,
    };
  }
}

// Pre-configured cache instances
export const cacheInstances = {
  // API response caches
  prices: new UnifiedCache({ ttl: 5 * 60 * 1000, maxSize: 500 }), // 5 min
  tokens: new UnifiedCache({ ttl: 10 * 60 * 1000, maxSize: 1000 }), // 10 min
  portfolio: new UnifiedCache({ ttl: 5 * 60 * 1000, maxSize: 300 }), // 5 min
  analytics: new UnifiedCache({ ttl: 15 * 60 * 1000, maxSize: 200 }), // 15 min
  apiService: new UnifiedCache({ ttl: 15 * 60 * 1000, maxSize: 200 }), // 15 min - for BaseAssetService

  // External API caches (rate-limited)
  panora: new UnifiedCache({ ttl: 5 * 60 * 1000, maxSize: 200 }), // 5 min
  coingecko: new UnifiedCache({ ttl: 5 * 60 * 1000, maxSize: 200 }), // 5 min
  cmc: new UnifiedCache({ ttl: 5 * 60 * 1000, maxSize: 200 }), // 5 min
  defillama: new UnifiedCache({ ttl: 10 * 60 * 1000, maxSize: 100 }), // 10 min

  // Asset-specific caches
  btc: new UnifiedCache({ ttl: 10 * 60 * 1000, maxSize: 100 }), // 10 min
  stables: new UnifiedCache({ ttl: 10 * 60 * 1000, maxSize: 100 }), // 10 min
  lst: new UnifiedCache({ ttl: 10 * 60 * 1000, maxSize: 100 }), // 10 min
  rwa: new UnifiedCache({ ttl: 15 * 60 * 1000, maxSize: 50 }), // 15 min
  defi: new UnifiedCache({ ttl: 5 * 60 * 1000, maxSize: 200 }), // 5 min
  nft: new UnifiedCache({ ttl: 10 * 60 * 1000, maxSize: 500 }), // 10 min
} as const;

export type CacheInstanceName = keyof typeof cacheInstances;

// Helper functions
export function getCachedData<T>(cacheName: CacheInstanceName, key: string): T | null {
  return cacheInstances[cacheName].get<T>(key);
}

export function setCachedData<T>(
  cacheName: CacheInstanceName,
  key: string,
  data: T,
  customTTL?: number
): void {
  cacheInstances[cacheName].set(key, data, customTTL);
}

export function hasCachedData(cacheName: CacheInstanceName, key: string): boolean {
  return cacheInstances[cacheName].has(key);
}

export function clearCache(cacheName?: CacheInstanceName): void {
  if (cacheName) {
    cacheInstances[cacheName].clear();
  } else {
    Object.values(cacheInstances).forEach((cache) => cache.clear());
  }
}

export function getCacheStats(
  cacheName?: CacheInstanceName
): CacheStats | Record<string, CacheStats> {
  if (cacheName) {
    return cacheInstances[cacheName].getStats();
  }

  const allStats: Record<string, CacheStats> = {};
  for (const [name, cache] of Object.entries(cacheInstances)) {
    allStats[name] = cache.getStats();
  }
  return allStats;
}

// Cache-first patterns
export interface CacheFirstOptions<T> {
  namespace: CacheInstanceName;
  cacheKey: string;
  fetchFn: () => Promise<T>;
  startTime?: number;
  forceRefresh?: boolean;
}

export async function cacheFirst<T>(options: CacheFirstOptions<T>): Promise<{ data: T }> {
  const { namespace, cacheKey, fetchFn, forceRefresh = false } = options;

  // Check cache first unless forcing refresh
  if (!forceRefresh) {
    const cachedData = getCachedData<T>(namespace, cacheKey);
    if (cachedData !== null) {
      return { data: cachedData };
    }
  }

  try {
    // Fetch fresh data
    const freshData = await fetchFn();

    // Cache the result
    setCachedData(namespace, cacheKey, freshData);

    return { data: freshData };
  } catch (error) {
    // Try fallback to stale cache on error
    const cachedData = getCachedData<T>(namespace, cacheKey);
    if (cachedData !== null) {
      logger.info("Fetch error, serving stale cached data as fallback");
      return { data: cachedData };
    }

    throw error;
  }
}

export async function cacheFirstWithFallback<T>(
  options: CacheFirstOptions<T>,
  fallbackData: T
): Promise<{ data: T }> {
  try {
    return await cacheFirst(options);
  } catch (error) {
    logger.error(`Failed to fetch ${options.cacheKey}, using fallback`, {
      error,
    });
    return { data: fallbackData };
  }
}

// Global cleanup scheduler
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

// Auto-start cleanup in production
if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
  startCacheCleanup();
}

// Cleanup on process exit
if (typeof process !== "undefined") {
  process.on("exit", stopCacheCleanup);
  process.on("SIGINT", stopCacheCleanup);
  process.on("SIGTERM", stopCacheCleanup);
}

// Legacy compatibility exports
export const SimpleCache = UnifiedCache;
export const EnhancedLRUCache = UnifiedCache;

// Add missing utility functions for backward compatibility
export function isNearingExpiration(cacheName: CacheInstanceName, key: string): boolean {
  const details = cacheInstances[cacheName].getEntryDetails(key);
  if (!details) return false;

  const age = Date.now() - details.timestamp;
  const ttl = cacheInstances[cacheName].ttl;
  return age > ttl * 0.8; // Consider "nearing" at 80% of TTL
}

export function isStale(cacheName: CacheInstanceName, key: string): boolean {
  return !hasCachedData(cacheName, key);
}

// For backward compatibility with simple-cache.ts pattern
export const coinGeckoCache = cacheInstances.coingecko;
export const cmcCache = cacheInstances.cmc;
export const panoraCache = cacheInstances.panora;
export const portfolioCache = cacheInstances.portfolio;
