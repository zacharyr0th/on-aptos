import { aptosAnalytics } from '@/lib/services/aptos-analytics';
import { logger } from '@/lib/utils/logger';

import { PanoraService } from '../panora-service';
import type { AssetPrice } from '../types';

export class PriceService {
  static async getPriceForAsset(
    assetType: string,
    symbol?: string
  ): Promise<AssetPrice | null> {
    try {
      // Hardcoded price for MKLP tokens
      if (
        assetType.includes('::house_lp::MKLP') ||
        assetType.includes('::mklp::MKLP')
      ) {
        return {
          assetType,
          symbol: 'MKLP',
          price: 1.05,
          change24h: 0,
        };
      }

      // Hardcoded price for THALA-LP tokens (Thala Farm LP tokens)
      if (
        assetType ===
        '0xb4a8b8462b4423780d6ee256f3a9a3b9ece5d9440d614f7ab2bfa4556aa4f69d'
      ) {
        return {
          assetType,
          symbol: 'THALA-LP',
          price: 1.5,
          change24h: 0,
        };
      }

      // Use the same logic as token-latest-price API route

      // First try Panora API for better coverage (same as token-latest-price route)
      try {
        const panoraPrices = await PanoraService.getTokenPrices([assetType]);

        if (panoraPrices && panoraPrices.length > 0) {
          const panoraPrice = panoraPrices[0];
          return {
            assetType,
            symbol: panoraPrice.symbol,
            price: parseFloat(panoraPrice.usdPrice),
            change24h: 0, // Panora doesn't provide 24h change
          };
        }
      } catch (panoraError) {
        logger.warn(
          `Failed to fetch price from Panora for ${assetType}:`,
          panoraError
        );
      }

      // Fallback to Aptos Analytics API (same as token-latest-price route)
      try {
        const data = await aptosAnalytics.getTokenLatestPrice({
          address: assetType,
        });

        if (data && data.length > 0) {
          const tokenData = data[0] as any;
          return {
            assetType,
            symbol: tokenData?.symbol || symbol || 'Unknown',
            price: tokenData?.price_usd || 0,
            change24h: 0,
          };
        }
      } catch (aptosError) {
        logger.warn(
          `Failed to fetch price from Aptos Analytics for ${assetType}:`,
          aptosError
        );
      }

      // If both fail, return null
      logger.warn(`No price data found for token ${assetType}`);
      return null;
    } catch (error) {
      logger.error('Failed to get price for asset:', { assetType, error });
      return null;
    }
  }

  static async getBatchPrices(assetTypes: string[]): Promise<AssetPrice[]> {
    try {
      const priceMap = new Map<string, AssetPrice>();

      // Handle hardcoded MKLP prices first
      const remainingAssets: string[] = [];

      for (const assetType of assetTypes) {
        if (
          assetType.includes('::house_lp::MKLP') ||
          assetType.includes('::mklp::MKLP')
        ) {
          priceMap.set(assetType, {
            assetType,
            symbol: 'MKLP',
            price: 1.05,
            change24h: 0,
          });
        } else if (
          assetType ===
          '0xb4a8b8462b4423780d6ee256f3a9a3b9ece5d9440d614f7ab2bfa4556aa4f69d'
        ) {
          priceMap.set(assetType, {
            assetType,
            symbol: 'THALA-LP',
            price: 1.5,
            change24h: 0,
          });
        } else {
          remainingAssets.push(assetType);
        }
      }

      if (remainingAssets.length === 0) {
        return assetTypes.map(assetType => priceMap.get(assetType)!);
      }

      // First try Panora for batch prices (same approach as token-latest-price API)
      try {
        const panoraPrices =
          await PanoraService.getTokenPrices(remainingAssets);

        panoraPrices.forEach(panoraPrice => {
          const assetType = panoraPrice.faAddress || panoraPrice.tokenAddress;
          if (assetType) {
            priceMap.set(assetType, {
              assetType,
              symbol: panoraPrice.symbol,
              price: parseFloat(panoraPrice.usdPrice),
              change24h: 0, // Panora doesn't provide 24h change
            });
          }
        });
      } catch (panoraError) {
        logger.warn('Panora batch prices failed:', panoraError);
      }

      // For missing assets, try Aptos Analytics one by one
      const missingAssets = assetTypes.filter(
        assetType => !priceMap.has(assetType)
      );

      if (missingAssets.length > 0) {
        const aptosResults = await Promise.allSettled(
          missingAssets.map(async assetType => {
            try {
              const data = await aptosAnalytics.getTokenLatestPrice({
                address: assetType,
              });

              if (data && data.length > 0) {
                const tokenData = data[0] as any;
                return {
                  assetType,
                  symbol: tokenData?.symbol || 'Unknown',
                  price: tokenData?.price_usd || 0,
                  change24h: 0,
                };
              }
            } catch (error) {
              logger.warn(`Aptos Analytics failed for ${assetType}:`, error);
            }
            return null;
          })
        );

        aptosResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            priceMap.set(missingAssets[index], result.value);
          }
        });
      }

      // Return requested prices
      return assetTypes.map(assetType => {
        const cached = priceMap.get(assetType);
        if (cached) return cached;

        // Log missing price but don't default to 0
        logger.warn(`No price data found for token ${assetType}`);

        // Return null price to indicate unavailable
        return {
          assetType,
          symbol: PanoraService.getSymbolForAssetType(assetType),
          price: null, // Changed from 0 to null to indicate price unavailable
          change24h: 0,
        };
      });
    } catch (error) {
      logger.error('Failed to get batch prices:', error);
      return assetTypes.map(assetType => ({
        assetType,
        symbol: PanoraService.getSymbolForAssetType(assetType),
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
    return prices.map(p => ({
      asset_type: p.assetType,
      price: p.price,
      price_change_24h: p.change24h,
      market_cap: p.marketCap,
      symbol: p.symbol,
      decimals: 8,
    }));
  }
}
