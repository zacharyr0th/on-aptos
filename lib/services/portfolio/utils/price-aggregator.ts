import { logger } from '@/lib/utils/logger';
import { PriceService } from '../services/price-service';
import type { AssetPrice } from '../types';

interface PriceData {
  price: number;
  change24h?: number;
  marketCap?: number;
  source: 'panora' | 'cmc' | 'cached';
}

export class PriceAggregator {
  private static priceCache = new Map<
    string,
    { data: PriceData; timestamp: number }
  >();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async getAssetPrice(
    assetType: string,
    symbol?: string
  ): Promise<PriceData | null> {
    const cacheKey = `${assetType}:${symbol || ''}`;
    const cached = this.priceCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return { ...cached.data, source: 'cached' };
    }

    try {
      const priceInfo = await PriceService.getPriceForAsset(assetType, symbol);
      if (priceInfo) {
        const priceData: PriceData = {
          price: priceInfo.price ?? 0,
          change24h: priceInfo.change24h,
          marketCap: priceInfo.marketCap,
          source: 'panora',
        };

        this.priceCache.set(cacheKey, {
          data: priceData,
          timestamp: Date.now(),
        });
        return priceData;
      }
    } catch (error) {
      logger.warn('Price fetch failed', { assetType, error });
    }

    // Fallback to CMC if needed (implement CMC service)
    // For now, return null if Panora fails
    return null;
  }

  static async getBatchPrices(
    assetTypes: string[]
  ): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>();
    const uncachedTypes: string[] = [];

    // Check cache first
    for (const assetType of assetTypes) {
      const cached = this.priceCache.get(assetType);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        results.set(assetType, { ...cached.data, source: 'cached' });
      } else {
        uncachedTypes.push(assetType);
      }
    }

    // Fetch uncached prices
    if (uncachedTypes.length > 0) {
      try {
        const prices = await PriceService.getBatchPrices(uncachedTypes);

        prices.forEach(priceInfo => {
          const priceData: PriceData = {
            price: priceInfo.price ?? 0,
            change24h: priceInfo.change24h,
            marketCap: priceInfo.marketCap,
            source: 'panora',
          };

          results.set(priceInfo.assetType, priceData);
          this.priceCache.set(priceInfo.assetType, {
            data: priceData,
            timestamp: Date.now(),
          });
        });
      } catch (error) {
        logger.error('Batch price fetch failed', { error });
      }
    }

    return results;
  }

  static clearCache(): void {
    this.priceCache.clear();
  }

  static getCacheSize(): number {
    return this.priceCache.size;
  }
}
