import { PROTOCOLS } from "@/lib/constants/protocols/protocol-registry";
import { COMMON_TOKENS } from "@/lib/constants/tokens/addresses";
import { TokenRegistry } from "@/lib/services/shared/utils/token-registry";
import { logger } from "@/lib/utils/core/logger";
import type { ProtocolOpportunity } from "./types";

// Type definitions for Aptos resources
interface AptosResource {
  type: string;
  data: Record<string, unknown>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface TableParams {
  table: string;
  data: {
    key_type: string;
    value_type: string;
    key: unknown;
  };
}

interface RewardToken {
  token?: string;
  address?: string;
  apr?: number;
  apy?: number;
}

/**
 * Helper service for fetching Aptos blockchain resources
 * Based on DefiLlama patterns for Aptos protocols
 */
export class AptosResourceFetcher {
  private static instance: AptosResourceFetcher;
  private apiUrl = "https://api.mainnet.aptoslabs.com/v1";
  private cache = new Map<string, CacheEntry<unknown>>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): AptosResourceFetcher {
    if (!AptosResourceFetcher.instance) {
      AptosResourceFetcher.instance = new AptosResourceFetcher();
    }
    return AptosResourceFetcher.instance;
  }

  /**
   * Get resources for an account with caching
   */
  async getResources(account: string): Promise<AptosResource[]> {
    if (!account || typeof account !== "string") {
      throw new Error("Invalid account address provided");
    }

    const cacheKey = `resources:${account}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      logger.debug(`Cache hit for resources: ${account}`);
      return cached.data as AptosResource[];
    }

    const startTime = Date.now();
    let attempt = 0;
    const maxRetries = 3;
    const baseDelay = 1000;

    while (attempt <= maxRetries) {
      try {
        logger.debug(
          `Fetching resources for ${account} (attempt ${attempt + 1}/${maxRetries + 1})`
        );

        const response = await fetch(`${this.apiUrl}/accounts/${account}/resources`, {
          headers: {
            "Content-Type": "application/json",
            ...(process.env.APTOS_BUILD_SECRET
              ? { Authorization: `Bearer ${process.env.APTOS_BUILD_SECRET}` }
              : {}),
          },
          // Add timeout
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid response format: expected array of resources");
        }

        const duration = Date.now() - startTime;
        logger.debug(
          `Successfully fetched ${data.length} resources for ${account} in ${duration}ms`
        );

        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } catch (error) {
        attempt++;

        if (attempt > maxRetries) {
          logger.error(
            `Failed to fetch resources for ${account} after ${maxRetries + 1} attempts:`,
            {
              error: error instanceof Error ? error.message : String(error),
              account,
              duration: Date.now() - startTime,
              stack: error instanceof Error ? error.stack : undefined,
            }
          );
          throw error;
        }

        // Exponential backoff
        const delay = baseDelay * 2 ** (attempt - 1);
        logger.warn(
          `Attempt ${attempt} failed for ${account}, retrying in ${delay}ms:`,
          error instanceof Error ? error.message : String(error)
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error("Unexpected error in resource fetching loop");
  }

  /**
   * Get a specific resource
   */
  async getResource(account: string, resourceType: string): Promise<AptosResource | undefined> {
    const resources = await this.getResources(account);
    return resources.find((r) => (r as any).type === resourceType);
  }

  /**
   * Get table data (for protocols that use tables)
   */
  async getTableData(params: TableParams): Promise<unknown> {
    try {
      const response = await fetch(`${this.apiUrl}/tables/${params.table}/item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.APTOS_BUILD_SECRET
            ? { Authorization: `Bearer ${process.env.APTOS_BUILD_SECRET}` }
            : {}),
        },
        body: JSON.stringify(params.data),
      });

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
    return TokenRegistry.getSymbolFromAddress(address);
  }

  /**
   * Get protocol addresses
   */
  static get PROTOCOL_ADDRESSES() {
    return {
      ARIES: PROTOCOLS.ARIES_MARKETS.addresses[0],
      ECHELON: PROTOCOLS.ECHELON.addresses[0],
      ECHO: PROTOCOLS.ECHO_LENDING.addresses[0],
      MESO: PROTOCOLS.MESO_FINANCE.addresses[0],
      THALA: PROTOCOLS.THALA_INFRA.addresses[0],
      LIQUIDSWAP: PROTOCOLS.LIQUIDSWAP.addresses[6],
      PANCAKESWAP: PROTOCOLS.PANCAKESWAP.addresses[3],
      SUSHISWAP: PROTOCOLS.SUSHISWAP.addresses[0],
      AMNIS: PROTOCOLS.AMNIS_FINANCE.addresses[0],
      THALA_FARM: PROTOCOLS.THALA_FARM.addresses[0],
      THALA_CDP: PROTOCOLS.THALA_CDP.addresses[0],
    };
  }

  /**
   * Get token addresses
   */
  static get TOKEN_ADDRESSES() {
    return COMMON_TOKENS;
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
      opportunityType: "lending" | "liquidity" | "staking" | "farming" | "vault";
      protocolType: string;
      risk: "low" | "medium" | "high";
      features: string[];
    }
  ): Promise<ProtocolOpportunity[]> {
    // Validate inputs
    if (!protocolName?.trim()) {
      logger.warn("Invalid protocol name provided");
      return [];
    }
    if (!protocolAddress?.trim()) {
      logger.warn("Invalid protocol address provided");
      return [];
    }
    if (!Array.isArray(config.resourceFilters) || config.resourceFilters.length === 0) {
      logger.warn(`No resource filters provided for ${protocolName}`);
      return [];
    }

    const opportunities: ProtocolOpportunity[] = [];
    const startTime = Date.now();

    try {
      logger.debug(`Fetching opportunities for ${protocolName} at ${protocolAddress}`);

      const resources = await this.getResources(protocolAddress);

      if (!resources || resources.length === 0) {
        logger.info(`No resources found for ${protocolName} at ${protocolAddress}`);
        return [];
      }

      // Filter resources based on config
      const relevantResources = resources.filter((r: AptosResource) => {
        if (!r || typeof (r as any).type !== "string") {
          logger.debug(`Invalid resource format found for ${protocolName}:`, r);
          return false;
        }
        return config.resourceFilters.some((filter) => (r as any).type.includes(filter));
      });

      logger.debug(
        `Found ${relevantResources.length} relevant resources out of ${resources.length} total for ${protocolName}`
      );

      const parsePromises = relevantResources.map(async (resource) => {
        try {
          return await this.parseResourceToOpportunity(resource, protocolName, config);
        } catch (error) {
          logger.warn(`Failed to parse resource for ${protocolName}:`, {
            error: error instanceof Error ? error.message : String(error),
            resourceType: resource?.type,
          });
          return null;
        }
      });

      const parsedOpportunities = await Promise.allSettled(parsePromises);

      parsedOpportunities.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) {
          opportunities.push(result.value);
        } else if (result.status === "rejected") {
          logger.debug(`Failed to parse opportunity ${index} for ${protocolName}:`, result.reason);
        }
      });

      const duration = Date.now() - startTime;
      logger.info(
        `Fetched ${opportunities.length} opportunities for ${protocolName} in ${duration}ms`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Error fetching ${protocolName} opportunities after ${duration}ms:`, {
        error: error instanceof Error ? error.message : String(error),
        protocolName,
        protocolAddress,
        config,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    return opportunities;
  }

  /**
   * Parse resource data into opportunity format
   */
  private async parseResourceToOpportunity(
    resource: AptosResource,
    protocolName: string,
    config: {
      opportunityType: "lending" | "liquidity" | "staking" | "farming" | "vault";
      protocolType: string;
      risk: "low" | "medium" | "high";
      features: string[];
    }
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
  calculateAPY(resourceData: Record<string, unknown>, opportunityType: string): number {
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
  calculateTVL(resourceData: Record<string, unknown>, opportunityType: string): number {
    if (!resourceData) return 0;

    switch (opportunityType) {
      case "lending":
        return (
          parseFloat(
            (resourceData as any).underlying_coin?.value ||
              (resourceData as any).total_supplied ||
              "0"
          ) / 1e8
        );
      case "liquidity": {
        const reserve0 = parseFloat(
          (resourceData as any).coin_x_reserve?.value || (resourceData as any).asset_0?.value || "0"
        );
        const reserve1 = parseFloat(
          (resourceData as any).coin_y_reserve?.value || (resourceData as any).asset_1?.value || "0"
        );
        return (reserve0 + reserve1) / 1e8;
      }
      case "staking":
        return (
          parseFloat(
            (resourceData as any).total_staked?.value ||
              (resourceData as any).pool_balance?.value ||
              "0"
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
    resourceData: Record<string, unknown>
  ): Array<{ token: string; symbol: string; apr: number }> | undefined {
    if (!resourceData?.reward_tokens && !resourceData?.rewards) return undefined;

    const rewardTokens = (resourceData as any).reward_tokens || (resourceData as any).rewards || [];
    return rewardTokens.map((token: unknown) => ({
      token: typeof token === "string" ? token : (token as any)?.token || (token as any)?.address,
      symbol: this.getSymbol(
        typeof token === "string" ? token : (token as any)?.token || (token as any)?.address
      ),
      apr: (token as any)?.apr || (token as any)?.apy || (resourceData as any).reward_apr || 0,
    }));
  }

  /**
   * Check if resource is active
   */
  private isResourceActive(resourceData: Record<string, unknown>): boolean {
    if (!resourceData) return false;

    // Check various activity indicators
    const hasValue =
      parseFloat(
        (resourceData as any).underlying_coin?.value || (resourceData as any).total_supplied || "0"
      ) > 0;
    const isNotPaused = !(resourceData as any).is_paused && !(resourceData as any).paused;
    const hasPositiveAPY =
      parseFloat((resourceData as any).supply_apy || (resourceData as any).apy || "0") > 0;

    return hasValue && isNotPaused && hasPositiveAPY;
  }

  // Specific APY calculation methods
  private calculateLendingAPY(resourceData: Record<string, unknown>): number {
    const apy =
      (resourceData as any).supply_apy ||
      (resourceData as any).current_apy ||
      (resourceData as any).apy ||
      (resourceData as any).supply_rate ||
      0;

    // Convert from basis points if needed (10000 = 100%)
    return apy > 100 ? apy / 100 : apy;
  }

  private calculateLiquidityAPY(resourceData: Record<string, unknown>): number {
    const feeAPY = (resourceData as any).fee_apy || (resourceData as any).trading_fee_apy || 0;
    const rewardAPY = (resourceData as any).reward_apy || (resourceData as any).incentive_apy || 0;
    return feeAPY + rewardAPY;
  }

  private calculateStakingAPY(resourceData: Record<string, unknown>): number {
    return (
      (resourceData as any).staking_apy ||
      (resourceData as any).validator_apy ||
      (resourceData as any).apy ||
      0
    );
  }

  private calculateFarmingAPY(resourceData: Record<string, unknown>): number {
    const baseAPY = (resourceData as any).base_apy || (resourceData as any).lp_apy || 0;
    const farmingAPY = (resourceData as any).farming_apy || (resourceData as any).reward_apy || 0;
    return baseAPY + farmingAPY;
  }
}
