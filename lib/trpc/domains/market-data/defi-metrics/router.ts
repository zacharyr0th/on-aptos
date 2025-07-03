import { publicProcedure, router } from '../../../core/server';
import { CacheService } from '../../../shared/services';
import { ProtocolNamesInputSchema } from './schemas';
import {
  fetchAptosTVL,
  fetchAptosSpotVolume,
  fetchAptosDerivativesVolume,
  fetchAptosProtocols,
  fetchAllAptosMetrics,
  fetchProtocolMetrics,
  fetchProtocolComprehensiveData,
} from './services';

/**
 * DeFi Metrics Router
 * Handles TVL, volume data, and protocol information
 */
export const defiMetricsRouter = router({
  /**
   * Get current TVL for Aptos ecosystem from DeFiLlama
   */
  getTVL: publicProcedure.query(async () => {
    const startTime = Date.now();

    try {
      const result = await CacheService.getCachedOrFetch(
        'defi-tvl',
        fetchAptosTVL,
        300 // 5 minutes cache
      );

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: result.cached ? 1 : 0,
          cacheMisses: result.cached ? 0 : 1,
          apiCalls: result.cached ? 0 : 1,
        },
        cache: {
          cached: result.cached,
        },
        data: result.data,
      };
    } catch (error) {
      console.error('Error fetching Aptos TVL:', error);
      throw error;
    }
  }),

  /**
   * Get 24h spot trading volume for Aptos from DeFiLlama
   */
  getSpotVolume: publicProcedure.query(async () => {
    const startTime = Date.now();

    try {
      const result = await CacheService.getCachedOrFetch(
        'defi-spot-volume',
        fetchAptosSpotVolume,
        300 // 5 minutes cache
      );

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: result.cached ? 1 : 0,
          cacheMisses: result.cached ? 0 : 1,
          apiCalls: result.cached ? 0 : 1,
        },
        cache: {
          cached: result.cached,
        },
        data: result.data,
      };
    } catch (error) {
      console.error('Error fetching Aptos spot volume:', error);
      throw error;
    }
  }),

  /**
   * Get 24h derivatives trading volume for Aptos (placeholder for future implementation)
   */
  getDerivativesVolume: publicProcedure.query(async () => {
    const data = await fetchAptosDerivativesVolume();

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
      data,
    };
  }),

  /**
   * Get Aptos protocols count and information from DeFiLlama
   */
  getProtocols: publicProcedure.query(async () => {
    const startTime = Date.now();

    try {
      const result = await CacheService.getCachedOrFetch(
        'defi-protocols',
        fetchAptosProtocols,
        600 // 10 minutes cache
      );

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: result.cached ? 1 : 0,
          cacheMisses: result.cached ? 0 : 1,
          apiCalls: result.cached ? 0 : 1,
        },
        cache: {
          cached: result.cached,
        },
        data: result.data,
      };
    } catch (error) {
      console.error('Error fetching Aptos protocols:', error);
      throw error;
    }
  }),

  /**
   * Get all DeFi metrics in one call (aggregates TVL and volume from DeFiLlama)
   */
  getAllMetrics: publicProcedure.query(async () => {
    const startTime = Date.now();

    try {
      const result = await CacheService.getCachedOrFetch(
        'defi-all-metrics',
        fetchAllAptosMetrics,
        300 // 5 minutes cache
      );

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: result.cached ? 1 : 0,
          cacheMisses: result.cached ? 0 : 1,
          apiCalls: result.cached ? 0 : 3,
        },
        cache: {
          cached: result.cached,
        },
        data: result.data,
      };
    } catch (error) {
      console.error('Error fetching all DeFi metrics:', error);
      throw error;
    }
  }),

  /**
   * Get protocol-specific TVL and volume data for Aptos protocols
   */
  getProtocolMetrics: publicProcedure
    .input(ProtocolNamesInputSchema)
    .query(async ({ input: protocolNames }) => {
      const data = await fetchProtocolMetrics(protocolNames);

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
        data,
      };
    }),

  /**
   * Get comprehensive protocol data for dialog display
   */
  getProtocolComprehensiveData: publicProcedure
    .input(ProtocolNamesInputSchema)
    .query(async ({ input: protocolNames }) => {
      const data = await fetchProtocolComprehensiveData(protocolNames);

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
        data,
      };
    }),
});
