/**
 * Consolidated Constants Export
 * Single entry point for all application constants
 */

// API Configuration
export * from "./api/endpoints";
export * from "./api/retry";

// Consolidated Endpoints
export * from "./endpoints";

// Error Messages (consolidated)
export * from "./errors";

// Aptos-specific constants
export * from "./aptos/core";
export * from "./aptos/platforms";
export * from "./aptos/validation";
export * from "./aptos/utils";
export * from "./aptos/known-addresses";

// Token Definitions
export * from "./tokens/addresses";
export * from "./tokens/decimals";
export * from "./tokens/stablecoins";
export * from "./tokens/lst";
export * from "./tokens/scam";
export * from "./tokens/bridges";
export * from "./tokens/rwa";
export * from "./tokens/registry";

// UI Configuration
export * from "./ui/colors";
export * from "./ui/thresholds";

// Portfolio Configuration
export * from "./portfolio/limits";
export * from "./portfolio/thresholds";
export * from "./portfolio/config";

// Cache Configuration - now centralized in lib/config/cache.ts
export {
  CACHE_CONFIG,
  SERVICE_CONFIG,
  PERFORMANCE_THRESHOLDS,
} from "@/lib/config/cache";

// Yield Configuration
export * from "./yield/addresses";
export * from "./yield/utils";

// Protocol Registry
export * from "./protocols/registry";
export * from "./protocols/protocol-registry";

/**
 * Asset Categories - consolidated from asset services
 */
export const ASSET_CATEGORIES = {
  BITCOIN: "bitcoin",
  STABLECOIN: "stablecoin",
  LST: "liquid-staking",
  RWA: "real-world-assets",
  DEFI: "defi",
} as const;
