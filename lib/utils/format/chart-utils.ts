import { logger } from "@/lib/utils/core/logger";

// Enhanced chart data interface for all asset types
export interface ChartDataItem {
  name: string;
  value: number;
  formattedSupply: string;
  _usdValue?: number;
  _btcValue?: number;
  originalSymbol?: string;
  components?: Array<{
    symbol: string;
    supply: string;
    supply_raw: string;
    formattedSupply: string;
  }>;
  color?: string;
  provider?: string;
}

// Performance-optimized cache with LRU eviction
class LRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 1000, ttlMs = 60000) {
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
const formatCache = new LRUCache<string>(2000, 300000); // 5 min TTL
const marketShareCache = new Map<string, number>();

// Ultra-fast percentage formatting
export const formatPercentage = (value: number): string => {
  if (!Number.isFinite(value)) return "0.0";
  return value >= 0.1 ? value.toFixed(1) : value.toFixed(2);
};

// Generic value formatting for different asset types
export const formatAssetValue = (
  value: number,
  assetType: "USD" | "BTC",
  options: { decimals?: number; prefix?: string } = {}
): string => {
  if (!value || !Number.isFinite(value)) return assetType === "BTC" ? "0 BTC" : "$0";

  const { decimals = assetType === "BTC" ? 8 : 2, prefix = "" } = options;
  const cacheKey = `${assetType}:${value}:${decimals}:${prefix}`;
  const cached = formatCache.get(cacheKey);
  if (cached) return cached;

  try {
    let result: string;
    
    if (assetType === "BTC") {
      if (value >= 1000) {
        result = `${prefix}${(value / 1000).toFixed(1)}k BTC`;
      } else if (value >= 1) {
        result = `${prefix}${value.toFixed(decimals)} BTC`;
      } else {
        result = `${prefix}${value.toFixed(decimals)} BTC`;
      }
    } else {
      // USD formatting
      if (value >= 1_000_000_000) {
        result = `${prefix}$${(value / 1_000_000_000).toFixed(1)}B`;
      } else if (value >= 1_000_000) {
        result = `${prefix}$${(value / 1_000_000).toFixed(1)}M`;
      } else if (value >= 1_000) {
        result = `${prefix}$${(value / 1_000).toFixed(decimals === 0 ? 0 : 1)}K`;
      } else {
        result = `${prefix}$${value.toFixed(decimals)}`;
      }
    }

    formatCache.set(cacheKey, result);
    return result;
  } catch {
    const fallback = assetType === "BTC" ? "0 BTC" : "$0";
    formatCache.set(cacheKey, fallback);
    return fallback;
  }
};

// Market share calculation with memoization
export const calculateMarketShare = (
  supply: number | bigint,
  totalSupply: number | bigint | Array<{ btcValue?: number; usdValue?: number }>,
  precision = 2,
): number => {
  // Handle array case (for complex calculations)
  if (Array.isArray(totalSupply)) {
    const total = totalSupply.reduce((sum, item) => {
      return sum + (item.btcValue || item.usdValue || 0);
    }, 0);
    if (total === 0) return 0;
    return Number(supply) / total * 100;
  }

  // Handle bigint case
  if (typeof supply === 'bigint' && typeof totalSupply === 'bigint') {
    if (totalSupply === 0n) return 0;
    const cacheKey = `ms:${supply.toString()}:${totalSupply.toString()}:${precision}`;
    if (marketShareCache.has(cacheKey)) {
      return marketShareCache.get(cacheKey)!;
    }
    const percentage = Number((supply * 10000n) / totalSupply) / 100;
    const rounded = Math.round(percentage * Math.pow(10, precision)) / Math.pow(10, precision);
    const result = Number.isFinite(rounded) ? rounded : 0;
    marketShareCache.set(cacheKey, result);
    return result;
  }

  // Handle number case
  const numSupply = Number(supply);
  const numTotal = Number(totalSupply);
  if (numTotal === 0) return 0;
  return (numSupply / numTotal) * 100;
};

// Group small items into "Other" category for cleaner charts
export const groupSmallItems = <T extends ChartDataItem>(
  items: T[],
  threshold = 1.0,
  otherColor = "hsl(240 5% 45%)"
): T[] => {
  const result: T[] = [];
  const otherItems: T[] = [];

  for (const item of items) {
    if (item.value >= threshold) {
      result.push(item);
    } else {
      otherItems.push(item);
    }
  }

  // Add "Other" category if we have small items
  if (otherItems.length > 0) {
    const otherValue = otherItems.reduce((sum, item) => sum + item.value, 0);
    const otherUsdValue = otherItems.reduce((sum, item) => sum + (item._usdValue || 0), 0);
    const otherBtcValue = otherItems.reduce((sum, item) => sum + (item._btcValue || 0), 0);

    result.push({
      name: "Other",
      originalSymbol: "Other",
      value: otherValue,
      formattedSupply: otherUsdValue > 0 
        ? formatAssetValue(otherUsdValue, "USD")
        : formatAssetValue(otherBtcValue, "BTC"),
      _usdValue: otherUsdValue || undefined,
      _btcValue: otherBtcValue || undefined,
      color: otherColor,
    } as T);
  }

  return result;
};

// Performance measurement utilities
export const measurePerformance = <T>(fn: () => T, label?: string): T => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  if (label && process.env.NODE_ENV === "development") {
    logger.debug(`${label}: ${(end - start).toFixed(2)}ms`);
  }

  return result;
};

// Async performance measurement
export const measureAsync = async <T>(
  fn: () => Promise<T>,
  label?: string,
): Promise<T> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  if (label && process.env.NODE_ENV === "development") {
    logger.debug(`${label}: ${(end - start).toFixed(2)}ms`);
  }

  return result;
};

// Chart configuration constants
export const CHART_DIMENSIONS = {
  mobile: { innerRadius: "54%", outerRadius: "95%" },
  desktop: { innerRadius: "63%", outerRadius: "99%" },
} as const;

// Cache management utilities
export const clearFormatCache = (): void => {
  formatCache.clear();
  marketShareCache.clear();
};

export const getFormatCacheSize = (): number => {
  return formatCache.size();
};

export const getChartCacheStats = () => ({
  formatCacheSize: formatCache.size(),
  marketShareCacheSize: marketShareCache.size,
});

// Error types for better error handling
export class ChartFormattingError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ChartFormattingError";
  }
}

export class ChartDataError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ChartDataError";
  }
}

// Memory cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    clearFormatCache();
  });
}

// Function to darken a hex color based on ranking
export const darkenColor = (hexColor: string, darkenFactor: number): string => {
  const color = hexColor.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  const newR = Math.round(r * (1 - darkenFactor));
  const newG = Math.round(g * (1 - darkenFactor));
  const newB = Math.round(b * (1 - darkenFactor));

  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

// Constants for better maintainability
export const DEFAULT_CACHE_SIZE = 2000;
export const PERFORMANCE_THRESHOLD_MS = 50;
export const CACHE_TTL_MS = 300000; // 5 minutes
export const DEFAULT_GROUP_THRESHOLD = 1.0; // Group items under 1%