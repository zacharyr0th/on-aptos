// Import and re-export consolidated types
import type { FungibleAsset, NFT, TokenMetadata, Transaction } from "@/lib/types/consolidated";
import type { DeFiPosition } from "@/lib/types/defi";

// Re-export for external consumption
export type { TokenMetadata, NFT, FungibleAsset, Transaction, DeFiPosition };

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

// Local attribute type for backward compatibility
export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface PortfolioHistory {
  timestamp: number;
  date: string;
  value: number;
  assets_value: number;
  defi_value: number;
  nft_value: number;
  change?: number;
  changePercentage?: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalAssets: number;
  totalNFTs: number;
  totalDeFi: number;
  change24h: number;
  changePercentage24h: number;
  change7d?: number;
  changePercentage7d?: number;
  change30d?: number;
  changePercentage30d?: number;
  totalAPY?: number;
  topGainer?: {
    symbol: string;
    changePercentage: number;
  };
  topLoser?: {
    symbol: string;
    changePercentage: number;
  };
}

export interface YieldOpportunity {
  protocol: string;
  pool_name: string;
  asset_symbols: string[];
  tvl_usd: number;
  apy: number;
  apr?: number;
  risk_level: "low" | "medium" | "high";
  type: "staking" | "lending" | "farming" | "vault";
  rewards?: string[];
  lock_period?: number;
  minimum_deposit?: number;
  protocol_url?: string;
}

export interface ANSName {
  name: string;
  address: string;
  expiration?: string;
  is_primary?: boolean;
  subdomain?: string;
}

export interface CollectionStats {
  name: string;
  count: number;
  floor_price?: number;
  total_value?: number;
  logo_uri?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  percentage: number;
  color?: string;
  metadata?: any;
}

export interface PortfolioState {
  // Data
  assets: PortfolioAsset[];
  nfts: NFT[];
  defiPositions: DeFiPosition[];
  transactions: Transaction[];
  history: PortfolioHistory[];
  yieldOpportunities: YieldOpportunity[];

  // Computed
  metrics: PortfolioMetrics;
  pieChartData: ChartDataPoint[];
  collectionStats: CollectionStats[];

  // Meta
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  address: string | null;
  ansNames: ANSName[];
}

export interface PortfolioFilters {
  hideSmallBalances: boolean;
  minAssetValue: number;
  showOnlyVerified: boolean;
  assetTypes: ("fungible" | "nft" | "defi")[];
  protocols: string[];
  timeframe: "1h" | "24h" | "7d" | "30d" | "90d" | "1y" | "all";
}

export interface PortfolioSort {
  field: "name" | "value" | "change" | "percentage" | "protocol" | "apy";
  order: "asc" | "desc";
}

export interface PortfolioView {
  layout: "grid" | "list" | "cards";
  density: "compact" | "comfortable" | "spacious";
  showCharts: boolean;
  showMetrics: boolean;
  theme: "light" | "dark" | "system";
}
