import { publicProcedure, router } from '../../../core/server';
import { LSTSupplyResponseSchema, ForceRefreshInputSchema } from './schemas';
import { fetchLSTSuppliesData } from './services';
import { LST_TOKENS } from '@/lib/config/data';
import { CacheService } from '../../../shared/services';

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
      const cacheKey = `lst-supplies-${input.forceRefresh || false}`;

      try {
        const result = await CacheService.getCachedOrFetch(
          cacheKey,
          fetchLSTSuppliesData,
          input.forceRefresh ? 0 : 300 // 5 minutes cache, 0 to force refresh
        );

        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: result.cached ? 1 : 0,
            cacheMisses: result.cached ? 0 : 1,
            apiCalls: result.cached ? 0 : LST_TOKENS.length,
          },
          cache: {
            cached: result.cached,
          },
          data: result.data,
        };
      } catch (error) {
        console.error('Error fetching LST supplies:', error);
        throw error;
      }
    }),
});
