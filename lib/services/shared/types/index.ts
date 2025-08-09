// Shared types for asset services

export interface AssetSupply {
  asset: string;
  name: string;
  symbol: string;
  supply: string; // Changed to string to match usage
  decimals: number;
  type: "coin" | "fa" | "combined";
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
  supply_raw: string;
  asset_type: string;
  percentage?: number;
}

export interface StablecoinData {
  supplies: StablecoinSupply[];
  total: string;
  total_raw: string;
  usdt_reserve?: any; // Based on usage in the service
}

export interface BridgedCoinConfig {
  symbol: string;
  name: string;
  asset_type: string;
  account: string;
  decimals: number;
}

export interface FungibleAssetMetadata {
  asset_type: string;
  creator_address: string;
  name: string;
  symbol: string;
  decimals: number;
  icon_uri?: string;
  project_uri?: string;
  supply_v2?: {
    vec: string[];
  };
}

export interface CurrentFungibleAssetBalance {
  owner_address: string;
  asset_type: string;
  amount: string;
  is_frozen: boolean;
}

export interface StablecoinGraphQLResponse {
  current_fungible_asset_balances: CurrentFungibleAssetBalance[];
  fungible_asset_metadata: FungibleAssetMetadata[];
}

export interface CoinBalanceResponse {
  data?: {
    coin_balances: Array<{
      coin_type: string;
      amount: string;
    }>;
  };
  current_coin_balances?: Array<{
    coin_type: string;
    amount: string;
    owner_address: string;
  }>;
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
