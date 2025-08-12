/**
 * Centralized type exports
 * Single source of truth for all types used across the application
 */

// Re-export all API types
export * from "./api";

// Re-export all token types
export * from "./tokens";

// Re-export token functions (not types)
export { normalizeIssuer, getThumbnailUrl } from "./tokens";

// Re-export all DeFi types (excluding conflicting names)
export {
  ProtocolType,
  type DeFiPosition as DeFiPositionDetailed, // Renamed to avoid conflict
  type GroupedDeFiPosition,
  type ProtocolInfo,
  type YieldInfo,
  type PoolInfo,
  type LendingMarket,
  type VaultInfo,
  isDeFiPosition,
  hasHealthStatus,
  hasRewards,
  getProtocolTypeLabel,
  calculateHealthRatio,
  getHealthStatus,
} from "./defi";

// Re-export all UI types
export * from "./ui";

// Re-export types from utils/types for backward compatibility
export type {
  RateLimitError,
  ApiResponse,
  RateLimitInfo,
  CacheEntry,
  CacheStats,
  RetryOptions,
  FetchOptions,
  GraphQLRequest,
} from "../utils/core/types";
