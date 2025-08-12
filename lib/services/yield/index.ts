/**
 * Yield Services - Unified Export
 * Consolidates all yield-related services and types
 */

export { AptosResourceFetcher } from "./AptosResourceFetcher";
export type { ProtocolOpportunity } from "./AptosResourceFetcher";

export { DefiLlamaIntegration } from "./DefiLlamaIntegration";
export type { YieldOpportunity } from "./DefiLlamaIntegration";

export { AutoCompoundService } from "./AutoCompoundService";
export type {
  CompoundablePosition,
  HarvestablePosition,
} from "./AutoCompoundService";

export { YieldAggregatorService } from "./YieldAggregatorService";
export type {
  YieldStrategy,
  YieldStrategyStep,
} from "./YieldAggregatorService";

// Re-export commonly used constants
export {
  YIELD_PROTOCOL_ADDRESSES,
  YIELD_TOKEN_ADDRESSES,
  getSymbolFromAddress,
  getAddressFromSymbol,
} from "@/lib/constants";
