/**
 * Smart data loader for large JSON files with compression and caching
 */

import { logger } from "./core/logger";

interface DataLoaderCache {
  [key: string]: {
    data: any;
    timestamp: number;
    compressed?: boolean;
  };
}

const cache: DataLoaderCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Compress data using simple JSON string compression
 */
function compressData(data: any): string {
  const jsonString = JSON.stringify(data);
  // Simple compression - in production you might use actual compression libraries
  return jsonString.replace(/\s+/g, " ").trim();
}

/**
 * Decompress data
 */
function decompressData(compressed: string): any {
  return JSON.parse(compressed);
}

/**
 * Load data with smart caching and compression
 */
export async function loadData<T>(
  key: string,
  loader: () => Promise<T> | T,
  options: {
    compress?: boolean;
    ttl?: number;
    fallback?: T;
  } = {}
): Promise<T> {
  const { compress = false, ttl = CACHE_TTL, fallback } = options;

  // Check cache first
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < ttl) {
    logger.debug(`Loading ${key} from cache`);
    if (cached.compressed) {
      return decompressData(cached.data);
    }
    return cached.data;
  }

  try {
    logger.debug(`Loading ${key} from source`);
    const data = await loader();

    // Cache the data
    if (compress && typeof data === "object") {
      cache[key] = {
        data: compressData(data),
        timestamp: Date.now(),
        compressed: true,
      };
    } else {
      cache[key] = {
        data,
        timestamp: Date.now(),
        compressed: false,
      };
    }

    return data;
  } catch (error) {
    logger.error(`Failed to load ${key}:`, error);
    if (fallback) {
      return fallback;
    }
    throw error;
  }
}

/**
 * Lazy load data only when needed (client-side)
 */
export function createLazyLoader<T>(
  key: string,
  loader: () => Promise<T>,
  options: Parameters<typeof loadData>[2] = {}
) {
  let loadPromise: Promise<T> | null = null;

  return {
    async load(): Promise<T> {
      if (!loadPromise) {
        loadPromise = loadData(key, loader, options) as Promise<T>;
      }
      return loadPromise;
    },

    reset() {
      loadPromise = null;
      delete cache[key];
    },

    get isLoaded() {
      return !!loadPromise;
    },
  };
}

/**
 * Batch load multiple data sources
 */
export async function batchLoad<T extends Record<string, any>>(
  loaders: {
    [K in keyof T]: () => Promise<T[K]> | T[K];
  },
  options: Parameters<typeof loadData>[2] = {}
): Promise<T> {
  const keys = Object.keys(loaders) as Array<keyof T>;
  const loadPromises = keys.map((key) => loadData(String(key), loaders[key], options));

  try {
    const results = await Promise.allSettled(loadPromises);
    const data = {} as T;

    results.forEach((result, index) => {
      const key = keys[index];
      if (result.status === "fulfilled") {
        data[key] = result.value as T[typeof key];
      } else {
        logger.warn(`Failed to load ${String(key)}:`, result.reason);
        // Set to undefined or default value
        data[key] = undefined as any;
      }
    });

    return data;
  } catch (error) {
    logger.error("Batch load failed:", error);
    throw error;
  }
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  Object.keys(cache).forEach((key) => delete cache[key]);
  logger.info("Data loader cache cleared");
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const stats = {
    totalItems: Object.keys(cache).length,
    totalSize: 0,
    compressedItems: 0,
    items: [] as Array<{ key: string; size: number; age: number; compressed: boolean }>,
  };

  const now = Date.now();

  Object.entries(cache).forEach(([key, value]) => {
    const size = JSON.stringify(value.data).length;
    stats.totalSize += size;
    if (value.compressed) {
      stats.compressedItems++;
    }

    stats.items.push({
      key,
      size,
      age: now - value.timestamp,
      compressed: !!value.compressed,
    });
  });

  return stats;
}
