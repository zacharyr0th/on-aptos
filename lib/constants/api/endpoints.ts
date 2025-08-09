/**
 * API Endpoints Configuration
 * Consolidated from multiple sources for single source of truth
 */

// Re-export consolidated endpoints for backward compatibility
export { ENDPOINTS as API_ENDPOINTS } from "../endpoints";

/**
 * Cache Key Generators
 * Functions to generate consistent cache keys
 */
export const CACHE_KEYS = {
  // Price cache keys
  cmcPrice: (symbol: string) => `cmc-price-${symbol}`,
  panoraPrice: (type: string) => `panora-price-${type}`,
  coingeckoPrice: (id: string) => `coingecko-price-${id}`,

  // DeFi metrics cache keys
  defiTVL: () => "defi-tvl",
  defiVolume: (type: string) => `defi-volume-${type}`,
  defiProtocols: () => "defi-protocols",

  // Asset cache keys
  assetSupply: (type: string) => `asset-supply-${type}`,

  // Portfolio cache keys
  portfolioHistory: (address: string) => `portfolio-history-${address}`,
  portfolioAssets: (address: string) => `portfolio-assets-${address}`,
} as const;
