/**
 * API Endpoints Configuration
 * Consolidated from all services
 */

export const ENDPOINTS = {
  // Aptos Infrastructure
  APTOS_INDEXER:
    process.env.NEXT_PUBLIC_APTOS_INDEXER_URL ||
    "https://api.mainnet.aptoslabs.com/v1/graphql",
  APTOS_FULLNODE: "https://fullnode.mainnet.aptoslabs.com/v1",

  // Market Data APIs
  CMC_BASE: "https://pro-api.coinmarketcap.com/v1",
  CMC_QUOTES:
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest",
  COINGECKO_BASE: "https://api.coingecko.com/api/v3",

  // DeFi Data
  PANORA_BASE: "https://api.panora.exchange/aptos",
  PANORA_API: "https://api.panora.exchange/v1",
  DEFILLAMA_BASE: "https://api.llama.fi",

  // Asset Data
  ECHELON_SUPPLIES: "https://on-chain-data-seven.vercel.app/api/supplies",
  RWA_BASE: "https://api.rwa.xyz/v1",
  RWA_API: "https://api.rwa.xyz/v1",
} as const;
