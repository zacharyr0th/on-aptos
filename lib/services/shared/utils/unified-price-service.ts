import { aptosAnalytics } from "@/lib/services/blockchain/aptos-analytics";
import { logger } from "@/lib/utils/core/logger";
import { UnifiedPanoraService } from "../../portfolio/unified-panora-service";

export interface UnifiedPriceData {
  price: number;
  change24h?: number;
  marketCap?: number;
  symbol?: string;
  decimals?: number;
  source: "panora" | "aptos_analytics" | "hardcoded" | "cached";
}

export interface AssetPrice {
  assetType: string;
  symbol: string;
  price: number | null;
  change24h: number;
  marketCap?: number;
}

/**
 * Unified price service that consolidates all price fetching logic
 * Replaces PriceService and PriceAggregator with a single source of truth
 */
export class UnifiedPriceService {
  private static priceCache = new Map<string, { data: UnifiedPriceData; timestamp: number }>();
  private static readonly CACHE_TTL = 30 * 1000; // 30 seconds

  /**
   * Hardcoded prices for special tokens that don't have market prices
   */
  private static readonly HARDCODED_PRICES: Record<string, Omit<UnifiedPriceData, "source">> = {
    // MKLP tokens
    "::house_lp::MKLP": {
      price: 1.05,
      change24h: 0,
      symbol: "MKLP",
      decimals: 8,
    },
    "::mklp::MKLP": {
      price: 1.05,
      change24h: 0,
      symbol: "MKLP",
      decimals: 8,
    },
    // Thala LP token
    "0xb4a8b8462b4423780d6ee256f3a9a3b9ece5d9440d614f7ab2bfa4556aa4f69d": {
      price: 1.5,
      change24h: 0,
      symbol: "THALA-LP",
      decimals: 8,
    },
  };

  /**
   * Get price for a single asset
   */
  static async getAssetPrice(assetType: string, symbol?: string): Promise<UnifiedPriceData | null> {
    const cacheKey = `${assetType}:${symbol || ""}`;
    const cached = UnifiedPriceService.priceCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < UnifiedPriceService.CACHE_TTL) {
      return { ...cached.data, source: "cached" };
    }

    try {
      // Check hardcoded prices first
      for (const [pattern, priceData] of Object.entries(UnifiedPriceService.HARDCODED_PRICES)) {
        if (assetType.includes(pattern) || assetType === pattern) {
          const result = { ...priceData, source: "hardcoded" as const };
          UnifiedPriceService.priceCache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
          });
          return result;
        }
      }

      // Try Panora API first (better coverage)
      try {
        const panoraPrices = await UnifiedPanoraService.getTokenPrices([assetType]);

        const price = panoraPrices.get(assetType);
        if (price !== undefined && price > 0) {
          const priceData: UnifiedPriceData = {
            price: price,
            change24h: 0, // Panora doesn't provide 24h change
            symbol: symbol || "Unknown",
            decimals: 8, // Default decimals
            source: "panora",
          };

          UnifiedPriceService.priceCache.set(cacheKey, {
            data: priceData,
            timestamp: Date.now(),
          });

          logger.info(`Price fetched from Panora for ${assetType}: $${priceData.price}`);
          return priceData;
        }
      } catch (panoraError) {
        logger.warn(`Panora price fetch failed for ${assetType}:`, panoraError);
      }

      // Fallback to Aptos Analytics
      try {
        const data = await aptosAnalytics.getTokenLatestPrice({
          address: assetType,
        });

        if (data && data.length > 0) {
          const priceData: UnifiedPriceData = {
            price: data[0].price_usd || 0,
            change24h: 0,
            symbol: symbol || "Unknown",
            decimals: 8, // Default for Aptos tokens
            source: "aptos_analytics",
          };

          UnifiedPriceService.priceCache.set(cacheKey, {
            data: priceData,
            timestamp: Date.now(),
          });

          logger.info(`Price fetched from Aptos Analytics for ${assetType}: $${priceData.price}`);
          return priceData;
        }
      } catch (aptosError) {
        logger.warn(`Aptos Analytics price fetch failed for ${assetType}:`, aptosError);
      }

      // No price found
      logger.warn(`No price data found for token ${assetType}`);
      return null;
    } catch (error) {
      logger.error("Failed to get price for asset:", { assetType, error });
      return null;
    }
  }

  /**
   * Get prices for multiple assets efficiently
   */
  static async getBatchPrices(assetTypes: string[]): Promise<Map<string, UnifiedPriceData>> {
    try {
      const results = new Map<string, UnifiedPriceData>();
      const uncachedTypes: string[] = [];

      // Check cache and hardcoded prices first
      for (const assetType of assetTypes) {
        const cached = UnifiedPriceService.priceCache.get(assetType);
        if (cached && Date.now() - cached.timestamp < UnifiedPriceService.CACHE_TTL) {
          results.set(assetType, { ...cached.data, source: "cached" });
          continue;
        }

        // Check hardcoded prices
        let foundHardcoded = false;
        for (const [pattern, priceData] of Object.entries(UnifiedPriceService.HARDCODED_PRICES)) {
          if (assetType.includes(pattern) || assetType === pattern) {
            const result = { ...priceData, source: "hardcoded" as const };
            results.set(assetType, result);
            UnifiedPriceService.priceCache.set(assetType, {
              data: result,
              timestamp: Date.now(),
            });
            foundHardcoded = true;
            break;
          }
        }

        if (!foundHardcoded) {
          uncachedTypes.push(assetType);
        }
      }

      // Fetch remaining prices from APIs
      if (uncachedTypes.length > 0) {
        // Try Panora for batch fetch first
        try {
          const panoraPrices = await UnifiedPanoraService.getTokenPrices(uncachedTypes);

          const foundPanoraAssets = new Set<string>();
          for (const [assetType, price] of panoraPrices.entries()) {
            if (assetType && uncachedTypes.includes(assetType)) {
              const priceData: UnifiedPriceData = {
                price: price || 0,
                change24h: 0,
                symbol: "Unknown", // We don't have symbol from the Map
                decimals: 8, // Default decimals
                source: "panora",
              };
              results.set(assetType, priceData);
              UnifiedPriceService.priceCache.set(assetType, {
                data: priceData,
                timestamp: Date.now(),
              });
              foundPanoraAssets.add(assetType);
            }
          }

          // Remove found assets from uncached list
          const stillUncached = uncachedTypes.filter(
            (assetType) => !foundPanoraAssets.has(assetType)
          );

          // Try Aptos Analytics for remaining assets
          if (stillUncached.length > 0) {
            logger.info(`Trying Aptos Analytics for ${stillUncached.length} remaining assets`);

            const batchResults = await Promise.allSettled(
              stillUncached.map(async (assetType) => {
                try {
                  const data = await aptosAnalytics.getTokenLatestPrice({
                    address: assetType,
                  });

                  if (data && data.length > 0) {
                    const priceData = {
                      price: data[0].price_usd || 0,
                      change24h: 0,
                      symbol: "Unknown",
                      decimals: 8,
                      source: "aptos_analytics" as const,
                    };

                    logger.info(`Found price for ${assetType}: $${priceData.price}`);

                    return {
                      assetType,
                      priceData,
                    };
                  }
                } catch (error) {
                  logger.warn(`Aptos Analytics failed for ${assetType}:`, error);
                }
                return null;
              })
            );

            batchResults.forEach((result) => {
              if (result.status === "fulfilled" && result.value) {
                const { assetType, priceData } = result.value;
                results.set(assetType, priceData);
                UnifiedPriceService.priceCache.set(assetType, {
                  data: priceData,
                  timestamp: Date.now(),
                });
              }
            });
          }
        } catch (error) {
          logger.error("Batch price fetch failed:", error);
        }
      }

      return results;
    } catch (error) {
      logger.error("UnifiedPriceService.getBatchPrices failed:", error);
      return new Map<string, UnifiedPriceData>();
    }
  }

  /**
   * Convert to AssetPrice format for backward compatibility
   */
  static async getAssetPrices(assetTypes: string[]): Promise<AssetPrice[]> {
    const priceData = await UnifiedPriceService.getBatchPrices(assetTypes);

    return assetTypes.map((assetType) => {
      const price = priceData.get(assetType);
      return {
        assetType,
        symbol: price?.symbol || "",
        price: price?.price ?? null,
        change24h: price?.change24h || 0,
        marketCap: price?.marketCap,
      };
    });
  }

  /**
   * Clear price cache
   */
  static clearCache(): void {
    UnifiedPriceService.priceCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    entries: Array<{ assetType: string; age: number; source: string }>;
  } {
    const now = Date.now();
    const entries = Array.from(UnifiedPriceService.priceCache.entries()).map(([key, value]) => ({
      assetType: key,
      age: now - value.timestamp,
      source: value.data.source,
    }));

    return {
      size: UnifiedPriceService.priceCache.size,
      entries,
    };
  }
}
