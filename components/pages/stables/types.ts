import {
  Currency,
  formatPercentage as utilFormatPercentage,
} from '@/lib/utils';

// Enhanced Token supply interface
export interface TokenSupply {
  symbol: string;
  supply: string;
  formatted_supply: string;
  currency?: Currency;
}

// Chart data item for better type safety
export interface ChartDataItem {
  name: string;
  value: number;
  formattedSupply: string;
  _usdValue?: number;
  originalSymbol?: string;
  components?: Array<{ symbol: string; supply: string }>;
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

// Ultra-fast percentage formatting with pre-computed common values
const commonPercentages = new Map([
  [0, '0.0'],
  [100, '100.0'],
  [50, '50.0'],
  [25, '25.0'],
  [75, '75.0'],
  [10, '10.0'],
  [90, '90.0'],
]);

export const formatPercentage = (value: number): string => {
  if (!Number.isFinite(value)) return '0.0';

  // Check common values first for ultra-fast lookup
  const rounded = Math.round(value * 10) / 10;
  if (commonPercentages.has(rounded)) {
    return commonPercentages.get(rounded)!;
  }

  const cacheKey = `pct:${rounded}`;
  const cached = formatCache.get(cacheKey);
  if (cached) return cached;

  const result = utilFormatPercentage(value, { decimals: 1 });
  formatCache.set(cacheKey, result);
  return result;
};

// Optimized USD value formatting with price rounding
export const formatUSDValue = (amount: bigint, susdePrice?: number): string => {
  if (!amount) return '$0';

  const amountNum = Number(amount) / 1_000_000; // Convert from 6 decimals
  let finalAmount = amountNum;

  // Apply sUSDe price multiplier if available
  if (susdePrice && Number.isFinite(susdePrice) && susdePrice > 0) {
    finalAmount = amountNum * susdePrice;
  }

  const cacheKey = `usd:${finalAmount.toFixed(2)}`;
  const cached = formatCache.get(cacheKey);
  if (cached) return cached;

  try {
    let result: string;
    if (finalAmount >= 1_000_000_000) {
      result = `$${(finalAmount / 1_000_000_000).toFixed(1)}b`;
    } else if (finalAmount >= 1_000_000) {
      result = `$${(finalAmount / 1_000_000).toFixed(1)}m`;
    } else if (finalAmount >= 1_000) {
      result = `$${(finalAmount / 1_000).toFixed(1)}k`;
    } else {
      result = `$${finalAmount.toFixed(0)}`;
    }

    formatCache.set(cacheKey, result);
    return result;
  } catch {
    const fallback = '$0';
    formatCache.set(cacheKey, fallback);
    return fallback;
  }
};

// Market share calculation with memoization
const marketShareCache = new Map<string, number>();

export const calculateMarketShare = (
  supply: bigint,
  totalSupply: bigint,
  precision = 2
): number => {
  if (totalSupply === 0n) return 0;

  const cacheKey = `ms:${supply.toString()}:${totalSupply.toString()}:${precision}`;
  if (marketShareCache.has(cacheKey)) {
    return marketShareCache.get(cacheKey)!;
  }

  const percentage = Number((supply * 10000n) / totalSupply) / 100;
  const rounded =
    Math.round(percentage * Math.pow(10, precision)) / Math.pow(10, precision);
  const result = Number.isFinite(rounded) ? rounded : 0;

  marketShareCache.set(cacheKey, result);
  return result;
};

// Batch processing for multiple stablecoin conversions
export const batchFormatStablecoins = (
  items: Array<{ supply: string; symbol: string }>,
  susdePrice?: number
): Array<{ formattedSupply: string; marketShare: number }> => {
  const totalSupply = items.reduce(
    (sum, item) => sum + BigInt(item.supply),
    0n
  );

  return items.map(({ supply, symbol }) => {
    try {
      const supplyBigInt = BigInt(supply);
      const formattedSupply = formatUSDValue(
        supplyBigInt,
        symbol === 'sUSDe' ? susdePrice : undefined
      );
      const marketShare = calculateMarketShare(supplyBigInt, totalSupply);

      return { formattedSupply, marketShare };
    } catch {
      return { formattedSupply: '$0', marketShare: 0 };
    }
  });
};

// Cache management utilities
export const clearFormatCache = (): void => {
  formatCache.clear();
  marketShareCache.clear();
  commonPercentages.clear();
  // Re-populate common percentages
  commonPercentages.set(0, '0.0');
  commonPercentages.set(100, '100.0');
  commonPercentages.set(50, '50.0');
  commonPercentages.set(25, '25.0');
  commonPercentages.set(75, '75.0');
  commonPercentages.set(10, '10.0');
  commonPercentages.set(90, '90.0');
};

export const getFormatCacheSize = (): number => {
  return formatCache.size();
};

export const getCacheStats = () => ({
  formatCacheSize: formatCache.size(),
  marketShareCacheSize: marketShareCache.size,
  commonPercentagesSize: commonPercentages.size,
});

// Performance monitoring
export interface PerformanceMetrics {
  renderTime: number;
  dataProcessingTime: number;
  cacheHitRate: number;
}

// Performance measurement utilities
export const measurePerformance = <T>(fn: () => T, label?: string): T => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  if (label && process.env.NODE_ENV === 'development') {
    console.log(`${label}: ${(end - start).toFixed(2)}ms`);
  }

  return result;
};

// Async performance measurement
export const measureAsync = async <T>(
  fn: () => Promise<T>,
  label?: string
): Promise<T> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  if (label && process.env.NODE_ENV === 'development') {
    console.log(`${label}: ${(end - start).toFixed(2)}ms`);
  }

  return result;
};

// Constants for better maintainability
export const STABLECOIN_DECIMAL_PLACES = 6;
export const DEFAULT_CACHE_SIZE = 2000;
export const PERFORMANCE_THRESHOLD_MS = 50; // Lowered for better performance
export const CACHE_TTL_MS = 300000; // 5 minutes

// Error types for better error handling
export class StablecoinFormattingError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'StablecoinFormattingError';
  }
}

export class StablecoinDataError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'StablecoinDataError';
  }
}

// Memory cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    clearFormatCache();
  });
}

// RWA Financial Data Types
export interface RWAFinancialMetrics {
  marketCap: number;
  circulatingSupply: number;
  totalSupply: number;
  price: number;
  dailyVolume: number;
  weeklyVolume: number;
  monthlyVolume: number;
  quarterlyVolume: number;
  holdingAddresses: number;
  dailyActiveAddresses: number;
  topHolderConcentration: number;
  dailyTransferCount: number;
  weeklyTransferCount: number;
  monthlyTransferCount: number;
  quarterlyTransferCount: number;
  mintCount7d: number;
  burnCount7d: number;
  mintVolume7d: number;
  burnVolume7d: number;
  lastUpdated: string;
}

export interface RWAAssetData {
  name: string;
  symbol: string;
  network: string;
  networkId: number;
  protocol: string;
  contractAddress?: string;
  decimals?: number;
  logoUrl?: string;
  isStablecoin: boolean;
  hasStats: boolean;
  financialMetrics?: RWAFinancialMetrics;
}

export interface RWAApiResponse {
  data: {
    results: RWAAssetData[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  };
  success: boolean;
}

// Formatted display types for UI components
export interface FormattedRWAMetrics {
  totalValueLocked: string;
  marketCap: string;
  dailyVolume: string;
  holdingAddresses: string;
  activeAddresses: string;
  concentration: string;
  dailyTransfers: string;
  weeklyTransfers: string;
  price: string;
  lastUpdated: string;
}

// RWA data processing utilities
export const formatRWAValue = (value: number, decimals = 2): string => {
  if (!value || !Number.isFinite(value)) return '$0';

  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  } else {
    return `$${value.toFixed(decimals)}`;
  }
};

export const formatRWACount = (count: number): string => {
  if (!count || !Number.isFinite(count)) return '0';

  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  } else if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  } else {
    return count.toLocaleString();
  }
};

export const formatRWAPercentage = (percentage: number): string => {
  if (!Number.isFinite(percentage)) return '0.0%';
  return `${percentage.toFixed(1)}%`;
};

export const processRWAMetrics = (
  metrics: RWAFinancialMetrics
): FormattedRWAMetrics => {
  return {
    totalValueLocked: formatRWAValue(
      metrics.marketCap || metrics.circulatingSupply * metrics.price
    ),
    marketCap: formatRWAValue(metrics.marketCap),
    dailyVolume: formatRWAValue(metrics.dailyVolume),
    holdingAddresses: formatRWACount(metrics.holdingAddresses),
    activeAddresses: formatRWACount(metrics.dailyActiveAddresses),
    concentration: formatRWAPercentage(metrics.topHolderConcentration),
    dailyTransfers: formatRWACount(metrics.dailyTransferCount),
    weeklyTransfers: formatRWACount(metrics.weeklyTransferCount),
    price: `$${metrics.price.toFixed(6)}`,
    lastUpdated: new Date(metrics.lastUpdated).toLocaleDateString(),
  };
};

// Error types for RWA data
export class RWADataError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RWADataError';
  }
}

export class RWAApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'RWAApiError';
  }
}
