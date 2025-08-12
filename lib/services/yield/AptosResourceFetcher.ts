import {
  YIELD_PROTOCOL_ADDRESSES,
  YIELD_TOKEN_ADDRESSES,
  getSymbolFromAddress,
} from "@/lib/constants";
import { logger } from "@/lib/utils/core/logger";

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
 * Helper service for fetching Aptos blockchain resources
 * Based on DefiLlama patterns for Aptos protocols
 */
export class AptosResourceFetcher {
  private static instance: AptosResourceFetcher;
  private apiUrl = "https://api.mainnet.aptoslabs.com/v1";
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): AptosResourceFetcher {
    if (!this.instance) {
      this.instance = new AptosResourceFetcher();
    }
    return this.instance;
  }

  /**
   * Get resources for an account with caching
   */
  async getResources(account: string): Promise<any[]> {
    const cacheKey = `resources:${account}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/accounts/${account}/resources`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(process.env.APTOS_BUILD_SECRET
              ? { Authorization: `Bearer ${process.env.APTOS_BUILD_SECRET}` }
              : {}),
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch resources: ${response.statusText}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      logger.error(`Error fetching resources for ${account}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific resource
   */
  async getResource(account: string, resourceType: string): Promise<any> {
    const resources = await this.getResources(account);
    return resources.find((r) => r.type === resourceType);
  }

  /**
   * Get table data (for protocols that use tables)
   */
  async getTableData(params: {
    table: string;
    data: {
      key_type: string;
      value_type: string;
      key: any;
    };
  }): Promise<any> {
    try {
      const response = await fetch(
        `${this.apiUrl}/tables/${params.table}/item`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.APTOS_BUILD_SECRET
              ? { Authorization: `Bearer ${process.env.APTOS_BUILD_SECRET}` }
              : {}),
          },
          body: JSON.stringify(params.data),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch table data: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      logger.error("Error fetching table data:", error);
      throw error;
    }
  }

  /**
   * Extract coin address from a type string
   */
  extractCoinAddress(typeStr: string): string {
    const match = typeStr.match(/<([^>]+)>/);
    return match ? match[1].split(",")[0].trim() : "";
  }

  /**
   * Extract multiple coin addresses from pool types
   */
  extractPoolAssets(typeStr: string): string[] {
    const match = typeStr.match(/<([^>]+)>/);
    if (match) {
      return match[1]
        .split(",")
        .map((s) => s.trim())
        .filter((s) => !s.includes("Null")); // Filter out null placeholders
    }
    return [];
  }

  /**
   * Get symbol from token address
   */
  getSymbol(address: string): string {
    return getSymbolFromAddress(address);
  }

  /**
   * Get protocol addresses
   */
  static get PROTOCOL_ADDRESSES() {
    return YIELD_PROTOCOL_ADDRESSES;
  }

  /**
   * Get token addresses
   */
  static get TOKEN_ADDRESSES() {
    return YIELD_TOKEN_ADDRESSES;
  }

  /**
   * Convert hex string to UTF-8
   */
  hexToString(hex: string): string {
    try {
      // Remove 0x prefix if present
      const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
      return Buffer.from(cleanHex, "hex").toString("utf-8");
    } catch {
      logger.warn(`Failed to convert hex to string: ${hex}`);
      return "";
    }
  }

  /**
   * Convert string to hex
   */
  stringToHex(str: string): string {
    return Buffer.from(str, "utf-8").toString("hex");
  }

  /**
   * Generic protocol opportunity fetcher
   */
  async fetchProtocolOpportunities(
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
    const opportunities: ProtocolOpportunity[] = [];

    try {
      const resources = await this.getResources(protocolAddress);

      // Filter resources based on config
      const relevantResources = resources.filter((r: any) =>
        config.resourceFilters.some((filter) => r.type.includes(filter)),
      );

      for (const resource of relevantResources) {
        const opportunity = await this.parseResourceToOpportunity(
          resource,
          protocolName,
          config,
        );

        if (opportunity) {
          opportunities.push(opportunity);
        }
      }
    } catch (error) {
      logger.error(`Error fetching ${protocolName} opportunities:`, error);
    }

    return opportunities;
  }

  /**
   * Parse resource data into opportunity format
   */
  private async parseResourceToOpportunity(
    resource: any,
    protocolName: string,
    config: {
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
  ): Promise<ProtocolOpportunity | null> {
    try {
      const assets =
        config.opportunityType === "liquidity"
          ? this.extractPoolAssets(resource.type)
          : [this.extractCoinAddress(resource.type)];

      if (!assets.length || !assets[0]) return null;

      const primaryAsset = assets[0];
      const primarySymbol = this.getSymbol(primaryAsset);

      return {
        id: `${protocolName.toLowerCase()}-${primarySymbol.toLowerCase()}-${config.opportunityType}`,
        protocol: protocolName,
        protocolType: config.protocolType,
        opportunityType: config.opportunityType,
        asset: primaryAsset,
        assetSymbol: primarySymbol,
        pairedAsset: assets[1],
        pairedAssetSymbol: assets[1] ? this.getSymbol(assets[1]) : undefined,
        apy: this.calculateAPY(resource.data, config.opportunityType),
        tvl: this.calculateTVL(resource.data, config.opportunityType),
        risk: config.risk,
        features: config.features,
        rewards: this.extractRewards(resource.data),
        isActive: this.isResourceActive(resource.data),
      };
    } catch (error) {
      logger.error("Error parsing resource to opportunity:", error);
      return null;
    }
  }

  /**
   * Calculate APY from resource data
   */
  calculateAPY(resourceData: any, opportunityType: string): number {
    if (!resourceData) return 0;

    switch (opportunityType) {
      case "lending":
        return this.calculateLendingAPY(resourceData);
      case "liquidity":
        return this.calculateLiquidityAPY(resourceData);
      case "staking":
        return this.calculateStakingAPY(resourceData);
      case "farming":
        return this.calculateFarmingAPY(resourceData);
      default:
        return 0;
    }
  }

  /**
   * Calculate TVL from resource data
   */
  calculateTVL(resourceData: any, opportunityType: string): number {
    if (!resourceData) return 0;

    switch (opportunityType) {
      case "lending":
        return (
          parseFloat(
            resourceData.underlying_coin?.value ||
              resourceData.total_supplied ||
              "0",
          ) / 1e8
        );
      case "liquidity":
        const reserve0 = parseFloat(
          resourceData.coin_x_reserve?.value ||
            resourceData.asset_0?.value ||
            "0",
        );
        const reserve1 = parseFloat(
          resourceData.coin_y_reserve?.value ||
            resourceData.asset_1?.value ||
            "0",
        );
        return (reserve0 + reserve1) / 1e8;
      case "staking":
        return (
          parseFloat(
            resourceData.total_staked?.value ||
              resourceData.pool_balance?.value ||
              "0",
          ) / 1e8
        );
      default:
        return 0;
    }
  }

  /**
   * Extract rewards from resource data
   */
  private extractRewards(
    resourceData: any,
  ): Array<{ token: string; symbol: string; apr: number }> | undefined {
    if (!resourceData?.reward_tokens && !resourceData?.rewards)
      return undefined;

    const rewardTokens =
      resourceData.reward_tokens || resourceData.rewards || [];
    return rewardTokens.map((token: any) => ({
      token: typeof token === "string" ? token : token.token || token.address,
      symbol: this.getSymbol(
        typeof token === "string" ? token : token.token || token.address,
      ),
      apr: token.apr || token.apy || resourceData.reward_apr || 0,
    }));
  }

  /**
   * Check if resource is active
   */
  private isResourceActive(resourceData: any): boolean {
    if (!resourceData) return false;

    // Check various activity indicators
    const hasValue =
      parseFloat(
        resourceData.underlying_coin?.value ||
          resourceData.total_supplied ||
          "0",
      ) > 0;
    const isNotPaused = !resourceData.is_paused && !resourceData.paused;
    const hasPositiveAPY =
      parseFloat(resourceData.supply_apy || resourceData.apy || "0") > 0;

    return hasValue && isNotPaused && hasPositiveAPY;
  }

  // Specific APY calculation methods
  private calculateLendingAPY(resourceData: any): number {
    const apy =
      resourceData.supply_apy ||
      resourceData.current_apy ||
      resourceData.apy ||
      resourceData.supply_rate ||
      0;

    // Convert from basis points if needed (10000 = 100%)
    return apy > 100 ? apy / 100 : apy;
  }

  private calculateLiquidityAPY(resourceData: any): number {
    const feeAPY = resourceData.fee_apy || resourceData.trading_fee_apy || 0;
    const rewardAPY =
      resourceData.reward_apy || resourceData.incentive_apy || 0;
    return feeAPY + rewardAPY;
  }

  private calculateStakingAPY(resourceData: any): number {
    return (
      resourceData.staking_apy ||
      resourceData.validator_apy ||
      resourceData.apy ||
      0
    );
  }

  private calculateFarmingAPY(resourceData: any): number {
    const baseAPY = resourceData.base_apy || resourceData.lp_apy || 0;
    const farmingAPY = resourceData.farming_apy || resourceData.reward_apy || 0;
    return baseAPY + farmingAPY;
  }
}
