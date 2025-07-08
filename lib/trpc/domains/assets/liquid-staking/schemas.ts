import { z } from 'zod';
import { BaseResponseSchema } from '../../../shared/schemas/base';

/**
 * LST Token Schema
 */
export const LSTTokenSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  supply: z.string(),
  formatted_supply: z.string(),
  decimals: z.number(),
  asset_type: z.string(),
});

/**
 * LST Supply Response Schema
 */
export const LSTSupplyResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    supplies: z.array(LSTTokenSchema),
    total: z.string(),
    total_formatted: z.string(),
    debug: z
      .object({
        source: z.string(),
        tokenCount: z.number(),
        indexerUrl: z.string(),
        query: z.string(),
        successfulFetches: z.number().optional(),
        hadRateLimitError: z.boolean().optional(),
      })
      .optional(),
  }),
});

/**
 * Force Refresh Input Schema
 */
export const ForceRefreshInputSchema = z.object({
  forceRefresh: z.boolean().optional(),
});

// Type exports
export type LSTToken = z.infer<typeof LSTTokenSchema>;
export type LSTSupplyResponse = z.infer<typeof LSTSupplyResponseSchema>;
export type ForceRefreshInput = z.infer<typeof ForceRefreshInputSchema>;
