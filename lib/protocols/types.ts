/**
 * Core types for the protocol system
 */

import { ProtocolType } from "@/lib/types/defi";

// Re-export ProtocolType from defi types (most comprehensive)
export { ProtocolType };

// Local protocol-specific types
export enum ProtocolSubType {
  DEX = "dex",
  LENDING = "lending",
  LIQUID_STAKING = "liquid_staking",
  FARMING = "farming",
  DERIVATIVES = "derivatives",
  BRIDGE = "bridge",
  NFT_MARKETPLACE = "nft_marketplace",
  INFRASTRUCTURE = "infrastructure",
  LAUNCHPAD = "launchpad",
  GAMING = "gaming",
}

export enum PositionType {
  LP = "lp",
  LENDING_SUPPLY = "lending_supply",
  LENDING_BORROW = "lending_borrow",
  STAKING = "staking",
  FARMING = "farming",
  DERIVATIVE = "derivative",
  TOKEN = "token",
  NFT = "nft",
}

export interface AssetInfo {
  address: string;
  symbol: string;
  decimals: number;
  amount: string;
  valueUSD?: number;
  metadata?: Record<string, any>;
}

export interface ProtocolPattern {
  // Pattern matching
  pattern: RegExp | string;
  priority?: number; // Higher priority patterns match first

  // Position extraction
  positionType: PositionType;
  extractAssets: (data: any) => AssetInfo[];
  extractMetadata?: (data: any) => Record<string, any>;

  // Optional filters
  minAmount?: string; // Minimum amount to consider
  requiredFields?: string[]; // Required fields in data
}

export interface TransactionPattern {
  pattern: RegExp | string;
  activity: string;
  description?: string;
  priority?: number;
}

export interface ProtocolMetadata {
  // Basic info
  id: string;
  name: string;
  displayName: string;
  type: ProtocolType;

  // Visual
  logo?: string;
  color?: string;

  // Links
  website?: string;
  docs?: string;
  twitter?: string;

  // Stats
  tvl?: number;
  volume24h?: number;

  // Tags for filtering
  tags?: string[];

  // Risk level
  riskLevel?: "low" | "medium" | "high" | "unknown";
  auditStatus?: "audited" | "unaudited" | "in-progress";
}

export interface ProtocolDefinition {
  metadata: ProtocolMetadata;

  // Contract addresses (can be lazy loaded)
  addresses: string[] | (() => Promise<string[]>);

  // Detection patterns (can be lazy loaded)
  patterns?: {
    resources?: ProtocolPattern[] | (() => Promise<ProtocolPattern[]>);
    transactions?: TransactionPattern[] | (() => Promise<TransactionPattern[]>);
  };

  // Custom handlers
  handlers?: {
    // Custom position extraction
    extractPosition?: (resource: any) => Promise<any>;

    // Custom transaction categorization
    categorizeTransaction?: (tx: any) => Promise<any>;

    // Custom value calculation
    calculateValue?: (position: any) => Promise<number>;
  };

  // Version info
  version: string;
  lastUpdated: string;
}
