/**
 * Zod validation schemas for runtime type checking
 * Provides type-safe validation for API responses and data transformations
 */

import { z } from "zod";

// =============================================================================
// BASE SCHEMAS
// =============================================================================

export const TokenMetadataSchema = z.object({
  symbol: z.string().optional(),
  name: z.string().optional(),
  decimals: z.number().optional(),
  asset_type: z.string().optional(),
  logoUrl: z.string().url().optional(),
  icon_uri: z.string().url().optional(),
  description: z.string().optional(),
  project_uri: z.string().url().optional(),
  website: z.string().url().optional(),
  twitter: z.string().url().optional(),
  telegram: z.string().url().optional(),
  discord: z.string().url().optional(),
  // Market data
  price: z.number().optional(),
  market_cap: z.number().optional(),
  volume_24h: z.number().optional(),
  circulating_supply: z.number().optional(),
  total_supply: z.string().optional(),
  max_supply: z.string().optional(),
});

export const FungibleAssetSchema = z.object({
  asset_type: z.string(),
  amount: z.string(),
  metadata: z
    .object({
      name: z.string(),
      symbol: z.string(),
      decimals: z.number(),
      icon_uri: z.string().optional(),
      project_uri: z.string().optional(),
    })
    .optional(),
  price_usd: z.number().optional(),
  value_usd: z.number().optional(),
});

export const NFTAttributeSchema = z.object({
  trait_type: z.string(),
  value: z.union([z.string(), z.number()]),
});

export const NFTMetadataSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    animation_url: z.string().optional(),
    attributes: z.array(NFTAttributeSchema).optional(),
  })
  .catchall(z.any()); // Allow additional properties

export const NFTSchema = z.object({
  token_data_id: z.string(),
  token_name: z.string(),
  collection_name: z.string(),
  token_uri: z.string(),
  description: z.string().optional(),
  amount: z.number().optional(),
  owner_address: z.string().optional(),
  last_transaction_version: z.string().optional(),
  last_transaction_timestamp: z.string().optional(),
  property_version: z.string().optional(),
  table_type: z.string().optional(),
  // Metadata fields
  image: z.string().optional(),
  animation_url: z.string().optional(),
  attributes: z.array(NFTAttributeSchema).optional(),
});

// =============================================================================
// DEFI SCHEMAS
// =============================================================================

export const DeFiAssetSchema = z.object({
  type: z.enum(["supplied", "borrowed", "staked", "liquidity", "rewards"]),
  tokenAddress: z.string(),
  symbol: z.string(),
  amount: z.string(),
  valueUSD: z.number(),
  apy: z.number().optional(),
});

export const DeFiPositionSchema = z.object({
  positionId: z.string(),
  protocol: z.string(),
  protocolType: z.string(),
  totalValue: z.number(),
  address: z.string(),
  position: z.object({
    supplied: z
      .array(
        z.object({
          asset: z.string(),
          amount: z.string(),
          value: z.number(),
          apy: z.number().optional(),
        }),
      )
      .optional(),
    borrowed: z
      .array(
        z.object({
          asset: z.string(),
          amount: z.string(),
          value: z.number(),
          apy: z.number().optional(),
        }),
      )
      .optional(),
    staked: z
      .array(
        z.object({
          asset: z.string(),
          amount: z.string(),
          value: z.number(),
          apy: z.number().optional(),
        }),
      )
      .optional(),
    liquidity: z
      .array(
        z.object({
          poolId: z.string(),
          lpTokens: z.string(),
          value: z.number().optional(),
          token0: z
            .object({
              symbol: z.string(),
              amount: z.string(),
              value: z.number().optional(),
            })
            .optional(),
          token1: z
            .object({
              symbol: z.string(),
              amount: z.string(),
              value: z.number().optional(),
            })
            .optional(),
          apy: z.number().optional(),
        }),
      )
      .optional(),
    rewards: z
      .array(
        z.object({
          asset: z.string(),
          amount: z.string(),
          value: z.number(),
        }),
      )
      .optional(),
  }),
  protocolInfo: z
    .object({
      name: z.string(),
      category: z.string(),
      logo: z.string().optional(),
      website: z.string().optional(),
      tvl: z.number().optional(),
    })
    .optional(),
  risk: z
    .object({
      level: z.enum(["low", "medium", "high"]),
      factors: z.array(z.string()).optional(),
    })
    .optional(),
  health: z
    .object({
      ratio: z.number().optional(),
      status: z.enum(["healthy", "warning", "danger"]).optional(),
    })
    .optional(),
});

// =============================================================================
// TRANSACTION SCHEMAS
// =============================================================================

export const TransactionSchema = z.object({
  transaction_version: z.string(),
  transaction_timestamp: z.string(),
  sender: z.string(),
  sequence_number: z.string(),
  max_gas_amount: z.string(),
  gas_unit_price: z.string(),
  expiration_timestamp_secs: z.string(),
  payload: z.any(),
  signature: z.any().optional(),
  events: z.array(z.any()),
  hash: z.string(),
  state_change_hash: z.string().optional(),
  event_root_hash: z.string().optional(),
  state_checkpoint_hash: z.string().optional(),
  gas_used: z.string(),
  success: z.boolean(),
  vm_status: z.string(),
  accumulator_root_hash: z.string(),
  // Processed fields
  type: z.string().optional(),
  function: z.string().optional(),
  arguments: z.array(z.any()).optional(),
  changes: z.array(z.any()).optional(),
});

// =============================================================================
// COLLECTION SCHEMAS
// =============================================================================

export const NFTCollectionSchema = z.object({
  name: z.string(),
  count: z.number(),
  floorPrice: z.number().optional(),
  totalValue: z.number().optional(),
  thumbnail: z.string().optional(),
});

export const NFTCollectionStatsSchema = z.object({
  collections: z.array(
    z.object({
      name: z.string(),
      count: z.number(),
    }),
  ),
  totalCollections: z.number(),
  concentrationTop3: z.number(),
  singleItemCollections: z.number(),
  fanCollections: z.number(),
  stanCollections: z.number(),
  averageHolding: z.number(),
  largestCollectionPercentage: z.number(),
});

// =============================================================================
// PORTFOLIO SCHEMAS
// =============================================================================

export const PortfolioDataSchema = z.object({
  assets: z.array(FungibleAssetSchema),
  nfts: z.array(NFTSchema),
  defiPositions: z.array(DeFiPositionSchema),
  transactions: z.array(TransactionSchema),
  totalValue: z.number(),
  totalValueChange24h: z.number().optional(),
  lastUpdated: z.string(),
});

export const PortfolioResponseSchema = z.object({
  success: z.boolean(),
  data: PortfolioDataSchema.optional(),
  error: z.string().optional(),
  timestamp: z.string(),
});

// =============================================================================
// API RESPONSE SCHEMAS
// =============================================================================

export const NFTsResponseSchema = z.object({
  nfts: z.array(NFTSchema),
  totalCount: z.number(),
  hasMore: z.boolean(),
  nextCursor: z.string().optional(),
});

export const DeFiPositionsResponseSchema = z.object({
  positions: z.array(DeFiPositionSchema),
  totalValue: z.number(),
  protocolCount: z.number(),
});

export const TransactionsResponseSchema = z.object({
  transactions: z.array(TransactionSchema),
  totalCount: z.number(),
  hasMore: z.boolean(),
  nextCursor: z.string().optional(),
});

// =============================================================================
// UTILITY SCHEMAS
// =============================================================================

export const PaginationStateSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  hasMore: z.boolean(),
});

export const ApiErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
});

export const HealthCheckSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  timestamp: z.string(),
  services: z.record(z.string(), z.enum(["up", "down"])),
  response_time_ms: z.number(),
});

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

export function validateNFT(data: unknown) {
  return NFTSchema.parse(data);
}

export function validateFungibleAsset(data: unknown) {
  return FungibleAssetSchema.parse(data);
}

export function validateDeFiPosition(data: unknown) {
  return DeFiPositionSchema.parse(data);
}

export function validateTransaction(data: unknown) {
  return TransactionSchema.parse(data);
}

export function validatePortfolioData(data: unknown) {
  return PortfolioDataSchema.parse(data);
}

export function validatePortfolioResponse(data: unknown) {
  return PortfolioResponseSchema.parse(data);
}

// Safe validation that returns null on error
export function safeValidateNFT(data: unknown) {
  try {
    return NFTSchema.parse(data);
  } catch {
    return null;
  }
}

export function safeValidateFungibleAsset(data: unknown) {
  try {
    return FungibleAssetSchema.parse(data);
  } catch {
    return null;
  }
}

export function safeValidateDeFiPosition(data: unknown) {
  try {
    return DeFiPositionSchema.parse(data);
  } catch {
    return null;
  }
}

export function safeValidateTransaction(data: unknown) {
  try {
    return TransactionSchema.parse(data);
  } catch {
    return null;
  }
}

// Array validation helpers
export function validateNFTArray(data: unknown) {
  return z.array(NFTSchema).parse(data);
}

export function validateFungibleAssetArray(data: unknown) {
  return z.array(FungibleAssetSchema).parse(data);
}

export function validateDeFiPositionArray(data: unknown) {
  return z.array(DeFiPositionSchema).parse(data);
}

export function validateTransactionArray(data: unknown) {
  return z.array(TransactionSchema).parse(data);
}

// =============================================================================
// TYPE INFERENCE
// =============================================================================

// Infer TypeScript types from Zod schemas
export type ValidatedNFT = z.infer<typeof NFTSchema>;
export type ValidatedFungibleAsset = z.infer<typeof FungibleAssetSchema>;
export type ValidatedDeFiPosition = z.infer<typeof DeFiPositionSchema>;
export type ValidatedTransaction = z.infer<typeof TransactionSchema>;
export type ValidatedPortfolioData = z.infer<typeof PortfolioDataSchema>;
export type ValidatedPortfolioResponse = z.infer<
  typeof PortfolioResponseSchema
>;

// Schemas are already exported above - no need to re-export
