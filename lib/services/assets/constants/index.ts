// Asset services constants

export const CACHE_TTL = {
  DEFAULT: 5 * 60 * 1000, // 5 minutes
  BTC_SUPPLY: 10 * 60 * 1000, // 10 minutes
  LST_SUPPLY: 5 * 60 * 1000, // 5 minutes
  STABLECOIN_SUPPLY: 10 * 60 * 1000, // 10 minutes
  RWA_DATA: 15 * 60 * 1000, // 15 minutes
  PRICE_DATA: 2 * 60 * 1000, // 2 minutes
} as const;

export const DECIMALS = {
  DEFAULT: 8,
  APT: 8,
  BTC: 8,
  USDC: 6,
  USDT: 6,
} as const;

export const TOKEN_ADDRESSES = {
  APT: '0x1::aptos_coin::AptosCoin',
  USDC: '0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b',
  USDT: '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b',
} as const;

export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY: 1000, // 1 second
  BACKOFF_FACTOR: 2,
  MAX_DELAY: 10000, // 10 seconds
} as const;

export const SERVICE_DEFAULTS = {
  CACHE_ENABLED: true,
  FALLBACK_ENABLED: true,
  TIMEOUT: 30000, // 30 seconds
  BATCH_SIZE: 10,
  RATE_LIMIT_DELAY: 100, // 100ms between batches
} as const;

export const API_ENDPOINTS = {
  CMC_QUOTES:
    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
  RWA_API: 'https://api.rwa.xyz/v1',
  PANORA_API: 'https://api.panora.exchange/v1',
  APTOS_INDEXER: 'https://api.mainnet.aptoslabs.com/v1/graphql',
} as const;

export const ASSET_CATEGORIES = {
  BITCOIN: 'bitcoin',
  STABLECOIN: 'stablecoin',
  LST: 'liquid-staking',
  RWA: 'real-world-assets',
  DEFI: 'defi',
} as const;

export const ERROR_MESSAGES = {
  INDEXER_ERROR: 'Aptos Indexer API error',
  NETWORK_ERROR: 'Network request failed',
  INVALID_ADDRESS: 'Invalid wallet address format',
  NO_DATA: 'No data available',
  TIMEOUT: 'Request timeout',
  PRICE_FETCH_ERROR: 'Failed to fetch price data',
  SUPPLY_FETCH_ERROR: 'Failed to fetch supply data',
} as const;
