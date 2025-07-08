import { publicProcedure, router } from '../../../core/server';
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
      const data = await fetchAptosTVL();

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
        },
        data,
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
      const data = await fetchAptosSpotVolume();

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
        },
        data,
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
    const startTime = Date.now();
    const data = await fetchAptosDerivativesVolume();

    return {
      timestamp: new Date().toISOString(),
      performance: {
        responseTimeMs: Date.now() - startTime,
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
      const data = await fetchAptosProtocols();

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
        },
        data,
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
      const data = await fetchAllAptosMetrics();

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
        },
        data,
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
      const startTime = Date.now();
      const data = await fetchProtocolMetrics(protocolNames);

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
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
      const startTime = Date.now();
      const data = await fetchProtocolComprehensiveData(protocolNames);

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
        },
        data,
      };
    }),
});
