/**
 * API Endpoints Configuration
 * Consolidated from multiple sources for single source of truth
 */

export const API_ENDPOINTS = {
  // Aptos Infrastructure
  APTOS_INDEXER: 'https://indexer.mainnet.aptoslabs.com/v1/graphql',
  APTOS_FULLNODE: 'https://fullnode.mainnet.aptoslabs.com/v1',

  // Market Data APIs
  CMC_BASE: 'https://pro-api.coinmarketcap.com/v1',
  COINGECKO_BASE: 'https://api.coingecko.com/api/v3',

  // DeFi Data
  PANORA_BASE: 'https://api.panora.exchange/aptos',
  DEFILLAMA_BASE: 'https://api.llama.fi',

  // Asset Data
  ECHELON_SUPPLIES: 'https://on-chain-data-seven.vercel.app/api/supplies',
  RWA_BASE: 'https://api.rwa.xyz/v1',
} as const;

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
  defiTVL: () => 'defi-tvl',
  defiVolume: (type: string) => `defi-volume-${type}`,
  defiProtocols: () => 'defi-protocols',

  // Asset cache keys
  assetSupply: (type: string) => `asset-supply-${type}`,

  // Portfolio cache keys
  portfolioHistory: (address: string) => `portfolio-history-${address}`,
  portfolioAssets: (address: string) => `portfolio-assets-${address}`,
} as const;
