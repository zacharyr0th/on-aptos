/**
 * Token-related addresses and constants
 * Central source of truth for all token addresses
 */

import { BRIDGE_UTILS } from "./bridges";

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
    asset_type:
      "0x68844a0d7f2587e726ad0579f3d640865bb4162c08a4589eeda3f9689ec52a3d",
    decimals: 8,
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
  },
  FiaBTC: {
    asset_type:
      "0x75de592a7e62e6224d13763c392190fda8635ebb79c798a5e9dd0840102f3f93",
    decimals: 8,
    name: "Fiat Bitcoin",
    symbol: "FiaBTC",
  },
} as const;

// Common token addresses on Aptos (consolidated from yield/addresses.ts)
export const COMMON_TOKENS = {
  // Native
  APT: "0x1::aptos_coin::AptosCoin",

  // LayerZero bridged tokens
  USDC: BRIDGE_UTILS.createLayerZeroToken("USDC"),
  USDT: BRIDGE_UTILS.createLayerZeroToken("USDT"),
  DAI: BRIDGE_UTILS.createLayerZeroToken("DAI"),
  WETH: BRIDGE_UTILS.createLayerZeroToken("WETH"),
  WBTC: BRIDGE_UTILS.createLayerZeroToken("WBTC"),

  // Protocol tokens
  THL: "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL",
  MOD: "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD",
  CAKE: "0x159df6b7689437016108a019fd5bef736bac692b6d4a1f10c941f6fbb9a74ca6::oft::CakeOFT",

  // LST tokens (Liquid Staking Tokens)
  thAPT:
    "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::ThalaAPT",
  stAPT:
    "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt",
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
