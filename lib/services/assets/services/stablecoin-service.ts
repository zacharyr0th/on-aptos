import { enhancedFetch } from "@/lib/utils/fetch-utils";
import { logger } from "@/lib/utils/logger";

import { CACHE_TTL, DECIMALS } from "../constants";
import type { StablecoinSupply } from "../types";
import { BaseAssetService } from "../utils/base-service";
import {
  formatTokenAmount,
  calculatePercentage,
  sortBySupply,
} from "../utils/formatting";
import { executeGraphQLQuery } from "../utils/graphql-helpers";

interface StablecoinMetadata {
  name: string;
  symbol: string;
  issuer: string;
  peggedTo: string;
  isAlgorithmic: boolean;
  assetType: string;
  decimals: number;
}

export class StablecoinService extends BaseAssetService {
  private static readonly STABLECOIN_METADATA: StablecoinMetadata[] = [
    {
      name: "USD Coin",
      symbol: "USDC",
      issuer: "Circle",
      peggedTo: "USD",
      isAlgorithmic: false,
      assetType:
        "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
      decimals: 6,
    },
    {
      name: "Tether USD",
      symbol: "USDT",
      issuer: "Tether",
      peggedTo: "USD",
      isAlgorithmic: false,
      assetType:
        "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
      decimals: 6,
    },
    // Add more stablecoins as needed
  ];

  private static readonly TETHER_RESERVE_ADDRESS =
    "0x84d1d3f9c7e49e7d1f1f8a87f8b4a7a3e1b2c8a5d6f9e8c7b4a3e2d1c8b7a6f5";

  /**
   * Get stablecoin supplies
   */
  static async getStablecoinSupplies(
    forceRefresh = false,
  ): Promise<StablecoinSupply[]> {
    const cacheKey = "stablecoin:supplies";

    return this.getCachedOrFetch(
      cacheKey,
      async () => {
        const supplies = await this.fetchAllStablecoinSupplies();
        return this.processSupplies(supplies);
      },
      forceRefresh ? 0 : CACHE_TTL.STABLECOIN_SUPPLY,
    );
  }

  /**
   * Fetch all stablecoin supplies
   */
  private static async fetchAllStablecoinSupplies(): Promise<
    Array<{
      metadata: StablecoinMetadata;
      rawSupply: number;
    }>
  > {
    const startTime = Date.now();

    try {
      // Batch all non-USDT queries into a single request
      const nonUSDTMetadata = this.STABLECOIN_METADATA.filter(
        (m) => m.symbol !== "USDT",
      );
      const usdtMetadata = this.STABLECOIN_METADATA.find(
        (m) => m.symbol === "USDT",
      );

      // Build dynamic query for all non-USDT stablecoins
      const aliases = nonUSDTMetadata.map((_, i) => `stable${i}`).join("\n");
      const query = `
        query GetAllStablecoinSupplies(${nonUSDTMetadata.map((_, i) => `$asset${i}: String!`).join(", ")}) {
          ${nonUSDTMetadata
            .map(
              (_, i) => `
            stable${i}: fungible_asset_metadata(where: { asset_type: { _eq: $asset${i} } }) {
              supply_v2
            }
          `,
            )
            .join("\n")}
        }
      `;

      const variables = nonUSDTMetadata.reduce(
        (acc, metadata, i) => {
          acc[`asset${i}`] = metadata.assetType;
          return acc;
        },
        {} as Record<string, string>,
      );

      const data = await executeGraphQLQuery<
        Record<string, Array<{ supply_v2: string }>>
      >(query, variables);

      const results: Array<{
        metadata: StablecoinMetadata;
        rawSupply: number;
      }> = [];

      // Process non-USDT results
      nonUSDTMetadata.forEach((metadata, i) => {
        const supply = data[`stable${i}`]?.[0]?.supply_v2;
        results.push({
          metadata,
          rawSupply: supply ? parseFloat(supply) : 0,
        });
      });

      // Handle USDT separately due to its special logic
      if (usdtMetadata) {
        const usdtSupply = await this.fetchUSDTCirculatingSupply(usdtMetadata);
        results.push({
          metadata: usdtMetadata,
          rawSupply: usdtSupply,
        });
      }

      this.logMetrics("fetchAllStablecoinSupplies", startTime, true, {
        totalStablecoins: this.STABLECOIN_METADATA.length,
        fetchedCount: results.length,
      });

      return results;
    } catch (error) {
      this.logMetrics("fetchAllStablecoinSupplies", startTime, false);
      throw error;
    }
  }

  /**
   * Fetch supply for a single stablecoin
   */
  private static async fetchStablecoinSupply(
    metadata: StablecoinMetadata,
  ): Promise<number> {
    try {
      // Special handling for USDT (subtract reserves)
      if (metadata.symbol === "USDT") {
        return this.fetchUSDTCirculatingSupply(metadata);
      }

      // Get supply from fungible asset metadata
      const data = await executeGraphQLQuery<{
        fungible_asset_metadata: Array<{
          supply_v2: string;
        }>;
      }>(
        `
        query GetStablecoinSupply($assetType: String!) {
          fungible_asset_metadata(where: { asset_type: { _eq: $assetType } }) {
            supply_v2
          }
        }
      `,
        { assetType: metadata.assetType },
      );

      if (data.fungible_asset_metadata?.length > 0) {
        return parseFloat(data.fungible_asset_metadata[0].supply_v2 || "0");
      }

      return 0;
    } catch (error) {
      logger.warn(`Failed to fetch supply for ${metadata.symbol}:`, error);
      return 0;
    }
  }

  /**
   * Fetch USDT circulating supply (total supply - reserves)
   */
  private static async fetchUSDTCirculatingSupply(
    metadata: StablecoinMetadata,
  ): Promise<number> {
    try {
      // Batch both queries into a single request
      const query = `
        query GetUSDTSupplyAndReserves($assetType: String!, $ownerAddress: String!) {
          fungible_asset_metadata(where: { asset_type: { _eq: $assetType } }) {
            supply_v2
          }
          current_fungible_asset_balances(
            where: {
              asset_type: { _eq: $assetType },
              owner_address: { _eq: $ownerAddress }
            }
          ) {
            amount
          }
        }
      `;

      const data = await executeGraphQLQuery<{
        fungible_asset_metadata: Array<{ supply_v2: string }>;
        current_fungible_asset_balances: Array<{ amount: string }>;
      }>(query, {
        assetType: metadata.assetType,
        ownerAddress: this.TETHER_RESERVE_ADDRESS,
      });

      const totalSupply = data.fungible_asset_metadata?.[0]?.supply_v2
        ? parseFloat(data.fungible_asset_metadata[0].supply_v2)
        : 0;

      const reserves = data.current_fungible_asset_balances?.[0]?.amount
        ? parseFloat(data.current_fungible_asset_balances[0].amount)
        : 0;

      // Return circulating supply (total - reserves)
      return Math.max(0, totalSupply - reserves);
    } catch (error) {
      logger.error("Failed to fetch USDT circulating supply:", error);
      return 0;
    }
  }

  /**
   * Process and format stablecoin supplies
   */
  private static processSupplies(
    supplies: Array<{
      metadata: StablecoinMetadata;
      rawSupply: number;
    }>,
  ): StablecoinSupply[] {
    const processed: StablecoinSupply[] = [];
    let totalSupply = 0;

    // Process each stablecoin
    for (const { metadata, rawSupply } of supplies) {
      if (rawSupply <= 0) continue;

      const formattedSupply = formatTokenAmount(rawSupply, metadata.decimals);
      totalSupply += formattedSupply;

      processed.push({
        asset: metadata.assetType,
        name: metadata.name,
        symbol: metadata.symbol,
        supply: formattedSupply,
        decimals: metadata.decimals,
        type: "fa",
        issuer: metadata.issuer,
        peggedTo: metadata.peggedTo,
        isAlgorithmic: metadata.isAlgorithmic,
      });
    }

    // Calculate percentages and sort by supply
    const withPercentages = processed.map((stablecoin) => ({
      ...stablecoin,
      percentage: calculatePercentage(stablecoin.supply, totalSupply),
    }));

    return sortBySupply(withPercentages);
  }
}
