/**
 * Yield service utility functions
 * Moved from lib/services/yield/constants.ts
 */

import { YIELD_TOKEN_ADDRESSES } from "./addresses";

/**
 * Token symbol to address mapping for quick lookups
 */
export const YIELD_SYMBOL_TO_ADDRESS_MAP = Object.fromEntries(
  Object.entries(YIELD_TOKEN_ADDRESSES).map(([symbol, address]) => [
    symbol,
    address,
  ]),
) as Record<keyof typeof YIELD_TOKEN_ADDRESSES, string>;

/**
 * Address to symbol mapping for reverse lookups
 */
export const YIELD_ADDRESS_TO_SYMBOL_MAP = Object.fromEntries(
  Object.entries(YIELD_TOKEN_ADDRESSES).map(([symbol, address]) => [
    address,
    symbol,
  ]),
) as Record<string, string>;

/**
 * Get symbol from token address
 */
export function getSymbolFromAddress(address: string): string {
  // Check known tokens first
  const knownSymbol = YIELD_ADDRESS_TO_SYMBOL_MAP[address];
  if (knownSymbol) return knownSymbol;

  // Try to extract from address structure
  const patterns = [
    /::([^:]+)::([^>]+)$/, // Match module::struct
    /::([^:]+)$/, // Match just struct name
  ];

  for (const pattern of patterns) {
    const match = address.match(pattern);
    if (match) {
      const name = match[match.length - 1];
      // Clean up common suffixes
      return name.replace(/Token|Coin|OFT|LP/g, "").toUpperCase();
    }
  }

  return "UNKNOWN";
}

/**
 * Get address from token symbol
 */
export function getAddressFromSymbol(symbol: string): string | undefined {
  return YIELD_SYMBOL_TO_ADDRESS_MAP[
    symbol as keyof typeof YIELD_TOKEN_ADDRESSES
  ];
}
