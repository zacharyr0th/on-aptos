/**
 * DeFi Balance Service - Refactored
 * Main service orchestrating all DeFi position scanning and analysis
 */

import { getEnvVar } from "@/lib/config/validate-env";
import type { DeFiPosition } from "@/lib/types/defi";
import { graphQLRequest } from "@/lib/utils/api/fetch-utils";
import { logger } from "@/lib/utils/core/logger";
import { AssetService } from "../../portfolio/services/asset-service";
import {
  buildLPTokenPosition,
  buildPositionDetailsWithPrices,
  calculatePositionValueWithPrices,
} from "./position-builders";
import {
  getBridgePositions,
  getDerivativesPositions,
  getDexPositions,
  getFarmingPositions,
  getLendingPositions,
  getLiquidStakingPositions,
} from "./protocol-scanners";
// Import from our new modules
import type { ComprehensivePositionSummary, DetailedPosition } from "./types";
import {
  getTokenDecimals,
  getTokenSymbol,
  identifyProtocol,
  isLPToken,
  mapProtocolTypeToDefiType,
} from "./utils";

const INDEXER = "https://api.mainnet.aptoslabs.com/v1/graphql";
const APTOS_API_KEY = getEnvVar("APTOS_BUILD_SECRET");

export class DeFiBalanceService {
  /**
   * Get all DeFi positions for a wallet address using comprehensive position checker
   */
  static async getDeFiPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      logger.info(`Fetching comprehensive DeFi positions for wallet: ${walletAddress}`);

      // Use comprehensive position checker first (higher data quality)
      const comprehensivePositions =
        await DeFiBalanceService.getComprehensiveDeFiPositions(walletAddress);

      // Also check wallet assets for tokens that match protocol addresses
      const walletAssetPositions =
        await DeFiBalanceService.getWalletAssetDeFiPositions(walletAddress);

      // Simple deduplication: comprehensive positions take priority
      const seenKeys = new Set<string>();
      const allPositions: DeFiPosition[] = [];

      // Add comprehensive positions first (higher priority)
      for (const position of comprehensivePositions) {
        const key = `${position.protocol}-${position.address}`;
        seenKeys.add(key);
        allPositions.push(position);
      }

      // Add wallet asset positions only if not already seen
      for (const position of walletAssetPositions) {
        const key = `${position.protocol}-${position.address}`;
        if (!seenKeys.has(key)) {
          allPositions.push(position);
        }
      }

      // Filter out positions with total value less than $0.10 (dust amounts)
      // BUT always include LP tokens regardless of value
      const MIN_DEFI_VALUE_THRESHOLD = 0.1;
      const filteredPositions = allPositions.filter((position) => {
        // Always include LP tokens regardless of value
        if (isLPToken(position)) {
          return true;
        }
        // For other positions, check minimum value threshold
        return position.totalValueUSD >= MIN_DEFI_VALUE_THRESHOLD;
      });

      logger.info(
        `Fetched ${allPositions.length} total positions, ${filteredPositions.length} after filtering`,
        {
          walletAddress,
          totalPositions: allPositions.length,
          filteredPositions: filteredPositions.length,
          protocolBreakdown: DeFiBalanceService.getProtocolBreakdown(filteredPositions),
        }
      );

      return filteredPositions.sort((a, b) => b.totalValueUSD - a.totalValueUSD);
    } catch (error) {
      logger.error("Failed to get DeFi positions", { walletAddress, error });
      return [];
    }
  }

  /**
   * Get comprehensive DeFi positions using enhanced scanning
   */
  private static async getComprehensiveDeFiPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      logger.info("Starting comprehensive DeFi position scan", {
        walletAddress,
      });

      // Fetch from all protocol scanners in parallel
      const [
        liquidStakingPositions,
        lendingPositions,
        dexPositions,
        farmingPositions,
        derivativesPositions,
        bridgePositions,
      ] = await Promise.all([
        getLiquidStakingPositions(walletAddress, APTOS_API_KEY),
        getLendingPositions(walletAddress, APTOS_API_KEY),
        getDexPositions(walletAddress, APTOS_API_KEY),
        getFarmingPositions(walletAddress, APTOS_API_KEY),
        getDerivativesPositions(walletAddress, APTOS_API_KEY),
        getBridgePositions(walletAddress, APTOS_API_KEY),
      ]);

      positions.push(
        ...liquidStakingPositions,
        ...lendingPositions,
        ...dexPositions,
        ...farmingPositions,
        ...derivativesPositions,
        ...bridgePositions
      );

      // Also get legacy positions as fallback
      const legacyPositions = await DeFiBalanceService.getLegacyDeFiPositions(walletAddress);
      positions.push(...legacyPositions);

      logger.info(`Comprehensive scan found ${positions.length} positions`);
      return positions;
    } catch (error) {
      logger.error("Failed comprehensive DeFi position scan", { error });
      return [];
    }
  }

  /**
   * Get wallet asset DeFi positions
   */
  private static async getWalletAssetDeFiPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      const walletAssets = await AssetService.getWalletAssets(walletAddress);
      const positions: DeFiPosition[] = [];

      for (const asset of walletAssets) {
        if (asset.asset_type && parseFloat(asset.amount) > 0) {
          // Check if this asset belongs to a known DeFi protocol
          const protocol = identifyProtocol(asset.asset_type);

          if (protocol.protocol !== "Unknown") {
            // Try to build LP position if it's an LP token
            const lpPosition = await buildLPTokenPosition(walletAddress, asset);
            if (lpPosition) {
              positions.push(lpPosition);
              continue;
            }

            // Build regular DeFi position
            const decimals = getTokenDecimals(asset.asset_type, asset.metadata);
            const adjustedAmount = parseFloat(asset.amount) / 10 ** decimals;
            const symbol = getTokenSymbol(asset.asset_type);
            const protocolType = mapProtocolTypeToDefiType(protocol.type as any);

            positions.push({
              id: `asset-${asset.asset_type}-${walletAddress}`,
              positionId: `asset-${asset.asset_type}-${walletAddress}`,
              protocol: protocol.protocol,
              protocolType: protocolType,
              type: protocolType,
              address: walletAddress,
              totalValue: 0,
              totalValueUSD: 0,
              assets: [
                {
                  type: "supplied",
                  tokenAddress: asset.asset_type,
                  symbol,
                  amount: adjustedAmount.toString(),
                  valueUSD: 0, // Will be updated with price
                },
              ],
              position: {
                supplied: [
                  {
                    asset: asset.asset_type,
                    amount: adjustedAmount.toString(),
                    value: 0,
                  },
                ],
              },
            });
          }
        }
      }

      return positions;
    } catch (error) {
      logger.error("Failed to get wallet asset DeFi positions", { error });
      return [];
    }
  }

  /**
   * Get legacy DeFi positions using account resources
   */
  private static async getLegacyDeFiPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      const resources = await DeFiBalanceService.fetchAccountResources(walletAddress);
      const positions: DeFiPosition[] = [];

      // Process each resource to identify DeFi positions
      for (const resource of resources) {
        const protocol = identifyProtocol(resource.type);
        if (protocol.protocol !== "Unknown") {
          // This is a simplified example - in practice, you'd need
          // protocol-specific parsing logic
          positions.push({
            id: `legacy-${resource.type}-${walletAddress}`,
            positionId: `legacy-${resource.type}-${walletAddress}`,
            protocol: protocol.protocol,
            protocolType: mapProtocolTypeToDefiType(protocol.type as any),
            type: mapProtocolTypeToDefiType(protocol.type as any),
            address: walletAddress,
            totalValue: 0,
            totalValueUSD: 0,
            assets: [],
            position: {},
            metadata: {
              resourceType: resource.type,
              resourceData: resource.data,
            },
          });
        }
      }

      return positions;
    } catch (error) {
      logger.error("Failed to get legacy DeFi positions", { error });
      return [];
    }
  }

  /**
   * Get DeFi stats for a wallet
   */
  static async getDeFiStats(walletAddress: string): Promise<{
    totalValueUSD: number;
    protocolCount: number;
    positionCount: number;
    breakdown: Record<string, { count: number; valueUSD: number }>;
  }> {
    try {
      const positions = await DeFiBalanceService.getDeFiPositions(walletAddress);
      const totalValueUSD = positions.reduce((sum, pos) => sum + pos.totalValueUSD, 0);

      const breakdown: Record<string, { count: number; valueUSD: number }> = {};
      const protocols = new Set<string>();

      for (const position of positions) {
        protocols.add(position.protocol);

        if (!breakdown[position.protocol]) {
          breakdown[position.protocol] = { count: 0, valueUSD: 0 };
        }

        breakdown[position.protocol].count++;
        breakdown[position.protocol].valueUSD += position.totalValueUSD;
      }

      return {
        totalValueUSD,
        protocolCount: protocols.size,
        positionCount: positions.length,
        breakdown,
      };
    } catch (error) {
      logger.error("Failed to get DeFi stats", { error });
      return {
        totalValueUSD: 0,
        protocolCount: 0,
        positionCount: 0,
        breakdown: {},
      };
    }
  }

  /**
   * Fetch account resources
   */
  private static async fetchAccountResources(
    walletAddress: string
  ): Promise<Array<{ type: string; data: Record<string, unknown> }>> {
    try {
      const response = await fetch(
        `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${walletAddress}/resources`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const resources = await response.json();
      return resources || [];
    } catch (error) {
      logger.error("Failed to fetch account resources", {
        walletAddress,
        error,
      });
      return [];
    }
  }

  /**
   * Get protocol breakdown helper
   */
  private static getProtocolBreakdown(positions: DeFiPosition[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const position of positions) {
      breakdown[position.protocol] = (breakdown[position.protocol] || 0) + 1;
    }
    return breakdown;
  }
}
