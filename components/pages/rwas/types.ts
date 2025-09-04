import type { Currency } from "@/lib/types/consolidated";

// RWA Token interface
export interface RWAToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  price?: number;
  currency?: Currency;
  provider?: string;
  type?: string;
}

// RWA Supply data
export interface RWASupplyData {
  supplies: RWATokenSupply[];
  total: string;
  total_formatted: string;
  total_decimals: number;
}

// RWA Token supply interface
export interface RWATokenSupply {
  symbol: string;
  name: string;
  provider: string;
  supply: string;
  formatted_supply: string;
  currency?: Currency;
}

// Chart data item for RWAs
export interface RWAChartDataItem {
  name: string;
  value: number;
  formattedSupply: string;
  _usdValue: number;
  originalSymbol?: string;
  provider?: string;
}

// Constants
export const RWA_DECIMAL_PLACES = 6;
export const DEFAULT_CACHE_SIZE = 2000;
export const CACHE_TTL_MS = 300000; // 5 minutes