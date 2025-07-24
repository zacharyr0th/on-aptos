// Shared types for asset services

export interface AssetSupply {
  asset: string;
  name: string;
  symbol: string;
  supply: number;
  decimals: number;
  type: 'coin' | 'fa' | 'combined';
  icon?: string;
  metadata?: Record<string, any>;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  icon?: string;
}

export interface SupplyResponse<T = AssetSupply> {
  success: boolean;
  data?: T[];
  error?: string;
  timestamp?: string;
}

// Bitcoin specific types
export interface BTCSupply {
  total: number;
  totalRaw?: number;
  sources: Array<{
    protocol: string;
    amount: number;
    rawAmount?: number;
    decimals?: number;
    formattedAmount?: number;
    displayAmount: string;
    percentage: number;
  }>;
}

export interface FarmingAPR {
  protocol: string;
  apr: number;
  tvl?: number;
}

export interface BTCAnalytics {
  totalSupply: BTCSupply;
  farmingAPRs: FarmingAPR[];
  timestamp: string;
}

// Liquid Staking specific types
export interface LSTToken extends AssetSupply {
  protocol: string;
  underlyingAsset: string;
  exchangeRate?: number;
}

export interface LSTSupply {
  tokens: LSTToken[];
  totalValueLocked: number;
  timestamp: string;
}

// Stablecoin specific types
export interface StablecoinSupply extends AssetSupply {
  issuer: string;
  peggedTo: string;
  isAlgorithmic: boolean;
  collateralRatio?: number;
}

// RWA specific types
export interface RWAAsset extends AssetSupply {
  assetClass: string;
  issuer: string;
  underlyingAsset: string;
  legalStructure?: string;
  jurisdiction?: string;
}

// Service configuration
export interface ServiceConfig {
  cacheEnabled: boolean;
  cacheTTL: number;
  fallbackEnabled: boolean;
  retryAttempts: number;
  timeout: number;
}

// API Response types
export interface PriceData {
  price: number;
  change24h?: number;
  marketCap?: number;
  volume24h?: number;
}

export interface TokenMetrics {
  supply: number;
  price?: PriceData;
  holders?: number;
  transactions24h?: number;
}
