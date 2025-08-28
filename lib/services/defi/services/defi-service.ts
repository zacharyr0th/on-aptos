import type { DeFiPosition as NewDeFiPosition } from "@/lib/services/defi";
import { scanDeFiPositions } from "@/lib/services/defi";
import { logger } from "@/lib/utils/core/logger";

import type { DeFiPosition } from "../../portfolio/types";
import { DeFiPositionConverter } from "../shared/defi-position-converter";
import { unifiedScanner } from "../unified-scanner";

export class DeFiService {
  static async getWalletDeFiPositions(
    address: string,
  ): Promise<DeFiPosition[]> {
    try {
      // Use unified scanner for accurate values
      const enhancedResult = await unifiedScanner.scan(address, {
        includeTokens: false,
        minValueUSD: 0.01,
      });

      if (enhancedResult.positions.length > 0) {
        logger.info("Using unified scanner results", {
          address,
          positions: enhancedResult.positions.length,
          totalValue: enhancedResult.totalValueUSD,
        });

        // Convert enhanced positions to portfolio format
        return enhancedResult.positions.map((pos: NewDeFiPosition) =>
          this.convertNewPosition(pos),
        );
      }

      // Fallback to original scanner if enhanced fails
      logger.warn(
        "Enhanced scanner returned no positions, falling back to original",
        { address },
      );
      const result = await scanDeFiPositions(address, {
        minValueUSD: 0, // Show ALL positions regardless of value
      });

      // Convert from new format to existing portfolio format
      return result.positions.map((pos: NewDeFiPosition) =>
        this.convertNewPosition(pos),
      );
    } catch (error) {
      logger.error("Failed to fetch DeFi positions:", error);

      // Final fallback to original scanner
      try {
        const fallbackResult = await scanDeFiPositions(address, {
          minValueUSD: 0,
        });
        return fallbackResult.positions.map((pos: NewDeFiPosition) =>
          this.convertNewPosition(pos),
        );
      } catch (fallbackError) {
        logger.error("Fallback scanner also failed:", fallbackError);
        throw error;
      }
    }
  }

  private static convertNewPosition(
    newPosition: NewDeFiPosition,
  ): DeFiPosition {
    // Use unified converter for consistent transformation
    const unified = DeFiPositionConverter.fromNewDeFiPosition(newPosition);
    const legacy = DeFiPositionConverter.toLegacyDeFiPosition(unified);

    // Set the address field from the new position
    legacy.address = newPosition.address;

    return legacy;
  }

  // Removed redundant conversion methods - now using DeFiPositionConverter

  static async calculateDeFiMetrics(positions: DeFiPosition[]): Promise<{
    totalValueLocked: number;
    totalSupplied: number;
    totalBorrowed: number;
    netAPY: number;
    protocols: string[];
  }> {
    let totalValueLocked = 0;
    let totalSupplied = 0;
    let totalBorrowed = 0;
    let weightedAPY = 0;
    const protocols = new Set<string>();

    for (const position of positions) {
      totalValueLocked += position.totalValueUSD || position.totalValue;
      protocols.add(position.protocol);

      // Calculate supplied value - handle undefined arrays
      const suppliedValue =
        position.position.supplied?.reduce(
          (sum: number, asset: any) => sum + asset.value,
          0,
        ) ?? 0;
      totalSupplied += suppliedValue;

      // Calculate borrowed value - handle undefined arrays
      const borrowedValue =
        position.position.borrowed?.reduce(
          (sum: number, asset: any) => sum + asset.value,
          0,
        ) ?? 0;
      totalBorrowed += borrowedValue;

      // Calculate weighted APY - handle undefined arrays
      if (position.position.supplied && position.position.supplied.length > 0) {
        for (const asset of position.position.supplied) {
          if (asset.apy && totalValueLocked > 0) {
            weightedAPY += (asset.value / totalValueLocked) * asset.apy;
          }
        }
      }
    }

    return {
      totalValueLocked,
      totalSupplied,
      totalBorrowed,
      netAPY: weightedAPY,
      protocols: Array.from(protocols),
    };
  }

  // Get aggregated stats directly from scanner
  static async getDeFiSummary(address: string): Promise<{
    totalPositions: number;
    totalValueUSD: number;
    protocolBreakdown: Record<string, number>;
    topProtocols: Array<{
      protocol: string;
      valueUSD: number;
      percentage: number;
    }>;
  }> {
    try {
      const result = await scanDeFiPositions(address, {
        minValueUSD: 0, // Show ALL positions regardless of value
      });

      // Convert to expected format
      const protocolBreakdown: Record<string, number> = {};
      for (const position of result.positions) {
        protocolBreakdown[position.protocol] =
          (protocolBreakdown[position.protocol] || 0) +
          (position.totalValueUSD || position.totalValue);
      }

      const topProtocols = Object.entries(protocolBreakdown)
        .map(([protocol, valueUSD]) => ({
          protocol,
          valueUSD,
          percentage:
            result.totalValueUSD > 0
              ? (valueUSD / result.totalValueUSD) * 100
              : 0,
        }))
        .sort((a, b) => b.valueUSD - a.valueUSD)
        .slice(0, 5);

      return {
        totalPositions: result.positions.length,
        totalValueUSD: result.totalValueUSD,
        protocolBreakdown,
        topProtocols,
      };
    } catch (error) {
      logger.error("Failed to fetch DeFi summary:", error);
      return {
        totalPositions: 0,
        totalValueUSD: 0,
        protocolBreakdown: {},
        topProtocols: [],
      };
    }
  }

  // Generate summary from existing positions (avoids additional API calls)
  static generateSummaryFromPositions(positions: DeFiPosition[]): {
    totalPositions: number;
    totalValueUSD: number;
    protocolBreakdown: Record<string, number>;
    topProtocols: Array<{
      protocol: string;
      valueUSD: number;
      percentage: number;
    }>;
  } {
    // Convert to unified format for consistent processing
    const unifiedPositions = positions.map((pos) =>
      DeFiPositionConverter.fromLegacyDeFiPosition(pos),
    );

    return DeFiPositionConverter.generateSummary(unifiedPositions);
  }
}
