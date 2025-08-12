/**
 * Protocol addresses and categorization
 * Moved from aptos-constants.ts
 * NOTE: This imports from protocol-registry.ts for the PROTOCOLS source
 */

import { PROTOCOLS, getProtocolLabel } from "../protocols/protocol-registry";

/**
 * Known protocol addresses derived from protocol registry
 */
export const PROTOCOL_ADDRESSES: Record<string, string> = Object.fromEntries(
  Object.values(PROTOCOLS).flatMap((protocol) =>
    protocol.addresses.map((address) => [address, protocol.name]),
  ),
);

/**
 * Protocol labels for UI display
 */
export const PROTOCOL_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(PROTOCOLS).flatMap((protocol) =>
    protocol.addresses.map((address) => [address, protocol.label]),
  ),
);

/**
 * Categorized protocol addresses by type
 */
export const PROTOCOLS_BY_TYPE = {
  LIQUID_STAKING: Object.values(PROTOCOLS)
    .filter((p) => p.type === "liquid_staking")
    .flatMap((p) => p.addresses),
  LENDING: Object.values(PROTOCOLS)
    .filter((p) => p.type === "lending")
    .flatMap((p) => p.addresses),
  BRIDGE: Object.values(PROTOCOLS)
    .filter((p) => p.type === "bridge")
    .flatMap((p) => p.addresses),
  FARMING: Object.values(PROTOCOLS)
    .filter((p) => p.type === "farming")
    .flatMap((p) => p.addresses),
  DEX: Object.values(PROTOCOLS)
    .filter((p) => p.type === "dex")
    .flatMap((p) => p.addresses),
  DERIVATIVES: Object.values(PROTOCOLS)
    .filter((p) => p.type === "derivatives")
    .flatMap((p) => p.addresses),
  INFRASTRUCTURE: Object.values(PROTOCOLS)
    .filter((p) => p.type === "infrastructure")
    .flatMap((p) => p.addresses),
  NFT_MARKETPLACE: Object.values(PROTOCOLS)
    .filter((p) => p.type === "nft_marketplace")
    .flatMap((p) => p.addresses),
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
    return getProtocolLabel(assetType);
  },
} as const;
