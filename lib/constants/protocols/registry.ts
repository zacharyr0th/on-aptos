/**
 * Protocol Registry - Temporary compatibility layer
 * This file will be deprecated. Use @/lib/protocols instead.
 */

// Re-export protocol types from new system for backward compatibility
export { ProtocolType } from "@/lib/protocols/types";

/**
 * DeFi Protocol Name Mappings
 * Maps common protocol name variations to canonical names for better matching
 */
export const DEFI_PROTOCOL_NAME_MAPPINGS: Record<string, string> = {
  // Thala variations
  thala: "Thala",
  "thala finance": "Thala",
  "thala farm": "Thala",

  // Pancake variations
  pancake: "PancakeSwap",
  pancakeswap: "PancakeSwap",
  "pancake swap": "PancakeSwap",

  // Liquid staking variations
  amnis: "Amnis",
  "amnis finance": "Amnis",

  // DEX variations
  liquidswap: "LiquidSwap",
  "liquid swap": "LiquidSwap",
  cellana: "Cellana",
  "cellana finance": "Cellana",
  sushi: "SushiSwap",
  sushiswap: "SushiSwap",
  "sushi swap": "SushiSwap",

  // Aggregator variations
  panora: "Panora",
  "panora exchange": "Panora",
  kana: "Kana",
  kanalabs: "Kana",
  "kana labs": "Kana",
  anqa: "Anqa",

  // Lending variations
  aries: "Aries Markets",
  "aries markets": "Aries Markets",

  // Other protocols
  hippo: "Hippo Labs",
  "hippo labs": "Hippo Labs",
  aux: "AUX",
  "aux exchange": "AUX",
} as const;

/**
 * Utility function to normalize protocol names for better matching
 */
export const normalizeProtocolName = (protocolName: string): string => {
  const normalized = protocolName.toLowerCase().trim();
  return DEFI_PROTOCOL_NAME_MAPPINGS[normalized] || protocolName;
};
