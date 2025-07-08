import { publicProcedure, router } from '../../../core/server';
import { LSTSupplyResponseSchema, ForceRefreshInputSchema } from './schemas';
import { fetchLSTSuppliesData } from './services';

/**
 * Liquid Staking Tokens (LST) Router
 */
export const liquidStakingRouter = router({
  /**
   * Get LST token supplies
   */
  getSupplies: publicProcedure
    .input(ForceRefreshInputSchema)
    .output(LSTSupplyResponseSchema)
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        const data = await fetchLSTSuppliesData();

        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 0,
            cacheMisses: 0,
            apiCalls: data.supplies.length, // One API call per token
          },
          cache: {
            cached: false,
          },
          data,
        };
      } catch (error) {
        console.error('Error fetching LST supplies:', error);
        throw error;
      }
    }),
});
