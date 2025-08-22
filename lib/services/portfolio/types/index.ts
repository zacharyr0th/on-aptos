// Portfolio service type definitions
// Import core types from consolidated types
import type {
  FungibleAsset,
  NFT,
  DeFiPosition,
  Transaction,
} from "@/lib/types/consolidated";

// Re-export core types
export type { FungibleAsset, NFT, DeFiPosition };

// Alias for backward compatibility
export type WalletTransaction = Transaction;

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

export interface AssetPrice {
  assetType: string;
  symbol: string;
  price: number | null;
  change24h: number;
  marketCap?: number;
}

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
  defiPositions: DeFiPosition[];
  metrics: PortfolioMetrics;
}
