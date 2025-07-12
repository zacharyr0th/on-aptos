import { logger } from '@/lib/utils/logger';

export interface PanoraPriceData {
  chainId: number;
  tokenAddress: string | null;
  faAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  usdPrice: number;
  nativePrice: string;
  iconUrl?: string;
}

export interface PanoraApiResponse {
  success: boolean;
  data: PanoraPriceData[];
  count: number;
  timestamp: string;
  source: string;
}

/**
 * Simple Panora client using direct REST calls
 * No tRPC complexity - just fetch data directly from our API endpoint
 */
export class PanoraClient {
  private static baseUrl = '';

  /**
   * Get all prices from Panora
   */
  static async getAllPrices(): Promise<PanoraPriceData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/prices/panora`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        // Use Next.js built-in caching
        next: { revalidate: 120 }, // 2 minutes
      });

      if (!response.ok) {
        throw new Error(`Panora API error: ${response.status}`);
      }

      const result: PanoraApiResponse = await response.json();

      if (!result.success) {
        throw new Error('Panora API returned unsuccessful response');
      }

      logger.info(`[PanoraClient] Retrieved ${result.data.length} prices`);
      return result.data;
    } catch (error) {
      logger.error('[PanoraClient] Failed to fetch prices:', error);
      // Return empty array instead of throwing to prevent breaking the portfolio page
      return [];
    }
  }

  /**
   * Get prices for specific token addresses
   */
  static async getTokenPrices(
    tokenAddresses: string[]
  ): Promise<PanoraPriceData[]> {
    if (tokenAddresses.length === 0) return [];

    try {
      const params = new URLSearchParams({
        tokens: tokenAddresses.join(','),
      });

      const response = await fetch(
        `${this.baseUrl}/api/prices/panora?${params}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          next: { revalidate: 120 },
        }
      );

      if (!response.ok) {
        throw new Error(`Panora API error: ${response.status}`);
      }

      const result: PanoraApiResponse = await response.json();

      if (!result.success) {
        throw new Error('Panora API returned unsuccessful response');
      }

      logger.info(
        `[PanoraClient] Retrieved ${result.data.length} specific token prices`
      );
      return result.data;
    } catch (error) {
      logger.error('[PanoraClient] Failed to fetch token prices:', error);
      throw error;
    }
  }

  /**
   * Get price for a single token by address
   */
  static async getTokenPrice(
    tokenAddress: string
  ): Promise<PanoraPriceData | null> {
    const prices = await this.getTokenPrices([tokenAddress]);
    return (
      prices.find(
        p => p.faAddress === tokenAddress || p.tokenAddress === tokenAddress
      ) || null
    );
  }

  /**
   * Get APT price specifically
   */
  static async getAptPrice(): Promise<number | null> {
    try {
      const prices = await this.getAllPrices();
      const aptToken = prices.find(token => token.symbol === 'APT');
      return aptToken ? aptToken.usdPrice : null;
    } catch (error) {
      logger.error('[PanoraClient] Failed to fetch APT price:', error);
      return null;
    }
  }
}
