// Import existing types from centralized locations

import type { SupplyData, Token } from "@/lib/config/tokens";
import type { Currency } from "@/lib/types/consolidated";
import { logger } from "@/lib/utils/core/logger";

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

// Re-export Token and SupplyData from centralized config
export type { Token, SupplyData };

// BTC-specific supply data interface
export interface BtcSupplyData extends SupplyData {
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

// Performance monitoring interface
export interface PerformanceMetrics {
  renderTime: number;
  dataProcessingTime: number;
  cacheHitRate: number;
}

// Error types for better error handling
export class BTCFormattingError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "BTCFormattingError";
  }
}

export class BTCDataError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "BTCDataError";
  }
}

// Constants for better maintainability
export const BTC_DECIMAL_PLACES = 10; // Increased to accommodate aBTC's 10 decimals
export const DEFAULT_CACHE_SIZE = 2000;
export const PERFORMANCE_THRESHOLD_MS = 50; // Lowered for better performance
export const CACHE_TTL_MS = 300000; // 5 minutes

// Type guards for better type safety
export const isValidMarket = (market: unknown): market is Market => {
  return (
    typeof market === "object" &&
    market !== null &&
    "symbol" in market &&
    "marketAddress" in market &&
    "balance" in market &&
    typeof (market as Market).symbol === "string" &&
    typeof (market as Market).marketAddress === "string" &&
    typeof (market as Market).balance === "string"
  );
};

export const isValidProtocolData = (data: unknown): data is ProtocolData => {
  return (
    typeof data === "object" &&
    data !== null &&
    "protocol" in data &&
    "markets" in data &&
    "total" in data &&
    typeof (data as ProtocolData).protocol === "string" &&
    Array.isArray((data as ProtocolData).markets)
  );
};

// Import performance utilities from dedicated module
export { measurePerformance } from "./performance";
