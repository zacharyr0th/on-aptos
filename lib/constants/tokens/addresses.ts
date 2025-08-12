/**
 * Token-related addresses and constants
 */

// Tether reserve addresses - funds held here should be excluded from circulating supply
export const TETHER_RESERVES = {
  // Official Tether reserve address on Aptos (244M USDT as per Tether transparency page)
  PRIMARY: "0xd5b71ee4d1bad5cb7f14c880ee55633c7befcb7384cf070919ea5c481019a4e9",
  // Secondary reserve (currently unused, kept for compatibility)
  SECONDARY: "",
} as const;

// BTC token addresses that aren't in BTC_TOKENS config
export const ADDITIONAL_BTC_TOKENS = {
  WBTC: {
    asset_type: "0x68844a0d7f2587e726ad0579f3d640865bb4162c08a4589eeda3f9689ec52a3d",
    decimals: 8,
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
  },
  FiaBTC: {
    asset_type: "0x75de592a7e62e6224d13763c392190fda8635ebb79c798a5e9dd0840102f3f93",
    decimals: 8,
    name: "Fiat Bitcoin",
    symbol: "FiaBTC",
  },
} as const;

// Network IDs for cross-chain queries
export const NETWORK_IDS = {
  APTOS: 38,
  ETHEREUM: 1,
  BSC: 56,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  AVALANCHE: 43114,
} as const;