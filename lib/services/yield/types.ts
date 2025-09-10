/**
 * Shared types for yield services
 *
 * This file consolidates all type definitions used across the yield services
 * to reduce duplication and ensure consistency.
 */

/**
 * Represents a yield opportunity with comprehensive details
 * Used by both DefiLlama integration and yield aggregator
 */
export interface YieldOpportunity {
  id: string;
  protocol: string;
  protocolType: string;
  opportunityType: "lending" | "liquidity" | "staking" | "farming" | "vault";
  asset: string;
  assetSymbol: string;
  pairedAsset?: string;
  pairedAssetSymbol?: string;
  apy: number;
  apr?: number;
  tvl: number;
  userDeposit?: number;
  minDeposit?: number;
  maxDeposit?: number;
  risk: "low" | "medium" | "high";
  features: string[];
  rewards?: {
    token: string;
    symbol: string;
    apr: number;
  }[];
  fees?: {
    deposit?: number;
    withdrawal?: number;
    performance?: number;
  };
  lockPeriod?: number;
  autoCompound?: boolean;
  isActive: boolean;
  metadata?: Record<string, any>;
}

/**
 * Represents a protocol-specific opportunity
 * Used by AptosResourceFetcher for on-chain data
 */
export interface ProtocolOpportunity {
  id: string;
  protocol: string;
  protocolType: string;
  opportunityType: "lending" | "liquidity" | "staking" | "farming" | "vault";
  asset: string;
  assetSymbol: string;
  pairedAsset?: string;
  pairedAssetSymbol?: string;
  apy: number;
  tvl: number;
  risk: "low" | "medium" | "high";
  features: string[];
  rewards?: Array<{ token: string; symbol: string; apr: number }>;
  isActive: boolean;
}

/**
 * Represents a position that can be auto-compounded
 */
export interface CompoundablePosition {
  id: string;
  protocol: string;
  asset: string;
  pendingRewards: number;
  rewardToken: string;
  lastCompounded?: Date;
  gasEstimate: number;
  minRewardThreshold: number;
}

/**
 * Represents a position with harvestable rewards
 */
export interface HarvestablePosition {
  id: string;
  protocol: string;
  rewards: Array<{
    token: string;
    amount: number;
    valueUSD: number;
  }>;
  gasEstimate: number;
  profitable: boolean;
}

/**
 * Represents a yield farming strategy with multiple steps
 */
export interface YieldStrategy {
  id: string;
  name: string;
  description: string;
  targetAPY: number;
  risk: "conservative" | "moderate" | "aggressive";
  protocols: string[];
  allocation: Record<string, number>; // protocol -> percentage
  estimatedGas: number;
  steps: YieldStrategyStep[];
}

/**
 * Represents a single step in a yield strategy
 */
export interface YieldStrategyStep {
  protocol: string;
  action: "deposit" | "withdraw" | "swap" | "stake" | "harvest";
  asset: string;
  amount: string;
  targetAsset?: string;
  estimatedAPY: number;
}
