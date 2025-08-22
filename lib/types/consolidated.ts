/**
 * Consolidated type definitions for the on-aptos application
 * This file serves as the single source of truth for commonly duplicated types
 */

// Export validation schemas (commented out to prevent duplicate exports)
// export * from './validation';

// =============================================================================
// CORE PORTFOLIO TYPES
// =============================================================================

// Base NFT type (consolidates multiple definitions)
export interface NFT {
  token_data_id: string;
  token_name: string;
  collection_name: string;
  token_uri: string;
  description?: string;
  amount?: number;
  owner_address?: string;
  last_transaction_version?: string;
  last_transaction_timestamp?: string;
  property_version?: string;
  table_type?: string;
  token_standard?: string;
  // Metadata fields
  image?: string;
  animation_url?: string;
  cdn_image_uri?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// NFT metadata from JSON
export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  [key: string]: Record<string, unknown>;
}

// NFT collection statistics
export interface NFTCollection {
  name: string;
  count: number;
  floorPrice?: number;
  totalValue?: number;
  thumbnail?: string;
}

export interface NFTCollectionStats {
  collections: Array<{ name: string; count: number }>;
  totalCollections: number;
  // Collector metrics
  concentrationTop3: number; // % of NFTs in top 3 collections
  singleItemCollections: number; // Collections with only 1 NFT
  fanCollections: number; // Collections with 5+ NFTs
  stanCollections: number; // Collections with 10+ NFTs
  averageHolding: number; // Average NFTs per collection
  largestCollectionPercentage: number; // % of total NFTs in largest collection
}

// Fungible Asset type (consolidates multiple definitions)
export interface FungibleAsset {
  asset_type: string;
  amount: string;
  metadata?: {
    name: string;
    symbol: string;
    decimals: number;
    icon_uri?: string;
    project_uri?: string;
  };
  // Price data
  price?: number;
  price_usd?: number;
  value?: number;
  value_usd?: number;
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

// Token metadata (consolidates multiple definitions)
export interface TokenMetadata {
  symbol?: string;
  name?: string;
  decimals?: number;
  asset_type?: string;
  logoUrl?: string;
  icon_uri?: string;
  description?: string;
  project_uri?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  issuer?:
    | string
    | { name?: string; logo?: string; website?: string; twitter?: string };
  assetAddress?: string;
  explorerLink?: string;
  type?: string;
  auditLink?: string;
  tags?: string[];
  // Market data
  price?: number;
  market_cap?: number;
  volume_24h?: number;
  circulating_supply?: number;
  total_supply?: string;
  max_supply?: string;
}

// Token price data
export interface TokenPrice {
  symbol: string;
  price: number;
  change24h?: number;
  marketCap?: number;
  volume24h?: number;
  last_updated?: string;
}

// Token balance
export interface TokenBalance {
  asset_type: string;
  amount: string;
  metadata?: TokenMetadata;
  value_usd?: number;
}

// =============================================================================
// DEFI TYPES (Re-export from existing defi.ts)
// =============================================================================

// Import and re-export from the existing comprehensive defi.ts
export type {
  DeFiPosition,
  GroupedDeFiPosition,
  ProtocolInfo,
  YieldInfo,
  PoolInfo,
  LendingMarket,
  VaultInfo,
} from "./defi";

export {
  ProtocolType,
  isDeFiPosition,
  hasHealthStatus,
  hasRewards,
  getProtocolTypeLabel,
  calculateHealthRatio,
  getHealthStatus,
} from "./defi";

// Additional DeFi asset type for portfolio service
export interface DeFiAsset {
  type: "supplied" | "borrowed" | "staked" | "liquidity" | "rewards";
  tokenAddress: string;
  symbol: string;
  amount: string;
  valueUSD: number;
  apy?: number;
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

export interface Transaction {
  transaction_version: string;
  transaction_timestamp: string;
  sender: string;
  sequence_number: string;
  max_gas_amount: string;
  gas_unit_price: string;
  expiration_timestamp_secs: string;
  payload: Record<string, unknown>;
  signature?: Record<string, unknown>;
  events: unknown[];
  hash: string;
  state_change_hash?: string;
  event_root_hash?: string;
  state_checkpoint_hash?: string;
  gas_used: string;
  success: boolean;
  vm_status: string;
  accumulator_root_hash: string;
  // Processed fields
  type?: string;
  function?: string;
  arguments?: unknown[];
  changes?: unknown[];
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface PortfolioData {
  assets: FungibleAsset[];
  nfts: NFT[];
  defiPositions: import("./defi").DeFiPosition[];
  transactions: Transaction[];
  totalValue: number;
  totalValueChange24h?: number;
  lastUpdated: string;
}

export interface PortfolioResponse {
  success: boolean;
  data?: PortfolioData;
  error?: string;
  timestamp: string;
}

export interface NFTsResponse {
  nfts: NFT[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface DeFiPositionsResponse {
  positions: import("./defi").DeFiPosition[];
  totalValue: number;
  protocolCount: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

// =============================================================================
// UI/COMPONENT TYPES
// =============================================================================

export interface LoadingState {
  assets: boolean;
  nfts: boolean;
  defi: boolean;
  transactions: boolean;
}

export interface ErrorState {
  assets?: string;
  nfts?: string;
  defi?: string;
  transactions?: string;
}

export interface FilterState {
  hideFilteredAssets: boolean;
  showOnlyVerified: boolean;
  minValue: number;
  searchQuery: string;
}

export interface SelectionState {
  selectedAsset: FungibleAsset | null;
  selectedNFT: NFT | null;
  selectedPosition: import("./defi").DeFiPosition | null;
  selectedTransaction: Transaction | null;
}

// View modes
export type ViewMode = "grid" | "list" | "compact";
export type SortMode = "value" | "name" | "symbol" | "balance" | "change";
export type SortDirection = "asc" | "desc";

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: Record<string, "up" | "down">;
  response_time_ms: number;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isNFT(obj: Record<string, unknown>): obj is NFT {
  return (
    obj &&
    typeof obj.token_data_id === "string" &&
    typeof obj.collection_name === "string"
  );
}

export function isFungibleAsset(obj: Record<string, unknown>): obj is FungibleAsset {
  return (
    obj && typeof obj.asset_type === "string" && typeof obj.amount === "string"
  );
}

export function isTransaction(obj: Record<string, unknown>): obj is Transaction {
  return (
    obj &&
    typeof obj.transaction_version === "string" &&
    typeof obj.hash === "string"
  );
}

export function isTokenMetadata(obj: Record<string, unknown>): obj is TokenMetadata {
  return obj && (obj.symbol || obj.name || obj.decimals !== undefined);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function createEmptyPortfolioData(): PortfolioData {
  return {
    assets: [],
    nfts: [],
    defiPositions: [],
    transactions: [],
    totalValue: 0,
    lastUpdated: new Date().toISOString(),
  };
}

export function createEmptyLoadingState(): LoadingState {
  return {
    assets: false,
    nfts: false,
    defi: false,
    transactions: false,
  };
}

export function createEmptyErrorState(): ErrorState {
  return {};
}

export function createEmptyFilterState(): FilterState {
  return {
    hideFilteredAssets: false,
    showOnlyVerified: false,
    minValue: 0,
    searchQuery: "",
  };
}

export function createEmptySelectionState(): SelectionState {
  return {
    selectedAsset: null,
    selectedNFT: null,
    selectedPosition: null,
    selectedTransaction: null,
  };
}
