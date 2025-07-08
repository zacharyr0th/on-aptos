import { router, publicProcedure } from '@/lib/trpc/core/server';
import { ForceRefreshInputSchema } from '@/lib/trpc/shared/schemas';
import {
  cmcCache,
  cacheFirst,
  withErrorHandling,
  type ErrorContext,
} from '@/lib/utils';
import { StablesSuppliesResponseSchema } from './schemas';
import { processStablesSuppliesData } from './services';

/**
 * Stablecoins Router
 * Handles stablecoin supply tracking and analytics
 */
export const stablecoinsRouter = router({
  /**
   * Get stablecoin supplies
   */
  getSupplies: publicProcedure
    .input(ForceRefreshInputSchema)
    .output(StablesSuppliesResponseSchema)
    .query(async ({ input }) => {
      const startTime = Date.now();
      const cacheKey = 'stables-supplies';

      const errorContext: ErrorContext = {
        operation: 'Stables supplies fetch',
        service: 'Stables',
        details: { forceRefresh: input.forceRefresh },
      };

      return await withErrorHandling(async () => {
        const data = input.forceRefresh
          ? await processStablesSuppliesData()
          : await cacheFirst(cmcCache, cacheKey, processStablesSuppliesData);

        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: input.forceRefresh ? 0 : 1,
            cacheMisses: input.forceRefresh ? 1 : 0,
            apiCalls: 2,
          },
          cache: {
            cached: !input.forceRefresh,
          },
          data,
        };
      }, errorContext);
    }),
});
