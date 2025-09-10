// Re-export common types from consolidated
import type { FungibleAsset, NFT, TokenMetadata, Transaction } from "@/lib/types/consolidated";
import type { AssetPrice } from "../shared";

export type { FungibleAsset, NFT, TokenMetadata, Transaction };
export type { DeFiPosition } from "@/lib/types/defi";
export type { AssetPrice };

export interface PortfolioHistoryPoint {
  date: string;
  totalValue: number;
  assets: {
    assetType: string;
    symbol: string;
    balance: number;
    value: number;
    price: number;
  }[];
}

// AssetPrice is now exported from shared/unified-price-service
// Use: import { AssetPrice } from '../shared'

export interface PortfolioMetrics {
  totalValue: number;
  totalChange24h: number;
  totalChangePercent24h: number;
  assetAllocation: {
    assetType: string;
    symbol: string;
    value: number;
    percentage: number;
  }[];
  topGainers: AssetPrice[];
  topLosers: AssetPrice[];
}

export interface WalletTransaction {
  transaction_version: string;
  transaction_timestamp: string;
  type: string;
  amount: string;
  asset_type: string;
  sender?: string;
  receiver?: string;
  gas_fee?: string;
  success: boolean;
  function?: string;
  payload?: any;
}

// LegacyDeFiPosition moved to @/lib/types/defi for better organization

export interface ANSNameResponse {
  owner_address: string;
  registered_address: string | null;
  name: string;
  domain: string | null;
  subdomain: string | null;
  is_active: boolean;
  is_primary: boolean;
  is_subdomain_active?: boolean;
  expiration_timestamp?: string;
  last_transaction_timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
  total?: number;
}

export interface PortfolioSummary {
  totalValue: number;
  fungibleAssets: FungibleAsset[];
  nfts: NFT[];
  defiPositions: import("@/lib/types/defi").LegacyDeFiPosition[];
  metrics: PortfolioMetrics;
}

export interface PortfolioAsset {
  asset_type: string;
  amount: string;
  balance?: number;
  price?: number;
  value?: number;
  metadata?: TokenMetadata;
  isVerified?: boolean;
  change24h?: number;
  changePercentage24h?: number;
  protocolInfo?: {
    protocol: string;
    protocolLabel: string;
    protocolType: string;
    isPhantomAsset: boolean;
  };
}

export interface ChartDataPoint {
  name: string;
  value: number;
  percentage: number;
  color?: string;
  metadata?: any;
}
