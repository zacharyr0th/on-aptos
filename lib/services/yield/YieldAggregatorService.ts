import { YIELD_PROTOCOL_ADDRESSES as PROTOCOL_ADDRESSES } from "@/lib/constants";
import { DeFiPosition } from "@/lib/services/defi";
import { logger } from "@/lib/utils/core/logger";

import {
  AptosResourceFetcher,
  ProtocolOpportunity,
} from "./AptosResourceFetcher";
import { DefiLlamaIntegration, YieldOpportunity } from "./DefiLlamaIntegration";

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

export interface YieldStrategyStep {
  protocol: string;
  action: "deposit" | "withdraw" | "swap" | "stake" | "harvest";
  asset: string;
  amount: string;
  targetAsset?: string;
  estimatedAPY: number;
}

export class YieldAggregatorService {
  private static instance: YieldAggregatorService;
  private defiLlama: DefiLlamaIntegration;
  private resourceFetcher: AptosResourceFetcher;

  private constructor() {
    this.defiLlama = DefiLlamaIntegration.getInstance();
    this.resourceFetcher = AptosResourceFetcher.getInstance();
  }

  static getInstance(): YieldAggregatorService {
    if (!this.instance) {
      this.instance = new YieldAggregatorService();
    }
    return this.instance;
  }

  /**
   * Discover all available yield opportunities across protocols
   */
  async discoverOpportunities(
    walletAddress?: string,
    filters?: {
      minAPY?: number;
      maxRisk?: "low" | "medium" | "high";
      protocols?: string[];
      assets?: string[];
      includeInactive?: boolean;
    },
  ): Promise<YieldOpportunity[]> {
    try {
      const opportunities: YieldOpportunity[] = [];

      // Fetch opportunities from various sources
      const [lending, liquidity, staking, farming, defiLlama] =
        await Promise.all([
          this.fetchLendingOpportunities(),
          this.fetchLiquidityOpportunities(),
          this.fetchStakingOpportunities(),
          this.fetchFarmingOpportunities(),
          this.fetchDefiLlamaOpportunities(),
        ]);

      opportunities.push(
        ...lending,
        ...liquidity,
        ...staking,
        ...farming,
        ...defiLlama,
      );

      // Filter based on criteria
      let filtered = opportunities;

      if (filters?.minAPY !== undefined) {
        filtered = filtered.filter((o) => o.apy >= filters.minAPY!);
      }

      if (filters?.maxRisk) {
        const riskLevels = { low: 1, medium: 2, high: 3 };
        filtered = filtered.filter(
          (o) => riskLevels[o.risk] <= riskLevels[filters.maxRisk!],
        );
      }

      if (filters?.protocols?.length) {
        filtered = filtered.filter((o) =>
          filters.protocols!.includes(o.protocol),
        );
      }

      if (filters?.assets?.length) {
        filtered = filtered.filter(
          (o) =>
            filters.assets!.includes(o.asset) ||
            (o.pairedAsset && filters.assets!.includes(o.pairedAsset)),
        );
      }

      if (!filters?.includeInactive) {
        filtered = filtered.filter((o) => o.isActive);
      }

      // Sort by APY descending
      filtered.sort((a, b) => b.apy - a.apy);

      // If wallet provided, add user's current deposits
      if (walletAddress) {
        await this.enrichWithUserData(filtered, walletAddress);
      }

      return filtered;
    } catch (error) {
      logger.error("Failed to discover yield opportunities:", error);
      return [];
    }
  }

  /**
   * Generate optimal yield strategies based on user preferences
   */
  async generateStrategies(
    walletAddress: string,
    preferences: {
      targetAPY?: number;
      riskTolerance: "conservative" | "moderate" | "aggressive";
      availableCapital: number;
      preferredProtocols?: string[];
      excludeProtocols?: string[];
      timeHorizon?: number; // days
    },
  ): Promise<YieldStrategy[]> {
    const strategies: YieldStrategy[] = [];

    // Get all opportunities
    const opportunities = await this.discoverOpportunities(walletAddress);

    // Conservative strategy: Focus on lending and stable LPs
    if (preferences.riskTolerance === "conservative") {
      const conservativeOps = opportunities.filter(
        (o) => o.risk === "low" && o.apy > 0,
      );

      strategies.push({
        id: "conservative-diversified",
        name: "Conservative Diversified Lending",
        description:
          "Spread funds across top lending protocols for stable yields",
        targetAPY: this.calculateWeightedAPY(conservativeOps.slice(0, 3)),
        risk: "conservative",
        protocols: [
          ...new Set(conservativeOps.slice(0, 3).map((o) => o.protocol)),
        ],
        allocation: this.calculateOptimalAllocation(
          conservativeOps.slice(0, 3),
        ),
        estimatedGas: 0.5,
        steps: this.generateStrategySteps(
          conservativeOps.slice(0, 3),
          preferences.availableCapital,
        ),
      });
    }

    // Moderate strategy: Mix of lending and LP
    if (preferences.riskTolerance === "moderate") {
      const moderateOps = opportunities.filter(
        (o) => o.risk !== "high" && o.apy > 5,
      );

      strategies.push({
        id: "balanced-yield",
        name: "Balanced Yield Portfolio",
        description:
          "Combination of lending and liquidity provision for enhanced yields",
        targetAPY: this.calculateWeightedAPY(moderateOps.slice(0, 5)),
        risk: "moderate",
        protocols: [...new Set(moderateOps.slice(0, 5).map((o) => o.protocol))],
        allocation: this.calculateOptimalAllocation(moderateOps.slice(0, 5)),
        estimatedGas: 1.0,
        steps: this.generateStrategySteps(
          moderateOps.slice(0, 5),
          preferences.availableCapital,
        ),
      });
    }

    // Aggressive strategy: High APY farming and exotic strategies
    if (preferences.riskTolerance === "aggressive") {
      const aggressiveOps = opportunities.filter((o) => o.apy > 10).slice(0, 7);

      strategies.push({
        id: "high-yield-farming",
        name: "High Yield Farming Strategy",
        description:
          "Maximize returns through high-APY farming and staking opportunities",
        targetAPY: this.calculateWeightedAPY(aggressiveOps),
        risk: "aggressive",
        protocols: [...new Set(aggressiveOps.map((o) => o.protocol))],
        allocation: this.calculateOptimalAllocation(aggressiveOps),
        estimatedGas: 2.0,
        steps: this.generateStrategySteps(
          aggressiveOps,
          preferences.availableCapital,
        ),
      });
    }

    return strategies;
  }

  /**
   * Calculate optimal yield path for rebalancing
   */
  async calculateRebalancingPath(
    _currentPositions: DeFiPosition[],
    _targetStrategy: YieldStrategy,
  ): Promise<{
    withdrawals: Array<{ protocol: string; asset: string; amount: number }>;
    swaps: Array<{ from: string; to: string; amount: number }>;
    deposits: Array<{ protocol: string; asset: string; amount: number }>;
    estimatedGas: number;
    estimatedTime: number; // minutes
  }> {
    // Implementation for calculating optimal rebalancing path
    return {
      withdrawals: [],
      swaps: [],
      deposits: [],
      estimatedGas: 0,
      estimatedTime: 0,
    };
  }

  private async fetchLendingOpportunities(): Promise<YieldOpportunity[]> {
    const opportunities: YieldOpportunity[] = [];

    try {
      // Use generalized protocol fetcher
      const [aries, echelon, echo, meso] = await Promise.allSettled([
        this.fetchProtocolOpportunities("Aries", PROTOCOL_ADDRESSES.ARIES, {
          resourceFilters: [
            `${PROTOCOL_ADDRESSES.ARIES}::reserve::ReserveCoinContainer`,
          ],
          opportunityType: "lending",
          protocolType: "lending",
          risk: "low",
          features: ["Auto-compound", "No lock period"],
        }),
        this.fetchProtocolOpportunities("Echelon", PROTOCOL_ADDRESSES.ECHELON, {
          resourceFilters: [`${PROTOCOL_ADDRESSES.ECHELON}::lending::Lending`],
          opportunityType: "lending",
          protocolType: "lending",
          risk: "low",
          features: ["Flexible withdrawal", "Isolated markets"],
        }),
        this.fetchProtocolOpportunities("Echo", PROTOCOL_ADDRESSES.ECHO, {
          resourceFilters: [`${PROTOCOL_ADDRESSES.ECHO}::lending`],
          opportunityType: "lending",
          protocolType: "lending",
          risk: "low",
          features: ["Bitcoin lending"],
        }),
        this.fetchProtocolOpportunities("Meso", PROTOCOL_ADDRESSES.MESO, {
          resourceFilters: [`${PROTOCOL_ADDRESSES.MESO}::lending`],
          opportunityType: "lending",
          protocolType: "lending",
          risk: "medium",
          features: ["Cross-chain lending"],
        }),
      ]);

      // Process results and convert to YieldOpportunity format
      const allResults = [aries, echelon, echo, meso].filter(
        (result) => result.status === "fulfilled",
      );
      for (const result of allResults) {
        if (result.status === "fulfilled") {
          opportunities.push(
            ...result.value.map(this.convertProtocolToYieldOpportunity),
          );
        }
      }
    } catch (error) {
      logger.error("Error fetching lending opportunities:", error);
    }

    return opportunities;
  }

  /**
   * Convert ProtocolOpportunity to YieldOpportunity format
   */
  private convertProtocolToYieldOpportunity(
    protocolOpp: ProtocolOpportunity,
  ): YieldOpportunity {
    return {
      id: protocolOpp.id,
      protocol: protocolOpp.protocol,
      protocolType: protocolOpp.protocolType,
      opportunityType: protocolOpp.opportunityType,
      asset: protocolOpp.asset,
      assetSymbol: protocolOpp.assetSymbol,
      pairedAsset: protocolOpp.pairedAsset,
      pairedAssetSymbol: protocolOpp.pairedAssetSymbol,
      apy: protocolOpp.apy,
      tvl: protocolOpp.tvl,
      risk: protocolOpp.risk,
      features: protocolOpp.features,
      rewards: protocolOpp.rewards,
      isActive: protocolOpp.isActive,
    };
  }

  /**
   * Fetch protocol opportunities using the generalized fetcher
   */
  private async fetchProtocolOpportunities(
    protocolName: string,
    protocolAddress: string,
    config: {
      resourceFilters: string[];
      opportunityType:
        | "lending"
        | "liquidity"
        | "staking"
        | "farming"
        | "vault";
      protocolType: string;
      risk: "low" | "medium" | "high";
      features: string[];
    },
  ): Promise<ProtocolOpportunity[]> {
    return this.resourceFetcher.fetchProtocolOpportunities(
      protocolName,
      protocolAddress,
      config,
    );
  }

  private async fetchLiquidityOpportunities(): Promise<YieldOpportunity[]> {
    const opportunities: YieldOpportunity[] = [];

    try {
      const [thala, liquidswap] = await Promise.allSettled([
        this.fetchProtocolOpportunities("Thala", PROTOCOL_ADDRESSES.THALA, {
          resourceFilters: [
            `${PROTOCOL_ADDRESSES.THALA}::stable_pool::StablePool`,
            `${PROTOCOL_ADDRESSES.THALA}::weighted_pool::WeightedPool`,
          ],
          opportunityType: "liquidity",
          protocolType: "dex",
          risk: "medium",
          features: ["Trading fees", "THL rewards"],
        }),
        this.fetchProtocolOpportunities(
          "LiquidSwap",
          PROTOCOL_ADDRESSES.LIQUIDSWAP,
          {
            resourceFilters: [`liquidity_pool::LiquidityPool`],
            opportunityType: "liquidity",
            protocolType: "dex",
            risk: "medium",
            features: ["Low fees", "Stable pools"],
          },
        ),
      ]);

      // Process results
      const allResults = [thala, liquidswap].filter(
        (result) => result.status === "fulfilled",
      );
      for (const result of allResults) {
        if (result.status === "fulfilled") {
          opportunities.push(
            ...result.value.map(this.convertProtocolToYieldOpportunity),
          );
        }
      }
    } catch (error) {
      logger.error("Error fetching liquidity opportunities:", error);
    }

    return opportunities;
  }

  private async fetchStakingOpportunities(): Promise<YieldOpportunity[]> {
    const opportunities: YieldOpportunity[] = [];

    try {
      const [amnis] = await Promise.allSettled([
        this.fetchProtocolOpportunities("Amnis", PROTOCOL_ADDRESSES.AMNIS, {
          resourceFilters: [`${PROTOCOL_ADDRESSES.AMNIS}::amapt_token`],
          opportunityType: "staking",
          protocolType: "liquid_staking",
          risk: "low",
          features: ["Liquid staking", "stAPT token"],
        }),
      ]);

      // Process results
      const allResults = [amnis].filter(
        (result) => result.status === "fulfilled",
      );
      for (const result of allResults) {
        if (result.status === "fulfilled") {
          opportunities.push(
            ...result.value.map(this.convertProtocolToYieldOpportunity),
          );
        }
      }
    } catch (error) {
      logger.error("Error fetching staking opportunities:", error);
    }

    return opportunities;
  }

  private async fetchFarmingOpportunities(): Promise<YieldOpportunity[]> {
    const opportunities: YieldOpportunity[] = [];

    try {
      const [thalaFarm] = await Promise.allSettled([
        this.fetchProtocolOpportunities(
          "Thala Farm",
          PROTOCOL_ADDRESSES.THALA_FARM,
          {
            resourceFilters: [`${PROTOCOL_ADDRESSES.THALA_FARM}::farming`],
            opportunityType: "farming",
            protocolType: "farming",
            risk: "medium",
            features: ["Auto-compound", "THL rewards"],
          },
        ),
      ]);

      // Process results
      if (thalaFarm.status === "fulfilled") {
        opportunities.push(
          ...thalaFarm.value.map(this.convertProtocolToYieldOpportunity),
        );
      }
    } catch (error) {
      logger.error("Error fetching farming opportunities:", error);
    }

    return opportunities;
  }

  private async enrichWithUserData(
    opportunities: YieldOpportunity[],
    walletAddress: string,
  ): Promise<void> {
    // Add user's current deposits to opportunities
    // This would fetch from DeFi positions
    logger.debug(
      `Enriching ${opportunities.length} opportunities for wallet ${walletAddress}`,
    );
    // TODO: Implement user position enrichment
  }

  private calculateWeightedAPY(opportunities: YieldOpportunity[]): number {
    if (opportunities.length === 0) return 0;
    const totalValue = opportunities.reduce((sum, o) => sum + (o.tvl || 0), 0);
    if (totalValue === 0) return 0;

    return opportunities.reduce(
      (sum, o) => sum + (o.apy * (o.tvl || 0)) / totalValue,
      0,
    );
  }

  private calculateOptimalAllocation(
    opportunities: YieldOpportunity[],
  ): Record<string, number> {
    const allocation: Record<string, number> = {};
    const total = opportunities.length;

    opportunities.forEach((o) => {
      if (!allocation[o.protocol]) {
        allocation[o.protocol] = 0;
      }
      allocation[o.protocol] += 100 / total;
    });

    return allocation;
  }

  private generateStrategySteps(
    opportunities: YieldOpportunity[],
    capital: number,
  ): YieldStrategyStep[] {
    const steps: YieldStrategyStep[] = [];
    const allocation = 1 / opportunities.length;

    opportunities.forEach((o) => {
      steps.push({
        protocol: o.protocol,
        action: "deposit",
        asset: o.asset,
        amount: (capital * allocation).toString(),
        targetAsset: o.pairedAsset,
        estimatedAPY: o.apy,
      });
    });

    return steps;
  }

  /**
   * Fetch opportunities from DefiLlama
   */
  private async fetchDefiLlamaOpportunities(): Promise<YieldOpportunity[]> {
    try {
      const aptosPools = await this.defiLlama.getAptosPools();
      return aptosPools.map((pool) => this.defiLlama.transformPool(pool));
    } catch (error) {
      logger.error("Error fetching DefiLlama opportunities:", error);
      return [];
    }
  }
}
