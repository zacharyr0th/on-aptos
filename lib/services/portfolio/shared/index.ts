/**
 * Portfolio-specific shared utilities
 *
 * This directory now contains only portfolio-specific shared utilities.
 * General-purpose utilities have been moved to lib/services/shared/utils.
 */

export type { UnifiedDeFiPosition } from "../../defi/shared/defi-position-converter";
export { DeFiPositionConverter } from "../../defi/shared/defi-position-converter";
export {
  ALL_TOKEN_ADDRESSES,
  CORE_TOKEN_ADDRESSES,
  LIQUID_STAKING_ADDRESSES,
  PROTOCOL_TOKEN_ADDRESSES,
  TokenRegistry,
} from "../../shared/utils/token-registry";
export type {
  AssetValidationOptions,
  ValidationResult,
} from "../../shared/utils/unified-asset-validator";
export { UnifiedAssetValidator } from "../../shared/utils/unified-asset-validator";
export type {
  ConversionOptions,
  FormattedBalance,
  TokenValue,
} from "../../shared/utils/unified-decimal-utils";
export { UnifiedDecimalUtils } from "../../shared/utils/unified-decimal-utils";
export type {
  GraphQLResponse,
  PaginationParams,
  PaginationVariables,
  QueryConfig,
} from "../../shared/utils/unified-graphql-client";
export {
  UNIFIED_QUERIES,
  UnifiedGraphQLClient,
} from "../../shared/utils/unified-graphql-client";
export type {
  AssetPrice,
  UnifiedPriceData,
} from "../../shared/utils/unified-price-service";
// Re-export commonly used utilities from shared services
export { UnifiedPriceService } from "../../shared/utils/unified-price-service";

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
