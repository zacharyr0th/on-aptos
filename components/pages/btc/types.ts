import {
  Currency,
  formatAmount,
  formatCurrency,
  formatNumber,
  formatPercentage as utilFormatPercentage,
  convertRawTokenAmount,
} from '@/lib/utils';

// Re-export utilities for backwards compatibility
export {
  formatAmount,
  formatCurrency,
  formatNumber,
  convertRawTokenAmount,
} from '@/lib/utils';

// Enhanced Market interface with better typing
export interface Market {
  symbol: string;
  marketAddress: string;
  assetType: string;
  description: string;
  balance: string;
  rawBalance: string;
  decimals: number;
  apyBase?: number;
  apyReward?: number;
  apyBaseBorrow?: number;
  totalSupply?: number;
  totalBorrow?: number;
  totalSupplyUsd?: number;
  totalBorrowUsd?: number;
  tvlUsd?: number;
  price?: number;
  currency?: Currency;
}

// Enhanced Protocol data with better structure
export interface ProtocolData {
  protocol: string;
  markets: Market[];
  total: {
    btc: string;
    normalized: string;
    tvlUsd?: number;
  };
  meta: {
    timestamp: string;
    responseTimeMs: number;
  };
}

// Enhanced Token supply interface
export interface TokenSupply {
  symbol: string;
  supply: string;
  formatted_supply: string;
  currency?: Currency;
}

// Enhanced BTC supply data
export interface BtcSupplyData {
  supplies: TokenSupply[];
  total: string;
  total_formatted: string;
  total_decimals: number;
}

// Chart data item for better type safety
export interface ChartDataItem {
  name: string;
  value: number;
  formattedSupply: string;
  _btcValue: number;
  _usdValue?: number;
  originalSymbol?: string;
  protocol?: string;
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

// Memoized formatting functions with optimized cache keys
export const formatBTCAmount = (value: number): string => {
  if (!Number.isFinite(value)) return '0';

  const cacheKey = `btc:${value.toFixed(0)}`;
  const cached = formatCache.get(cacheKey);
  if (cached) return cached;

  const result = formatAmount(value, 'BTC', { decimals: 0 });
  formatCache.set(cacheKey, result);
  return result;
};

export const formatBTCAmountWithCommas = (btcValue: number): string => {
  if (!Number.isFinite(btcValue)) return '0';

  const cacheKey = `btc-commas:${Math.round(btcValue)}`;
  const cached = formatCache.get(cacheKey);
  if (cached) return cached;

  const result = formatNumber(btcValue, {
    decimals: 0,
    useGrouping: true,
  });
  formatCache.set(cacheKey, result);
  return result;
};

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
  if (!Number.isFinite(value)) return '0.00';

  // Check common values first for ultra-fast lookup
  const rounded = Math.round(value * 100) / 100;
  if (commonPercentages.has(rounded)) {
    return commonPercentages.get(rounded)!;
  }

  const cacheKey = `pct:${rounded}`;
  const cached = formatCache.get(cacheKey);
  if (cached) return cached;

  const result = utilFormatPercentage(value, { decimals: 2 });
  formatCache.set(cacheKey, result);
  return result;
};

// Optimized BTC supply formatting with fast path for common decimals
export const formatBTCSupply = (
  supply: string,
  decimals: number = 8
): string => {
  if (!supply || typeof supply !== 'string') return '0';

  const cacheKey = `supply:${supply}:${decimals}`;
  const cached = formatCache.get(cacheKey);
  if (cached) return cached;

  try {
    const btcAmount = convertRawTokenAmount(supply, decimals);
    if (!Number.isFinite(btcAmount)) throw new Error('Invalid BTC amount');

    const result = formatNumber(btcAmount, {
      decimals: 0,
      useGrouping: true,
    });
    formatCache.set(cacheKey, result);
    return result;
  } catch {
    const fallback = '0.' + '0'.repeat(Math.min(decimals, 8));
    formatCache.set(cacheKey, fallback);
    return fallback;
  }
};

// Optimized USD value formatting with price rounding
export const formatBTCUsdValue = (
  btcAmount: number,
  bitcoinPrice: number
): string => {
  if (!Number.isFinite(btcAmount) || !Number.isFinite(bitcoinPrice))
    return '$0';

  // Round price to nearest dollar for better cache hits
  const roundedPrice = Math.round(bitcoinPrice);
  const cacheKey = `usd:${btcAmount.toFixed(4)}:${roundedPrice}`;
  const cached = formatCache.get(cacheKey);
  if (cached) return cached;

  try {
    const usdValue = btcAmount * bitcoinPrice;
    const result = formatCurrency(usdValue, 'USD', { compact: true });
    formatCache.set(cacheKey, result);
    return result;
  } catch {
    const fallback = '$0';
    formatCache.set(cacheKey, fallback);
    return fallback;
  }
};

// Batch processing for multiple BTC conversions
export const batchConvertBTCAmounts = (
  items: Array<{ supply: string; decimals: number }>,
  bitcoinPrice?: number
): Array<{ btcValue: number; usdValue?: number; formatted: string }> => {
  return items.map(({ supply, decimals }) => {
    try {
      const btcValue = convertRawTokenAmount(supply, decimals);
      const formatted = formatBTCAmount(btcValue);
      const usdValue = bitcoinPrice ? btcValue * bitcoinPrice : undefined;

      return { btcValue, usdValue, formatted };
    } catch {
      return { btcValue: 0, formatted: '0 BTC' };
    }
  });
};

// Market share calculation with memoization
const marketShareCache = new Map<string, number>();

// Calculate market shares for all tokens that always sum to 100%
export const calculateAllMarketShares = (
  tokens: Array<{ btcValue: number; symbol?: string }>
): Map<string, number> => {
  const result = new Map<string, number>();

  if (!tokens.length) return result;

  const totalBtc = tokens.reduce((sum, token) => {
    const value = Number.isFinite(token.btcValue) ? token.btcValue : 0;
    return sum + value;
  }, 0);

  if (totalBtc === 0) {
    tokens.forEach((token, index) => {
      result.set(token.symbol || index.toString(), 0);
    });
    return result;
  }

  // Calculate exact percentages first
  const exactPercentages = tokens.map(
    token => (token.btcValue / totalBtc) * 100
  );

  // Round to whole numbers
  const roundedPercentages = exactPercentages.map(p => Math.round(p));

  // Calculate the difference from 100%
  const sum = roundedPercentages.reduce((a, b) => a + b, 0);
  const diff = 100 - sum;

  // Distribute the difference to the tokens with the largest rounding errors
  if (diff !== 0) {
    const errors = exactPercentages.map((exact, i) => ({
      index: i,
      error: exact - roundedPercentages[i],
    }));

    // Sort by error magnitude (descending for positive diff, ascending for negative)
    errors.sort((a, b) => (diff > 0 ? b.error - a.error : a.error - b.error));

    // Adjust the percentages
    for (let i = 0; i < Math.abs(diff); i++) {
      const index = errors[i % errors.length].index;
      roundedPercentages[index] += diff > 0 ? 1 : -1;
    }
  }

  // Store results
  tokens.forEach((token, index) => {
    result.set(token.symbol || index.toString(), roundedPercentages[index]);
  });

  return result;
};

export const calculateMarketShare = (
  btcValue: number,
  allTokens: Array<{ btcValue: number }>,
  precision = 2 // Back to 2 decimal places
): number => {
  if (!Number.isFinite(btcValue) || btcValue < 0) return 0;

  const totalBtc = allTokens.reduce((sum, token) => {
    const value = Number.isFinite(token.btcValue) ? token.btcValue : 0;
    return sum + value;
  }, 0);

  if (totalBtc === 0) return 0;

  const percentage = (btcValue / totalBtc) * 100;
  const rounded =
    Math.round(percentage * Math.pow(10, precision)) / Math.pow(10, precision);
  const result = Number.isFinite(rounded) ? rounded : 0;

  return result;
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

// Type guards for better type safety (optimized)
export const isValidMarket = (market: unknown): market is Market => {
  return (
    typeof market === 'object' &&
    market !== null &&
    'symbol' in market &&
    'marketAddress' in market &&
    'balance' in market &&
    typeof (market as Market).symbol === 'string' &&
    typeof (market as Market).marketAddress === 'string' &&
    typeof (market as Market).balance === 'string'
  );
};

export const isValidProtocolData = (data: unknown): data is ProtocolData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'protocol' in data &&
    'markets' in data &&
    'total' in data &&
    typeof (data as ProtocolData).protocol === 'string' &&
    Array.isArray((data as ProtocolData).markets)
  );
};

// Constants for better maintainability
export const BTC_DECIMAL_PLACES = 10; // Increased to accommodate aBTC's 10 decimals
export const DEFAULT_CACHE_SIZE = 2000;
export const PERFORMANCE_THRESHOLD_MS = 50; // Lowered for better performance
export const CACHE_TTL_MS = 300000; // 5 minutes

// Error types for better error handling
export class BTCFormattingError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BTCFormattingError';
  }
}

export class BTCDataError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'BTCDataError';
  }
}

// Memory cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    clearFormatCache();
  });
}
