import type { Currency } from "@/lib/types/consolidated";

// Base token interface for all asset types
export interface BaseToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  price?: number;
  currency?: Currency;
}

// Enhanced token with supply information
export interface TokenWithSupply extends BaseToken {
  supply: string;
  formatted_supply: string;
  totalSupply?: number;
  totalSupplyUsd?: number;
}

// Market data for DeFi protocols
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

// Protocol data structure
export interface ProtocolData<TMarket = Market> {
  protocol: string;
  markets: TMarket[];
  total: {
    value: string;
    normalized: string;
    tvlUsd?: number;
  };
  meta: {
    timestamp: string;
    responseTimeMs: number;
  };
}

// Supply data structure
export interface SupplyData {
  supplies: TokenWithSupply[];
  total: string;
  total_formatted: string;
  total_decimals: number;
}

// Chart data item for visualization
export interface ChartDataItem {
  name: string;
  value: number;
  formattedSupply: string;
  _rawValue: number;
  _usdValue?: number;
  originalSymbol?: string;
  protocol?: string;
  apy?: number;
}

// Performance monitoring interface
export interface PerformanceMetrics {
  renderTime: number;
  dataProcessingTime: number;
  cacheHitRate: number;
}

// Common error types
export class AssetFormattingError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AssetFormattingError";
  }
}

export class AssetDataError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AssetDataError";
  }
}

// Common constants
export const DEFAULT_CACHE_SIZE = 2000;
export const PERFORMANCE_THRESHOLD_MS = 50;
// CACHE_TTL_MS moved to constants.ts to avoid export conflicts

// Type guards for better type safety
export const isValidToken = (token: unknown): token is BaseToken => {
  return (
    typeof token === "object" &&
    token !== null &&
    "symbol" in token &&
    "address" in token &&
    "decimals" in token &&
    typeof (token as BaseToken).symbol === "string" &&
    typeof (token as BaseToken).address === "string" &&
    typeof (token as BaseToken).decimals === "number"
  );
};

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

export const isValidProtocolData = <T = Market>(
  data: unknown,
): data is ProtocolData<T> => {
  return (
    typeof data === "object" &&
    data !== null &&
    "protocol" in data &&
    "markets" in data &&
    "total" in data &&
    typeof (data as ProtocolData<T>).protocol === "string" &&
    Array.isArray((data as ProtocolData<T>).markets)
  );
};
