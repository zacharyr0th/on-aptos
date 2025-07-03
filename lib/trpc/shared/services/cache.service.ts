import NodeCache from 'node-cache';

/**
 * Cache Service
 * Provides centralized caching functionality for all tRPC endpoints
 */

// Create a singleton cache instance
const cache = new NodeCache({
  stdTTL: 300, // Default TTL: 5 minutes
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // For better performance with large objects
});

export interface CacheResult<T> {
  data: T;
  cached: boolean;
}

export class CacheService {
  /**
   * Get cached data or fetch from source
   */
  static async getCachedOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<CacheResult<T>> {
    // Check if we have cached data
    const cachedData = cache.get<T>(key);
    if (cachedData !== undefined) {
      return { data: cachedData, cached: true };
    }

    // Fetch fresh data
    try {
      const freshData = await fetchFn();

      // Cache the fresh data
      cache.set(key, freshData, ttl);

      return { data: freshData, cached: false };
    } catch (error) {
      // If there's an error and we have stale data, return it
      const staleData = cache.get<T>(key);
      if (staleData !== undefined) {
        return { data: staleData, cached: true };
      }

      // Otherwise, propagate the error
      throw error;
    }
  }

  /**
   * Invalidate cache by key or pattern
   */
  static invalidate(keyOrPattern: string | RegExp): number {
    if (typeof keyOrPattern === 'string') {
      return cache.del(keyOrPattern) ? 1 : 0;
    }

    // For RegExp, find all matching keys
    const keys = cache.keys();
    const matchingKeys = keys.filter((key: string) => keyOrPattern.test(key));

    return cache.del(matchingKeys);
  }

  /**
   * Clear all cache
   */
  static clearAll(): void {
    cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    return cache.getStats();
  }

  /**
   * Check if a key exists in cache
   */
  static has(key: string): boolean {
    return cache.has(key);
  }

  /**
   * Get remaining TTL for a key
   */
  static getTTL(key: string): number | undefined {
    return cache.getTtl(key);
  }

  /**
   * Set cache data directly
   */
  static set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl !== undefined) {
      return cache.set(key, value, ttl);
    }
    return cache.set(key, value);
  }

  /**
   * Get cache data directly
   */
  static get<T>(key: string): T | undefined {
    return cache.get<T>(key);
  }
}

// Export cache key generators for consistency
export const CacheKeys = {
  // Bitcoin
  btcSupplies: (forceRefresh = false) => `btc:supplies:${forceRefresh}`,
  btcPrice: () => 'btc:price',

  // Stablecoins
  stablecoinSupplies: (forceRefresh = false) =>
    `stables:supplies:${forceRefresh}`,
  stablecoinMetrics: () => 'stables:metrics',

  // Liquid Staking
  lstSupplies: (forceRefresh = false) => `lst:supplies:${forceRefresh}`,
  lstMetrics: () => 'lst:metrics',

  // Prices
  cmcPrice: (symbol: string) => `price:cmc:${symbol}`,
  panoraPrice: (token: string) => `price:panora:${token}`,

  // DeFi
  defiTVL: () => 'defi:tvl',
  defiVolume: () => 'defi:volume',
  protocolMetrics: (protocol: string) => `defi:protocol:${protocol}`,

  // Aptos
  aptosStats: () => 'aptos:stats',
  aptosGas: () => 'aptos:gas',
};
