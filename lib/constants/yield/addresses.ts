/**
 * Yield service constants - protocol addresses and token mappings
 * References centralized constants from protocol-registry and tokens
 */

import { PROTOCOLS } from "@/lib/constants/protocols/protocol-registry";
import { COMMON_TOKENS } from "@/lib/constants/tokens/addresses";

/**
 * Common protocol addresses on Aptos
 * References the centralized protocol registry
 */
export const YIELD_PROTOCOL_ADDRESSES = {
  // Lending
  ARIES: PROTOCOLS.ARIES_MARKETS.addresses[0],
  ECHELON: PROTOCOLS.ECHELON.addresses[0],
  ECHO: PROTOCOLS.ECHO_LENDING.addresses[0],
  MESO: PROTOCOLS.MESO_FINANCE.addresses[0],

  // DEX
  THALA: PROTOCOLS.THALA_INFRA.addresses[0],
  LIQUIDSWAP: PROTOCOLS.LIQUIDSWAP.addresses[6], // pool deployer v0
  PANCAKESWAP: PROTOCOLS.PANCAKESWAP.addresses[3], // Main masterchef
  SUSHISWAP: PROTOCOLS.SUSHISWAP.addresses[0],

  // LST
  AMNIS: PROTOCOLS.AMNIS_FINANCE.addresses[0],

  // Farming/Yield
  THALA_FARM: PROTOCOLS.THALA_FARM.addresses[0],

  // CDP/Stablecoin
  THALA_CDP: PROTOCOLS.THALA_CDP.addresses[0],
} as const;

/**
 * Common token addresses on Aptos
 * References the centralized token addresses
 */
export const YIELD_TOKEN_ADDRESSES = COMMON_TOKENS;
