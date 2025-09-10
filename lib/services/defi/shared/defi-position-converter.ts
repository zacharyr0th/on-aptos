import type { DeFiPosition as LegacyDeFiPosition } from "@/lib/types/defi";
import { ProtocolType } from "@/lib/types/defi";
import { TokenRegistry } from "../../shared/utils/token-registry";
import type { DeFiPosition as NewDeFiPosition } from "../unified-scanner";

/**
 * Unified DeFi position converter that handles all position format transformations
 * Consolidates conversion logic from multiple services
 */

export interface UnifiedDeFiPosition {
  id: string;
  protocol: string;
  protocolType: string;
  poolName?: string;
  positionType: string;
  suppliedAssets: Array<{
    asset: string;
    symbol: string;
    amount: number;
    value: number;
    apy?: number;
  }>;
  borrowedAssets: Array<{
    asset: string;
    symbol: string;
    amount: number;
    value: number;
    apy?: number;
  }>;
  liquidityAssets: Array<{
    poolId: string;
    token0: { asset: string; symbol: string; amount: string };
    token1: { asset: string; symbol: string; amount: string };
    lpTokens: string;
    value: number;
  }>;
  stakedAssets: Array<{
    asset: string;
    symbol: string;
    amount: number;
    value: number;
    rewards?: string;
    apy?: number;
  }>;
  totalValueUSD: number;
  healthFactor?: number;
  claimableRewards?: Array<{
    asset: string;
    symbol: string;
    amount: number;
    value: number;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Position type mappings for consistent categorization
 */
const POSITION_TYPE_MAPPING: Record<string, string> = {
  // New DeFi service types
  liquidity_pool: "Liquidity Pool",
  lending_supply: "Lending",
  lending_borrow: "Lending/Borrowing",
  staking: "Staking",
  farming: "Farming",
  vault: "Vault",

  // Legacy position types
  liquidity: "Liquidity Pool",
  lending: "Lending",
  liquid_staking: "Staking",
  derivatives: "Derivatives",
  nft: "NFT Platform",
  other: "Other",
};

/**
 * Protocol type mappings for consistency
 */
const PROTOCOL_TYPE_MAPPING: Record<ProtocolType, string> = {
  [ProtocolType.DEX]: "DEX",
  [ProtocolType.LENDING]: "Lending",
  [ProtocolType.YIELD]: "Yield",
  [ProtocolType.FARMING]: "Farming",
  [ProtocolType.DERIVATIVES]: "Derivatives",
  [ProtocolType.CDP]: "CDP",
  [ProtocolType.LIQUID_STAKING]: "Liquid Staking",
  [ProtocolType.ORACLE]: "Oracle",
  [ProtocolType.GAMING]: "Gaming",
  [ProtocolType.SOCIAL]: "Social",
  [ProtocolType.BRIDGE]: "Bridge",
  [ProtocolType.LAUNCHPAD]: "Launchpad",
  [ProtocolType.AGGREGATOR]: "Aggregator",
  [ProtocolType.INFRASTRUCTURE]: "Infrastructure",
  [ProtocolType.NFT]: "NFT",
  [ProtocolType.NFT_MARKETPLACE]: "NFT Marketplace",
  [ProtocolType.UNKNOWN]: "Unknown",
};

export class DeFiPositionConverter {
  /**
   * Convert new DeFi service position to unified format
   */
  static fromNewDeFiPosition(position: NewDeFiPosition): UnifiedDeFiPosition {
    const suppliedAssets: UnifiedDeFiPosition["suppliedAssets"] = [];
    const borrowedAssets: UnifiedDeFiPosition["borrowedAssets"] = [];
    const liquidityAssets: UnifiedDeFiPosition["liquidityAssets"] = [];
    const stakedAssets: UnifiedDeFiPosition["stakedAssets"] = [];

    // Process assets by type
    for (const asset of position.assets) {
      // Handle both tokenAddress and address fields (from different sources)
      const address = asset.tokenAddress || asset.address || "";
      const symbol = asset.symbol || TokenRegistry.getSymbolFromAddress(address);
      const assetData = {
        asset: address,
        symbol,
        amount: parseFloat(asset.amount || "0"),
        value: asset.valueUSD || 0,
        apy: asset.metadata?.apy,
      };

      switch (asset.type) {
        case "supplied":
          suppliedAssets.push(assetData);
          break;
        case "borrowed":
          borrowedAssets.push(assetData);
          break;
        case "staked":
          stakedAssets.push({
            ...assetData,
            rewards: asset.metadata?.rewards,
          });
          break;
        case "lp_token":
          // Convert LP token to liquidity format
          liquidityAssets.push({
            poolId: address,
            token0: {
              asset: address,
              symbol,
              amount: asset.amount || "0",
            },
            token1: {
              asset: "Unknown",
              symbol: "Unknown",
              amount: "0",
            },
            lpTokens: asset.amount || "0",
            value: asset.valueUSD,
          });
          break;
        case "vault_share":
          suppliedAssets.push(assetData);
          break;
      }
    }

    return {
      id: `${position.protocol}-${position.id}`,
      protocol: position.protocol,
      protocolType: PROTOCOL_TYPE_MAPPING[ProtocolType.DEX] || "DeFi", // Default to DeFi
      poolName: position.protocol,
      positionType: POSITION_TYPE_MAPPING[position.type] || position.type,
      suppliedAssets,
      borrowedAssets,
      liquidityAssets,
      stakedAssets,
      totalValueUSD: position.totalValueUSD,
      healthFactor:
        typeof position.metadata?.healthFactor === "number"
          ? position.metadata.healthFactor
          : undefined,
      claimableRewards: Array.isArray(position.metadata?.claimableRewards)
        ? position.metadata!.claimableRewards.map((reward: any) => ({
            asset: reward.tokenAddress,
            symbol: TokenRegistry.getSymbolFromAddress(reward.tokenAddress),
            amount: parseFloat(reward.amount),
            value: reward.valueUSD,
          }))
        : [],
      metadata: position.metadata,
    };
  }

  /**
   * Convert legacy DeFi position to unified format
   */
  static fromLegacyDeFiPosition(position: LegacyDeFiPosition): UnifiedDeFiPosition {
    const suppliedAssets: UnifiedDeFiPosition["suppliedAssets"] = [];
    const borrowedAssets: UnifiedDeFiPosition["borrowedAssets"] = [];
    const liquidityAssets: UnifiedDeFiPosition["liquidityAssets"] = [];
    const stakedAssets: UnifiedDeFiPosition["stakedAssets"] = [];

    // Process supplied assets
    if (position.position?.supplied) {
      position.position.supplied.forEach((asset) => {
        suppliedAssets.push({
          asset: asset.asset,
          symbol: TokenRegistry.getSymbolFromAddress(asset.asset),
          amount: parseFloat(asset.amount),
          value: asset.value,
          apy: asset.apy,
        });
      });
    }

    // Process borrowed assets
    if (position.position?.borrowed) {
      position.position.borrowed.forEach((asset) => {
        borrowedAssets.push({
          asset: asset.asset,
          symbol: TokenRegistry.getSymbolFromAddress(asset.asset),
          amount: parseFloat(asset.amount),
          value: asset.value,
          apy: asset.apy,
        });
      });
    }

    return {
      id: `${position.protocol}-${Date.now()}`,
      protocol: position.protocol,
      protocolType: position.protocolType,
      poolName: position.metadata?.poolName || position.metadata?.type || "",
      positionType: position.type || position.metadata?.type || "unknown",
      suppliedAssets,
      borrowedAssets,
      liquidityAssets,
      stakedAssets,
      totalValueUSD: position.totalValueUSD ?? position.totalValue,
      healthFactor: position.health?.ratio,
      claimableRewards: position.position?.rewards?.map((reward) => ({
        asset: reward.asset,
        symbol: TokenRegistry.getSymbolFromAddress(reward.asset),
        amount: parseFloat(reward.amount),
        value: reward.value,
      })),
    };
  }

  /**
   * Convert from comprehensive position format (defi-balance-service)
   */
  static fromComprehensivePosition(
    position: any,
    priceMap: Map<string, number>
  ): UnifiedDeFiPosition {
    const suppliedAssets: UnifiedDeFiPosition["suppliedAssets"] = [];
    const borrowedAssets: UnifiedDeFiPosition["borrowedAssets"] = [];
    const liquidityAssets: UnifiedDeFiPosition["liquidityAssets"] = [];
    const stakedAssets: UnifiedDeFiPosition["stakedAssets"] = [];

    // Process LP tokens
    if (position.lpTokens?.length > 0) {
      position.lpTokens.forEach((lp: any) => {
        const balance = parseFloat(lp.balance || "0");
        const price = priceMap.get(lp.poolTokens[0]) || 0;
        const value = balance * price;

        liquidityAssets.push({
          poolId: `${lp.poolType}-${lp.poolTokens.join("-")}`,
          token0: {
            asset: lp.poolTokens[0] || "",
            symbol: TokenRegistry.getSymbolFromAddress(lp.poolTokens[0] || ""),
            amount: lp.balance || "0",
          },
          token1: {
            asset: lp.poolTokens[1] || "",
            symbol: TokenRegistry.getSymbolFromAddress(lp.poolTokens[1] || ""),
            amount: lp.balance || "0",
          },
          lpTokens: lp.balance || "0",
          value,
        });
      });
    }

    // Process regular tokens
    if (position.tokens?.length > 0) {
      position.tokens.forEach((token: any) => {
        const rawBalance = parseFloat(token.balance || "0");
        const decimals = TokenRegistry.getTokenDecimals(token.address, token.symbol);
        const balance = rawBalance / 10 ** decimals;

        const price = priceMap.get(token.address) || 0;
        const value = balance * price;
        const symbol = TokenRegistry.getSymbolFromAddress(token.address);

        const assetData = {
          asset: token.address,
          symbol,
          amount: balance,
          value,
        };

        // Categorize based on position type
        switch (position.type) {
          case "staking":
            stakedAssets.push(assetData);
            break;
          case "lending":
            if (token.symbol?.toLowerCase().includes("debt")) {
              borrowedAssets.push(assetData);
            } else {
              suppliedAssets.push(assetData);
            }
            break;
          default:
            suppliedAssets.push(assetData);
        }
      });
    }

    // Calculate total value
    const totalValue = [
      ...suppliedAssets,
      ...liquidityAssets.map((lp) => ({ value: lp.value })),
      ...stakedAssets,
    ].reduce((sum, asset) => sum + asset.value, 0);

    return {
      id: `${position.protocol}-${position.protocolAddress}`,
      protocol: position.protocol,
      protocolType: DeFiPositionConverter.mapPositionTypeToProtocolType(position.type),
      poolName: position.description,
      positionType: POSITION_TYPE_MAPPING[position.type] || position.type,
      suppliedAssets,
      borrowedAssets,
      liquidityAssets,
      stakedAssets,
      totalValueUSD: totalValue,
      metadata: {
        protocolAddress: position.protocolAddress,
        resources: position.resources,
        isActive: position.isActive,
      },
    };
  }

  /**
   * Convert unified position to legacy format for backward compatibility
   */
  static toLegacyDeFiPosition(position: UnifiedDeFiPosition): LegacyDeFiPosition {
    // Convert to the expected DeFi position format from /lib/types/defi.ts
    const supplied = position.suppliedAssets.map((asset) => ({
      asset: asset.asset,
      amount: asset.amount.toString(),
      value: asset.value,
      apy: asset.apy,
    }));

    const borrowed = position.borrowedAssets.map((asset) => ({
      asset: asset.asset,
      amount: asset.amount.toString(),
      value: asset.value,
      apy: asset.apy,
    }));

    const staked = position.stakedAssets.map((asset) => ({
      asset: asset.asset,
      amount: asset.amount.toString(),
      value: asset.value,
      apy: asset.apy,
    }));

    const liquidity = position.liquidityAssets.map((lp) => ({
      poolId: lp.poolId,
      lpTokens: lp.lpTokens,
      value: lp.value,
      token0: lp.token0,
      token1: lp.token1,
    }));

    return {
      positionId: position.id,
      protocol: position.protocol,
      protocolType: position.protocolType,
      totalValue: position.totalValueUSD,
      address: "", // Will be set by the service
      position: {
        supplied: supplied.length > 0 ? supplied : undefined,
        borrowed: borrowed.length > 0 ? borrowed : undefined,
        staked: staked.length > 0 ? staked : undefined,
        liquidity: liquidity.length > 0 ? liquidity : undefined,
      },
    };
  }

  /**
   * Generate position summary from array of positions
   */
  static generateSummary(positions: UnifiedDeFiPosition[]): {
    totalPositions: number;
    totalValueUSD: number;
    protocolBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
    topProtocols: Array<{
      protocol: string;
      valueUSD: number;
      percentage: number;
    }>;
  } {
    const totalPositions = positions.length;
    const totalValueUSD = positions.reduce((sum, pos) => sum + pos.totalValueUSD, 0);

    // Group by protocol
    const protocolBreakdown: Record<string, number> = {};
    const typeBreakdown: Record<string, number> = {};

    positions.forEach((position) => {
      const protocol = position.protocol || "Unknown";
      const type = position.positionType || "Other";

      protocolBreakdown[protocol] = (protocolBreakdown[protocol] || 0) + position.totalValueUSD;
      typeBreakdown[type] = (typeBreakdown[type] || 0) + position.totalValueUSD;
    });

    // Create top protocols array
    const topProtocols = Object.entries(protocolBreakdown)
      .map(([protocol, valueUSD]) => ({
        protocol,
        valueUSD,
        percentage: totalValueUSD > 0 ? (valueUSD / totalValueUSD) * 100 : 0,
      }))
      .sort((a, b) => b.valueUSD - a.valueUSD)
      .slice(0, 10);

    return {
      totalPositions,
      totalValueUSD,
      protocolBreakdown,
      typeBreakdown,
      topProtocols,
    };
  }

  /**
   * Validate position data
   */
  static validatePosition(position: UnifiedDeFiPosition): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!position.protocol) {
      errors.push("Missing protocol name");
    }

    if (position.totalValueUSD < 0) {
      errors.push("Total value cannot be negative");
    }

    if (
      !position.suppliedAssets &&
      !position.borrowedAssets &&
      !position.liquidityAssets &&
      !position.stakedAssets
    ) {
      errors.push("Position must have at least one asset");
    }

    // Validate asset data
    [...position.suppliedAssets, ...position.borrowedAssets, ...position.stakedAssets].forEach(
      (asset, index) => {
        if (!asset.asset) {
          errors.push(`Asset ${index} missing address`);
        }
        if (asset.amount < 0) {
          errors.push(`Asset ${index} amount cannot be negative`);
        }
        if (asset.value < 0) {
          errors.push(`Asset ${index} value cannot be negative`);
        }
      }
    );

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Map position type string to protocol type
   */
  private static mapPositionTypeToProtocolType(type: string): string {
    switch (type.toLowerCase()) {
      case "liquidity":
        return "DEX";
      case "farming":
        return "Farming";
      case "lending":
        return "Lending";
      case "staking":
        return "Liquid Staking";
      case "nft":
        return "NFT Marketplace";
      case "derivatives":
        return "Derivatives";
      default:
        return "Infrastructure";
    }
  }

  /**
   * Merge duplicate positions from the same protocol
   */
  static mergeDuplicates(positions: UnifiedDeFiPosition[]): UnifiedDeFiPosition[] {
    const merged = new Map<string, UnifiedDeFiPosition>();

    positions.forEach((position) => {
      const key = `${position.protocol}-${position.positionType}`;
      const existing = merged.get(key);

      if (existing) {
        // Merge assets
        existing.suppliedAssets.push(...position.suppliedAssets);
        existing.borrowedAssets.push(...position.borrowedAssets);
        existing.liquidityAssets.push(...position.liquidityAssets);
        existing.stakedAssets.push(...position.stakedAssets);
        existing.totalValueUSD += position.totalValueUSD;
      } else {
        merged.set(key, { ...position });
      }
    });

    return Array.from(merged.values());
  }

  /**
   * Filter positions by minimum value threshold
   */
  static filterByMinValue(
    positions: UnifiedDeFiPosition[],
    minValueUSD: number = 0.1
  ): UnifiedDeFiPosition[] {
    return positions.filter((position) => {
      // Always include LP positions regardless of value
      if (position.liquidityAssets.length > 0) {
        return true;
      }

      return position.totalValueUSD >= minValueUSD;
    });
  }
}
