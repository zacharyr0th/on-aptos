import { z } from 'zod';
import { createResponseSchema } from '@/lib/trpc/shared/schemas';

/**
 * Price Domain Schemas
 */

// CMC Price schemas
export const CMCPriceDataSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  updated: z.string(),
});

export const CMCPriceResponseSchema = createResponseSchema(CMCPriceDataSchema);

// Panora Price schemas
export const PanoraPriceItemSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  asset_type: z.string(),
  price: z.string(),
  decimals: z.number(),
});

export const PanoraPricesDataSchema = z.object({
  success: z.boolean(),
  prices: z.array(PanoraPriceItemSchema),
  attribution: z.string(),
});

export const PanoraPricesResponseSchema = createResponseSchema(
  PanoraPricesDataSchema
);

// Historical Price schemas
export const CMCHistoricalPriceDataSchema = z.object({
  price: z.number(),
  date: z.string(),
});

export const CMCHistoricalPriceResponseSchema = createResponseSchema(
  CMCHistoricalPriceDataSchema
);

// Input schemas
export const GetCMCPriceInputSchema = z.object({
  symbol: z.string(),
});

export const GetCMCHistoricalPriceInputSchema = z.object({
  symbol: z.string(),
  date: z.string(),
});
