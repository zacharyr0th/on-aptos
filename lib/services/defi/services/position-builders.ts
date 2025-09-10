/**
 * DeFi Position Builders
 * Functions for building and calculating DeFi position details
 */

import type { DeFiPosition } from "@/lib/types/defi";
import { logger } from "@/lib/utils/core/logger";
import { AssetService } from "../../portfolio/services/asset-service";
import {
  getTokenDecimals,
  getTokenSymbol,
  mapDeFiTokenToUnderlyingAsset,
  parseLPToken,
} from "./utils";

/**
 * Build position details structure
 */
export function buildPositionDetails(position: any): DeFiPosition["position"] {
  return {
    supplied: position.supplied || [],
    borrowed: position.borrowed || [],
    rewards: position.rewards || [],
  };
}

/**
 * Build position details with price calculations
 */
export async function buildPositionDetailsWithPrices(
  position: any,
  walletAddress: string
): Promise<DeFiPosition["position"]> {
  const positionDetails = buildPositionDetails(position);

  // Enhance supplied assets with price data
  if (positionDetails.supplied) {
    for (const asset of positionDetails.supplied) {
      try {
        // Get price from AssetService
        const assetPrices = await AssetService.getAssetPrices([asset.asset]);
        const assetData = assetPrices.find((p) => p.assetType === asset.asset);

        if (assetData?.price) {
          asset.value = parseFloat(asset.amount) * assetData.price;
        }

        // Map to underlying asset if needed
        const symbol = getTokenSymbol(asset.asset);
        const mapping = mapDeFiTokenToUnderlyingAsset(symbol, asset.asset);

        if (mapping.underlyingSymbol !== symbol) {
          // Add metadata to the asset object if it doesn't exist
          if (!("metadata" in asset)) {
            (asset as any).metadata = {};
          }
          (asset as any).metadata = {
            ...(asset as any).metadata,
            underlyingAsset: mapping.underlyingSymbol,
            underlyingAddress: mapping.underlyingAddress,
            conversionRate: mapping.conversionRate,
          };
        }
      } catch (error) {
        logger.debug("Failed to get price for asset", {
          asset: asset.asset,
          error,
        });
      }
    }
  }

  // Enhance borrowed assets with price data
  if (positionDetails.borrowed) {
    for (const asset of positionDetails.borrowed) {
      try {
        const assetPrices = await AssetService.getAssetPrices([asset.asset]);
        const assetData = assetPrices.find((p) => p.assetType === asset.asset);

        if (assetData?.price) {
          asset.value = parseFloat(asset.amount) * assetData.price;
        }
      } catch (error) {
        logger.debug("Failed to get price for borrowed asset", {
          asset: asset.asset,
          error,
        });
      }
    }
  }

  return positionDetails;
}

/**
 * Calculate position total value (legacy method)
 */
export function calculatePositionValue(position: any): number {
  let totalValue = 0;

  if (position.supplied) {
    totalValue += position.supplied.reduce(
      (sum: number, asset: any) => sum + (asset.value || 0),
      0
    );
  }

  if (position.borrowed) {
    totalValue -= position.borrowed.reduce(
      (sum: number, asset: any) => sum + (asset.value || 0),
      0
    );
  }

  return Math.max(0, totalValue);
}

/**
 * Calculate position value with price lookups
 */
export async function calculatePositionValueWithPrices(
  position: any,
  walletAddress: string
): Promise<number> {
  let totalValue = 0;

  // Calculate supplied value
  if (position.supplied) {
    for (const asset of position.supplied) {
      try {
        if (asset.value) {
          totalValue += asset.value;
        } else {
          // Try to calculate value
          const assetPrices = await AssetService.getAssetPrices([asset.asset]);
          const assetData = assetPrices.find((p) => p.assetType === asset.asset);
          if (assetData?.price) {
            const amount = parseFloat(asset.amount || "0");
            totalValue += amount * assetData.price;
          }
        }
      } catch (error) {
        logger.debug("Failed to calculate supplied asset value", {
          asset: asset.asset,
          error,
        });
      }
    }
  }

  // Subtract borrowed value
  if (position.borrowed) {
    for (const asset of position.borrowed) {
      try {
        if (asset.value) {
          totalValue -= asset.value;
        } else {
          const assetPrices = await AssetService.getAssetPrices([asset.asset]);
          const assetData = assetPrices.find((p) => p.assetType === asset.asset);
          if (assetData?.price) {
            const amount = parseFloat(asset.amount || "0");
            totalValue -= amount * assetData.price;
          }
        }
      } catch (error) {
        logger.debug("Failed to calculate borrowed asset value", {
          asset: asset.asset,
          error,
        });
      }
    }
  }

  return Math.max(0, totalValue);
}

/**
 * Build LP token position from wallet assets
 */
export async function buildLPTokenPosition(
  walletAddress: string,
  asset: any
): Promise<DeFiPosition | null> {
  try {
    const lpInfo = parseLPToken(asset.asset_type);
    if (!lpInfo) return null;

    const balance = parseFloat(asset.amount || "0");
    const decimals = getTokenDecimals(asset.asset_type, asset.metadata);
    const adjustedBalance = balance / 10 ** decimals;

    if (adjustedBalance <= 0) return null;

    // Try to get underlying assets
    const underlyingAssets = await extractUnderlyingAssets(
      asset.asset_type,
      adjustedBalance.toString()
    );

    return {
      id: `lp-${asset.asset_type}`,
      positionId: `lp-${asset.asset_type}`,
      protocol: lpInfo.poolAddress.split("::")[1] || "Unknown",
      protocolType: "lp",
      type: "lp",
      address: walletAddress,
      totalValue: 0,
      totalValueUSD: 0,
      assets: [
        {
          type: "supplied",
          tokenAddress: asset.asset_type,
          symbol: getTokenSymbol(asset.asset_type),
          amount: adjustedBalance.toString(),
          valueUSD: 0, // Will be calculated later
          metadata: {
            poolAddress: lpInfo.poolAddress,
            tokenA: lpInfo.tokenA,
            tokenB: lpInfo.tokenB,
            underlyingAssets,
          },
        },
      ],
      position: {
        supplied: [
          {
            asset: asset.asset_type,
            amount: adjustedBalance.toString(),
            value: 0,
          },
        ],
      },
      metadata: {
        poolAddress: lpInfo.poolAddress,
        tokenA: lpInfo.tokenA,
        tokenB: lpInfo.tokenB,
        underlyingAssets,
      },
    };
  } catch (error) {
    logger.debug("Failed to build LP token position", {
      asset: asset.asset_type,
      error,
    });
    return null;
  }
}

/**
 * Extract underlying assets from LP token
 */
export async function extractUnderlyingAssets(
  lpTokenAddress: string,
  lpAmount: string
): Promise<Array<{ symbol: string; amount: string; address: string }>> {
  try {
    const lpInfo = parseLPToken(lpTokenAddress);
    if (!lpInfo) return [];

    // This is a simplified implementation
    // In practice, you'd need to query the specific pool contract
    // for the current reserves and calculate the underlying amounts

    // For Thala LP tokens, we can try specific calculations
    if (lpTokenAddress.includes("thala")) {
      return getThalaLPTokenAmounts(lpTokenAddress, lpAmount);
    }

    // Default implementation - equal split
    const halfAmount = (parseFloat(lpAmount) / 2).toString();
    return [
      {
        symbol: getTokenSymbol(lpInfo.tokenA),
        amount: halfAmount,
        address: lpInfo.tokenA,
      },
      {
        symbol: getTokenSymbol(lpInfo.tokenB),
        amount: halfAmount,
        address: lpInfo.tokenB,
      },
    ];
  } catch (error) {
    logger.debug("Failed to extract underlying assets", {
      lpToken: lpTokenAddress,
      error,
    });
    return [];
  }
}

/**
 * Get Thala LP token underlying amounts (protocol-specific)
 */
export async function getThalaLPTokenAmounts(
  lpTokenAddress: string,
  lpAmount: string
): Promise<Array<{ symbol: string; amount: string; address: string }>> {
  try {
    // This would require querying Thala's pool contracts
    // For now, return a simplified calculation
    const lpInfo = parseLPToken(lpTokenAddress);
    if (!lpInfo) return [];

    // Simplified: assume 1:1 ratio for demonstration
    const amount = (parseFloat(lpAmount) / 2).toString();

    return [
      {
        symbol: getTokenSymbol(lpInfo.tokenA),
        amount,
        address: lpInfo.tokenA,
      },
      {
        symbol: getTokenSymbol(lpInfo.tokenB),
        amount,
        address: lpInfo.tokenB,
      },
    ];
  } catch (error) {
    logger.debug("Failed to get Thala LP token amounts", {
      lpToken: lpTokenAddress,
      error,
    });
    return [];
  }
}
