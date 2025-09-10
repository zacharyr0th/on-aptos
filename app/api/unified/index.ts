/**
 * Unified API endpoints for aggregated data
 *
 * This directory contains consolidated API endpoints that provide
 * unified access to various data sources including:
 * - Assets (stablecoins, BTC, RWA, LST)
 * - Prices (from Panora and Analytics APIs)
 * - TVL data (from DeFiLlama)
 * - Volume data (from DeFiLlama)
 *
 * All endpoints follow consistent patterns for:
 * - Rate limiting (using RATE_LIMIT_TIERS)
 * - Caching (using CACHE_DURATIONS)
 * - Error handling (with structured logging)
 * - CORS support (standardized headers)
 * - Response time tracking
 * - Data source attribution
 *
 * For detailed usage and patterns, see README.md in this directory.
 *
 * @example
 * ```typescript
 * // Use shared utilities in new unified endpoints
 * import { getResponseTimeHeaders, extractTokensFromParams } from "./shared";
 *
 * // Use constants in API calls
 * import { DEFI_LLAMA_BASE, PANORA_API_ENDPOINT } from "./constants";
 *
 * // Use utilities for common operations
 * import { fetchFromDeFiLlama, validateTokenAddress } from "./utils";
 * ```
 */

// Export individual modules for direct imports if needed
export * as UnifiedConstants from "./constants";
// Export all shared utilities for use in unified endpoints
export * from "./shared";
export * as UnifiedUtils from "./utils";
