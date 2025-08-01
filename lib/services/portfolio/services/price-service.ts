import { logger } from "@/lib/utils/logger";
import { PanoraService } from "../panora-service";
import { aptosAnalytics } from "@/lib/services/aptos-analytics";

import type { AssetPrice } from "../types";

export class PriceService {
  static async getPriceForAsset(
    assetType: string,
    symbol?: string,
  ): Promise<AssetPrice | null> {
    try {
      // Hardcoded price for MKLP tokens
      if (
        assetType.includes("::house_lp::MKLP") ||
        assetType.includes("::mklp::MKLP")
      ) {
        return {
          assetType,
          symbol: "MKLP",
          price: 1.05,
          change24h: 0,
        };
      }

      // Hardcoded price for THALA-LP tokens (Thala Farm LP tokens)
      if (
        assetType ===
        "0xb4a8b8462b4423780d6ee256f3a9a3b9ece5d9440d614f7ab2bfa4556aa4f69d"
      ) {
        return {
          assetType,
          symbol: "THALA-LP",
          price: 1.5,
          change24h: 0,
        };
      }

      // First try Panora API for better coverage
      try {
        const panoraPrices = await PanoraService.getTokenPrices([assetType]);

        if (panoraPrices && panoraPrices.length > 0) {
          const panoraPrice = panoraPrices[0];
          logger.info(
            `Token price fetched from Panora for ${assetType}: $${panoraPrice.usdPrice}`,
          );
          return {
            assetType,
            symbol: panoraPrice.symbol || symbol || "Unknown",
            price: parseFloat(panoraPrice.usdPrice) || 0,
            change24h: 0,
          };
        }
      } catch (panoraError) {
        logger.warn(
          `Failed to fetch price from Panora for ${assetType}:`,
          panoraError,
        );
      }

      // Fallback to Aptos Analytics API
      try {
        const data = await aptosAnalytics.getTokenLatestPrice({
          address: assetType,
        });

        if (data && data.length > 0) {
          logger.info(
            `Token price fetched from Aptos Analytics for ${assetType}`,
          );
          return {
            assetType,
            symbol: symbol || "Unknown",
            price: data[0].price_usd || 0,
            change24h: 0,
          };
        }
      } catch (aptosError) {
        logger.warn(
          `Failed to fetch price from Aptos Analytics for ${assetType}:`,
          aptosError,
        );
      }

      // If API fails, return null
      logger.warn(`No price data found for token ${assetType}`);
      return null;
    } catch (error) {
      logger.error("Failed to get price for asset:", { assetType, error });
      return null;
    }
  }

  static async getBatchPrices(assetTypes: string[]): Promise<AssetPrice[]> {
    try {
      const priceMap = new Map<string, AssetPrice>();

      // Handle hardcoded MKLP prices first
      let remainingAssets: string[] = [];

      for (const assetType of assetTypes) {
        if (
          assetType.includes("::house_lp::MKLP") ||
          assetType.includes("::mklp::MKLP")
        ) {
          priceMap.set(assetType, {
            assetType,
            symbol: "MKLP",
            price: 1.05,
            change24h: 0,
          });
        } else if (
          assetType ===
          "0xb4a8b8462b4423780d6ee256f3a9a3b9ece5d9440d614f7ab2bfa4556aa4f69d"
        ) {
          priceMap.set(assetType, {
            assetType,
            symbol: "THALA-LP",
            price: 1.5,
            change24h: 0,
          });
        } else {
          remainingAssets.push(assetType);
        }
      }

      if (remainingAssets.length === 0) {
        return assetTypes.map((assetType) => priceMap.get(assetType)!);
      }

      // Use direct service calls for all remaining assets
      if (remainingAssets.length > 0) {
        // First try Panora for all remaining assets at once
        try {
          const panoraPrices =
            await PanoraService.getTokenPrices(remainingAssets);

          for (const panoraPrice of panoraPrices) {
            const assetType = panoraPrice.faAddress || panoraPrice.tokenAddress;
            if (assetType && remainingAssets.includes(assetType)) {
              priceMap.set(assetType, {
                assetType,
                symbol: panoraPrice.symbol || "Unknown",
                price: parseFloat(panoraPrice.usdPrice) || 0,
                change24h: 0,
              });
              // Remove from remaining assets
              remainingAssets = remainingAssets.filter((a) => a !== assetType);
            }
          }
        } catch (panoraError) {
          logger.warn("Failed to fetch batch prices from Panora:", panoraError);
        }

        // For any still remaining, try Aptos Analytics
        if (remainingAssets.length > 0) {
          const batchSize = 10;
          for (let i = 0; i < remainingAssets.length; i += batchSize) {
            const batch = remainingAssets.slice(i, i + batchSize);

            const batchResults = await Promise.allSettled(
              batch.map(async (assetType) => {
                try {
                  const data = await aptosAnalytics.getTokenLatestPrice({
                    address: assetType,
                  });

                  if (data && data.length > 0) {
                    return {
                      assetType,
                      symbol: "Unknown",
                      price: data[0].price_usd || 0,
                      change24h: 0,
                    };
                  }
                } catch (error) {
                  logger.warn(
                    `Aptos Analytics failed for ${assetType}:`,
                    error,
                  );
                }
                return null;
              }),
            );

            batchResults.forEach((result, index) => {
              if (result.status === "fulfilled" && result.value) {
                priceMap.set(batch[index], result.value);
              }
            });
          }
        }
      }

      // Return requested prices
      return assetTypes.map((assetType) => {
        const cached = priceMap.get(assetType);
        if (cached) return cached;

        // Log missing price but don't default to 0
        logger.warn(`No price data found for token ${assetType}`);

        // Return null price to indicate unavailable
        return {
          assetType,
          symbol: "Unknown",
          price: null, // Changed from 0 to null to indicate price unavailable
          change24h: 0,
        };
      });
    } catch (error) {
      logger.error("Failed to get batch prices:", error);
      return assetTypes.map((assetType) => ({
        assetType,
        symbol: "Unknown",
        price: null, // Changed from 0 to null
        change24h: 0,
      }));
    }
  }

  /**
   * Get coin price from Panora
   * @deprecated Use getBatchPrices instead
   */
  static async getCoinPrice(assetTypes: string[]) {
    const prices = await this.getBatchPrices(assetTypes);
    return prices.map((p) => ({
      asset_type: p.assetType,
      price: p.price,
      price_change_24h: p.change24h,
      market_cap: p.marketCap,
      symbol: p.symbol,
      decimals: 8,
    }));
  }
}
