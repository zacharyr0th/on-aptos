/**
 * Token Decimal Configuration
 * Standard decimal places for different token types
 */

export const DECIMALS = {
  // Major cryptocurrencies
  BTC: 8,
  APT: 8,

  // Stablecoins (from asset services)
  USDC: 6,
  USDT: 6,

  // Fiat representations
  USD: 6,

  // Default fallback
  DEFAULT: 8,
} as const;

/**
 * Asset type classifications
 */
export const ASSET_TYPES = {
  FUNGIBLE: "fungible",
  NFT: "nft",
  DEFI: "defi",
} as const;
