import { Currency } from "@/lib/utils";

// Enhanced Market interface with better typing
export interface LSTMarket {
  symbol: string;
  name: string;
  protocol: string;
  address: string;
  balance: string;
  rawBalance: string;
  decimals: number;
  apy?: number;
  totalSupply?: number;
  totalSupplyUsd?: number;
  tvlUsd?: number;
  price?: number;
  currency?: Currency;
}

// Enhanced Protocol data with better structure
export interface LSTProtocolData {
  protocol: string;
  markets: LSTMarket[];
  total: {
    apt: string;
    normalized: string;
    tvlUsd?: number;
  };
  meta: {
    timestamp: string;
    responseTimeMs: number;
  };
}

// Enhanced Token supply interface
export interface LSTTokenSupply {
  symbol: string;
  name: string;
  protocol: string;
  supply: string;
  formatted_supply: string;
  apy?: number;
  currency?: Currency;
}

// Enhanced LST supply data
export interface LSTSupplyData {
  supplies: LSTTokenSupply[];
  total: string;
  total_formatted: string;
  total_decimals: number;
}

// Chart data item for better type safety
export interface LSTChartDataItem {
  name: string;
  value: number;
  formattedSupply: string;
  _aptValue: number;
  _usdValue?: number;
  originalSymbol?: string;
  protocol?: string;
  apy?: number;
}

// Performance monitoring interface
export interface LSTPerformanceMetrics {
  renderTime: number;
  dataProcessingTime: number;
  cacheHitRate: number;
}

// Error types for better error handling
export class LSTFormattingError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "LSTFormattingError";
  }
}

export class LSTDataError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "LSTDataError";
  }
}

// Constants for better maintainability
export const LST_DECIMAL_PLACES = 8;
export const DEFAULT_CACHE_SIZE = 2000;
export const PERFORMANCE_THRESHOLD_MS = 50;
export const CACHE_TTL_MS = 300000; // 5 minutes

// Type guards for better type safety
export const isValidLSTMarket = (market: unknown): market is LSTMarket => {
  return (
    typeof market === "object" &&
    market !== null &&
    "symbol" in market &&
    "address" in market &&
    "balance" in market &&
    typeof (market as LSTMarket).symbol === "string" &&
    typeof (market as LSTMarket).address === "string" &&
    typeof (market as LSTMarket).balance === "string"
  );
};

export const isValidLSTProtocolData = (
  data: unknown,
): data is LSTProtocolData => {
  return (
    typeof data === "object" &&
    data !== null &&
    "protocol" in data &&
    "markets" in data &&
    "total" in data &&
    typeof (data as LSTProtocolData).protocol === "string" &&
    Array.isArray((data as LSTProtocolData).markets)
  );
};
