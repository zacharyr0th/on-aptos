import { SERVICE_CONFIG } from "@/lib/config/cache";
import {
  ALGO_STABLECOINS,
  CELER_STABLECOINS,
  LAYERZERO_STABLECOINS,
  STABLECOINS,
  WORMHOLE_STABLECOINS,
} from "@/lib/constants";
import { TETHER_RESERVES } from "@/lib/constants/tokens/addresses";
import { logger } from "@/lib/utils/core/logger";
import { formatBigIntWithDecimals } from "@/lib/utils/format";
import type {
  BridgedCoinConfig,
  CoinBalanceResponse,
  StablecoinData,
  StablecoinGraphQLResponse,
  StablecoinSupply,
} from "../shared/types";
import { BaseAssetService } from "../shared/utils/base-service";

// Constants
const INDEXER_URL = "https://indexer.mainnet.aptoslabs.com/v1/graphql";
const REST_API_URL = "https://api.mainnet.aptoslabs.com/v1";

// Configuration
const config = SERVICE_CONFIG.stables;

// Stablecoin metadata
const STABLECOIN_METADATA: Record<string, { symbol: string; decimals: number }> = {
  [STABLECOINS.USDC]: { symbol: "USDC", decimals: 6 },
  [STABLECOINS.USDT]: { symbol: "USDT", decimals: 6 },
  [STABLECOINS.USDE]: { symbol: "USDe", decimals: 6 },
  [STABLECOINS.SUSDE]: { symbol: "sUSDe", decimals: 6 },
  [STABLECOINS.USDA]: { symbol: "USDA", decimals: 8 },
  [ALGO_STABLECOINS.MOD]: { symbol: "MOD", decimals: 8 },
};

const BRIDGED_COINS: BridgedCoinConfig[] = [
  {
    symbol: "lzUSDC",
    name: "LayerZero USDC",
    asset_type: LAYERZERO_STABLECOINS.LZ_USDC,
    account: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa",
    decimals: 6,
  },
  {
    symbol: "lzUSDT",
    name: "LayerZero USDT",
    asset_type: LAYERZERO_STABLECOINS.LZ_USDT,
    account: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa",
    decimals: 6,
  },
  {
    symbol: "whUSDC",
    name: "Wormhole USDC",
    asset_type: WORMHOLE_STABLECOINS.WH_USDC,
    account: "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea",
    decimals: 6,
  },
  {
    symbol: "whUSDT",
    name: "Wormhole USDT",
    asset_type: WORMHOLE_STABLECOINS.WH_USDT,
    account: "0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852",
    decimals: 6,
  },
  {
    symbol: "ceUSDC",
    name: "Celer USDC",
    asset_type: CELER_STABLECOINS.CELER_USDC,
    account: "0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d",
    decimals: 6,
  },
  {
    symbol: "ceUSDT",
    name: "Celer USDT",
    asset_type: CELER_STABLECOINS.CELER_USDT,
    account: "0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d",
    decimals: 6,
  },
];

export class StablecoinService extends BaseAssetService {
  /**
   * Get all stablecoin supplies with caching
   */
  static async getStablecoinSupplies(): Promise<StablecoinData> {
    const cacheKey = "stablecoin-supplies";

    return StablecoinService.getCachedOrFetch(
      cacheKey,
      () => StablecoinService.fetchStablecoinSupplies(),
      config.ttl * 1000
    );
  }

  /**
   * Fetch fresh stablecoin supply data
   */
  private static async fetchStablecoinSupplies(): Promise<StablecoinData> {
    const startTime = Date.now();

    try {
      // Fetch native fungible assets and USDT reserve
      const nativeData = await StablecoinService.fetchNativeFungibleAssets();

      // Fetch bridged coin supplies
      const bridgedSupplies = await StablecoinService.fetchBridgedCoinSupplies();

      // Combine and process all supplies
      const allSupplies = [...nativeData.supplies, ...bridgedSupplies];

      // Calculate total supply and percentages
      const processedData = StablecoinService.processSupplies(allSupplies);

      // Add USDT reserve data
      const result: StablecoinData = {
        ...processedData,
        usdt_reserve: nativeData.usdtReserve,
      };

      StablecoinService.logMetrics("fetchStablecoinSupplies", startTime, true, {
        supplyCount: result.supplies.length,
        totalSupply: result.total,
      });

      return result;
    } catch (error) {
      StablecoinService.logMetrics("fetchStablecoinSupplies", startTime, false);
      logger.error("Failed to fetch stablecoin supplies:", error);
      throw error;
    }
  }

  /**
   * Fetch native fungible asset supplies using metadata table
   */
  private static async fetchNativeFungibleAssets(): Promise<{
    supplies: StablecoinSupply[];
    usdtReserve: StablecoinData["usdt_reserve"];
  }> {
    const fungibleAssets = [...Object.values(STABLECOINS), ALGO_STABLECOINS.MOD];

    // Use the metadata table which has supply information
    const query = `
      query GetFAMetadata {
        fungible_asset_metadata(where: {
          asset_type: {_in: ${JSON.stringify(fungibleAssets)}}
        }) {
          asset_type
          supply_v2
          name
          symbol
          decimals
        }
        
        current_fungible_asset_balances(where: {
          owner_address: {_in: ["${TETHER_RESERVES.PRIMARY}"${TETHER_RESERVES.SECONDARY ? `, "${TETHER_RESERVES.SECONDARY}"` : ""}]},
          asset_type: {_eq: "${STABLECOINS.USDT}"}
        }) {
          amount
          owner_address
        }
      }
    `;

    const result = await StablecoinService.executeGraphQLQuery<any>(query);

    const supplies: StablecoinSupply[] = [];

    // Sum all USDT reserve balances
    let totalUsdtReserve = BigInt(0);
    if (result.current_fungible_asset_balances) {
      for (const balance of result.current_fungible_asset_balances) {
        totalUsdtReserve += BigInt(balance.amount);
      }
    }
    const usdtReserveBalance = totalUsdtReserve.toString();

    // Process metadata results
    if (result.fungible_asset_metadata) {
      for (const item of result.fungible_asset_metadata) {
        const metadata = STABLECOIN_METADATA[item.asset_type];
        if (!metadata) {
          logger.warn(`Unknown stablecoin asset type: ${item.asset_type}`);
          continue;
        }

        // Extract supply from supply_v2 - it's a direct number
        let supply = BigInt(0);
        if (item.supply_v2) {
          if (typeof item.supply_v2 === "string" || typeof item.supply_v2 === "number") {
            supply = BigInt(item.supply_v2);
          }
        }

        const { symbol, decimals } = metadata;

        // For USDT, subtract the reserve balance
        if (symbol === "USDT") {
          const reserveAmount = BigInt(usdtReserveBalance);
          supply = supply - reserveAmount;
          logger.info(
            `USDT: Total supply ${supply + reserveAmount}, Reserve ${usdtReserveBalance}, Circulating ${supply.toString()}`
          );
        }

        const divisor = BigInt(10 ** decimals);
        supplies.push({
          // AssetSupply properties
          asset: item.asset_type,
          name: symbol,
          symbol,
          supply: (supply / divisor).toString(),
          decimals,
          type: "fa",

          // StablecoinSupply specific properties
          issuer: "Unknown",
          peggedTo: "USD",
          isAlgorithmic: false,
          supply_raw: supply.toString(),
          asset_type: item.asset_type,
          percentage: 0,
        });
      }
    }

    return {
      supplies,
      usdtReserve: {
        amount: usdtReserveBalance,
        amount_formatted: formatBigIntWithDecimals(BigInt(usdtReserveBalance), 6),
        address: TETHER_RESERVES.PRIMARY,
      },
    };
  }

  /**
   * Fetch bridged coin supplies using REST API (original working approach)
   */
  private static async fetchBridgedCoinSupplies(): Promise<StablecoinSupply[]> {
    const supplies: StablecoinSupply[] = [];

    for (const coin of BRIDGED_COINS) {
      try {
        // Use REST API to get CoinInfo resource (original approach)
        const resourceType = `0x1::coin::CoinInfo<${coin.asset_type}>`;
        const url = `${REST_API_URL}/accounts/${coin.account}/resource/${encodeURIComponent(resourceType)}`;

        const response = await StablecoinService.withTimeout(
          fetch(url, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.APTOS_BUILD_SECRET}`,
            },
          }),
          10000
        );

        if (!response.ok) {
          logger.warn(`Failed to fetch ${coin.symbol}: HTTP ${response.status}`);
          continue;
        }

        const data = await response.json();
        const supply = StablecoinService.extractCoinSupply(data, coin);

        const divisor = BigInt(10 ** coin.decimals);
        supplies.push({
          // AssetSupply properties
          asset: coin.asset_type,
          name: coin.name,
          symbol: coin.symbol,
          supply: (supply / divisor).toString(),
          decimals: coin.decimals,
          type: "coin",

          // StablecoinSupply specific properties
          issuer: "Unknown",
          peggedTo: "USD",
          isAlgorithmic: false,
          supply_raw: supply.toString(),
          asset_type: coin.asset_type,
          percentage: 0,
        });
      } catch (error) {
        logger.error(`Failed to fetch supply for ${coin.symbol}:`, error);
      }
    }

    return supplies;
  }

  /**
   * Extract coin supply from CoinInfo resource response
   */
  private static extractCoinSupply(data: any, _coin: BridgedCoinConfig): bigint {
    // Try different paths for the supply data from CoinInfo resource
    if (data.data?.supply?.vec?.[0]?.integer?.vec?.[0]?.value) {
      return BigInt(data.data.supply.vec[0].integer.vec[0].value);
    }

    if (data.data?.supply && typeof data.data.supply === "string") {
      return BigInt(data.data.supply);
    }

    if (data.supply && typeof data.supply === "string") {
      return BigInt(data.supply);
    }

    return BigInt(0);
  }

  /**
   * Process supplies to calculate totals and percentages
   */
  private static processSupplies(
    supplies: StablecoinSupply[]
  ): Omit<StablecoinData, "usdt_reserve"> {
    // Sort by supply descending
    supplies.sort((a, b) => {
      const aSupply = BigInt(a.supply);
      const bSupply = BigInt(b.supply);
      return bSupply > aSupply ? 1 : -1;
    });

    // Calculate total dollar value
    let totalDollarValue = BigInt(0);
    for (const item of supplies) {
      totalDollarValue += BigInt(item.supply);
    }

    // Calculate percentages
    for (const item of supplies) {
      const dollarSupply = BigInt(item.supply);
      item.percentage =
        totalDollarValue > 0 ? Number((dollarSupply * BigInt(10000)) / totalDollarValue) / 100 : 0;
    }

    // Calculate total supply in raw units (normalized to 6 decimals)
    let totalSupplyRaw = BigInt(0);
    for (const supply of supplies) {
      const metadata =
        STABLECOIN_METADATA[supply.asset_type] ||
        BRIDGED_COINS.find((c) => c.asset_type === supply.asset_type);

      const decimals = metadata?.decimals || 6;
      const supplyBigInt = BigInt(supply.supply_raw);

      // Normalize to 6 decimals
      const normalizedSupply = decimals === 8 ? supplyBigInt / BigInt(100) : supplyBigInt;

      totalSupplyRaw += normalizedSupply;
    }

    return {
      supplies,
      total: (totalSupplyRaw / BigInt(1000000)).toString(),
      total_raw: totalSupplyRaw.toString(),
    };
  }

  /**
   * Execute GraphQL query
   */
  private static async executeGraphQLQuery<T>(query: string): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Next.js/14 DeFi-Dashboard (Stablecoin-Service)",
    };

    if (process.env.APTOS_BUILD_SECRET) {
      headers["Authorization"] = `Bearer ${process.env.APTOS_BUILD_SECRET}`;
    }

    const response = await StablecoinService.withTimeout(
      fetch(INDEXER_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ query }),
      }),
      30000
    );

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      logger.error("GraphQL errors:", result.errors);
      throw new Error("GraphQL query failed: " + JSON.stringify(result.errors));
    }

    return result.data;
  }
}
