/**
 * Protocol addresses and categorization
 * Temporary compatibility layer - will be deprecated
 */

// Temporary empty export until migration complete
export const PROTOCOL_ADDRESSES: Record<string, string> = {};

/**
 * Protocol labels for UI display
 * Temporary empty object until migration complete
 */
export const PROTOCOL_LABELS: Record<string, string> = {};

/**
 * Categorized protocol addresses by type
 * Temporary empty object until migration complete
 */
export const PROTOCOLS_BY_TYPE = {
  LIQUID_STAKING: [],
  LENDING: [],
  BRIDGE: [],
  FARMING: [],
  DEX: [],
  DERIVATIVES: [],
  INFRASTRUCTURE: [],
  NFT_MARKETPLACE: [],
} as const;

/**
 * Utility functions for working with protocols
 */
export const ProtocolUtils = {
  /**
   * Check if an address is a known protocol
   */
  isProtocolAddress: (address: string): boolean => {
    return address in PROTOCOL_ADDRESSES;
  },

  /**
   * Get protocol name from address
   */
  getProtocolName: (address: string): string | null => {
    return PROTOCOL_ADDRESSES[address] || null;
  },

  /**
   * Get protocol label for UI display
   */
  getProtocolLabel: (assetType: string): string | null => {
    return null; // Use new protocol system
  },
} as const;
