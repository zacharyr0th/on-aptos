import type { DeFiPosition as NewDeFiPosition } from "@/lib/services/defi";
import { createDeFiProvider } from "@/lib/services/defi/createDeFiProvider";
import { logger } from "@/lib/utils/logger";

import { DeFiPositionConverter } from "../shared";
import type { DeFiPosition } from "../types";

// Create singleton provider instance
let defiProvider: any = null;

async function getProvider() {
  if (!defiProvider) {
    defiProvider = await createDeFiProvider({
      apiKey: process.env.APTOS_BUILD_SECRET,
      // Enable all adapters by default
      enabledAdapters: [
        "thala-adapter",
        "liquidswap-adapter",
        "pancakeswap-adapter",
        "aries-adapter",
        "cellana-adapter",
        "sushiswap-adapter",
        "merkle-trade-adapter",
        "echelon-adapter",
        "echo-lending-adapter",
        "meso-finance-adapter",
        "joule-finance-adapter",
        "superposition-adapter",
        "vibrantx-adapter",
        "kana-labs-adapter",
        "hyperion-adapter",
        "panora-exchange-adapter",
        "uptos-pump-adapter",
        "thetis-market-adapter",
        "generic-token-adapter",
      ],
    });
  }
  return defiProvider;
}

export class DeFiService {
  static async getWalletDeFiPositions(
    address: string,
  ): Promise<DeFiPosition[]> {
    try {
      // Get provider instance
      const provider = await getProvider();

      // Scan positions using new provider
      const result = await provider.scanPositions(address, {
        parallel: true,
        minValueUSD: 0, // Show ALL positions regardless of value
        includeDust: true,
      });

      // Convert from new format to existing portfolio format
      return result.positions.map((pos: NewDeFiPosition) =>
        this.convertNewPosition(pos),
      );
    } catch (error) {
      logger.error("Failed to fetch DeFi positions:", error);
      throw error;
    }
  }

  private static convertNewPosition(
    newPosition: NewDeFiPosition,
  ): DeFiPosition {
    // Use unified converter for consistent transformation
    const unified = DeFiPositionConverter.fromNewDeFiPosition(newPosition);
    return DeFiPositionConverter.toLegacyDeFiPosition(unified);
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
      totalValueLocked += position.totalValueUSD;
      protocols.add(position.protocol);

      // Calculate supplied value
      const suppliedValue = position.suppliedAssets.reduce(
        (sum, asset) => sum + asset.value,
        0,
      );
      totalSupplied += suppliedValue;

      // Calculate borrowed value
      const borrowedValue = position.borrowedAssets.reduce(
        (sum, asset) => sum + asset.value,
        0,
      );
      totalBorrowed += borrowedValue;

      // Calculate weighted APY
      for (const asset of position.suppliedAssets) {
        if (asset.apy) {
          weightedAPY += (asset.value / totalValueLocked) * asset.apy;
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

  // Get aggregated stats directly from provider
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
      const provider = await getProvider();

      const result = await provider.scanPositions(address, {
        parallel: true,
        minValueUSD: 0, // Show ALL positions regardless of value
      });

      return result.summary;
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
    const unifiedPositions = positions.map(pos => 
      DeFiPositionConverter.fromLegacyDeFiPosition(pos)
    );
    
    return DeFiPositionConverter.generateSummary(unifiedPositions);
  }
}
