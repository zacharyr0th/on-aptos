// Portfolio service type definitions

export interface FungibleAsset {
  asset_type: string;
  amount: string;
  metadata?: {
    name: string;
    symbol: string;
    decimals: number;
    icon_uri?: string;
    project_uri?: string;
    creator_address?: string;
  };
  price?: number;
  value?: number;
  balance?: number;
  isVerified?: boolean;
  protocolInfo?: {
    protocol: string;
    protocolLabel: string;
    protocolType: string;
    isPhantomAsset: boolean;
  };
  is_frozen?: boolean;
  is_primary?: boolean;
  last_transaction_timestamp?: string;
  last_transaction_version?: number;
  token_standard?: string;
}

export interface NFT {
  token_data_id: string;
  token_name: string;
  collection_name: string;
  token_uri: string;
  description?: string;
  property_version_v1: number;
  amount: number;
  cdn_image_uri?: string;
  cdn_animation_uri?: string;
  collection_description?: string;
  creator_address?: string;
  collection_uri?: string;
  last_transaction_version?: number;
  last_transaction_timestamp?: string;
  token_standard?: string;
  is_soulbound?: boolean;
  collection_id?: string;
  supply?: number;
  maximum?: number;
  current_supply?: number;
  max_supply?: number;
}

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

export interface DeFiPosition {
  protocol: string;
  protocolType: string;
  poolName: string;
  positionType: string;
  suppliedAssets: Array<{
    asset: string;
    amount: number;
    value: number;
    apy?: number;
  }>;
  borrowedAssets: Array<{
    asset: string;
    amount: number;
    value: number;
    apy?: number;
  }>;
  totalValueUSD: number;
  healthFactor?: number;
  claimableRewards?: Array<{
    asset: string;
    amount: number;
    value: number;
  }>;
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
