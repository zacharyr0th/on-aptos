import { z } from 'zod';

// Base schemas for common data structures
export const TimestampSchema = z.string().datetime();
export const AddressSchema = z.string().min(1, 'Address cannot be empty');
export const AssetTypeSchema = z.string().min(1, 'Asset type cannot be empty');

// Common token/asset schemas
export const TokenBalanceSchema = z.object({
  amount: z.string(),
  formatted: z.string(),
  decimals: z.number().int().min(0),
  symbol: z.string(),
  address: z.string(),
});

export const PriceDataSchema = z.object({
  price: z.number().min(0),
  priceUsd: z.number().min(0).optional(),
  change24h: z.number().optional(),
  change7d: z.number().optional(),
  volume24h: z.number().min(0).optional(),
  marketCap: z.number().min(0).optional(),
  timestamp: TimestampSchema,
});

// Protocol-agnostic schemas for different data types
export const SupplyDataSchema = z.object({
  supply: z.string(),
  supply_raw: z.string(),
  formatted_supply: z.string(),
  decimals: z.number().int().min(0),
});

export const MarketDataSchema = z.object({
  symbol: z.string(),
  marketAddress: z.string(),
  assetType: z.string(),
  tvlUsd: z.number().min(0),
  totalSupply: z.number().min(0),
  totalBorrow: z.number().min(0).optional(),
  apyBase: z.number().min(0),
  apyReward: z.number().min(0).optional(),
  price: z.number().min(0),
});

// Performance and caching schemas
export const PerformanceMetricsSchema = z.object({
  responseTimeMs: z.number().min(0),
  cacheHits: z.number().int().min(0),
  cacheMisses: z.number().int().min(0),
  apiCalls: z.number().int().min(0),
});

export const CacheInfoSchema = z.object({
  cached: z.boolean(),
  cacheKey: z.string().optional(),
  expiresAt: TimestampSchema.optional(),
});

// Base response schema for all API responses
export const BaseResponseSchema = z.object({
  timestamp: TimestampSchema,
  performance: PerformanceMetricsSchema,
  cache: CacheInfoSchema,
});

// Protocol-specific schemas (can be extended by specific routers)
export const AptosTransactionSchema = z.object({
  hash: z.string(),
  sender: AddressSchema,
  sequence_number: z.number().int().min(0),
  max_gas_amount: z.number().int().min(0),
  gas_unit_price: z.number().int().min(0),
  expiration_timestamp_secs: z.number().int().min(0),
  payload: z.object({
    type: z.string(),
    function: z.string(),
    arguments: z.array(z.any()),
    type_arguments: z.array(z.string()).optional(),
  }),
});

// Input validation schemas
export const ForceRefreshInputSchema = z.object({
  forceRefresh: z.boolean().optional().default(false),
});

export const PaginationInputSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export const AddressInputSchema = z.object({
  address: AddressSchema,
});

export const AssetTypeInputSchema = z.object({
  assetType: AssetTypeSchema,
});

// Error schemas
export const ErrorDetailsSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  timestamp: TimestampSchema,
});

// Export common types
export type TokenBalance = z.infer<typeof TokenBalanceSchema>;
export type PriceData = z.infer<typeof PriceDataSchema>;
export type SupplyData = z.infer<typeof SupplyDataSchema>;
export type MarketData = z.infer<typeof MarketDataSchema>;
export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;
export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type AptosTransaction = z.infer<typeof AptosTransactionSchema>;
export type ErrorDetails = z.infer<typeof ErrorDetailsSchema>;
