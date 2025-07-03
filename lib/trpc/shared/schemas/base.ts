import { z } from 'zod';

/**
 * Base Schemas
 * Common schemas used across all tRPC endpoints
 */

// Common input schemas
export const ForceRefreshInputSchema = z.object({
  forceRefresh: z.boolean().optional().default(false),
});

export const PaginationInputSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
});

// Performance metrics schema
export const PerformanceMetricsSchema = z.object({
  responseTimeMs: z.number(),
  cacheHits: z.number(),
  cacheMisses: z.number(),
  apiCalls: z.number(),
});

// Cache info schema
export const CacheInfoSchema = z.object({
  cached: z.boolean(),
});

// Base response schema
export const BaseResponseSchema = z.object({
  timestamp: z.string(),
  performance: PerformanceMetricsSchema,
  cache: CacheInfoSchema,
});

// Create a generic response schema factory
export function createResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return BaseResponseSchema.extend({
    data: dataSchema,
  });
}

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional(),
  }),
  timestamp: z.string(),
});

// Common data schemas
export const PriceDataSchema = z.object({
  price: z.number(),
  currency: z.string().default('USD'),
  change24h: z.number().optional(),
  change7d: z.number().optional(),
  marketCap: z.number().optional(),
  volume24h: z.number().optional(),
  lastUpdated: z.string(),
});

export const SupplyDataSchema = z.object({
  total: z.number(),
  circulating: z.number(),
  locked: z.number().optional(),
  burned: z.number().optional(),
});

export const MetricsDataSchema = z.object({
  tvl: z.number(),
  volume24h: z.number(),
  users24h: z.number().optional(),
  transactions24h: z.number().optional(),
});
