/**
 * Centralized DeFi and protocol type definitions
 */

// Protocol types enum - comprehensive list
export enum ProtocolType {
  // Core DeFi
  LENDING = "LENDING",
  DEX = "DEX",
  YIELD = "YIELD",
  FARMING = "FARMING",
  DERIVATIVES = "DERIVATIVES",
  CDP = "CDP",
  LIQUID_STAKING = "LIQUID_STAKING",

  // Additional types that were missing
  ORACLE = "ORACLE",
  GAMING = "GAMING",
  SOCIAL = "SOCIAL",

  // Infrastructure
  BRIDGE = "BRIDGE",
  LAUNCHPAD = "LAUNCHPAD",
  AGGREGATOR = "AGGREGATOR",

  // Other
  NFT = "NFT",
  UNKNOWN = "UNKNOWN",
}

// Protocol category
export type ProtocolCategory =
  | "lending"
  | "dex"
  | "yield"
  | "derivatives"
  | "cdp"
  | "liquid-staking"
  | "oracle"
  | "gaming"
  | "social"
  | "bridge"
  | "launchpad"
  | "aggregator"
  | "nft";

// Base DeFi position
export interface DeFiPosition {
  // Required fields
  positionId: string; // Was missing in some places
  protocol: string;
  protocolType: string;
  totalValue: number;
  address: string;

  // Backward compatibility fields
  totalValueUSD?: number; // Alias for totalValue
  protocol_type?: string; // Alias for protocolType
  tvl_usd?: number; // Alternative name for totalValue
  id?: string; // Alternative name for positionId
  type?: string; // Position type
  assets?: any[]; // Position assets
  metadata?: any; // Additional metadata

  // Position details
  position: {
    supplied?: Array<{
      asset: string;
      amount: string;
      value: number;
      apy?: number;
    }>;
    borrowed?: Array<{
      asset: string;
      amount: string;
      value: number;
      apy?: number;
    }>;
    staked?: Array<{
      asset: string;
      amount: string;
      value: number;
      apy?: number;
    }>;
    liquidity?: Array<{
      poolId: string;
      lpTokens: string;
      value?: number;
      token0?: {
        symbol: string;
        amount: string;
        value?: number;
      };
      token1?: {
        symbol: string;
        amount: string;
        value?: number;
      };
      apy?: number;
    }>;
    rewards?: Array<{
      asset: string;
      amount: string;
      value: number;
    }>;
  };

  // Protocol metadata
  protocolInfo?: {
    name: string;
    category: string;
    logo?: string;
    website?: string;
    tvl?: number;
  };

  // Risk metrics
  risk?: {
    level: "low" | "medium" | "high";
    factors?: string[];
  };

  // Health metrics
  health?: {
    ratio?: number;
    status?: "healthy" | "warning" | "danger";
  };
}

// Grouped DeFi position for UI
export interface GroupedDeFiPosition {
  protocol: string;
  protocolLabel: string;
  protocolType: string;
  positions: DeFiPosition[];
  totalValue: number;
  logo?: string;
  apy?: number;
  health?: {
    ratio?: number;
    status?: "healthy" | "warning" | "danger";
  };
}

// Protocol info
export interface ProtocolInfo {
  id: string;
  name: string;
  category: ProtocolCategory;
  logo?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  tvl?: number;
  volume24h?: number;
  users?: number;
  chains?: string[];
  description?: string;
  audits?: string[];
  isVerified?: boolean;
}

// APY/APR info
export interface YieldInfo {
  apy?: number;
  apr?: number;
  rewards?: Array<{
    token: string;
    apy: number;
  }>;
  isCompounding?: boolean;
  frequency?: "daily" | "weekly" | "monthly" | "continuous";
}

// Pool info for DEXes
export interface PoolInfo {
  poolId: string;
  token0: {
    address: string;
    symbol: string;
    decimals: number;
    reserve: string;
  };
  token1: {
    address: string;
    symbol: string;
    decimals: number;
    reserve: string;
  };
  lpTokenAddress?: string;
  totalSupply?: string;
  fee?: number;
  volume24h?: number;
  tvl?: number;
  apy?: number;
}

// Lending market info
export interface LendingMarket {
  asset: string;
  symbol: string;
  totalSupplied: string;
  totalBorrowed: string;
  supplyApy: number;
  borrowApy: number;
  utilizationRate: number;
  availableLiquidity: string;
  collateralFactor?: number;
  liquidationThreshold?: number;
}

// CDP/Vault info
export interface VaultInfo {
  vaultId: string;
  collateral: {
    asset: string;
    amount: string;
    value: number;
  };
  debt: {
    asset: string;
    amount: string;
    value: number;
  };
  collateralizationRatio: number;
  liquidationPrice?: number;
  availableToBorrow?: string;
  stabilityFee?: number;
}

// Type guards
export function isDeFiPosition(obj: any): obj is DeFiPosition {
  return (
    obj &&
    typeof obj.protocol === "string" &&
    typeof obj.protocolType === "string" &&
    typeof obj.totalValue === "number" &&
    typeof obj.address === "string" &&
    obj.position !== undefined
  );
}

export function hasHealthStatus(position: DeFiPosition): boolean {
  return !!position.health?.status;
}

export function hasRewards(position: DeFiPosition): boolean {
  return !!(position.position.rewards && position.position.rewards.length > 0);
}

// Helper functions
export function getProtocolTypeLabel(type: ProtocolType | string): string {
  const labels: Record<string, string> = {
    [ProtocolType.LENDING]: "Lending",
    [ProtocolType.DEX]: "DEX",
    [ProtocolType.YIELD]: "Yield",
    [ProtocolType.FARMING]: "Farming",
    [ProtocolType.DERIVATIVES]: "Derivatives",
    [ProtocolType.CDP]: "CDP",
    [ProtocolType.LIQUID_STAKING]: "Liquid Staking",
    [ProtocolType.ORACLE]: "Oracle",
    [ProtocolType.GAMING]: "Gaming",
    [ProtocolType.SOCIAL]: "Social",
    [ProtocolType.BRIDGE]: "Bridge",
    [ProtocolType.LAUNCHPAD]: "Launchpad",
    [ProtocolType.AGGREGATOR]: "Aggregator",
    [ProtocolType.NFT]: "NFT",
  };
  return labels[type] || type;
}

export function calculateHealthRatio(
  supplied: number,
  borrowed: number,
): number {
  if (borrowed === 0) return 100;
  return (supplied / borrowed) * 100;
}

export function getHealthStatus(
  ratio: number,
): "healthy" | "warning" | "danger" {
  if (ratio >= 150) return "healthy";
  if (ratio >= 120) return "warning";
  return "danger";
}
