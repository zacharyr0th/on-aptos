/**
 * Token Decimal Configuration
 * Standard decimal places for different token types
 */

export const DECIMALS = {
  // Major cryptocurrencies
  BTC: 8,
  APT: 8,

  // Fiat representations
  USD: 6,

  // Default fallback
  DEFAULT: 8,
} as const;

/**
 * Asset type classifications
 */
export const ASSET_TYPES = {
  FUNGIBLE: 'fungible',
  NFT: 'nft',
  DEFI: 'defi',
} as const;
