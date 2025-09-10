import { PANORA_TOKENS } from "@/lib/config/tokens/lst";
import { NATIVE_TOKENS, STABLECOINS, TOKEN_REGISTRY } from "@/lib/constants";
import { logger } from "@/lib/utils/core/logger";

/**
 * Unified token registry that consolidates all token address mappings
 * Replaces scattered symbol mapping logic across services
 */

// Core token addresses (most common)
export const CORE_TOKEN_ADDRESSES = {
  APT: "0x1::aptos_coin::AptosCoin",
  USDC: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
  USDT: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
  WETH: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH",
  WBTC: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WBTC",
  DAI: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::DAI",
} as const;

// Protocol token addresses
export const PROTOCOL_TOKEN_ADDRESSES = {
  THL: "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL",
  MOD: "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD",
  CAKE: "0x159df6b7689437016108a019fd5bef736bac692b6d4a1f10c941f6fbb9a74ca6::oft::CakeOFT",
} as const;

// Liquid staking token addresses
export const LIQUID_STAKING_ADDRESSES = {
  thAPT: "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::ThalaAPT",
  stAPT:
    "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt",
  amAPT:
    "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt",
} as const;

// All token addresses combined
export const ALL_TOKEN_ADDRESSES = {
  ...CORE_TOKEN_ADDRESSES,
  ...PROTOCOL_TOKEN_ADDRESSES,
  ...LIQUID_STAKING_ADDRESSES,
} as const;

// Create reverse mapping for fast lookups
const ADDRESS_TO_SYMBOL_MAP = new Map<string, string>();
const SYMBOL_TO_ADDRESS_MAP = new Map<string, string>();

// Initialize mappings
function initializeMappings() {
  // Add core tokens
  Object.entries(ALL_TOKEN_ADDRESSES).forEach(([symbol, address]) => {
    ADDRESS_TO_SYMBOL_MAP.set(address, symbol);
    SYMBOL_TO_ADDRESS_MAP.set(symbol.toUpperCase(), address);
  });

  // Add from existing registries
  Object.entries(TOKEN_REGISTRY).forEach(([symbol, address]) => {
    if (!ADDRESS_TO_SYMBOL_MAP.has(address)) {
      ADDRESS_TO_SYMBOL_MAP.set(address, symbol);
      SYMBOL_TO_ADDRESS_MAP.set(symbol.toUpperCase(), address);
    }
  });

  // Add native tokens
  if (NATIVE_TOKENS.APT) {
    ADDRESS_TO_SYMBOL_MAP.set(NATIVE_TOKENS.APT, "APT");
    SYMBOL_TO_ADDRESS_MAP.set("APT", NATIVE_TOKENS.APT);
  }
  if (NATIVE_TOKENS.APT_FA) {
    ADDRESS_TO_SYMBOL_MAP.set(NATIVE_TOKENS.APT_FA, "APT");
  }

  // Add stablecoins
  Object.entries(STABLECOINS).forEach(([symbol, address]) => {
    if (!ADDRESS_TO_SYMBOL_MAP.has(address)) {
      ADDRESS_TO_SYMBOL_MAP.set(address, symbol);
      SYMBOL_TO_ADDRESS_MAP.set(symbol.toUpperCase(), address);
    }
  });

  // Add Panora tokens
  Object.entries(PANORA_TOKENS).forEach(([key, token]) => {
    if (token.asset_type && !ADDRESS_TO_SYMBOL_MAP.has(token.asset_type)) {
      const symbol = key; // Use the key as the symbol (e.g., "amAPT", "stAPT")
      ADDRESS_TO_SYMBOL_MAP.set(token.asset_type, symbol);
      SYMBOL_TO_ADDRESS_MAP.set(symbol.toUpperCase(), token.asset_type);
    }
  });

  logger.info(`Initialized token registry with ${ADDRESS_TO_SYMBOL_MAP.size} mappings`);
}

// Initialize on module load
initializeMappings();

/**
 * Token registry service for unified symbol/address resolution
 */
export class TokenRegistry {
  /**
   * Get symbol from token address with comprehensive fallback logic
   */
  static getSymbolFromAddress(address: string): string {
    // Handle null/undefined addresses
    if (!address) return "UNKNOWN";

    // Check direct mapping first
    const knownSymbol = ADDRESS_TO_SYMBOL_MAP.get(address);
    if (knownSymbol) return knownSymbol;

    // Check pattern matching for common formats
    if (address === NATIVE_TOKENS.APT || address === NATIVE_TOKENS.APT_FA) {
      return "APT";
    }

    // Handle liquid staking tokens (all derive from APT)
    if (
      address &&
      (address.includes("::stapt_token::") ||
        address.includes("::StakedApt") ||
        address.includes("::amapt_token::") ||
        address.includes("::AmnisApt") ||
        address.includes("::staking::ThalaAPT") ||
        address.includes("::staked_aptos_coin::"))
    ) {
      // Map to specific LST symbols if known
      for (const [symbol, addr] of Object.entries(LIQUID_STAKING_ADDRESSES)) {
        if (address === addr) return symbol;
      }
      return "stAPT"; // Generic staked APT
    }

    // Handle bridged tokens
    if (address && address.includes("::asset::USDC")) return "USDC";
    if (address && address.includes("::asset::USDT")) return "USDT";
    if (address && address.includes("::asset::WETH")) return "WETH";
    if (address && address.includes("::asset::WBTC")) return "WBTC";
    if (address && address.includes("::asset::DAI")) return "DAI";

    // Handle protocol tokens
    if (address && (address.includes("::thl_coin::") || address.includes("::THL"))) return "THL";
    if (address && (address.includes("::mod_coin::") || address.includes("::MOD"))) return "MOD";

    // Extract from address structure as last resort
    if (!address) return "UNKNOWN";

    const patterns = [
      /::([^:]+)::([^>]+)$/, // module::struct
      /::([^:]+)$/, // struct name only
    ];

    for (const pattern of patterns) {
      const match = address.match(pattern);
      if (match) {
        const name = match[match.length - 1];
        // Clean up common suffixes and convert to uppercase
        const cleanName = name.replace(/Token|Coin|OFT|LP/g, "").toUpperCase();
        if (cleanName && cleanName !== "UNKNOWN") {
          return cleanName;
        }
      }
    }

    return "UNKNOWN";
  }

  /**
   * Get address from symbol
   */
  static getAddressFromSymbol(symbol: string): string | null {
    return SYMBOL_TO_ADDRESS_MAP.get(symbol.toUpperCase()) || null;
  }

  /**
   * Check if address is a known stablecoin
   */
  static isStablecoin(address: string, symbol?: string): boolean {
    if (symbol) {
      const stablecoinSymbols = ["USDT", "USDC", "BUSD", "DAI", "TUSD", "USDD"];
      if (stablecoinSymbols.includes(symbol.toUpperCase())) {
        return true;
      }
    }

    return (
      address.includes("::asset::USDC") ||
      address.includes("::asset::USDT") ||
      address.includes("::asset::DAI") ||
      Object.values(STABLECOINS).includes(address as any) ||
      address.toLowerCase().includes("usd")
    );
  }

  /**
   * Check if address is native APT
   */
  static isNativeAPT(address: string): boolean {
    return address === NATIVE_TOKENS.APT || address === NATIVE_TOKENS.APT_FA;
  }

  /**
   * Check if address is a liquid staking token
   */
  static isLiquidStakingToken(address: string): boolean {
    return (
      Object.values(LIQUID_STAKING_ADDRESSES).includes(address as any) ||
      address.includes("::stapt_token::") ||
      address.includes("::StakedApt") ||
      address.includes("::amapt_token::") ||
      address.includes("::AmnisApt") ||
      address.includes("::staking::ThalaAPT") ||
      address.includes("::staked_aptos_coin::")
    );
  }

  /**
   * Get token decimals based on known patterns
   */
  static getTokenDecimals(address: string, symbol?: string): number {
    // Native APT tokens
    if (TokenRegistry.isNativeAPT(address)) return 8;

    // Check symbol for known tokens
    const upperSymbol = symbol?.toUpperCase();
    if (upperSymbol === "APT") return 8;
    if (upperSymbol === "MKLP") return 8; // Merkle LP token uses 8 decimals
    if (upperSymbol === "UPT" || upperSymbol === "UPTOS") return 8; // Uptos token uses 8 decimals

    // Stablecoins typically use 6 decimals
    if (TokenRegistry.isStablecoin(address, symbol)) {
      if (symbol?.toUpperCase().includes("USDC") || symbol?.toUpperCase().includes("USDT")) {
        return 6;
      }
    }

    // Liquid staking tokens follow APT (8 decimals)
    if (TokenRegistry.isLiquidStakingToken(address)) return 8;

    // Default for most Aptos tokens
    return 8;
  }

  /**
   * Map DeFi token to its underlying asset for price lookup
   */
  static mapToUnderlyingAsset(address: string, symbol?: string): string | null {
    // APT variants map to native APT
    if (symbol?.toLowerCase().includes("apt") || TokenRegistry.isLiquidStakingToken(address)) {
      return NATIVE_TOKENS.APT;
    }

    // Stablecoins map to their canonical addresses
    if (symbol?.toLowerCase().includes("usdc")) {
      return CORE_TOKEN_ADDRESSES.USDC;
    }
    if (symbol?.toLowerCase().includes("usdt")) {
      return CORE_TOKEN_ADDRESSES.USDT;
    }

    // Check if it's already a known token
    if (ADDRESS_TO_SYMBOL_MAP.has(address)) {
      return address; // Already canonical
    }

    return null;
  }

  /**
   * Check if token is likely a fake/scam token
   */
  static isSuspiciousToken(address: string, symbol?: string): boolean {
    // Check for fake APT tokens
    if (symbol?.toUpperCase() === "APT" && !TokenRegistry.isNativeAPT(address)) {
      return true;
    }

    // Check for scam patterns
    const scamPatterns = [
      /test/i,
      /fake/i,
      /scam/i,
      /airdrop/i,
      /reward/i,
      /bonus/i,
      /gift/i,
      /claim/i,
    ];

    return scamPatterns.some(
      (pattern) => pattern.test(address) || (symbol && pattern.test(symbol))
    );
  }

  /**
   * Get all registered tokens
   */
  static getAllTokens(): Array<{ symbol: string; address: string }> {
    return Array.from(ADDRESS_TO_SYMBOL_MAP.entries()).map(([address, symbol]) => ({
      symbol,
      address,
    }));
  }

  /**
   * Get registry statistics
   */
  static getStats(): {
    totalTokens: number;
    coreTokens: number;
    protocolTokens: number;
    liquidStakingTokens: number;
  } {
    return {
      totalTokens: ADDRESS_TO_SYMBOL_MAP.size,
      coreTokens: Object.keys(CORE_TOKEN_ADDRESSES).length,
      protocolTokens: Object.keys(PROTOCOL_TOKEN_ADDRESSES).length,
      liquidStakingTokens: Object.keys(LIQUID_STAKING_ADDRESSES).length,
    };
  }
}
