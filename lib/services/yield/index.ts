/**
 * Yield Services - Unified Export
 * Consolidates all yield-related services and types
 */

export { AptosResourceFetcher } from "./AptosResourceFetcher";
export { AutoCompoundService } from "./AutoCompoundService";
export { DefiLlamaIntegration } from "./DefiLlamaIntegration";
// Export all types from the centralized types file
export type {
  CompoundablePosition,
  HarvestablePosition,
  ProtocolOpportunity,
  YieldOpportunity,
  YieldStrategy,
  YieldStrategyStep,
} from "./types";

// Export validation utilities
export * from "./validation";
export { YieldAggregatorService } from "./YieldAggregatorService";

// Note: Constants and utilities can be imported directly from their respective modules
// to avoid unnecessary re-exports and dependencies in this module
