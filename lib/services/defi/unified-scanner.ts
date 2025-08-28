/**
 * Unified DeFi Scanner V2 - Using new protocol system
 * Fully compatible with existing portfolio components
 */

import {
  scanWalletPositions,
  getAllProtocolsForFilter,
} from "@/lib/protocols/adapters/portfolio-adapter";
import { ProtocolLoader } from "@/lib/protocols/loader";
import type { DeFiPosition } from "@/lib/types/defi";
import { logger } from "@/lib/utils/core/logger";

import { DefaultPriceService } from "../external/price-service";
import { UnifiedPanoraService } from "../portfolio/unified-panora-service";

import { FungibleAssetService } from "./fungible-asset-service";

// Re-export DeFiPosition for external use
export type { DeFiPosition } from "@/lib/types/defi";

// Legacy interface for backward compatibility
interface LegacyDeFiPosition {
  id: string;
  protocol: string;
  type: "lp" | "lending" | "staking" | "farming" | "token" | "derivatives";
  address: string;
  assets: Array<{
    type: string;
    tokenAddress: string;
    symbol: string;
    amount: string;
    valueUSD: number;
    metadata?: Record<string, any>;
  }>;
  totalValueUSD: number;
  lastUpdated: string;
  metadata?: Record<string, any>;
}

export interface ScanResult {
  positions: DeFiPosition[];
  totalValueUSD: number;
  protocols: string[];
  scanDuration: number;
  detailedStats?: {
    resourcesScanned: number;
    positionsFound: number;
    protocolsDetected: string[];
    errors: Array<{ protocol: string; error: string }>;
  };
}

/**
 * Unified resource fetcher with caching
 */
class ResourceFetcher {
  private cache = new Map<string, any[]>();

  async fetchAccountResources(walletAddress: string): Promise<any[]> {
    const cached = this.cache.get(walletAddress);
    if (cached) {
      logger.debug("Using cached resources", { walletAddress });
      return cached;
    }

    const response = await fetch(
      `https://api.mainnet.aptoslabs.com/v1/accounts/${walletAddress}/resources`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch resources: ${response.statusText}`);
    }

    const resources = await response.json();
    this.cache.set(walletAddress, resources);

    // Clear cache after 5 minutes
    setTimeout(() => this.cache.delete(walletAddress), 5 * 60 * 1000);

    return resources;
  }
}

/**
 * Main unified scanner using new protocol system
 */
export class UnifiedDeFiScanner {
  private fetcher = new ResourceFetcher();
  private priceService = new DefaultPriceService();

  /**
   * Scan wallet for all DeFi positions
   */
  async scan(
    walletAddress: string,
    options: {
      minValueUSD?: number;
      includeTokens?: boolean;
      protocols?: string[];
    } = {},
  ): Promise<ScanResult> {
    const startTime = Date.now();
    const errors: Array<{ protocol: string; error: string }> = [];

    logger.info("Starting unified DeFi scan v2", {
      walletAddress,
      options,
    });

    try {
      // Load protocols
      await ProtocolLoader.loadCore();

      // Fetch all resources once
      const resources = await this.fetcher.fetchAccountResources(walletAddress);
      logger.info("Fetched account resources", {
        totalResources: resources.length,
      });

      // Use new protocol system to scan positions
      let positions = await scanWalletPositions(walletAddress, resources);

      // Enrich positions with fungible asset balances
      positions = await this.enrichPositionsWithFungibleAssets(
        positions,
        walletAddress,
      );

      // Add direct fungible asset positions (like MKLP)
      const faPositions =
        await this.createFungibleAssetPositions(walletAddress);
      positions = [...positions, ...faPositions];

      // Add regular tokens if requested
      if (options.includeTokens !== false) {
        const tokenPositions = await this.scanTokens(resources, walletAddress);
        positions = [...positions, ...tokenPositions];
      }

      // Enrich all positions with real prices
      positions = await this.enrichPositionsWithPrices(positions);

      // Deduplicate positions
      positions = this.deduplicatePositions(positions);

      // Filter by protocols if specified
      if (options.protocols && options.protocols.length > 0) {
        positions = positions.filter((p) =>
          options.protocols!.some((protocol) =>
            p.protocol.toLowerCase().includes(protocol.toLowerCase()),
          ),
        );
      }

      // Filter by minimum value
      const filteredPositions = options.minValueUSD
        ? positions.filter(
            (pos) =>
              (pos.totalValueUSD ?? pos.totalValue ?? 0) >=
              options.minValueUSD!,
          )
        : positions;

      // Sort by value
      const sortedPositions = filteredPositions.sort(
        (a, b) =>
          (b.totalValueUSD ?? b.totalValue ?? 0) -
          (a.totalValueUSD ?? a.totalValue ?? 0),
      );

      // Calculate totals
      const totalValueUSD = sortedPositions.reduce(
        (sum, pos) => sum + (pos.totalValueUSD ?? pos.totalValue ?? 0),
        0,
      );

      const protocols = Array.from(
        new Set(sortedPositions.map((pos) => pos.protocol)),
      );

      const scanDuration = Date.now() - startTime;

      logger.info("Unified DeFi scan v2 completed", {
        walletAddress,
        totalPositions: sortedPositions.length,
        totalValueUSD,
        protocols: protocols.length,
        protocolList: protocols,
        scanDuration,
        resourcesScanned: resources.length,
      });

      return {
        positions: sortedPositions,
        totalValueUSD,
        protocols,
        scanDuration,
        detailedStats: {
          resourcesScanned: resources.length,
          positionsFound: sortedPositions.length,
          protocolsDetected: protocols,
          errors,
        },
      };
    } catch (error) {
      logger.error("Unified scan failed", { walletAddress, error });
      throw error;
    }
  }

  /**
   * Scan regular tokens (non-DeFi positions)
   */
  private async scanTokens(
    resources: any[],
    walletAddress: string,
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    const coinResources = resources.filter(
      (r) =>
        r.type.startsWith("0x1::coin::CoinStore<") &&
        !r.type.includes("AptosCoin"), // Handled separately
    );

    for (const resource of coinResources) {
      const balance = resource.data?.coin?.value || "0";
      if (balance === "0") continue;

      const tokenMatch = resource.type.match(/CoinStore<(.+)>/);
      if (!tokenMatch) continue;

      const tokenAddress = tokenMatch[1];
      const amount = parseFloat(balance) / Math.pow(10, 8);

      let valueUSD = 0;
      try {
        const price = await this.priceService.getTokenPrice(tokenAddress);
        valueUSD = amount * (price || 0);
      } catch (error) {
        logger.debug("Could not fetch token price", { tokenAddress });
      }

      // Only include tokens worth more than $0.01
      if (valueUSD > 0.01) {
        positions.push({
          positionId: `token-${tokenAddress}`,
          protocol: "Wallet",
          protocolType: "WALLET",
          address: walletAddress,
          totalValue: valueUSD,
          position: {
            supplied: [
              {
                asset: tokenAddress,
                amount: amount.toString(),
                value: valueUSD,
              },
            ],
          },
        });
      }
    }

    return positions;
  }

  /**
   * Extract token symbol from address
   */
  private extractTokenSymbol(tokenAddress: string): string {
    const match = tokenAddress.match(/::([^:]+)$/);
    return match ? match[1].toUpperCase() : "UNKNOWN";
  }

  /**
   * Enrich positions with fungible asset balances
   */
  private async enrichPositionsWithFungibleAssets(
    positions: DeFiPosition[],
    walletAddress: string,
  ): Promise<DeFiPosition[]> {
    const fungibleBalances =
      await FungibleAssetService.getBalances(walletAddress);

    return positions.map((position) => {
      // Check if position requires fungible asset query
      if (position.metadata?.requiresFungibleAssetQuery) {
        // Find matching fungible asset balance
        const faBalance = fungibleBalances.find((fb) => {
          const positionFA = position.metadata?.faAddress;
          return positionFA && fb.asset_type.includes(positionFA.split("<")[0]);
        });

        if (faBalance) {
          // Update position with real balance
          const decimals = faBalance.metadata?.decimals || 6;
          const amount = faBalance.amount / Math.pow(10, decimals);

          position.assets = [
            {
              type: "supplied",
              tokenAddress: faBalance.asset_type,
              symbol: faBalance.metadata?.symbol || "MKLP",
              amount: amount.toString(),
              valueUSD: 0, // Will be updated with price
              metadata: {
                decimals,
                name: faBalance.metadata?.name,
              },
            },
          ];
        }
      }

      return position;
    });
  }

  /**
   * Enrich positions with real prices from Panora
   */
  private async enrichPositionsWithPrices(
    positions: DeFiPosition[],
  ): Promise<DeFiPosition[]> {
    if (positions.length === 0) return positions;

    try {
      // Get all unique token addresses
      const tokenAddresses = new Set<string>();
      positions.forEach((pos) => {
        pos.assets?.forEach((asset) => {
          if (asset.tokenAddress) {
            tokenAddresses.add(asset.tokenAddress);
          }
        });
      });

      if (tokenAddresses.size === 0) {
        logger.info("No token addresses found for price enrichment");
        return positions;
      }

      logger.info(`Fetching prices for ${tokenAddresses.size} tokens`, {
        addresses: Array.from(tokenAddresses),
      });

      // Fetch prices from Panora
      const prices = await UnifiedPanoraService.getTokenPrices(
        Array.from(tokenAddresses),
      );

      logger.info(`Retrieved ${prices.size} prices`);

      // Update position values
      const enrichedPositions = positions.map((position) => {
        let totalValue = 0;

        const enrichedAssets =
          position.assets?.map((asset) => {
            const price = prices.get(asset.tokenAddress) || 0;
            const amount = parseFloat(asset.amount) || 0;
            const valueUSD = amount * price;
            totalValue += valueUSD;

            logger.debug("Asset price calculation", {
              symbol: asset.symbol,
              amount,
              price,
              valueUSD,
            });

            return {
              ...asset,
              valueUSD,
            };
          }) || [];

        return {
          ...position,
          assets: enrichedAssets,
          totalValueUSD: totalValue,
        };
      });

      logger.info("Price enrichment completed", {
        totalPositions: enrichedPositions.length,
        totalValue: enrichedPositions.reduce(
          (sum, p) => sum + p.totalValueUSD,
          0,
        ),
      });

      return enrichedPositions;
    } catch (error) {
      logger.error("Failed to enrich positions with prices", { error });
      return positions;
    }
  }

  /**
   * Deduplicate positions based on protocol and asset type
   */
  private deduplicatePositions(positions: DeFiPosition[]): DeFiPosition[] {
    const seen = new Map<string, DeFiPosition>();

    for (const position of positions) {
      // Create unique key based on protocol, type, and main asset
      const mainAsset = position.assets?.[0];
      if (!mainAsset) continue;

      const key = `${position.protocol}-${position.type}-${mainAsset.tokenAddress}`;

      const existing = seen.get(key);
      if (
        !existing ||
        (position.totalValueUSD ?? position.totalValue ?? 0) >
          (existing.totalValueUSD ?? existing.totalValue ?? 0)
      ) {
        seen.set(key, position);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Create positions directly from fungible assets (for tokens like MKLP)
   */
  private async createFungibleAssetPositions(
    walletAddress: string,
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      // Get MKLP balances specifically
      const mklpBalances =
        await FungibleAssetService.getMKLPBalances(walletAddress);

      for (const balance of mklpBalances) {
        if (balance.amount === 0) continue;

        const decimals = balance.metadata?.decimals || 6;
        const amount = balance.amount / Math.pow(10, decimals);

        positions.push({
          positionId: `mklp-${balance.asset_type}`,
          protocol: "Merkle",
          protocolType: "DEX",
          totalValue: 0,
          address: walletAddress,
          type: "lp",
          assets: [
            {
              type: "supplied",
              tokenAddress: balance.asset_type,
              symbol: balance.metadata?.symbol || "MKLP",
              amount: amount.toString(),
              valueUSD: 0, // Will be updated with price
            },
          ],
          totalValueUSD: 0,
          position: {},
          metadata: {
            protocolId: "merkle",
            protocolType: "DERIVATIVES",
            confidence: 100,
            lpType: "house_lp",
            protocolName: "Merkle Trade",
            positionType: "Liquidity Provider",
            assetType: balance.asset_type,
            decimals,
          },
        });
      }

      logger.info(`Created ${positions.length} fungible asset positions`);
      return positions;
    } catch (error) {
      logger.warn("Failed to create fungible asset positions", { error });
      return [];
    }
  }

  /**
   * Scan specific protocols only
   */
  async scanProtocols(
    walletAddress: string,
    protocolNames: string[],
  ): Promise<ScanResult> {
    return this.scan(walletAddress, { protocols: protocolNames });
  }

  /**
   * Quick scan for overview (no price lookups)
   */
  async quickScan(walletAddress: string): Promise<{
    protocols: string[];
    positionCount: number;
  }> {
    await ProtocolLoader.loadCore();
    const resources = await this.fetcher.fetchAccountResources(walletAddress);
    const positions = await scanWalletPositions(walletAddress, resources);

    const protocols = Array.from(new Set(positions.map((p) => p.protocol)));

    return {
      protocols,
      positionCount: positions.length,
    };
  }

  /**
   * Get available protocols for filtering
   */
  async getAvailableProtocols() {
    return getAllProtocolsForFilter();
  }
}

/**
 * Export singleton instance for backward compatibility
 */
export const unifiedScanner = new UnifiedDeFiScanner();

/**
 * Backward compatible function
 */
export async function scanDeFiPositions(
  walletAddress: string,
  options: { minValueUSD?: number } = {},
): Promise<ScanResult> {
  return unifiedScanner.scan(walletAddress, options);
}
