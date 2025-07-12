import { ApiEndpoints, CacheKeys } from '@/lib/config/api-endpoints';
import { PANORA_TOKENS } from '@/lib/config/data';
import { SERVICE_CONFIG } from '@/lib/config/cache';
import { formatNumber, ApiError, enhancedFetch } from '@/lib/utils';
import {
  cmcCache,
  panoraCache,
  coinGeckoCache,
} from '@/lib/utils/simple-cache';
import {
  CMCPriceData,
  PanoraPricesData,
  CMC_SYMBOL_IDS,
  COINGECKO_IDS,
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

    // Check cache first for rate-limited API
    const cached = cmcCache.get<CMCPriceData>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.fetchCMCPriceData(symbol);
    cmcCache.set(cacheKey, data);
    return data;
  }

  /**
   * Get historical CMC price for a symbol on a specific date
   */
  static async getCMCHistoricalPrice(
    symbol: string,
    date: string
  ): Promise<{ price: number; date: string }> {
    const cacheKey = `cmc_historical_${symbol}_${date}`;

    // Check cache first for rate-limited API
    const cached = cmcCache.get<{ price: number; date: string }>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.fetchCMCHistoricalPriceData(symbol, date);
    cmcCache.set(cacheKey, data);
    return data;
  }

  /**
   * Get historical prices for multiple symbols over a date range
   */
  static async getCMCHistoricalPrices(
    symbols: string[],
    startDate: string,
    endDate: string
  ): Promise<Record<string, Array<{ date: string; price: number }>>> {
    const results: Record<string, Array<{ date: string; price: number }>> = {};

    // Process symbols in batches to avoid hitting API limits
    for (const symbol of symbols) {
      try {
        const historicalData = await this.fetchCMCHistoricalPriceRange(
          symbol,
          startDate,
          endDate
        );
        results[symbol] = historicalData;
      } catch (error) {
        console.warn(`Failed to fetch historical prices for ${symbol}:`, error);
        results[symbol] = [];
      }
    }

    return results;
  }

  /**
   * Get all Panora prices
   */
  static async getPanoraPrices(): Promise<PanoraPricesData> {
    const cacheKey = CacheKeys.panoraPrice('all');

    // Check cache first for rate-limited API
    const cached = panoraCache.get<PanoraPricesData>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await this.fetchAllPanoraPricesData();
    panoraCache.set(cacheKey, data);
    return data;
  }

  /**
   * Fetch CMC price data (private method)
   */
  private static async fetchCMCPriceData(
    symbol: string
  ): Promise<CMCPriceData> {
    if (!CMC_API_KEY) {
      throw new ApiError(
        'CMC_API_KEY is not configured',
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

    try {
      console.log(`[Price] Fetching ${symbol} price from CMC`);
      const url = `${ApiEndpoints.CMC_BASE}/cryptocurrency/quotes/latest?id=${cmcId}`;

      const response = await enhancedFetch(url, {
        headers: {
          'X-CMC_PRO_API_KEY': CMC_API_KEY,
          Accept: 'application/json',
          'User-Agent': 'OnAptos-Price-Tracker/1.0',
        },
        timeout: Math.min(config.timeout, 6000), // Cap at 6 seconds for production
        retries: 1, // Reduce retries for faster failure
      });

      if (!response.ok) {
        throw new Error(
          `CMC API error: ${response.status} ${response.statusText}`
        );
      }

      const responseData = (await response.json()) as {
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
      };

      const price = responseData?.data?.[cmcId]?.quote?.USD?.price;

      if (price == null) {
        throw new Error('Invalid price data received from CMC');
      }

      console.log(`[Price] ${symbol} price fetched:`, { price });

      return {
        symbol:
          SYMBOL_DISPLAY_NAMES[symbol.toLowerCase()] || symbol.toUpperCase(),
        name: SYMBOL_FULL_NAMES[symbol.toLowerCase()] || symbol,
        price,
        updated: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`[Price] CMC API call failed for ${symbol}:`, error);
      throw new ApiError(
        `CMC API call failed for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'CMC-API'
      );
    }
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

    const params = new URLSearchParams({
      tokenAddress: tokenAddresses.join(','),
    });
    const url = `${ApiEndpoints.PANORA_BASE}/prices?${params.toString()}`;

    const data = (await enhancedFetch(url, {
      headers: {
        'x-api-key': PANORA_API_KEY,
      },
      timeout: 10000,
      retries: 3,
    }).then(r => r.json())) as Array<{
      faAddress?: string;
      tokenAddress?: string;
      usdPrice?: string;
    }>;

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
   * Fetch historical price data using CoinGecko + Dexscreener fallback
   */
  private static async fetchCMCHistoricalPriceData(
    symbol: string,
    date: string
  ): Promise<{ price: number; date: string }> {
    const coinGeckoId = COINGECKO_IDS[symbol.toLowerCase()];

    // Try CoinGecko first (free and reliable)
    if (coinGeckoId) {
      try {
        const price = await this.getCoinGeckoHistoricalPrice(coinGeckoId, date);
        return { price, date };
      } catch (error) {
        console.warn(`CoinGecko failed for ${symbol} on ${date}:`, error);
      }
    }

    // Fallback to Dexscreener current price (no historical data available)
    try {
      const price = await this.getDexscreenerPrice(symbol);
      console.log(
        `Using Dexscreener current price for ${symbol} (historical not available)`
      );
      return { price, date };
    } catch (error) {
      console.warn(`Dexscreener failed for ${symbol}:`, error);
    }

    throw new ApiError(
      `No historical price data available for ${symbol} on ${date}`,
      undefined,
      'fetchCMCHistoricalPriceData'
    );
  }

  /**
   * Get historical price from CoinGecko
   */
  private static async getCoinGeckoHistoricalPrice(
    coinId: string,
    date: string
  ): Promise<number> {
    // Convert YYYY-MM-DD to DD-MM-YYYY format required by CoinGecko
    const [year, month, day] = date.split('-');
    const geckoDate = `${day}-${month}-${year}`;

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/history?date=${geckoDate}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OnAptos-Historical/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `CoinGecko API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.market_data?.current_price?.usd) {
      throw new Error(`No price data found for ${coinId} on ${date}`);
    }

    return parseFloat(data.market_data.current_price.usd.toFixed(6));
  }

  /**
   * Get current price from Dexscreener (fallback)
   */
  private static async getDexscreenerPrice(symbol: string): Promise<number> {
    // Map symbols to token addresses for Dexscreener
    const tokenAddresses: Record<string, string> = {
      APT: '0x1::aptos_coin::AptosCoin',
      USDC: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
      USDT: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT',
    };

    const tokenAddress = tokenAddresses[symbol.toUpperCase()];
    if (!tokenAddress) {
      throw new Error(`No Dexscreener mapping for ${symbol}`);
    }

    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OnAptos-Fallback/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Dexscreener API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.pairs?.[0]?.priceUsd) {
      throw new Error(`No price data found for ${symbol} on Dexscreener`);
    }

    return parseFloat(parseFloat(data.pairs[0].priceUsd).toFixed(6));
  }

  /**
   * Fetch CMC historical price range (private method)
   */
  private static async fetchCMCHistoricalPriceRange(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{ price: number; date: string }>> {
    const symbolId = CMC_SYMBOL_IDS[symbol.toLowerCase()];
    if (!symbolId) {
      throw new ApiError(
        `CMC ID not found for symbol: ${symbol}`,
        undefined,
        'fetchCMCHistoricalPriceRange'
      );
    }

    if (!CMC_API_KEY) {
      throw new ApiError(
        'CMC_API_KEY is not configured',
        undefined,
        'CMC-Config'
      );
    }

    try {
      const params = new URLSearchParams({
        id: symbolId,
        time_start: new Date(startDate).toISOString(),
        time_end: new Date(endDate).toISOString(),
        interval: 'daily',
      });
      const url = `${ApiEndpoints.CMC_BASE}/cryptocurrency/quotes/historical?${params.toString()}`;

      const response = await enhancedFetch(url, {
        method: 'GET',
        headers: {
          'X-CMC_PRO_API_KEY': CMC_API_KEY,
          Accept: 'application/json',
          'User-Agent': `OnAptos-${symbol}-Historical-Range/1.0`,
        },
        timeout: config.timeout,
        retries: config.retries,
      }).then(r => r.json());

      const data = (response as any).data[symbolId];
      if (!data || !data.quotes) {
        throw new ApiError(
          `No historical data found for ${symbol} between ${startDate} and ${endDate}`,
          undefined,
          'fetchCMCHistoricalPriceRange'
        );
      }

      return data.quotes.map((quote: any) => ({
        price: parseFloat(quote.quote.USD.price.toFixed(6)),
        date: quote.timestamp.split('T')[0],
      }));
    } catch (error) {
      throw new ApiError(
        `Failed to fetch CMC historical price range for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'fetchCMCHistoricalPriceRange'
      );
    }
  }

  /**
   * Get all Panora prices data (private method)
   */
  private static async fetchAllPanoraPricesData(): Promise<PanoraPricesData> {
    if (!PANORA_API_KEY) {
      throw new ApiError(
        'PANORA_API_KEY is not configured',
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
        const price = prices[asset_type];
        if (price === undefined || price === null) {
          throw new ApiError(
            `No price found for token ${symbol} (${asset_type})`,
            undefined,
            'Panora-Price'
          );
        }

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
