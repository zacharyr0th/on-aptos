import { z } from 'zod';
import { router, publicProcedure } from '../../core/server';
import { BaseResponseSchema, ForceRefreshInputSchema } from '../../schemas';

/**
 * Panora protocol schemas
 */
const PanoraTokenResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    protocol: z.string(),
    tokens: z.array(
      z.object({
        symbol: z.string(),
        name: z.string(),
        address: z.string(),
        price: z.number().optional(),
      })
    ),
    supportedTokenCount: z.number(),
  }),
});

/**
 * Panora Protocol Router
 * Handles Panora Exchange integration and price feeds
 *
 * Note: Core Panora price functionality is integrated into the prices router.
 * This router provides dedicated Panora-specific endpoints for future expansion.
 */
export const panoraRouter = router({
  /**
   * Get basic Panora protocol information
   */
  getProtocolInfo: publicProcedure
    .output(
      BaseResponseSchema.extend({
        data: z.object({
          name: z.string(),
          description: z.string(),
          website: z.string(),
          status: z.string(),
          services: z.array(z.string()),
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
          name: 'Panora Exchange',
          description: 'Price feeds and token data aggregator for Aptos',
          website: 'https://panora.exchange',
          status: 'active',
          services: ['Price Feeds', 'Token Data', 'Market Analytics'],
        },
      };
    }),

  /**
   * Get supported tokens (placeholder for future expansion)
   */
  getSupportedTokens: publicProcedure
    .input(ForceRefreshInputSchema)
    .output(PanoraTokenResponseSchema)
    .query(async ({ input: _input }) => {
      // Placeholder implementation
      // Future: Could provide detailed token metadata and analytics
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
          protocol: 'Panora Exchange',
          tokens: [],
          supportedTokenCount: 0,
        },
      };
    }),
});
