/**
 * SINGLE SOURCE OF TRUTH: Legitimate stablecoin addresses
 * This is the authoritative list of legitimate stablecoins for portfolio filtering
 * DO NOT DUPLICATE - import from here for all stablecoin logic
 * Moved from aptos-constants.ts
 */

export const STABLECOINS = {
  // Native Fungible Assets
  USDC: "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b",
  USDT: "0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b",
  USDE: "0xf37a8864fe737eb8ec2c2931047047cbaed1beed3fb0e5b7c5526dafd3b9c2e9",
  SUSDE: "0xb30a694a344edee467d9f82330bbe7c3b89f440a1ecd2da1f3bca266560fce69",
  MUSD: "0xdd84125d1ebac8f1ecb2819801417fc392325e672be111ec03830c34d6ff82dd", // Mirage mUSD
  USDA: "0x534e4c3dc0f038dab1a8259e89301c4da58779a5d482fb354a41c08147e6b9ec", // USDA fungible asset
} as const;

// LayerZero bridged coins (separate because they use coin_info table)
export const LAYERZERO_STABLECOINS = {
  LZ_USDC:
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
  LZ_USDT:
    "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
} as const;

// Wormhole bridged coins
export const WORMHOLE_STABLECOINS = {
  WH_USDT:
    "0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T",
  WH_USDC:
    "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T",
} as const;

// Celer bridged coins
export const CELER_STABLECOINS = {
  CELER_USDT:
    "0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d::celer_coin_manager::UsdtCoin",
  CELER_USDC:
    "0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d::celer_coin_manager::UsdcCoin",
} as const;

// Algorithmic coins
export const ALGO_STABLECOINS = {
  MOD: "0x94ed76d3d66cb0b6e7a3ab81acf830e3a50b8ae3cfb9edc0abea635a11185ff4",
} as const;

/**
 * Set of all legitimate stablecoin addresses for O(1) lookup
 * Used for portfolio filtering to prevent scam tokens
 */
export const LEGITIMATE_STABLECOINS = new Set([
  ...Object.values(STABLECOINS),
  ...Object.values(LAYERZERO_STABLECOINS),
  ...Object.values(WORMHOLE_STABLECOINS),
  ...Object.values(CELER_STABLECOINS),
  ...Object.values(ALGO_STABLECOINS),
]) as Set<string>;
