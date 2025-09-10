import type { Currency } from "@/lib/types/consolidated";

// Stablecoin Token interface
export interface StableToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  price?: number;
  currency?: Currency;
  issuer?: string;
  type?: string;
}

// Stablecoin Supply data
export interface StableSupplyData {
  supplies: StableTokenSupply[];
  total: string;
  total_formatted: string;
  total_decimals: number;
}

// Stablecoin Token supply interface
export interface StableTokenSupply {
  symbol: string;
  name: string;
  issuer: string;
  supply: string;
  formatted_supply: string;
  currency?: Currency;
}

// Chart data item for Stablecoins
export interface StableChartDataItem {
  name: string;
  value: number;
  formattedSupply: string;
  _usdValue: number;
  originalSymbol?: string;
  issuer?: string;
}

// Constants
export const STABLE_DECIMAL_PLACES = 6;
export const DEFAULT_CACHE_SIZE = 2000;
export const CACHE_TTL_MS = 300000; // 5 minutes
