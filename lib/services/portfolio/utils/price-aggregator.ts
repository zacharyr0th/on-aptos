import { DefaultPriceService } from "@/lib/services/external/price-service";
import { logger } from "@/lib/utils/core/logger";
import type { AssetPrice } from "../types";

interface PriceData {
  price: number;
  change24h?: number;
  marketCap?: number;
  source: "panora" | "cmc" | "cached";
}

export class PriceAggregator {
  private static priceCache = new Map<string, { data: PriceData; timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async getAssetPrice(assetType: string, symbol?: string): Promise<PriceData | null> {
    const cacheKey = `${assetType}:${symbol || ""}`;
    const cached = PriceAggregator.priceCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < PriceAggregator.CACHE_TTL) {
      return { ...cached.data, source: "cached" };
    }

    try {
      const priceService = new DefaultPriceService();
      const price = await priceService.getTokenPrice(assetType);
      if (price !== null) {
        const priceData: PriceData = {
          price: price,
          change24h: undefined,
          marketCap: undefined,
          source: "panora",
        };

        PriceAggregator.priceCache.set(cacheKey, {
          data: priceData,
          timestamp: Date.now(),
        });
        return priceData;
      }
    } catch (error) {
      logger.warn("Price fetch failed", { assetType, error });
    }

    // Fallback to CMC if needed (implement CMC service)
    // For now, return null if Panora fails
    return null;
  }

  static async getBatchPrices(assetTypes: string[]): Promise<Map<string, PriceData>> {
    try {
      const results = new Map<string, PriceData>();
      const uncachedTypes: string[] = [];

      // Check cache first
      for (const assetType of assetTypes) {
        const cached = PriceAggregator.priceCache.get(assetType);
        if (cached && Date.now() - cached.timestamp < PriceAggregator.CACHE_TTL) {
          results.set(assetType, { ...cached.data, source: "cached" });
        } else {
          uncachedTypes.push(assetType);
        }
      }

      // Fetch uncached prices
      if (uncachedTypes.length > 0) {
        try {
          const priceService = new DefaultPriceService();
          const prices = await priceService.getTokenPrices(uncachedTypes);

          prices.forEach((price, assetType) => {
            // Preserve null to indicate price unavailable
            if (price !== null) {
              const priceData: PriceData = {
                price: price,
                change24h: undefined,
                marketCap: undefined,
                source: "panora",
              };
              results.set(assetType, priceData);
              PriceAggregator.priceCache.set(assetType, {
                data: priceData,
                timestamp: Date.now(),
              });
            }
          });
        } catch (error) {
          logger.error("Batch price fetch failed", { error });
        }
      }

      return results;
    } catch (error) {
      logger.error("PriceAggregator.getBatchPrices failed:", error);
      // Always return a Map, even if empty
      return new Map<string, PriceData>();
    }
  }

  static clearCache(): void {
    PriceAggregator.priceCache.clear();
  }

  static getCacheSize(): number {
    return PriceAggregator.priceCache.size;
  }
}
