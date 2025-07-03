import { z } from 'zod';
import { router, publicProcedure } from '../../core/server';
import {
  BaseResponseSchema,
  ForceRefreshInputSchema,
  MarketDataSchema,
} from '../../schemas';

/**
 * Echelon protocol schemas
 */
const EchelonMarketResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    protocol: z.string(),
    markets: z.array(MarketDataSchema),
    totalTVL: z.number().optional(),
  }),
});

/**
 * Echelon Protocol Router
 * Handles Echelon lending protocol data and markets
 *
 * Note: Much of the Echelon functionality is currently integrated into the BTC router.
 * This router provides a dedicated space for Echelon-specific endpoints.
 */
export const echelonRouter = router({
  /**
   * Get basic Echelon protocol information
   */
  getProtocolInfo: publicProcedure
    .output(
      BaseResponseSchema.extend({
        data: z.object({
          name: z.string(),
          description: z.string(),
          website: z.string(),
          status: z.string(),
        }),
      })
    )
    .query(async () => {
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
          name: 'Echelon Protocol',
          description: 'Lending and borrowing protocol on Aptos',
          website: 'https://app.echelon.market',
          status: 'active',
        },
      };
    }),

  /**
   * Get Echelon markets (placeholder for future expansion)
   * Currently most market data is handled in the BTC router
   */
  getMarkets: publicProcedure
    .input(ForceRefreshInputSchema)
    .output(EchelonMarketResponseSchema)
    .query(async ({ input: _input }) => {
      // Placeholder implementation
      // In the future, this could fetch detailed market data specific to Echelon
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
          protocol: 'Echelon',
          markets: [],
          totalTVL: 0,
        },
      };
    }),
});
