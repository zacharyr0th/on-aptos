import { z } from 'zod';
import {
  createResponseSchema,
  ForceRefreshInputSchema,
} from '@/lib/trpc/shared/schemas';

/**
 * Bitcoin Domain Schemas
 */

// BTC Market schema
export const BTCMarketSchema = z.object({
  symbol: z.string(),
  marketAddress: z.string(),
  assetType: z.string(),
  description: z.string(),
  balance: z.string(),
  rawBalance: z.string(),
  decimals: z.number(),
  apyBase: z.number(),
  apyReward: z.number(),
  apyBaseBorrow: z.number(),
  totalSupply: z.number(),
  totalBorrow: z.number(),
  totalSupplyUsd: z.number(),
  totalBorrowUsd: z.number(),
  tvlUsd: z.number(),
  price: z.number(),
});

// BTC Supply Token schema
export const BTCSupplyTokenSchema = z.object({
  symbol: z.string(),
  supply: z.string(),
  formatted_supply: z.string(),
});

// BTC Data schema
export const BTCDataSchema = z.object({
  protocol: z.string(),
  markets: z.array(BTCMarketSchema),
  total: z.object({
    btc: z.string(),
    normalized: z.string(),
    tvlUsd: z.number(),
  }),
});

// Comprehensive BTC Supply schema
export const ComprehensiveBTCSupplySchema = z.object({
  supplies: z.array(BTCSupplyTokenSchema),
  total: z.string(),
  total_formatted: z.string(),
  total_decimals: z.number(),
});

// Response schemas
export const BTCDataResponseSchema = createResponseSchema(BTCDataSchema);
export const ComprehensiveBTCSupplyResponseSchema = createResponseSchema(
  ComprehensiveBTCSupplySchema
);

// Input schemas
export const BTCSuppliesInputSchema = ForceRefreshInputSchema;
