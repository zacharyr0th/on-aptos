import { router, publicProcedure } from '@/lib/trpc/core/server';
import {
  GetCMCPriceInputSchema,
  CMCPriceResponseSchema,
  GetCMCHistoricalPriceInputSchema,
  CMCHistoricalPriceResponseSchema,
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
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 0,
            cacheMisses: 0,
            apiCalls: 1,
          },
          cache: {
            cached: false,
          },
          data,
        };
      } catch (error) {
        // Let tRPC handle the error
        throw error;
      }
    }),

  /**
   * Get CMC historical price for a specific symbol and date
   */
  getCMCHistoricalPrice: publicProcedure
    .input(GetCMCHistoricalPriceInputSchema)
    .output(CMCHistoricalPriceResponseSchema)
    .query(async ({ input }) => {
      const startTime = Date.now();

      try {
        const data = await PriceService.getCMCHistoricalPrice(
          input.symbol,
          input.date
        );
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 0,
            cacheMisses: 0,
            apiCalls: 1,
          },
          cache: {
            cached: false,
          },
          data,
        };
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
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 0,
            cacheMisses: 0,
            apiCalls: 1,
          },
          cache: {
            cached: false,
          },
          data,
        };
      } catch (error) {
        // Let tRPC handle the error
        throw error;
      }
    }),
});
