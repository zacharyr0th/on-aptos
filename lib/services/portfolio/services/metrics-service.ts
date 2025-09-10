import { logger } from "@/lib/utils/core/logger";

import type { AssetPrice, DeFiPosition, FungibleAsset, PortfolioMetrics } from "../types";

import { AssetService } from "./asset-service";

export class MetricsService {
  static async calculatePortfolioMetrics(
    assets: FungibleAsset[],
    defiPositions: DeFiPosition[] = []
  ): Promise<PortfolioMetrics> {
    try {
      // Calculate total portfolio value
      const assetValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
      const defiValue = defiPositions.reduce((sum, position) => sum + position.totalValueUSD, 0);
      const totalValue = assetValue + defiValue;

      // Get unique asset types for price changes
      const uniqueAssetTypes = [...new Set(assets.map((a) => a.asset_type))];
      const priceData = await AssetService.getAssetPrices(uniqueAssetTypes);

      // Calculate 24h changes
      let totalChange24h = 0;
      const assetPriceMap = new Map<string, AssetPrice>();

      priceData.forEach((price) => {
        assetPriceMap.set(price.assetType, price);
      });

      assets.forEach((asset) => {
        const priceInfo = assetPriceMap.get(asset.asset_type);
        if (priceInfo && asset.value) {
          const change = (asset.value * priceInfo.change24h) / 100;
          totalChange24h += change;
        }
      });

      const totalChangePercent24h = totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

      // Calculate asset allocation
      const assetAllocation = MetricsService.calculateAssetAllocation(
        assets,
        defiPositions,
        totalValue
      );

      // Find top gainers and losers
      const { topGainers, topLosers } = MetricsService.findTopMovers(assets, assetPriceMap);

      return {
        totalValue,
        totalChange24h,
        totalChangePercent24h,
        assetAllocation,
        topGainers,
        topLosers,
      };
    } catch (error) {
      logger.error("Failed to calculate portfolio metrics:", error);
      return {
        totalValue: 0,
        totalChange24h: 0,
        totalChangePercent24h: 0,
        assetAllocation: [],
        topGainers: [],
        topLosers: [],
      };
    }
  }

  private static calculateAssetAllocation(
    assets: FungibleAsset[],
    defiPositions: DeFiPosition[],
    totalValue: number
  ): Array<{
    assetType: string;
    symbol: string;
    value: number;
    percentage: number;
  }> {
    const allocation: Array<{
      assetType: string;
      symbol: string;
      value: number;
      percentage: number;
    }> = [];

    // Add fungible assets
    assets.forEach((asset) => {
      if (asset.value && asset.value > 0) {
        allocation.push({
          assetType: asset.asset_type,
          symbol: asset.metadata?.symbol || "Unknown",
          value: asset.value,
          percentage: totalValue > 0 ? (asset.value / totalValue) * 100 : 0,
        });
      }
    });

    // Add DeFi positions as aggregated
    if (defiPositions.length > 0) {
      const defiTotal = defiPositions.reduce((sum, pos) => sum + pos.totalValueUSD, 0);
      if (defiTotal > 0) {
        allocation.push({
          assetType: "DeFi Positions",
          symbol: "DEFI",
          value: defiTotal,
          percentage: totalValue > 0 ? (defiTotal / totalValue) * 100 : 0,
        });
      }
    }

    // Sort by value descending
    return allocation.sort((a, b) => b.value - a.value);
  }

  private static findTopMovers(
    assets: FungibleAsset[],
    priceMap: Map<string, AssetPrice>
  ): { topGainers: AssetPrice[]; topLosers: AssetPrice[] } {
    const movers: AssetPrice[] = [];

    assets.forEach((asset) => {
      const priceInfo = priceMap.get(asset.asset_type);
      if (priceInfo && asset.value && asset.value > 1) {
        // Only include assets worth > $1
        movers.push({
          ...priceInfo,
          symbol: asset.metadata?.symbol || priceInfo.symbol,
        });
      }
    });

    // Sort by 24h change
    const sorted = movers.sort((a, b) => b.change24h - a.change24h);

    return {
      topGainers: sorted.filter((m) => m.change24h > 0).slice(0, 5),
      topLosers: sorted
        .filter((m) => m.change24h < 0)
        .slice(-5)
        .reverse(),
    };
  }
}
