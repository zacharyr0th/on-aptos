/**
 * Simple cache for rate-limited external APIs only
 * Most caching is handled by TanStack Query on the client
 */

import { errorLogger } from "@/lib/utils/core/logger";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Type definitions for backward compatibility
export type CacheInstanceName =
  | "btc"
  | "lst"
  | "stables"
  | "defi"
  | "cmc"
  | "panorama"
  | "portfolio";

export interface CacheFirstOptions<T> {
  namespace: CacheInstanceName;
  cacheKey: string;
  fetchFn: () => Promise<T>;
  startTime?: number;
  forceRefresh?: boolean;
  apiCallCount?: number;
}

export class SimpleCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();

  constructor(private ttl: number) {}

  get<U = T>(key: string): U | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as unknown as U;
  }

  set(key: string, data: T, customTTL?: number): void {
    const ttl = customTTL || this.ttl;
    this.cache.set(key, { data, timestamp: Date.now() });

    // Auto-cleanup expired entries after custom TTL
    if (customTTL) {
      setTimeout(() => {
        const entry = this.cache.get(key);
        if (entry && Date.now() - entry.timestamp >= ttl) {
          this.cache.delete(key);
        }
      }, ttl);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// Pre-configured caches for specific rate-limited APIs
export const coinGeckoCache = new SimpleCache(5 * 60 * 1000); // 5 minutes
export const cmcCache = new SimpleCache(5 * 60 * 1000); // 5 minutes
export const panoraCache = new SimpleCache(5 * 60 * 1000); // 5 minutes (increased from 1 minute)
export const portfolioCache = new SimpleCache(5 * 60 * 1000); // 5 minutes for processed portfolio data

// Helper functions for backward compatibility
export function getCachedData<T>(cache: SimpleCache, key: string): T | null {
  return cache.get<T>(key);
}

export function setCachedData<T>(
  cache: SimpleCache,
  key: string,
  data: T,
  ttl?: number,
): void {
  cache.set(key, data, ttl);
}

// Simple cache-first pattern for rate-limited APIs
export async function cacheFirst<T>(
  cache: SimpleCache,
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number,
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const fresh = await fetchFn();
  cache.set(key, fresh, ttl);
  return fresh;
}

// Cache-first with fallback for error handling
export async function cacheFirstWithFallback<T>(
  options: CacheFirstOptions<T>,
  fallbackData: T,
): Promise<{ data: T }> {
  // Determine which cache to use based on namespace
  let cache: SimpleCache;
  switch (options.namespace) {
    case "cmc":
      cache = cmcCache;
      break;
    case "panorama":
      cache = panoraCache;
      break;
    case "portfolio":
      cache = portfolioCache;
      break;
    case "btc":
    case "lst":
    case "stables":
    case "defi":
    default:
      // Use a general 5-minute cache for others
      cache = cmcCache;
  }

  if (!options.forceRefresh) {
    const cached = cache.get<T>(options.cacheKey);
    if (cached !== null) {
      return { data: cached };
    }
  }

  try {
    const fresh = await options.fetchFn();
    cache.set(options.cacheKey, fresh);
    return { data: fresh };
  } catch (error) {
    errorLogger.error(
      { error },
      `Cache fetch error for ${options.namespace}:${options.cacheKey}:`,
    );
    // Try to return stale cached data if available
    const stale = cache.get<T>(options.cacheKey);
    if (stale !== null) {
      return { data: stale };
    }
    return { data: fallbackData };
  }
}
