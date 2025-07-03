import { router, publicProcedure } from '@/lib/trpc/core/server';
import { buildStandardResponse } from '@/lib/trpc/shared/services';
import {
  GetCMCPriceInputSchema,
  CMCPriceResponseSchema,
  PanoraPricesResponseSchema,
} from './schemas';
import { PriceService } from './services';

/**
 * Prices Router
 * Handles all price-related endpoints
 */
export const pricesRouter = router({
  /**
   * Get CMC price for a specific symbol
   */
  getCMCPrice: publicProcedure
    .input(GetCMCPriceInputSchema)
    .output(CMCPriceResponseSchema)
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        const data = await PriceService.getCMCPrice(input.symbol);
        return buildStandardResponse(data, startTime, false, 1);
      } catch (error) {
        // Let tRPC handle the error
        throw error;
      }
    }),

  /**
   * Get all Panora prices
   */
  getPanoraPrices: publicProcedure
    .output(PanoraPricesResponseSchema)
    .query(async () => {
      const startTime = Date.now();

      try {
        const data = await PriceService.getPanoraPrices();
        return buildStandardResponse(data, startTime, false, 1);
      } catch (error) {
        // Let tRPC handle the error
        throw error;
      }
    }),
});
