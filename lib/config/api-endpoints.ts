/**
 * API Endpoints Configuration
 */

export const ApiEndpoints = {
  // CoinMarketCap
  CMC_BASE: 'https://pro-api.coinmarketcap.com/v1',

  // Panora Exchange
  PANORA_BASE: 'https://api.panora.exchange/aptos',

  // CoinGecko
  COINGECKO_BASE: 'https://api.coingecko.com/api/v3',

  // Aptos
  APTOS_INDEXER: 'https://indexer.mainnet.aptoslabs.com/v1/graphql',
  APTOS_FULLNODE: 'https://fullnode.mainnet.aptoslabs.com/v1',

  // DeFiLlama
  DEFILLAMA_BASE: 'https://api.llama.fi',

  // RWA
  RWA_BASE: 'https://api.rwa.xyz/v1',
} as const;

/**
 * Cache Keys Generator
 */
export const CacheKeys = {
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
