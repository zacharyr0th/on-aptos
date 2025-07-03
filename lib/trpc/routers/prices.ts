import { z } from 'zod';
import { router, publicProcedure } from '../core/server';
import { BaseResponseSchema } from '../schemas';
import { PANORA_TOKENS } from '@/lib/config/data';
import { SERVICE_CONFIG } from '@/lib/config/cache';
import {
  enhancedFetch,
  formatNumber,
  cacheFirst,
  withErrorHandling,
  ApiError,
  type FetchOptions,
  type ErrorContext,
} from '@/lib/utils';

/**
 * Price specific schemas
 */
const CMCPriceSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  updated: z.string(),
});

const CMCPriceResponseSchema = BaseResponseSchema.extend({
  data: CMCPriceSchema,
});

const PanoraPriceItemSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  asset_type: z.string(),
  price: z.string(),
  decimals: z.number(),
});

const PanoraPricesResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    success: z.boolean(),
    prices: z.array(PanoraPriceItemSchema),
    attribution: z.string(),
  }),
});

// CMC configuration
const CMC_API_KEY = process.env.CMC_API_KEY;

// Panora configuration
const PANORA_API_URL = 'https://api.panora.exchange/prices';
const PANORA_API_KEY = process.env.PANORA_API_KEY;

// Use centralized cache and config
const config = SERVICE_CONFIG.prices;

// CMC symbol ID mapping
const CMC_SYMBOL_IDS: Record<string, string> = {
  susde: '29471',
  btc: '1',
  apt: '21794', // Aptos
  // Add more mappings as needed
};

/**
 * Fetch CMC price for a specific symbol - core data fetching logic
 */
async function fetchCMCPriceData(
  symbol: string
): Promise<z.infer<typeof CMCPriceSchema>> {
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

  const fetchOptions: FetchOptions = {
    headers: {
      'X-CMC_PRO_API_KEY': CMC_API_KEY,
      Accept: 'application/json',
      'User-Agent': 'Next.js/14 DeFi-Dashboard (Price-Feeds)',
    },
    timeout: config.timeout,
    retries: config.retries,
    retryDelay: 1000,
  };

  const response = await enhancedFetch(
    `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=${cmcId}`,
    fetchOptions
  );

  if (!response.ok) {
    throw new ApiError(
      `CMC API responded with status: ${response.status}`,
      response.status,
      'CMC'
    );
  }

  const json = await response.json();
  const price = json?.data?.[cmcId]?.quote?.USD?.price;

  if (price == null) {
    throw new ApiError(
      'Invalid price data received from CMC',
      undefined,
      'CMC-Data'
    );
  }

  // Map symbol to proper display names
  const symbolDisplayNames: Record<string, string> = {
    susde: 'sUSDe',
    btc: 'BTC',
    apt: 'APT',
  };

  const fullNames: Record<string, string> = {
    susde: 'Ethena Staked USDe',
    btc: 'Bitcoin',
    apt: 'Aptos',
  };

  return {
    symbol: symbolDisplayNames[symbol.toLowerCase()] || symbol.toUpperCase(),
    name: fullNames[symbol.toLowerCase()] || symbol,
    price,
    updated: new Date().toISOString(),
  };
}

/**
 * Fetch prices from Panora API - core data fetching logic
 */
async function fetchPanoraPricesData(
  tokenAddresses: string[]
): Promise<Record<string, number>> {
  const url = new URL(PANORA_API_URL);
  url.searchParams.append('tokenAddress', tokenAddresses.join(','));

  if (!PANORA_API_KEY) {
    throw new ApiError(
      'PANORA_API_KEY is not configured',
      undefined,
      'Panora-Config'
    );
  }

  const fetchOptions: FetchOptions = {
    headers: {
      'x-api-key': PANORA_API_KEY,
      'User-Agent': 'Next.js/14 DeFi-Dashboard (Price-Feeds)',
    },
    cache: 'no-store',
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
  };

  const response = await enhancedFetch(url.toString(), fetchOptions);

  if (!response.ok) {
    throw new ApiError(
      `Panora API returned ${response.status}: ${response.statusText}`,
      response.status,
      'Panora'
    );
  }

  const data = await response.json();
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
 * Get all Panora prices - core data processing logic
 */
async function getAllPanoraPricesData(): Promise<
  z.infer<typeof PanoraPricesResponseSchema>['data']
> {
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
  const prices = await fetchPanoraPricesData(tokenAddresses);

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

/**
 * Prices router using the new utilities
 */
export const pricesRouter = router({
  getCMCPrice: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
      })
    )
    .output(CMCPriceResponseSchema)
    .query(async ({ input }) => {
      const startTime = Date.now();
      const cacheKey = `cmc_price_${input.symbol.toLowerCase()}`;

      const errorContext: ErrorContext = {
        operation: 'CMC price fetch',
        service: 'CMC',
        details: { symbol: input.symbol },
      };

      return await withErrorHandling(
        () =>
          cacheFirst({
            namespace: 'prices',
            cacheKey,
            fetchFn: () => fetchCMCPriceData(input.symbol),
            startTime,
            apiCallCount: 1,
          }),
        errorContext
      );
    }),

  getPanoraPrices: publicProcedure
    .output(PanoraPricesResponseSchema)
    .query(async () => {
      const startTime = Date.now();
      const cacheKey = 'panora_prices';

      const errorContext: ErrorContext = {
        operation: 'Panora prices fetch',
        service: 'Panora',
      };

      return await withErrorHandling(
        () =>
          cacheFirst({
            namespace: 'prices',
            cacheKey,
            fetchFn: getAllPanoraPricesData,
            startTime,
            apiCallCount: 1,
          }),
        errorContext
      );
    }),
});
