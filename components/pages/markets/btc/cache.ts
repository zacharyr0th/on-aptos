import { CACHE_TTL_MS, DEFAULT_CACHE_SIZE } from "./types";

// Generic LRU cache implementation for BTC components
export class LRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = DEFAULT_CACHE_SIZE, ttlMs = CACHE_TTL_MS) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // Check TTL
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key: string, value: T): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Optimized format cache with LRU eviction
export const formatCache = new LRUCache<string>(2000, 300000); // 5 min TTL

// Cache management utilities
export const getFormatCacheSize = (): number => {
  return formatCache.size();
};
