/**
 * Consolidated Constants Export
 * Single entry point for all application constants
 */

// API Configuration
export * from "./api/endpoints";
export * from "./api/cache";
export * from "./api/retry";

// Consolidated Endpoints
export * from "./endpoints";

// Error Messages (consolidated)
export * from "./errors";

// Aptos-specific constants
export * from "./aptos/core";
export * from "./aptos/protocols";
export * from "./aptos/platforms";
export * from "./aptos/validation";
export * from "./aptos/utils";
export * from "./aptos/known-addresses";

// Token Definitions
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
export * from "./portfolio/cache";
export * from "./portfolio/thresholds";
export * from "./portfolio/config";

// Yield Configuration
export * from "./yield/addresses";
export * from "./yield/utils";

// Protocol Registry
export * from "./protocols/registry";

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
