import { logger } from '@/lib/utils/logger';
import { BaseAssetService } from '../utils/base-service';
import { formatTokenAmount, sortBySupply } from '../utils/formatting';
import { CACHE_TTL, API_ENDPOINTS } from '../constants';
import type { RWAAsset } from '../types';
import { enhancedFetch } from '@/lib/utils/fetch-utils';
import { getEnvVar } from '@/lib/config/validate-env';

interface RWATokenResponse {
  id: string;
  name: string;
  symbol: string;
  asset_class: string;
  issuer: string;
  underlying_asset: string;
  total_supply: number;
  market_cap: number;
  price: number;
  legal_structure?: string;
  jurisdiction?: string;
}

export class RWAService extends BaseAssetService {
  /**
   * Get Real World Asset data
   */
  static async getRWAAssets(forceRefresh = false): Promise<RWAAsset[]> {
    const cacheKey = 'rwa:assets';

    return this.getCachedOrFetch(
      cacheKey,
      async () => {
        const assets = await this.fetchRWAData();
        return this.processRWAAssets(assets);
      },
      forceRefresh ? 0 : CACHE_TTL.RWA_DATA
    );
  }

  /**
   * Fetch RWA data from RWA.xyz API
   */
  private static async fetchRWAData(): Promise<RWATokenResponse[]> {
    const startTime = Date.now();

    try {
      const apiKey = getEnvVar('RWA_API_KEY');

      const response = await this.withTimeout(
        enhancedFetch(API_ENDPOINTS.RWA_API, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
          },
          timeout: 15000,
          retries: 2,
        })
      );

      if (!response.ok) {
        throw new Error(
          `RWA API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid RWA API response format');
      }

      this.logMetrics('fetchRWAData', startTime, true, {
        assetCount: data.length,
      });

      return data;
    } catch (error) {
      this.logMetrics('fetchRWAData', startTime, false);

      // If API key is missing, return empty array instead of throwing
      if (
        error instanceof Error &&
        error.message.includes('Environment variable')
      ) {
        logger.warn('RWA API key not configured, returning empty results');
        return [];
      }

      throw error;
    }
  }

  /**
   * Process and format RWA assets
   */
  private static processRWAAssets(assets: RWATokenResponse[]): RWAAsset[] {
    return sortBySupply(
      assets.map(asset => ({
        asset: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        supply: asset.total_supply,
        decimals: 8, // Most RWA tokens use 8 decimals
        type: 'fa' as const,
        assetClass: asset.asset_class,
        issuer: asset.issuer,
        underlyingAsset: asset.underlying_asset,
        legalStructure: asset.legal_structure,
        jurisdiction: asset.jurisdiction,
        metadata: {
          price: asset.price,
          marketCap: asset.market_cap,
        },
      }))
    );
  }

  /**
   * Get RWA assets by asset class
   */
  static async getRWAAssetsByClass(assetClass: string): Promise<RWAAsset[]> {
    const allAssets = await this.getRWAAssets();
    return allAssets.filter(
      asset => asset.assetClass.toLowerCase() === assetClass.toLowerCase()
    );
  }

  /**
   * Get RWA assets by issuer
   */
  static async getRWAAssetsByIssuer(issuer: string): Promise<RWAAsset[]> {
    const allAssets = await this.getRWAAssets();
    return allAssets.filter(asset =>
      asset.issuer.toLowerCase().includes(issuer.toLowerCase())
    );
  }
}
