/**
 * DeFi Balance Service Utilities
 * Helper functions for protocol identification and data transformation
 */

import { getProtocolsByType, PROTOCOLS } from "@/lib/constants/protocols/protocol-registry";
import { ProtocolType } from "@/lib/protocols/types";
import type { DeFiPosition } from "@/lib/types/defi";
import type { LPTokenInfo, ProtocolInfo } from "./types";

/**
 * Map position type string to protocol type enum
 */
export function mapPositionTypeToProtocolType(type: string): ProtocolType {
  switch (type.toLowerCase()) {
    case "liquidity":
    case "dex":
    case "swap":
      return ProtocolType.DEX;
    case "farming":
    case "farm":
    case "yield":
      return ProtocolType.FARMING;
    case "lending":
    case "borrow":
    case "loan":
      return ProtocolType.LENDING;
    case "staking":
    case "stake":
      return ProtocolType.LIQUID_STAKING;
    case "derivatives":
    case "perp":
    case "future":
      return ProtocolType.DERIVATIVES;
    case "nft":
      return ProtocolType.NFT;
    default:
      return ProtocolType.UNKNOWN;
  }
}

/**
 * Map protocol type to defi position type
 */
export function mapProtocolTypeToDefiType(protocolType: ProtocolType): DeFiPosition["type"] {
  switch (protocolType) {
    case ProtocolType.DEX:
      return "lp";
    case ProtocolType.FARMING:
      return "farming";
    case ProtocolType.LENDING:
      return "lending";
    case ProtocolType.LIQUID_STAKING:
      return "staking";
    case ProtocolType.DERIVATIVES:
      return "derivatives";
    default:
      return "token";
  }
}

/**
 * Check if a position is an LP token
 */
export function isLPToken(position: DeFiPosition): boolean {
  return (
    position.type === "lp" ||
    position.assets.some(
      (asset) =>
        asset.symbol.includes("LP") || asset.symbol.includes("Pool") || asset.metadata?.poolAddress
    )
  );
}

/**
 * Get token decimals from address or return default
 */
export function getTokenDecimals(tokenAddress: string, metadata?: Record<string, unknown>): number {
  // Check metadata first
  if (metadata?.decimals && typeof metadata.decimals === "number") {
    return metadata.decimals;
  }

  // Common token decimals
  if (tokenAddress.includes("USDC") || tokenAddress.includes("USDT")) {
    return 6;
  }
  if (tokenAddress.includes("APT") || tokenAddress.includes("aptos_coin")) {
    return 8;
  }
  if (tokenAddress.includes("BTC") || tokenAddress.includes("WBTC")) {
    return 8;
  }
  if (tokenAddress.includes("ETH") || tokenAddress.includes("WETH")) {
    return 8;
  }

  // Default decimals
  return 8;
}

/**
 * Parse LP token from resource type
 */
export function parseLPToken(resourceType: string): LPTokenInfo | null {
  // Pattern for LP tokens like: 0x123::pool::LP<TokenA, TokenB>
  const lpMatch = resourceType.match(/LP<([^,]+),\s*([^>]+)>/);
  if (lpMatch) {
    return {
      poolAddress: resourceType.split("::")[0],
      tokenA: lpMatch[1].trim(),
      tokenB: lpMatch[2].trim(),
    };
  }

  // Pattern for pool tokens like: 0x123::pool::Pool<TokenA, TokenB>
  const poolMatch = resourceType.match(/Pool<([^,]+),\s*([^>]+)>/);
  if (poolMatch) {
    return {
      poolAddress: resourceType.split("::")[0],
      tokenA: poolMatch[1].trim(),
      tokenB: poolMatch[2].trim(),
    };
  }

  return null;
}

/**
 * Extract token symbol from address
 */
export function getTokenSymbol(tokenAddress: string): string {
  // Extract symbol from type string like "0x123::coin::Token"
  const parts = tokenAddress.split("::");
  if (parts.length >= 3) {
    return parts[parts.length - 1].toUpperCase();
  }

  // For nested types like "0x123::coin::Token<0x456::other::OtherToken>"
  const match = tokenAddress.match(/::([^<:]+)(?:<|$)/);
  if (match) {
    return match[1].toUpperCase();
  }

  return "UNKNOWN";
}

/**
 * Identify protocol from resource type
 */
export function identifyProtocol(resourceType: string): ProtocolInfo {
  const protocolAddress = resourceType.split("::")[0];

  // Check all protocol types
  for (const protocolType of Object.values(ProtocolType)) {
    const protocols = getProtocolsByType(protocolType);
    for (const protocol of protocols) {
      if (protocol.addresses) {
        for (const address of protocol.addresses) {
          if (protocolAddress === address) {
            return {
              protocol: protocol.name,
              type: mapProtocolTypeToPositionType(protocolType),
              description:
                protocol.description ||
                getDescriptionForType(mapProtocolTypeToPositionType(protocolType)),
            };
          }
        }
      }
    }
  }

  return {
    protocol: "Unknown",
    type: "other",
    description: "Unknown Protocol",
  };
}

/**
 * Map protocol type to position type
 */
export function mapProtocolTypeToPositionType(
  protocolType: ProtocolType
): "liquidity" | "farming" | "lending" | "staking" | "nft" | "derivatives" | "other" {
  switch (protocolType) {
    case ProtocolType.DEX:
      return "liquidity";
    case ProtocolType.FARMING:
      return "farming";
    case ProtocolType.LENDING:
      return "lending";
    case ProtocolType.LIQUID_STAKING:
      return "staking";
    case ProtocolType.NFT:
      return "nft";
    case ProtocolType.DERIVATIVES:
      return "derivatives";
    default:
      return "other";
  }
}

/**
 * Get description for position type
 */
export function getDescriptionForType(
  type: "liquidity" | "farming" | "lending" | "staking" | "nft" | "derivatives" | "other"
): string {
  switch (type) {
    case "liquidity":
      return "DEX/Liquidity Pool";
    case "farming":
      return "Yield Farming";
    case "lending":
      return "Lending/Borrowing";
    case "staking":
      return "Liquid Staking";
    case "nft":
      return "NFT Platform";
    case "derivatives":
      return "Derivatives Trading";
    default:
      return "Other Protocol";
  }
}

/**
 * Map DeFi token to underlying asset
 */
export function mapDeFiTokenToUnderlyingAsset(
  tokenSymbol: string,
  tokenAddress: string
): {
  underlyingSymbol: string;
  underlyingAddress: string;
  conversionRate?: number;
} {
  // Liquid staking tokens
  const liquidStakingMap: Record<string, string> = {
    stAPT: "APT",
    tAPT: "APT",
    amAPT: "APT",
    dAPT: "APT",
  };

  if (liquidStakingMap[tokenSymbol]) {
    return {
      underlyingSymbol: liquidStakingMap[tokenSymbol],
      underlyingAddress: "0x1::aptos_coin::AptosCoin",
      conversionRate: 1, // This should be fetched from the protocol
    };
  }

  // For wrapped tokens
  if (tokenSymbol.startsWith("W") && tokenSymbol.length > 1) {
    const underlying = tokenSymbol.substring(1);
    return {
      underlyingSymbol: underlying,
      underlyingAddress: tokenAddress, // Would need mapping
    };
  }

  // Default case - token is its own underlying asset
  return {
    underlyingSymbol: tokenSymbol,
    underlyingAddress: tokenAddress,
  };
}
