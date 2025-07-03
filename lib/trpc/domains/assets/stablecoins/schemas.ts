import { z } from 'zod';
import { BaseResponseSchema } from '@/lib/trpc/shared/schemas';

/**
 * Stablecoins Domain Schemas
 */

export const StableSupplySchema = z.object({
  symbol: z.string(),
  supply: z.string(),
  supply_raw: z.string(),
  percentage: z.number(),
  usd_value: z.number().optional(),
  asset_type: z.string(),
});

export const StablesSuppliesResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    supplies: z.array(StableSupplySchema),
    total: z.string(),
    total_raw: z.string(),
    total_usd: z.number().optional(),
    debug: z.object({
      cached_entries: z.number(),
      fallback_used: z.boolean(),
      performance: z.object({
        cache_hits: z.number(),
        cache_misses: z.number(),
        api_calls: z.number(),
      }),
    }),
  }),
});

// GraphQL response types
export interface StablesGraphQLResponse {
  fungible_asset_metadata: Array<{
    asset_type: string;
    supply_v2: string;
  }>;
}

export interface BalanceGraphQLResponse {
  current_fungible_asset_balances: Array<{
    amount: string;
    owner_address: string;
  }>;
}

// Export types
export type StableSupply = z.infer<typeof StableSupplySchema>;
export type StablesSuppliesResponse = z.infer<
  typeof StablesSuppliesResponseSchema
>;
