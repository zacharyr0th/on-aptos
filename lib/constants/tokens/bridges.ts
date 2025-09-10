/**
 * Bridge token patterns and addresses
 * Central source of truth for all bridge addresses
 */

/**
 * Bridge base addresses - avoid duplication across files
 */
export const BRIDGE_ADDRESSES = {
  LAYERZERO: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa",
  WORMHOLE: "0x5bc11445584a763c1fa7ed39081f1b920954da14e04b32440cba863d03e19625",
  CELER: "0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d",
} as const;

/**
 * Bridge token patterns
 */
export const BRIDGE_TOKENS = {
  LAYERZERO_PATTERN: new RegExp(`${BRIDGE_ADDRESSES.LAYERZERO}::asset::.*`),
  WORMHOLE_PATTERN: new RegExp(`${BRIDGE_ADDRESSES.WORMHOLE}::.*`),
  CELER_PATTERN: new RegExp(`${BRIDGE_ADDRESSES.CELER}::.*`),
} as const;

/**
 * Helper functions for bridge tokens
 */
export const BRIDGE_UTILS = {
  createLayerZeroToken: (symbol: string) => `${BRIDGE_ADDRESSES.LAYERZERO}::asset::${symbol}`,
  createWormholeToken: (module: string) => `${BRIDGE_ADDRESSES.WORMHOLE}::${module}`,
  createCelerToken: (module: string) => `${BRIDGE_ADDRESSES.CELER}::${module}`,
} as const;
