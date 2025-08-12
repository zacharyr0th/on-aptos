/**
 * Core Aptos blockchain constants
 * Moved from aptos-constants.ts
 */

/**
 * Core Aptos constants
 */
export const APTOS_CORE = {
  OCTA: 100_000_000,
  FRAMEWORK_ADDRESS: "0x1",
  TOKEN_V2_ADDRESS: "0x4",
  APTOS_COIN_FA_ADDRESS: "0xa",
  APTOS_COIN_TYPE: "0x1::aptos_coin::AptosCoin",
} as const;

/**
 * Core resource types
 */
export const APTOS_RESOURCES = {
  OBJECT_CORE: "0x1::object::ObjectCore",
  FA_METADATA: "0x1::fungible_asset::Metadata",
  TOKEN_V2: "0x4::token::Token",
  COLLECTION_V2: "0x4::collection::Collection",
} as const;

/**
 * Native token addresses
 */
export const NATIVE_TOKENS = {
  APT: "0x1::aptos_coin::AptosCoin",
  APT_FA: "0x000000000000000000000000000000000000000000000000000000000000000a",
} as const;
