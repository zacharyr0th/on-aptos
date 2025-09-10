/**
 * DeFi Dashboard Types - Import shared types and define dashboard-specific ones
 * Re-exports comprehensive DeFi types from shared location
 */

// Import all comprehensive types from the shared location
export type {
  ApyType,
  AuditStatus,
  // Category definition
  CategoryDefinition,
  // Combined implementation types (not the enums themselves)
  CreditImplementation,
  // Protocol definitions
  CreditProtocol,
  // Data source types
  DataProvider,
  DataSource,
  DefiProtocol,
  ISODateString,
  // Utility types
  LargeNumberString,
  // Localization helpers
  LocalizationHelpers,
  MultipleProtocol,
  NetworkType,
  // Pool data
  PoolData,
  // Basic protocol types
  ProtocolStatus,
  // Security & metrics
  SecurityMetrics,
  // Localization types
  SupportedLanguage,
  TradingImplementation,
  TradingProtocol,
  Translatable,
  TranslatableString,
  TranslatableStringArray,
  YieldImplementation,
  YieldProtocol,
} from "@/lib/types/defi";

// Re-export implementation enums as values (needed for runtime usage)
export {
  DexAggregatorImplementation,
  DexImplementation,
  LaunchpadImplementation,
  LendingImplementation,
  LeveragedFarmingImplementation,
  LiquidityManagerImplementation,
  LiquidStakingImplementation,
  MultipleImplementation,
  PerpsImplementation,
  YieldAggregatorImplementation,
} from "@/lib/types/defi";
