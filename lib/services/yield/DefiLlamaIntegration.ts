import { logger } from "@/lib/utils/core/logger";

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
 * Integration with DefiLlama Yields API
 * Fetches real yield data from DefiLlama
 */
export class DefiLlamaIntegration {
  private static instance: DefiLlamaIntegration;
  private readonly apiUrl = "https://yields.llama.fi";
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): DefiLlamaIntegration {
    if (!this.instance) {
      this.instance = new DefiLlamaIntegration();
    }
    return this.instance;
  }

  /**
   * Get all pools from DefiLlama
   */
  async getAllPools(): Promise<any[]> {
    const cacheKey = "all-pools";
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.apiUrl}/pools`);
      if (!response.ok) {
        throw new Error(`Failed to fetch pools: ${response.statusText}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data: data.data, timestamp: Date.now() });
      return data.data;
    } catch (error) {
      logger.error("Error fetching DefiLlama pools:", error);
      return [];
    }
  }

  /**
   * Get Aptos-specific pools
   */
  async getAptosPools(): Promise<any[]> {
    try {
      const allPools = await this.getAllPools();
      // Filter for Aptos chain
      return allPools.filter(
        (pool) =>
          pool.chain?.toLowerCase() === "aptos" &&
          pool.apy != null &&
          pool.apy > 0,
      );
    } catch (error) {
      logger.error("Error fetching Aptos pools:", error);
      return [];
    }
  }

  /**
   * Transform DefiLlama pool to our YieldOpportunity format
   */
  transformPool(pool: any): YieldOpportunity {
    // Determine opportunity type
    let opportunityType:
      | "lending"
      | "liquidity"
      | "staking"
      | "farming"
      | "vault" = "liquidity";

    // Check protocol-specific mappings first
    const protocol = (pool.project || "").toLowerCase();
    if (protocol.includes("amnis") || protocol === "amnis finance") {
      opportunityType = "staking";
    } else if (pool.category === "Lending" || pool.poolMeta?.includes("lend")) {
      opportunityType = "lending";
    } else if (
      pool.category === "Liquid Staking" ||
      pool.poolMeta?.includes("stak")
    ) {
      opportunityType = "staking";
    } else if (pool.category === "Farm" || pool.poolMeta?.includes("farm")) {
      opportunityType = "farming";
    } else if (pool.category === "Vault" || pool.poolMeta?.includes("vault")) {
      opportunityType = "vault";
    }

    // Determine risk level based on various factors
    let risk: "low" | "medium" | "high" = "medium";

    if (pool.stablecoin === true || pool.apy < 10) {
      risk = "low";
    } else if (pool.ilRisk === "yes" || pool.apy > 50) {
      risk = "high";
    }

    // Parse symbol/asset info
    let assetSymbol = pool.symbol || "UNKNOWN";
    let pairedAssetSymbol = undefined;

    if (assetSymbol.includes("-")) {
      const parts = assetSymbol.split("-");
      assetSymbol = parts[0];
      pairedAssetSymbol = parts[1];
    } else if (assetSymbol.includes("/")) {
      const parts = assetSymbol.split("/");
      assetSymbol = parts[0];
      pairedAssetSymbol = parts[1];
    }

    return {
      id: pool.pool || `${pool.project}-${pool.symbol}`,
      protocol: pool.project || "Unknown",
      protocolType: pool.category?.toLowerCase() || "defi",
      opportunityType,
      asset: pool.underlyingTokens?.[0] || assetSymbol,
      assetSymbol,
      pairedAsset: pool.underlyingTokens?.[1],
      pairedAssetSymbol,
      apy: pool.apy || 0,
      apr: pool.apyBase || pool.apr || 0,
      tvl: pool.tvlUsd || 0,
      risk,
      features: this.extractFeatures(pool),
      rewards: pool.rewardTokens?.map((token: string) => ({
        token,
        symbol: token.split("::").pop() || token,
        apr: pool.apyReward || 0,
      })),
      fees: {
        deposit: pool.depositFee || 0,
        withdrawal: pool.withdrawFee || 0,
        performance: pool.performanceFee || 0,
      },
      lockPeriod: pool.lockPeriod || 0,
      autoCompound: pool.autoCompound || false,
      isActive: pool.apy > 0 && pool.tvlUsd > 1000,
      metadata: {
        poolId: pool.pool,
        ilRisk: pool.ilRisk,
        exposure: pool.exposure,
        category: pool.category,
        stablecoin: pool.stablecoin,
      },
    };
  }

  private extractFeatures(pool: any): string[] {
    const features = [];

    if (pool.stablecoin) features.push("Stablecoin");
    if (pool.autoCompound) features.push("Auto-compound");
    if (pool.ilRisk === "no") features.push("No IL Risk");
    if (pool.category === "Liquid Staking") features.push("Liquid Staking");
    if (pool.rewardTokens?.length > 0) features.push("Reward Tokens");
    if (pool.boosted) features.push("Boosted");
    if (!pool.lockPeriod || pool.lockPeriod === 0)
      features.push("No lock period");

    return features;
  }

  /**
   * Get protocol statistics
   */
  async getProtocolStats(protocol: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/protocol/${protocol}`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch protocol stats: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      logger.error(`Error fetching stats for ${protocol}:`, error);
      return null;
    }
  }

  /**
   * Get historical APY data
   */
  async getPoolHistory(poolId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiUrl}/chart/${poolId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch pool history: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      logger.error(`Error fetching history for pool ${poolId}:`, error);
      return [];
    }
  }
}
