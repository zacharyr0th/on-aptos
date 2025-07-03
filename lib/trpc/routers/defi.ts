import { z } from 'zod';
import { router, publicProcedure } from '../core/server';
import { SERVICE_CONFIG } from '@/lib/config/cache';
import { getCachedData, setCachedData, enhancedFetch } from '@/lib/utils';
import { protocolsRouter } from './protocols';

/**
 * DeFi specific schemas and interfaces
 */

// Interface for raw protocol data from DeFiLlama API
interface RawProtocolData {
  id: string;
  name: string;
  symbol?: string;
  category?: string;
  tvl?: number;
  change_1d?: number;
  change_7d?: number;
  chains?: string[];
  chain?: string;
}

// Interface for transformed protocol data returned by our API
interface TransformedProtocolData {
  id: string;
  name: string;
  symbol: string;
  category?: string;
  tvl: number;
  change_1d?: number;
  change_7d?: number;
}

// Interface for TVL historical data from DeFiLlama
interface TvlHistoricalEntry {
  date: string;
  tvl: number;
}

// Interface for volume data from DeFiLlama
interface VolumeData {
  total24h?: number;
  totalVolume24h?: number;
}

// Interface for stablecoin data
interface StablecoinData {
  id: number;
  name: string;
  symbol: string;
  price?: number;
  circulating?: {
    peggedUSD?: number;
  };
  chains?: string[];
}

// Interface for stablecoin response
interface StablecoinsResponse {
  peggedAssets: StablecoinData[];
}

// Interface for stablecoin chart data
interface StablecoinChartEntry {
  date: string;
  totalCirculating: number;
}

// Interface for yield/pool data
interface YieldPoolData {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  apyPct1D?: number;
  apyPct7D?: number;
  apyPct30D?: number;
  stablecoin?: boolean;
  ilRisk?: string;
  exposure?: string;
  predictions?: {
    predictedClass?: string;
    predictedProbability?: number;
    binnedConfidence?: number;
  };
}

// Interface for fees data
interface FeesData {
  total24h?: number;
  totalAllTime?: number;
  breakdown24h?: Record<string, number>;
}

// Interface for revenue data
interface RevenueData {
  total24h?: number;
  totalAllTime?: number;
  breakdown24h?: Record<string, number>;
}

// Interface for price data
interface PriceData {
  price: number;
  symbol: string;
  timestamp: number;
  confidence?: number;
  decimals?: number;
}

// Interface for historical price data
interface HistoricalPriceData {
  timestamp: number;
  price: number;
}

// Interface for options volume data
interface OptionsVolumeData {
  dailyNotionalVolume?: number;
  dailyPremiumVolume?: number;
}

// Interface for protocols response
interface ProtocolsResponse {
  protocols: TransformedProtocolData[];
}

// Interface for all metrics response
interface AllMetricsResponse {
  tvl: number;
  spotVolume: number;
  derivativesVolume: number;
  protocolCount: number;
  protocols: TransformedProtocolData[];
  stablecoins: StablecoinData[];
  yieldPools: YieldPoolData[];
  fees: FeesData;
  revenue: RevenueData;
  optionsVolume: OptionsVolumeData;
}

// Protocol metrics type definition
type ProtocolMetrics = {
  tvl?: number;
  volume24h?: number;
  volumes?: {
    spot?: number;
    derivatives?: number;
  };
};

// Use centralized cache and config
const config = SERVICE_CONFIG.apiService;

/**
 * DeFi router with endpoints for TVL, volume data, and protocol information
 * Now componentized to use protocol-specific routers
 */
export const defiRouter = router({
  /**
   * Protocols sub-router - delegates to individual protocol implementations
   */
  protocols: protocolsRouter,

  /**
   * Get current TVL for Aptos ecosystem from DeFiLlama
   */
  getTVL: publicProcedure.query(async () => {
    const startTime = Date.now();
    const cacheKey = 'defi:aptos:tvl';

    try {
      // Try to get from cache first
      const cachedData = getCachedData<number>('apiService', cacheKey);
      if (cachedData !== null) {
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 1,
            cacheMisses: 0,
            apiCalls: 0,
          },
          cache: {
            cached: true,
          },
          data: cachedData,
        };
      }

      // Fetch from DeFiLlama API
      const response = await enhancedFetch('https://api.llama.fi/tvl/aptos', {
        timeout: config.timeout,
        retries: config.retries,
      });

      const tvlData = await response.json();
      const tvlValue = tvlData || 0;

      // Cache the result for 5 minutes
      setCachedData('apiService', cacheKey, tvlValue);

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: {
          cached: false,
        },
        data: tvlValue,
      };
    } catch (error) {
      console.error('Error fetching Aptos TVL from DeFiLlama:', error);

      // Return fallback data
      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: {
          cached: false,
        },
        data: 0,
      };
    }
  }),

  /**
   * Get 24h spot trading volume for Aptos from DeFiLlama
   */
  getSpotVolume: publicProcedure.query(async () => {
    const startTime = Date.now();
    const cacheKey = 'defi:aptos:spot-volume';

    try {
      // Try to get from cache first
      const cachedData = getCachedData<VolumeData>('apiService', cacheKey);
      if (cachedData !== null) {
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 1,
            cacheMisses: 0,
            apiCalls: 0,
          },
          cache: {
            cached: true,
          },
          data: cachedData,
        };
      }

      // Fetch from DeFiLlama volumes API for Aptos
      const response = await enhancedFetch(
        'https://api.llama.fi/overview/dexs/aptos',
        {
          timeout: config.timeout,
          retries: config.retries,
        }
      );

      const volumeData = (await response.json()) as VolumeData;
      const spotVolume = volumeData?.total24h || 0;

      const result: VolumeData = {
        total24h: spotVolume,
        totalVolume24h: spotVolume,
      };

      // Cache the result for 5 minutes
      setCachedData('apiService', cacheKey, result);

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: {
          cached: false,
        },
        data: result,
      };
    } catch (error) {
      console.error('Error fetching Aptos spot volume from DeFiLlama:', error);

      // Return fallback data
      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: {
          cached: false,
        },
        data: {
          total24h: 0,
          totalVolume24h: 0,
        } as VolumeData,
      };
    }
  }),

  /**
   * Get 24h derivatives trading volume for Aptos (placeholder for future implementation)
   */
  getDerivativesVolume: publicProcedure.query(async () => {
    return {
      timestamp: new Date().toISOString(),
      performance: {
        responseTimeMs: 1,
        cacheHits: 0,
        cacheMisses: 0,
        apiCalls: 0,
      },
      cache: {
        cached: false,
      },
      data: {
        total24h: 0,
        totalVolume24h: 0,
      } as VolumeData,
    };
  }),

  /**
   * Get stablecoins data for Aptos ecosystem
   */
  getStablecoins: publicProcedure.query(async () => {
    const startTime = Date.now();
    const cacheKey = 'defi:aptos:stablecoins';

    try {
      const cachedData = getCachedData<StablecoinsResponse>(
        'apiService',
        cacheKey
      );
      if (cachedData !== null) {
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 1,
            cacheMisses: 0,
            apiCalls: 0,
          },
          cache: { cached: true },
          data: cachedData,
        };
      }

      const response = await enhancedFetch('https://api.llama.fi/stablecoins', {
        timeout: config.timeout,
        retries: config.retries,
      });

      const stablecoinsData = (await response.json()) as StablecoinsResponse;

      // Filter for Aptos stablecoins
      const aptosStablecoins =
        stablecoinsData.peggedAssets?.filter((stablecoin: StablecoinData) =>
          stablecoin.chains?.includes('Aptos')
        ) || [];

      const result: StablecoinsResponse = {
        peggedAssets: aptosStablecoins,
      };

      setCachedData('apiService', cacheKey, result);

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: { cached: false },
        data: result,
      };
    } catch (error) {
      console.error('Error fetching Aptos stablecoins:', error);
      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: { cached: false },
        data: { peggedAssets: [] } as StablecoinsResponse,
      };
    }
  }),

  /**
   * Get stablecoin market cap history for Aptos
   */
  getStablecoinCharts: publicProcedure.query(async () => {
    const startTime = Date.now();
    const cacheKey = 'defi:aptos:stablecoin-charts';

    try {
      const cachedData = getCachedData<StablecoinChartEntry[]>(
        'apiService',
        cacheKey
      );
      if (cachedData !== null) {
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 1,
            cacheMisses: 0,
            apiCalls: 0,
          },
          cache: { cached: true },
          data: cachedData,
        };
      }

      const response = await enhancedFetch(
        'https://api.llama.fi/stablecoincharts/aptos',
        {
          timeout: config.timeout,
          retries: config.retries,
        }
      );

      const chartData = (await response.json()) as StablecoinChartEntry[];
      setCachedData('apiService', cacheKey, chartData);

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: { cached: false },
        data: chartData,
      };
    } catch (error) {
      console.error('Error fetching Aptos stablecoin charts:', error);
      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: { cached: false },
        data: [] as StablecoinChartEntry[],
      };
    }
  }),

  /**
   * Get yield pools data for Aptos protocols
   */
  getYieldPools: publicProcedure.query(async () => {
    const startTime = Date.now();
    const cacheKey = 'defi:aptos:yield-pools';

    try {
      const cachedData = getCachedData<YieldPoolData[]>('apiService', cacheKey);
      if (cachedData !== null) {
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 1,
            cacheMisses: 0,
            apiCalls: 0,
          },
          cache: { cached: true },
          data: cachedData,
        };
      }

      const response = await enhancedFetch('https://api.llama.fi/pools', {
        timeout: config.timeout,
        retries: config.retries,
      });

      const poolsData = (await response.json()) as { data: YieldPoolData[] };

      // Filter for Aptos pools
      const aptosPools =
        poolsData.data?.filter(
          (pool: YieldPoolData) => pool.chain?.toLowerCase() === 'aptos'
        ) || [];

      setCachedData('apiService', cacheKey, aptosPools);

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: { cached: false },
        data: aptosPools,
      };
    } catch (error) {
      console.error('Error fetching Aptos yield pools:', error);
      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: { cached: false },
        data: [] as YieldPoolData[],
      };
    }
  }),

  /**
   * Get fees data for Aptos protocols
   */
  getFees: publicProcedure.query(async () => {
    const startTime = Date.now();
    const cacheKey = 'defi:aptos:fees';

    try {
      const cachedData = getCachedData<FeesData>('apiService', cacheKey);
      if (cachedData !== null) {
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 1,
            cacheMisses: 0,
            apiCalls: 0,
          },
          cache: { cached: true },
          data: cachedData,
        };
      }

      const response = await enhancedFetch(
        'https://api.llama.fi/overview/fees/aptos',
        {
          timeout: config.timeout,
          retries: config.retries,
        }
      );

      const feesData = (await response.json()) as FeesData;
      setCachedData('apiService', cacheKey, feesData);

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: { cached: false },
        data: feesData,
      };
    } catch (error) {
      console.error('Error fetching Aptos fees:', error);
      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: { cached: false },
        data: { total24h: 0, totalAllTime: 0 } as FeesData,
      };
    }
  }),

  /**
   * Get revenue data for Aptos protocols
   */
  getRevenue: publicProcedure.query(async () => {
    const startTime = Date.now();
    const cacheKey = 'defi:aptos:revenue';

    try {
      const cachedData = getCachedData<RevenueData>('apiService', cacheKey);
      if (cachedData !== null) {
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 1,
            cacheMisses: 0,
            apiCalls: 0,
          },
          cache: { cached: true },
          data: cachedData,
        };
      }

      const response = await enhancedFetch(
        'https://api.llama.fi/overview/fees/aptos?dataType=dailyRevenue',
        {
          timeout: config.timeout,
          retries: config.retries,
        }
      );

      const revenueData = (await response.json()) as RevenueData;
      setCachedData('apiService', cacheKey, revenueData);

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: { cached: false },
        data: revenueData,
      };
    } catch (error) {
      console.error('Error fetching Aptos revenue:', error);
      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: { cached: false },
        data: { total24h: 0, totalAllTime: 0 } as RevenueData,
      };
    }
  }),

  /**
   * Get current prices for Aptos tokens
   */
  getTokenPrices: publicProcedure
    .input(z.array(z.string()))
    .query(async ({ input: tokenAddresses }) => {
      const startTime = Date.now();
      const cacheKey = `defi:aptos:token-prices:${tokenAddresses.join(',')}`;

      try {
        const cachedData = getCachedData<Record<string, PriceData>>(
          'apiService',
          cacheKey
        );
        if (cachedData !== null) {
          return {
            timestamp: new Date().toISOString(),
            performance: {
              responseTimeMs: Date.now() - startTime,
              cacheHits: 1,
              cacheMisses: 0,
              apiCalls: 0,
            },
            cache: { cached: true },
            data: cachedData,
          };
        }

        // Format addresses for DeFiLlama API (aptos:address format)
        const formattedAddresses = tokenAddresses
          .map(addr => `aptos:${addr}`)
          .join(',');

        const response = await enhancedFetch(
          `https://api.llama.fi/prices/current/${formattedAddresses}`,
          {
            timeout: config.timeout,
            retries: config.retries,
          }
        );

        const pricesData = (await response.json()) as {
          coins: Record<string, PriceData>;
        };
        setCachedData('apiService', cacheKey, pricesData.coins);

        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 0,
            cacheMisses: 1,
            apiCalls: 1,
          },
          cache: { cached: false },
          data: pricesData.coins || {},
        };
      } catch (error) {
        console.error('Error fetching Aptos token prices:', error);
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 0,
            cacheMisses: 1,
            apiCalls: 1,
          },
          cache: { cached: false },
          data: {} as Record<string, PriceData>,
        };
      }
    }),

  /**
   * Get historical prices for Aptos tokens
   */
  getHistoricalPrices: publicProcedure
    .input(
      z.object({
        tokenAddresses: z.array(z.string()),
        timestamp: z.number(),
      })
    )
    .query(async ({ input: { tokenAddresses, timestamp } }) => {
      const startTime = Date.now();
      const cacheKey = `defi:aptos:historical-prices:${tokenAddresses.join(',')}:${timestamp}`;

      try {
        const cachedData = getCachedData<Record<string, PriceData>>(
          'apiService',
          cacheKey
        );
        if (cachedData !== null) {
          return {
            timestamp: new Date().toISOString(),
            performance: {
              responseTimeMs: Date.now() - startTime,
              cacheHits: 1,
              cacheMisses: 0,
              apiCalls: 0,
            },
            cache: { cached: true },
            data: cachedData,
          };
        }

        // Format addresses for DeFiLlama API
        const formattedAddresses = tokenAddresses
          .map(addr => `aptos:${addr}`)
          .join(',');

        const response = await enhancedFetch(
          `https://api.llama.fi/prices/historical/${timestamp}/${formattedAddresses}`,
          {
            timeout: config.timeout,
            retries: config.retries,
          }
        );

        const pricesData = (await response.json()) as {
          coins: Record<string, PriceData>;
        };
        setCachedData('apiService', cacheKey, pricesData.coins); // Cache for 1 hour

        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 0,
            cacheMisses: 1,
            apiCalls: 1,
          },
          cache: { cached: false },
          data: pricesData.coins || {},
        };
      } catch (error) {
        console.error('Error fetching historical Aptos token prices:', error);
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 0,
            cacheMisses: 1,
            apiCalls: 1,
          },
          cache: { cached: false },
          data: {} as Record<string, PriceData>,
        };
      }
    }),

  /**
   * Get options volume data for Aptos (if available)
   */
  getOptionsVolume: publicProcedure.query(async () => {
    const startTime = Date.now();
    const cacheKey = 'defi:aptos:options-volume';

    try {
      const cachedData = getCachedData<OptionsVolumeData>(
        'apiService',
        cacheKey
      );
      if (cachedData !== null) {
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 1,
            cacheMisses: 0,
            apiCalls: 0,
          },
          cache: { cached: true },
          data: cachedData,
        };
      }

      const response = await enhancedFetch(
        'https://api.llama.fi/overview/options/aptos',
        {
          timeout: config.timeout,
          retries: config.retries,
        }
      );

      const optionsData = (await response.json()) as OptionsVolumeData;
      setCachedData('apiService', cacheKey, optionsData);

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: { cached: false },
        data: optionsData,
      };
    } catch (error) {
      console.error('Error fetching Aptos options volume:', error);
      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: { cached: false },
        data: {
          dailyNotionalVolume: 0,
          dailyPremiumVolume: 0,
        } as OptionsVolumeData,
      };
    }
  }),

  /**
   * Get Aptos protocols count and information from DeFiLlama
   */
  getProtocols: publicProcedure.query(async () => {
    const startTime = Date.now();
    const cacheKey = 'defi:aptos:protocols';

    try {
      // Try to get from cache first
      const cachedData = getCachedData<ProtocolsResponse>(
        'apiService',
        cacheKey
      );
      if (cachedData !== null) {
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 1,
            cacheMisses: 0,
            apiCalls: 0,
          },
          cache: {
            cached: true,
          },
          data: cachedData,
        };
      }

      // Fetch protocols from DeFiLlama API
      const response = await enhancedFetch('https://api.llama.fi/protocols', {
        timeout: config.timeout,
        retries: config.retries,
      });

      const protocolsData = (await response.json()) as RawProtocolData[];

      // Filter for Aptos protocols
      const aptosProtocols = protocolsData
        .filter(
          (protocol: RawProtocolData) =>
            protocol.chains?.includes('Aptos') || protocol.chain === 'Aptos'
        )
        .map(
          (protocol: RawProtocolData): TransformedProtocolData => ({
            id: protocol.id,
            name: protocol.name,
            symbol: protocol.symbol || protocol.name,
            category: protocol.category,
            tvl: protocol.tvl || 0,
            change_1d: protocol.change_1d,
            change_7d: protocol.change_7d,
          })
        );

      const result: ProtocolsResponse = {
        protocols: aptosProtocols,
      };

      // Cache the result for 10 minutes
      setCachedData('apiService', cacheKey, result);

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: {
          cached: false,
        },
        data: result,
      };
    } catch (error) {
      console.error('Error fetching Aptos protocols from DeFiLlama:', error);

      // Return fallback data
      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: {
          cached: false,
        },
        data: {
          protocols: [],
        } as ProtocolsResponse,
      };
    }
  }),

  /**
   * Get all DeFi metrics in one call (aggregates TVL and volume from DeFiLlama)
   */
  getAllMetrics: publicProcedure.query(async () => {
    const startTime = Date.now();
    const cacheKey = 'defi:aptos:all-metrics';

    try {
      // Try to get from cache first
      const cachedData = getCachedData<AllMetricsResponse>(
        'apiService',
        cacheKey
      );
      if (cachedData !== null) {
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 1,
            cacheMisses: 0,
            apiCalls: 0,
          },
          cache: {
            cached: true,
          },
          data: cachedData,
        };
      }

      // Fetch all data in parallel
      const [
        tvlResponse,
        volumeResponse,
        protocolsResponse,
        stablecoinsResponse,
        yieldPoolsResponse,
        feesResponse,
        revenueResponse,
        optionsResponse,
      ] = await Promise.allSettled([
        // Use the correct DeFiLlama endpoint for historical chain TVL
        enhancedFetch('https://api.llama.fi/v2/historicalChainTvl/Aptos', {
          timeout: config.timeout,
          retries: config.retries,
        }),
        enhancedFetch('https://api.llama.fi/overview/dexs/aptos', {
          timeout: config.timeout,
          retries: config.retries,
        }),
        enhancedFetch('https://api.llama.fi/protocols', {
          timeout: config.timeout,
          retries: config.retries,
        }),
        enhancedFetch('https://api.llama.fi/stablecoins', {
          timeout: config.timeout,
          retries: config.retries,
        }),
        enhancedFetch('https://api.llama.fi/pools', {
          timeout: config.timeout,
          retries: config.retries,
        }),
        enhancedFetch('https://api.llama.fi/overview/fees/aptos', {
          timeout: config.timeout,
          retries: config.retries,
        }),
        enhancedFetch(
          'https://api.llama.fi/overview/fees/aptos?dataType=dailyRevenue',
          {
            timeout: config.timeout,
            retries: config.retries,
          }
        ),
        enhancedFetch('https://api.llama.fi/overview/options/aptos', {
          timeout: config.timeout,
          retries: config.retries,
        }),
      ]);

      // Process TVL - extract latest value from historical data
      let tvl = 0;
      if (tvlResponse.status === 'fulfilled') {
        try {
          const tvlData =
            (await tvlResponse.value.json()) as TvlHistoricalEntry[];
          // Extract the latest TVL from the historical data array
          if (Array.isArray(tvlData) && tvlData.length > 0) {
            const latestEntry = tvlData[tvlData.length - 1];
            tvl = latestEntry?.tvl || 0;
          }
        } catch (e) {
          console.error('Error parsing TVL data:', e);
        }
      }

      // Process Volume
      let spotVolume = 0;
      if (volumeResponse.status === 'fulfilled') {
        try {
          const volumeData = (await volumeResponse.value.json()) as VolumeData;
          spotVolume = volumeData?.total24h || 0;
        } catch (e) {
          console.error('Error parsing volume data:', e);
        }
      }

      // Process Protocols
      let protocolCount = 0;
      let protocols: TransformedProtocolData[] = [];
      if (protocolsResponse.status === 'fulfilled') {
        try {
          const protocolsData =
            (await protocolsResponse.value.json()) as RawProtocolData[];
          const aptosProtocols = protocolsData.filter(
            (protocol: RawProtocolData) =>
              protocol.chains?.includes('Aptos') || protocol.chain === 'Aptos'
          );
          protocolCount = aptosProtocols.length;
          protocols = aptosProtocols.map(
            (protocol: RawProtocolData): TransformedProtocolData => ({
              id: protocol.id,
              name: protocol.name,
              symbol: protocol.symbol || protocol.name,
              category: protocol.category,
              tvl: protocol.tvl || 0,
              change_1d: protocol.change_1d,
              change_7d: protocol.change_7d,
            })
          );
        } catch (e) {
          console.error('Error parsing protocols data:', e);
        }
      }

      // Process Stablecoins
      let stablecoins: StablecoinData[] = [];
      if (stablecoinsResponse.status === 'fulfilled') {
        try {
          const stablecoinsData =
            (await stablecoinsResponse.value.json()) as StablecoinsResponse;
          stablecoins =
            stablecoinsData.peggedAssets?.filter((stablecoin: StablecoinData) =>
              stablecoin.chains?.includes('Aptos')
            ) || [];
        } catch (e) {
          console.error('Error parsing stablecoins data:', e);
        }
      }

      // Process Yield Pools
      let yieldPools: YieldPoolData[] = [];
      if (yieldPoolsResponse.status === 'fulfilled') {
        try {
          const poolsData = (await yieldPoolsResponse.value.json()) as {
            data: YieldPoolData[];
          };
          yieldPools =
            poolsData.data?.filter(
              (pool: YieldPoolData) => pool.chain?.toLowerCase() === 'aptos'
            ) || [];
        } catch (e) {
          console.error('Error parsing yield pools data:', e);
        }
      }

      // Process Fees
      let fees: FeesData = { total24h: 0, totalAllTime: 0 };
      if (feesResponse.status === 'fulfilled') {
        try {
          fees = (await feesResponse.value.json()) as FeesData;
        } catch (e) {
          console.error('Error parsing fees data:', e);
        }
      }

      // Process Revenue
      let revenue: RevenueData = { total24h: 0, totalAllTime: 0 };
      if (revenueResponse.status === 'fulfilled') {
        try {
          revenue = (await revenueResponse.value.json()) as RevenueData;
        } catch (e) {
          console.error('Error parsing revenue data:', e);
        }
      }

      // Process Options Volume
      let optionsVolume: OptionsVolumeData = {
        dailyNotionalVolume: 0,
        dailyPremiumVolume: 0,
      };
      if (optionsResponse.status === 'fulfilled') {
        try {
          optionsVolume =
            (await optionsResponse.value.json()) as OptionsVolumeData;
        } catch (e) {
          console.error('Error parsing options volume data:', e);
        }
      }

      const result: AllMetricsResponse = {
        tvl,
        spotVolume,
        derivativesVolume: 0, // Not available for Aptos yet
        protocolCount,
        protocols,
        stablecoins,
        yieldPools,
        fees,
        revenue,
        optionsVolume,
      };

      // Cache the result for 5 minutes
      setCachedData('apiService', cacheKey, result);

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 8,
        },
        cache: {
          cached: false,
        },
        data: result,
      };
    } catch (error) {
      console.error('Error fetching all DeFi metrics:', error);

      // Return fallback data
      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 0,
        },
        cache: {
          cached: false,
        },
        data: {
          tvl: 0,
          spotVolume: 0,
          derivativesVolume: 0,
          protocolCount: 0,
          protocols: [],
          stablecoins: [],
          yieldPools: [],
          fees: { total24h: 0, totalAllTime: 0 },
          revenue: { total24h: 0, totalAllTime: 0 },
          optionsVolume: { dailyNotionalVolume: 0, dailyPremiumVolume: 0 },
        } as AllMetricsResponse,
      };
    }
  }),

  /**
   * Get protocol-specific TVL and volume data for Aptos protocols
   */
  getProtocolMetrics: publicProcedure
    .input(z.array(z.string()))
    .query(async ({ input: protocolNames }) => {
      // This would aggregate metrics from specific protocol routers
      const emptyMetrics: Record<string, ProtocolMetrics> = {};
      protocolNames.forEach(name => {
        emptyMetrics[name] = { tvl: undefined, volume24h: undefined };
      });

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: 1,
          cacheHits: 0,
          cacheMisses: 0,
          apiCalls: 0,
        },
        cache: {
          cached: false,
        },
        data: emptyMetrics,
      };
    }),

  /**
   * Get comprehensive protocol data for dialog display
   */
  getProtocolComprehensiveData: publicProcedure
    .input(z.array(z.string()))
    .query(async ({ input: protocolNames }) => {
      // This would aggregate comprehensive data from specific protocol routers
      const emptyData: Record<string, TransformedProtocolData | null> = {};
      protocolNames.forEach(name => {
        emptyData[name] = null;
      });

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: 1,
          cacheHits: 0,
          cacheMisses: 0,
          apiCalls: 0,
        },
        cache: {
          cached: false,
        },
        data: emptyData,
      };
    }),
});
