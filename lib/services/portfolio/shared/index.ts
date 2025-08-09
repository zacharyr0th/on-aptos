/**
 * Shared utilities for portfolio services
 * 
 * This directory contains unified, consolidated utilities that replace
 * scattered and duplicated functionality across the portfolio services.
 */

// Export all unified services
export { UnifiedPriceService } from "./unified-price-service";
export type { PriceData, AssetPrice } from "./unified-price-service";

export { TokenRegistry } from "./token-registry";
export {
  CORE_TOKEN_ADDRESSES,
  PROTOCOL_TOKEN_ADDRESSES,
  LIQUID_STAKING_ADDRESSES,
  ALL_TOKEN_ADDRESSES,
} from "./token-registry";

export { UnifiedGraphQLClient, UNIFIED_QUERIES } from "./unified-graphql-client";
export type {
  GraphQLResponse,
  QueryConfig,
  PaginationParams,
  PaginationVariables,
} from "./unified-graphql-client";

export { DeFiPositionConverter } from "./defi-position-converter";
export type { UnifiedDeFiPosition } from "./defi-position-converter";

export { UnifiedDecimalUtils } from "./unified-decimal-utils";
export type {
  ConversionOptions,
  FormattedBalance,
  TokenValue,
} from "./unified-decimal-utils";

export { UnifiedAssetValidator } from "./unified-asset-validator";
export type {
  ValidationResult,
  AssetValidationOptions,
} from "./unified-asset-validator";

/**
 * Migration guide for existing code:
 * 
 * OLD: import { PriceService } from "../services/price-service"
 * NEW: import { UnifiedPriceService } from "../shared"
 * 
 * OLD: import { PriceAggregator } from "../utils/price-aggregator"
 * NEW: import { UnifiedPriceService } from "../shared"
 * 
 * OLD: import { formatBalance } from "../utils/decimal-converter"
 * NEW: import { UnifiedDecimalUtils } from "../shared"
 * 
 * OLD: import { executeGraphQLQuery } from "../utils/graphql-helpers"
 * NEW: import { UnifiedGraphQLClient } from "../shared"
 * 
 * OLD: Custom symbol mapping logic in multiple files
 * NEW: import { TokenRegistry } from "../shared"
 * 
 * OLD: Custom position conversion logic in DeFiService
 * NEW: import { DeFiPositionConverter } from "../shared"
 * 
 * OLD: Scattered validation logic in AssetService
 * NEW: import { UnifiedAssetValidator } from "../shared"
 */