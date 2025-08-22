// Comprehensive type definitions for portfolio

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  icon_uri?: string;
  project_uri?: string;
  token_standard?: string;
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

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFT {
  collection_id: string;
  collection_name: string;
  token_data_id: string;
  token_name: string;
  token_uri?: string;
  description?: string;
  creator_address?: string;
  cdn_asset_uris?: {
    cdn_image_uri?: string;
    cdn_animation_uri?: string;
    raw_image_uri?: string;
  }[];
  current_token_data?: {
    metadata_uri?: string;
    payee_address?: string;
    royalty_points_numerator?: number;
    royalty_points_denominator?: number;
    maximum_version?: number;
    token_properties?: Record<string, any>;
  };
  attributes?: NFTAttribute[];
  rarity?: {
    rank?: number;
    score?: number;
    percentage?: number;
  };
}

export interface DeFiPosition {
  protocol: string;
  protocol_type: 'lending' | 'dex' | 'staking' | 'farming' | 'vault' | 'other';
  position_type?: string;
  position_id?: string;
  address?: string;
  tokens?: Array<{
    symbol: string;
    amount: number;
    value_usd: number;
  }>;
  supplied?: Array<{
    symbol: string;
    amount: number;
    value_usd: number;
    apy?: number;
  }>;
  borrowed?: Array<{
    symbol: string;
    amount: number;
    value_usd: number;
    apy?: number;
  }>;
  rewards?: Array<{
    symbol: string;
    amount: number;
    value_usd: number;
  }>;
  tvl_usd?: number;
  totalValue?: number;
  totalValueUSD?: number;
  apy?: number;
  apr?: number;
  health_factor?: number;
  liquidation_threshold?: number;
  protocolLabel?: string;
}

export interface Transaction {
  transaction_version: string;
  transaction_timestamp: string;
  transaction_hash?: string;
  type: 'coin_transfer' | 'token_transfer' | 'nft_transfer' | 'swap' | 'liquidity' | 'stake' | 'other';
  sender?: string;
  receiver?: string;
  amount?: string;
  asset_type?: string;
  success: boolean;
  function?: string;
  module?: string;
  gas_fee?: string;
  gas_unit_price?: string;
  gas_used?: string;
  vm_status?: string;
  events?: Array<{
    type: string;
    data: any;
  }>;
  metadata?: {
    symbol?: string;
    decimals?: number;
    price_usd?: number;
    value_usd?: number;
  };
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
  risk_level: 'low' | 'medium' | 'high';
  type: 'staking' | 'lending' | 'farming' | 'vault';
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
  assetTypes: ('fungible' | 'nft' | 'defi')[];
  protocols: string[];
  timeframe: '1h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'all';
}

export interface PortfolioSort {
  field: 'name' | 'value' | 'change' | 'percentage' | 'protocol' | 'apy';
  order: 'asc' | 'desc';
}

export interface PortfolioView {
  layout: 'grid' | 'list' | 'cards';
  density: 'compact' | 'comfortable' | 'spacious';
  showCharts: boolean;
  showMetrics: boolean;
  theme: 'light' | 'dark' | 'system';
}