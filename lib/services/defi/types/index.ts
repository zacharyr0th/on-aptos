export interface DeFiPosition {
  id: string;
  protocol: string;
  protocolType: ProtocolType;
  positionType: PositionType;
  address: string;
  assets: DeFiAsset[];
  totalValueUSD: number;
  metadata?: Record<string, unknown>;
  lastUpdated: string;
}

export interface DeFiAsset {
  type: AssetType;
  tokenAddress: string;
  symbol: string;
  amount: string;
  valueUSD: number;
  metadata?: {
    poolId?: string;
    poolTokens?: string[];
    apy?: number;
    rewards?: string;
    underlying?: string | string[];
    borrowType?: string;
    poolType?: string;
    farmType?: string;
    pendingRewards?: string;
    rewardToken?: string;
    principal?: string;
    accruedInterest?: string;
    isLocked?: boolean;
    collateralFactor?: any;
    liquidationThreshold?: any;
    fees24h?: any;
    [key: string]: any; // Allow additional properties
  };
}

export enum ProtocolType {
  DEX = 'dex',
  LENDING = 'lending',
  LIQUID_STAKING = 'liquid_staking',
  FARMING = 'farming',
  DERIVATIVES = 'derivatives',
  BRIDGE = 'bridge',
  NFT_MARKETPLACE = 'nft_marketplace',
  INFRASTRUCTURE = 'infrastructure',
}

export enum PositionType {
  LIQUIDITY_POOL = 'liquidity_pool',
  LENDING_SUPPLY = 'lending_supply',
  LENDING_BORROW = 'lending_borrow',
  STAKING = 'staking',
  FARMING = 'farming',
  VAULT = 'vault',
  DERIVATIVE_LONG = 'derivative_long',
  DERIVATIVE_SHORT = 'derivative_short',
  OPTION = 'option',
  TOKEN_HOLDING = 'token_holding',
  TRADING = 'trading',
  COLLATERAL = 'collateral',
  LIMIT_ORDER = 'limit_order',
  PENDING = 'pending',
  VESTING = 'vesting',
}

export enum AssetType {
  SUPPLIED = 'supplied',
  BORROWED = 'borrowed',
  STAKED = 'staked',
  LP_TOKEN = 'lp_token',
  VAULT_SHARE = 'vault_share',
  DERIVATIVE = 'derivative',
  REWARD = 'reward',
  COLLATERAL = 'collateral',
  LOCKED = 'locked',
  VESTING = 'vesting',
}

export interface AdapterConfig {
  enabled: boolean;
  priority: number;
  timeout: number;
  retryAttempts: number;
  cacheTimeToLive: number;
  features?: {
    priceCalculation?: boolean;
    rewardTracking?: boolean;
    historicalData?: boolean;
  };
  apiKeys?: Record<string, string>;
  customEndpoints?: Record<string, string>;
}

export interface AdapterMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastExecutionTime?: string;
  lastError?: string;
}

export interface PositionScanResult {
  positions: DeFiPosition[];
  metadata: {
    adapterId: string;
    walletAddress: string;
    scanDuration: number;
    timestamp: string;
    positionsFound: number;
    totalValueUSD: number;
  };
}

export interface AggregatedPositions {
  positions: DeFiPosition[];
  summary: {
    totalPositions: number;
    totalValueUSD: number;
    protocolBreakdown: Record<string, number>;
    positionTypeBreakdown: Record<string, number>;
    topProtocols: Array<{
      protocol: string;
      valueUSD: number;
      percentage: number;
    }>;
  };
  metadata: {
    walletAddress: string;
    adaptersUsed: string[];
    scanDuration: number;
    timestamp: string;
  };
}
