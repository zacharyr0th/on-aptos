import { router, publicProcedure } from '@/lib/trpc/core/server';
import {
  BTCSuppliesInputSchema,
  BTCDataResponseSchema,
  ComprehensiveBTCSupplyResponseSchema,
} from './schemas';
import { BitcoinService } from './services';
import {
  buildFreshResponse,
  withErrorHandling,
  type ErrorContext,
} from '@/lib/utils';

/**
 * Bitcoin Router
 * Enhanced with proper error handling and response building
 */
export const bitcoinRouter = router({
  /**
   * Get BTC supplies from Echelon
   */
  getSupplies: publicProcedure
    .input(BTCSuppliesInputSchema)
    .output(BTCDataResponseSchema)
    .query(async ({ input }) => {
      const startTime = Date.now();

      const errorContext: ErrorContext = {
        operation: 'Get BTC supplies',
        service: 'BTC-Router',
        details: { forceRefresh: input.forceRefresh },
      };

      return withErrorHandling(async () => {
        const data = await BitcoinService.getBTCSupplies(input.forceRefresh);
        return buildFreshResponse(data, startTime, 1);
      }, errorContext);
    }),

  /**
   * Get comprehensive BTC supplies
   */
  getComprehensiveSupplies: publicProcedure
    .input(BTCSuppliesInputSchema)
    .output(ComprehensiveBTCSupplyResponseSchema)
    .query(async ({ input }) => {
      const startTime = Date.now();

      const errorContext: ErrorContext = {
        operation: 'Get comprehensive BTC supplies',
        service: 'BTC-Router',
        details: { forceRefresh: input.forceRefresh },
      };

      return withErrorHandling(async () => {
        const data = await BitcoinService.getComprehensiveBTCSupplies(
          input.forceRefresh
        );
        return buildFreshResponse(
          data,
          startTime,
          Object.keys(data.supplies).length
        );
      }, errorContext);
    }),
});
