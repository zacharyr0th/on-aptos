import {
  ExternalApiService,
  ApiEndpoints,
  CacheService,
  CacheKeys,
} from '@/lib/trpc/shared/services';
import { PANORA_TOKENS } from '@/lib/config/data';
import { SERVICE_CONFIG } from '@/lib/config/cache';
import { formatNumber, ApiError } from '@/lib/utils';
import {
  CMCPriceData,
  PanoraPricesData,
  CMC_SYMBOL_IDS,
  SYMBOL_DISPLAY_NAMES,
  SYMBOL_FULL_NAMES,
} from './types';

/**
 * Price Service
 * Handles all price-related business logic
 */

// Configuration
const CMC_API_KEY = process.env.CMC_API_KEY;
const PANORA_API_KEY = process.env.PANORA_API_KEY;
const config = SERVICE_CONFIG.prices;

export class PriceService {
  /**
   * Get CMC price for a symbol
   */
  static async getCMCPrice(symbol: string): Promise<CMCPriceData> {
    const cacheKey = CacheKeys.cmcPrice(symbol);

    const result = await CacheService.getCachedOrFetch(
      cacheKey,
      () => this.fetchCMCPriceData(symbol),
      config.ttl
    );

    return result.data;
  }

  /**
   * Get all Panora prices
   */
  static async getPanoraPrices(): Promise<PanoraPricesData> {
    const cacheKey = CacheKeys.panoraPrice('all');

    const result = await CacheService.getCachedOrFetch(
      cacheKey,
      () => this.fetchAllPanoraPricesData(),
      config.ttl
    );

    return result.data;
  }

  /**
   * Fetch CMC price data (private method)
   */
  private static async fetchCMCPriceData(
    symbol: string
  ): Promise<CMCPriceData> {
    if (!CMC_API_KEY) {
      throw new ApiError(
        'CMC API key is required but not configured. Please add your CMC_API_KEY to the .env file.',
        undefined,
        'CMC-Config'
      );
    }

    const cmcId = CMC_SYMBOL_IDS[symbol.toLowerCase()];
    if (!cmcId) {
      throw new ApiError(
        `No CMC ID mapping found for symbol: ${symbol}`,
        undefined,
        'CMC-Config'
      );
    }

    const url = `${ApiEndpoints.CMC_BASE}/cryptocurrency/quotes/latest?id=${cmcId}`;

    const response = await ExternalApiService.get<{
      data?: Record<
        string,
        {
          quote?: {
            USD?: {
              price?: number;
            };
          };
        }
      >;
    }>(url, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        Accept: 'application/json',
      },
      timeout: config.timeout,
      retries: config.retries,
    });

    const price = response?.data?.[cmcId]?.quote?.USD?.price;

    if (price == null) {
      throw new ApiError(
        'Invalid price data received from CMC',
        undefined,
        'CMC-Data'
      );
    }

    return {
      symbol:
        SYMBOL_DISPLAY_NAMES[symbol.toLowerCase()] || symbol.toUpperCase(),
      name: SYMBOL_FULL_NAMES[symbol.toLowerCase()] || symbol,
      price,
      updated: new Date().toISOString(),
    };
  }

  /**
   * Fetch Panora prices data (private method)
   */
  private static async fetchPanoraPricesData(
    tokenAddresses: string[]
  ): Promise<Record<string, number>> {
    if (!PANORA_API_KEY) {
      throw new ApiError(
        'PANORA_API_KEY is not configured',
        undefined,
        'Panora-Config'
      );
    }

    const url = ExternalApiService.buildUrl(
      `${ApiEndpoints.PANORA_BASE}/prices`,
      {
        tokenAddress: tokenAddresses.join(','),
      }
    );

    const data = await ExternalApiService.get<
      Array<{
        faAddress?: string;
        tokenAddress?: string;
        usdPrice?: string;
      }>
    >(url, {
      headers: {
        'x-api-key': PANORA_API_KEY,
      },
      timeout: 10000,
      retries: 3,
    });

    const prices: Record<string, number> = {};

    for (const token of data) {
      if (token.faAddress && token.usdPrice) {
        prices[token.faAddress] = parseFloat(token.usdPrice);
      } else if (token.tokenAddress && token.usdPrice) {
        prices[token.tokenAddress] = parseFloat(token.usdPrice);
      }
    }

    return prices;
  }

  /**
   * Get all Panora prices data (private method)
   */
  private static async fetchAllPanoraPricesData(): Promise<PanoraPricesData> {
    if (!PANORA_API_KEY) {
      throw new ApiError(
        'Panora API key is required but not configured. Please add your PANORA_API_KEY to the .env file.',
        undefined,
        'Panora-Config'
      );
    }

    const tokenAddresses = Object.values(PANORA_TOKENS).map(
      token => token.asset_type
    );
    const prices = await this.fetchPanoraPricesData(tokenAddresses);

    const results = Object.entries(PANORA_TOKENS).map(
      ([symbol, { asset_type, description, decimals }]) => {
        const price = prices[asset_type] || 0;

        return {
          symbol,
          name: description,
          asset_type,
          price: formatNumber(price, { decimals: 6 }),
          decimals,
        };
      }
    );

    return {
      success: true,
      prices: results,
      attribution: 'Powered by Panora',
    };
  }
}
