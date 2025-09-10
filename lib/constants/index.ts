/**
 * Consolidated Constants Export
 * Single entry point for all application constants
 */

// API Configuration
export * from "./api/endpoints";
export * from "./api/retry";
// Aptos-specific constants
export * from "./aptos/core";
export * from "./aptos/known-addresses";
export * from "./aptos/platforms";
export * from "./aptos/utils";
export * from "./aptos/validation";
// Consolidated Endpoints
export * from "./endpoints";
// Error Messages (consolidated)
export * from "./errors";
export * from "./portfolio/config";
// Portfolio Configuration
export * from "./portfolio/limits";
export * from "./portfolio/thresholds";
// Token Definitions
export * from "./tokens/addresses";
export * from "./tokens/bridges";
export * from "./tokens/decimals";
export * from "./tokens/lst";
export * from "./tokens/registry";
export * from "./tokens/rwa";
export * from "./tokens/scam";
export * from "./tokens/stablecoins";
// UI Configuration
export * from "./ui/colors";
export * from "./ui/thresholds";

// Portfolio Indexer Configuration
export const PORTFOLIO_INDEXER = {
  URL: process.env.NEXT_PUBLIC_APTOS_INDEXER_URL || "https://api.mainnet.aptoslabs.com/v1/graphql",
} as const;

// Cache Configuration - now centralized in lib/config/cache.ts
export {
  CACHE_CONFIG,
  PERFORMANCE_THRESHOLDS,
  SERVICE_CONFIG,
} from "@/lib/config/cache";
export * from "./protocols/protocol-registry";
// Protocol Registry
export * from "./protocols/registry";
// Yield Configuration
export * from "./yield/addresses";
export * from "./yield/utils";

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
