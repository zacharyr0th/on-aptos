import { router, publicProcedure } from '@/lib/trpc/core/server';
import { ForceRefreshInputSchema } from '@/lib/trpc/shared/schemas';
import { cacheFirst, withErrorHandling, type ErrorContext } from '@/lib/utils';
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

      return await withErrorHandling(
        () =>
          cacheFirst({
            namespace: 'stables',
            cacheKey,
            fetchFn: processStablesSuppliesData,
            startTime,
            forceRefresh: input.forceRefresh,
            apiCallCount: 2,
          }),
        errorContext
      );
    }),
});
