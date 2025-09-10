import { LST_TOKEN_ADDRESSES } from "@/lib/constants/tokens/lst";
import { UnifiedCache } from "@/lib/utils/cache/unified-cache";
import { logger } from "@/lib/utils/core/logger";

// Define LST token configurations
interface LSTTokenConfig {
  symbol: string;
  name: string;
  asset_type: string;
  decimals: number;
  protocol: string;
  apy?: number;
  type: "FA";
}

// Token addresses are imported at the top of the file

const LST_TOKEN_CONFIGS: LSTTokenConfig[] = [
  {
    symbol: "amAPT",
    name: "Amnis APT",
    asset_type: "0xa259be733b6a759909f92815927fa213904df6540519568692caf0b068fe8e62",
    decimals: 8,
    protocol: "Amnis",
    type: "FA",
  },
  {
    symbol: "stAPT",
    name: "Staked APT",
    asset_type: "0xb614bfdf9edc39b330bbf9c3c5bcd0473eee2f6d4e21748629cc367869ece627",
    decimals: 8,
    protocol: "Amnis",
    type: "FA",
  },
  {
    symbol: "sthAPT",
    name: "Staked Thala APT",
    asset_type: "0x0a9ce1bddf93b074697ec5e483bc5050bc64cff2acd31e1ccfd8ac8cae5e4abe",
    decimals: 8,
    protocol: "Thala",
    type: "FA",
  },
  {
    symbol: "thAPT",
    name: "Thala APT",
    asset_type: "0xa0d9d647c5737a5aed08d2cfeb39c31cf901d44bc4aa024eaa7e5e68b804e011",
    decimals: 8,
    protocol: "Thala",
    type: "FA",
  },
  {
    symbol: "stAPT-Ditto",
    name: "Ditto Staked Aptos",
    asset_type: "0x517c121de6b75f6b811786f370a19561d8c993e63c9a00173186017fd1956708",
    decimals: 8,
    protocol: "Ditto",
    type: "FA",
  },
];

export interface LSTTokenSupply {
  symbol: string;
  name: string;
  supply: string;
  formatted_supply: string;
  decimals: number;
  protocol: string;
  apy?: number;
  percentage?: number;
}

export interface LSTSuppliesResponse {
  success: boolean;
  total_supply: string;
  total_supply_formatted: string;
  supplies: LSTTokenSupply[];
  timestamp: string;
  error?: string;
}

export class LiquidStakingService {
  private static cache = new UnifiedCache<LSTSuppliesResponse>({
    ttl: 5 * 60 * 1000,
  });
  private static readonly CACHE_KEY = "lst:supply:individual:v2";

  /**
   * Get detailed LST supply data
   */
  static async getLSTSupplyDetailed(forceRefresh = false): Promise<LSTSuppliesResponse> {
    // Clear cache if forcing refresh
    if (forceRefresh) {
      LiquidStakingService.cache.clear();
    }

    // Check cache first
    if (!forceRefresh) {
      const cached = LiquidStakingService.cache.get(LiquidStakingService.CACHE_KEY);
      if (cached) {
        return cached;
      }
    }

    try {
      const supplies = await LiquidStakingService.fetchAllLSTSupplies();
      logger.info(`Individual LST tokens fetched: ${supplies.map((s) => s.symbol).join(", ")}`);

      const response = LiquidStakingService.formatSupplyResponse(supplies);
      logger.info(
        `Final response has ${response.supplies.length} tokens: ${response.supplies.map((s) => s.symbol).join(", ")}`
      );

      // Cache successful response
      LiquidStakingService.cache.set(LiquidStakingService.CACHE_KEY, response, 5 * 60 * 1000);

      return response;
    } catch (error) {
      logger.error("Failed to fetch LST supplies:", error);

      // Try to return cached data even if expired
      const stale = LiquidStakingService.cache.get<LSTSuppliesResponse>(
        LiquidStakingService.CACHE_KEY
      );
      if (stale) {
        return { ...stale, error: "Using cached data (stale)" };
      }

      return {
        success: false,
        total_supply: "0",
        total_supply_formatted: "0.00",
        supplies: [],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Fetch all LST token supplies
   */
  private static async fetchAllLSTSupplies(): Promise<LSTTokenSupply[]> {
    const startTime = Date.now();

    try {
      const supplies = await Promise.all(
        LST_TOKEN_CONFIGS.map((token) => LiquidStakingService.fetchTokenSupply(token))
      );

      logger.info(
        `Fetched ${supplies.filter((s) => s !== null).length}/${supplies.length} LST supplies in ${Date.now() - startTime}ms`
      );

      return supplies.filter((s) => s !== null) as LSTTokenSupply[];
    } catch (error) {
      logger.error("Failed to fetch all LST supplies:", error);
      throw error;
    }
  }

  /**
   * Fetch individual LST token supply from metadata
   */
  private static async fetchTokenSupply(token: LSTTokenConfig): Promise<LSTTokenSupply | null> {
    try {
      const query = `query GetFAMetadata {
        fungible_asset_metadata(where: {
          asset_type: {_eq: "${token.asset_type}"}
        }) {
          supply_v2
          decimals
        }
      }`;

      const response = await fetch("https://api.mainnet.aptoslabs.com/v1/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.APTOS_BUILD_SECRET}`,
        },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors) {
        const errorMessages = data.errors.map((e: any) => e.message);
        throw new Error(`GraphQL errors: ${errorMessages.join(", ")}`);
      }

      const metadata = data.data?.fungible_asset_metadata?.[0];

      if (!metadata) {
        logger.warn(`No metadata found for token ${token.symbol}`);
        return null;
      }

      // Use supply_v2 from metadata
      const supply = metadata.supply_v2 ? String(metadata.supply_v2) : "0";

      // If supply is 0, we might still want to show the token
      const supplyBigInt = BigInt(supply);
      const divisor = BigInt(10 ** token.decimals);
      const formattedSupply = Number(supplyBigInt) / Number(divisor);

      // Log tokens with zero supply for debugging
      if (supply === "0") {
        logger.info(`Token ${token.symbol} has zero supply`);
      }

      return {
        symbol: token.symbol,
        name: token.name,
        supply: supply,
        formatted_supply: formattedSupply.toFixed(2),
        decimals: token.decimals,
        protocol: token.protocol,
      };
    } catch (error) {
      logger.error(`Failed to fetch ${token.symbol} supply:`, error);
      return null;
    }
  }

  /**
   * Format supply response grouped by protocol with individual token breakdowns
   */
  private static formatSupplyResponse(supplies: LSTTokenSupply[]): LSTSuppliesResponse {
    // Filter out tokens with zero supply to show only active LSTs
    const activeSupplies = supplies.filter((supply) => parseFloat(supply.formatted_supply) > 0);

    logger.info(`Filtered to ${activeSupplies.length} active LSTs out of ${supplies.length} total`);

    // Group supplies by protocol and maintain individual token breakdowns
    const protocolGroups = activeSupplies.reduce(
      (groups, supply) => {
        const protocol = supply.protocol;
        if (!groups[protocol]) {
          groups[protocol] = {
            symbol: LiquidStakingService.getProtocolDisplaySymbol(protocol, []),
            name: LiquidStakingService.getProtocolName(protocol),
            supply: "0",
            formatted_supply: "0",
            decimals: 8,
            protocol: protocol,
            tokenBreakdown: [],
          };
        }

        // Add individual token to breakdown
        const protocolGroup = groups[protocol];
        protocolGroup.tokenBreakdown.push({
          symbol: supply.symbol,
          supply: supply.supply,
          formatted_supply: supply.formatted_supply,
        });

        // Update the display symbol with all tokens in the group
        protocolGroup.symbol = LiquidStakingService.getProtocolDisplaySymbol(
          protocol,
          protocolGroup.tokenBreakdown
        );

        // Add to the protocol totals
        protocolGroup.supply = (BigInt(protocolGroup.supply) + BigInt(supply.supply)).toString();
        protocolGroup.formatted_supply = (
          parseFloat(protocolGroup.formatted_supply) + parseFloat(supply.formatted_supply)
        ).toFixed(2);

        return groups;
      },
      {} as Record<
        string,
        LSTTokenSupply & {
          tokenBreakdown: Array<{
            symbol: string;
            supply: string;
            formatted_supply: string;
          }>;
        }
      >
    );

    // Convert back to array
    const combinedSupplies = Object.values(protocolGroups);

    // Calculate total supply in APT terms
    let totalSupply = BigInt(0);
    let totalFormatted = 0;

    for (const supply of combinedSupplies) {
      totalSupply += BigInt(supply.supply);
      totalFormatted += parseFloat(supply.formatted_supply);
    }

    // Add percentages based on combined protocol totals
    const suppliesWithPercentage = combinedSupplies.map((supply) => ({
      ...supply,
      percentage:
        totalFormatted > 0 ? (parseFloat(supply.formatted_supply) / totalFormatted) * 100 : 0,
    }));

    // Sort by supply descending
    suppliesWithPercentage.sort(
      (a, b) => parseFloat(b.formatted_supply) - parseFloat(a.formatted_supply)
    );

    return {
      success: true,
      total_supply: totalSupply.toString(),
      total_supply_formatted: totalFormatted.toFixed(2),
      supplies: suppliesWithPercentage,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get protocol display symbol with token breakdown
   */
  private static getProtocolDisplaySymbol(
    protocol: string,
    tokens: Array<{ symbol: string }>
  ): string {
    const tokenSymbols = tokens.map((t) => t.symbol).sort();
    if (tokenSymbols.length === 0) return protocol;

    switch (protocol) {
      case "Amnis":
        return tokenSymbols.join(" / ") || "Amnis";
      case "Thala":
        return tokenSymbols.join(" / ") || "Thala";
      case "Kofi":
        return tokenSymbols.join(" / ") || "Kofi";
      case "Trustake":
        return tokenSymbols.join(" / ") || "Trustake";
      default:
        return tokenSymbols.join(" / ") || protocol;
    }
  }

  /**
   * Get protocol display name
   */
  private static getProtocolName(protocol: string): string {
    switch (protocol) {
      case "Amnis":
        return "Amnis Liquid Staking";
      case "Thala":
        return "Thala Liquid Staking";
      case "Kofi":
        return "Kofi Liquid Staking";
      case "Trustake":
        return "Trustake Liquid Staking";
      default:
        return `${protocol} Liquid Staking`;
    }
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function fetchLSTSuppliesData(): Promise<LSTSuppliesResponse> {
  return LiquidStakingService.getLSTSupplyDetailed();
}
