/**
 * Enterprise-grade API types and interfaces
 * Standardized across all REST endpoints
 */

export interface StandardAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta: ResponseMeta;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string; // Only in development
}

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  performance?: {
    responseTimeMs: number;
    cacheHit: boolean;
    apiCalls?: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total?: number;
    hasMore: boolean;
  };
}

// Portfolio Types (matching service output)
export interface PortfolioAsset {
  asset_type: string;
  amount: string;
  metadata?: {
    name: string;
    symbol: string;
    decimals: number;
    icon_uri?: string;
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
}

export interface PortfolioAssetsResponse {
  assets: PortfolioAsset[];
  totalValue: number;
  assetCount: number;
}

// DeFi Types
export interface DeFiPosition {
  protocol: string;
  protocolType: string;
  totalValue: number;
  address: string;
  position: {
    supplied?: Array<{
      asset: string;
      amount: string;
      value: number;
    }>;
    borrowed?: Array<{
      asset: string;
      amount: string;
      value: number;
    }>;
    staked?: Array<{
      asset: string;
      amount: string;
      value: number;
    }>;
    liquidity?: Array<{
      poolId: string;
      lpTokens: string;
      token0?: { symbol: string; amount: string };
      token1?: { symbol: string; amount: string };
    }>;
  };
  protocolInfo?: {
    name: string;
    category: string;
    logo?: string;
  };
}

export interface DeFiPositionsResponse {
  positions: DeFiPosition[];
  totalValue: number;
  protocolCount: number;
}

// NFT Types (matching service output)
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
}

export interface NFTsResponse {
  nfts: NFT[];
  totalCount: number;
  hasMore: boolean;
}

// Price Types
export interface PriceData {
  symbol: string;
  price: number;
  change24h?: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated: string;
}

export interface PriceResponse {
  price: PriceData;
  source: string;
}

// Supply Types
export interface TokenSupply {
  symbol: string;
  name: string;
  supply: string;
  formatted_supply: string;
  decimals: number;
  asset_type: string;
  value?: number;
  price?: number;
  isVerified?: boolean;
  protocol?: string;
}

export interface SuppliesResponse {
  supplies: TokenSupply[];
  total: string;
  total_formatted: string;
  totalValue?: number;
}

// ANS Types
export interface ANSName {
  domain: string;
  subdomain?: string;
  is_primary: boolean;
  owner_address: string;
  expiration_timestamp?: string;
}

export interface ANSResponse {
  name?: string;
  names?: string[];
  address?: string;
}

// Transfer History Types
export interface TokenTransfer {
  transaction_version: string;
  transaction_timestamp: string;
  from_address: string;
  to_address: string;
  token_amount: string;
  transfer_type: string;
  token_data_id: string;
}

export interface TransferHistoryResponse {
  transfers: TokenTransfer[];
  totalCount: number;
  hasMore: boolean;
}

// Error Codes
export enum APIErrorCode {
  // Client Errors (4xx)
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  NOT_FOUND = 'NOT_FOUND',
  
  // Server Errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  
  // Business Logic Errors
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
}

// Request validation schemas
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface WalletParams {
  walletAddress: string;
}

export interface TokenParams {
  tokenId?: string;
  symbol?: string;
  assetType?: string;
}

export interface QueryParams extends PaginationParams {
  forceRefresh?: boolean;
  includeMetadata?: boolean;
  showOnlyVerified?: boolean;
}