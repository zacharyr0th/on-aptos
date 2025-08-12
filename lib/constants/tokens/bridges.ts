/**
 * Bridge token patterns and addresses
 * Moved from aptos-constants.ts
 */

/**
 * Bridge token patterns
 */
export const BRIDGE_TOKENS = {
  LAYERZERO_PATTERN:
    /0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::.*/,
  WORMHOLE_PATTERN:
    /0x5bc11445584a763c1fa7ed39081f1b920954da14e04b32440cba863d03e19625::.*/,
  CELER_PATTERN:
    /0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d::.*/,
} as const;
