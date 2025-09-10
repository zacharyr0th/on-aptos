/**
 * DeFi Balance Service Types
 * Shared interfaces and types for DeFi position analysis
 */

export interface DetailedPosition {
  protocol: string;
  protocolAddress: string;
  type: "liquidity" | "farming" | "lending" | "staking" | "nft" | "derivatives" | "other";
  description: string;
  tokens: Array<{
    symbol: string;
    address: string;
    balance: string;
    value?: string;
  }>;
  lpTokens: Array<{
    poolType: string;
    poolTokens: string[];
    balance: string;
    value?: string;
  }>;
  resources: Array<{
    type: string;
    data: Record<string, unknown>;
  }>;
  isActive: boolean;
}

export interface ComprehensivePositionSummary {
  walletAddress: string;
  positions: DetailedPosition[];
  totalActivePositions: number;
  totalProtocols: number;
  protocolBreakdown: Record<string, number>;
  valueBreakdown: Record<string, string>;
  lastUpdated: string;
}

export interface ProtocolInfo {
  protocol: string;
  type: string;
  description: string;
}

export interface LPTokenInfo {
  poolAddress: string;
  tokenA: string;
  tokenB: string;
}
