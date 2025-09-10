/**
 * Consolidated type definitions for the on-aptos application
 * This file serves as the single source of truth for commonly duplicated types
 */

import type { TokenMetadata } from "./tokens";

// Re-export TokenMetadata explicitly
export type { TokenMetadata };

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
  last_transaction_version?: string | number;
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
  // Additional properties for compatibility
  token_properties?: any;
  creator_address?: string;
  collection_description?: string;
  property_version_v1?: number;
  collection_uri?: string;
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
  [key: string]: unknown;
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

// TokenMetadata is already exported above

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
  LendingMarket,
  PoolInfo,
  ProtocolInfo,
  VaultInfo,
  YieldInfo,
} from "./defi";

export {
  calculateHealthRatio,
  getHealthStatus,
  getProtocolTypeLabel,
  hasHealthStatus,
  hasRewards,
  isDeFiPosition,
  ProtocolType,
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
// API RESPONSE TYPES - Consolidated from multiple files
// =============================================================================

// Standard API response wrapper - used across all endpoints
export interface StandardAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
  requestId?: string;
  meta?: {
    responseTimeMs?: number;
    cacheHit?: boolean;
    apiCalls?: number;
    pagination?: {
      page: number;
      limit: number;
      total?: number;
      hasMore: boolean;
    };
  };
}

// Portfolio data responses
export interface PortfolioData {
  assets: FungibleAsset[];
  nfts: NFT[];
  defiPositions: import("./defi").DeFiPosition[];
  transactions: Transaction[];
  totalValue: number;
  totalValueChange24h?: number;
  lastUpdated: string;
}

export interface BatchResponse {
  assets: FungibleAsset[] | null;
  defiPositions: import("./defi").DeFiPosition[] | null;
  nfts: NFT[] | null;
  nftTotalCount: number | null;
  nftCollectionStats: {
    collections: Array<{ name: string; count: number }>;
    totalCollections: number;
  } | null;
  transactions: Transaction[] | null;
  metrics: {
    totalValue: number;
    totalAssets: number;
    totalNFTs: number;
    totalDeFi: number;
  } | null;
  error?: string;
}

// Specific response types
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

// Analytics response types
export interface GasUsageData {
  date: string;
  gasUsed: number;
  avgGasPrice: number;
  totalCost: number;
}

export interface TokenPriceData {
  symbol: string;
  price: number;
  change24h: number;
  timestamp: string;
}

export interface BalanceHistoryData {
  date: string;
  balance: number;
  value: number;
}

export interface TopPriceChangeData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h?: number;
  marketCap?: number;
}

export interface PerformanceData {
  timestamp: string;
  totalValue: number;
  change24h: number;
  changePercent24h: number;
}

// Market data types
export interface MarketPriceData {
  symbol: string;
  price: number;
  change24h?: number;
  volume24h?: number;
  marketCap?: number;
  lastUpdated: string;
}

// ANS data types
export interface AnsData {
  name?: string;
  address?: string;
  primaryName?: string;
  isOwner?: boolean;
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

// View modes and sorting
export type ViewMode = "grid" | "list" | "compact";
export type SortMode = "value" | "name" | "symbol" | "balance" | "change";
export type SortDirection = "asc" | "desc";
export type SortField =
  | "timestamp"
  | "type"
  | "amount"
  | "asset"
  | "name"
  | "value"
  | "change"
  | "percentage"
  | "protocol"
  | "apy";

// Additional common types
export type PortfolioTab = "assets" | "nfts" | "defi" | "transactions" | "history";
export type AssetType = "fungible" | "nft" | "defi";
export type TimeFrame = "1h" | "24h" | "7d" | "30d" | "90d" | "1y" | "all";

// Currency types - consolidated from multiple files
export type Currency = string;
export type FiatCurrency =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD"
  | "CHF"
  | "CNY"
  | "HKD"
  | "SGD"
  | "INR"
  | "MXN"
  | "BRL"
  | "RUB"
  | "ZAR"
  | "TRY"
  | "NZD"
  | "KRW"
  | "SEK"
  | "NOK"
  | "DKK"
  | "PLN"
  | "THB"
  | "IDR"
  | "MYR"
  | "PHP";

// Date and string utility types
export type ISODateString = string;
export type LargeNumberString = string;

// Transaction analysis enums - consolidated from multiple files
export enum TransactionCategory {
  DEFI = "defi",
  TRANSFER = "transfer",
  CEX = "cex",
  NFT = "nft",
  STAKING = "staking",
  BRIDGE = "bridge",
  RWA = "rwa",
  SYSTEM = "system",
  GAMING = "gaming",
  UNKNOWN = "unknown",
}

export enum ActivityType {
  // DeFi activities
  SWAP = "swap",
  LIQUIDITY_ADD = "liquidity_add",
  LIQUIDITY_REMOVE = "liquidity_remove",
  LENDING_SUPPLY = "lending_supply",
  LENDING_BORROW = "lending_borrow",
  LENDING_REPAY = "lending_repay",
  LENDING_WITHDRAW = "lending_withdraw",
  STAKE = "stake",
  UNSTAKE = "unstake",
  FARMING_STAKE = "farming_stake",
  FARMING_UNSTAKE = "farming_unstake",
  FARMING_HARVEST = "farming_harvest",
  CLAIM_REWARDS = "claim_rewards",
  BRIDGE_DEPOSIT = "bridge_deposit",
  BRIDGE_WITHDRAW = "bridge_withdraw",

  // Transfer activities
  TRANSFER_IN = "transfer_in",
  TRANSFER_OUT = "transfer_out",
  SEND = "send",
  RECEIVE = "receive",
  AIRDROP = "airdrop",

  // NFT activities
  NFT_BUY = "nft_buy",
  NFT_SELL = "nft_sell",
  NFT_MINT = "nft_mint",
  NFT_TRANSFER = "nft_transfer",

  // CEX activities
  CEX_DEPOSIT = "cex_deposit",
  CEX_WITHDRAWAL = "cex_withdrawal",

  // RWA activities
  RWA_PURCHASE = "rwa_purchase",
  RWA_REDEEM = "rwa_redeem",

  // System activities
  ACCOUNT_CREATION = "account_creation",
  MODULE_PUBLISH = "module_publish",
  SCRIPT_EXECUTION = "script_execution",
  COIN_REGISTER = "coin_register",

  // Gaming activities
  GAME_ACTION = "game_action",
  ITEM_PURCHASE = "item_purchase",

  // Unknown
  UNKNOWN = "unknown",
}

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

export function isNFT(obj: any): obj is NFT {
  return obj && typeof obj.token_data_id === "string" && typeof obj.collection_name === "string";
}

export function isFungibleAsset(obj: any): obj is FungibleAsset {
  return obj && typeof obj.asset_type === "string" && typeof obj.amount === "string";
}

export function isTransaction(obj: any): obj is Transaction {
  return obj && typeof obj.transaction_version === "string" && typeof obj.hash === "string";
}

export function isTokenMetadata(obj: any): obj is TokenMetadata {
  return true;
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
