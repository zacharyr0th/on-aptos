// Main portfolio service that orchestrates all sub-services
import { logger } from "@/lib/utils/core/logger";

import {
  AssetService,
  NFTService,
  TransactionService,
  DeFiService,
  MetricsService,
  PortfolioHistoryService,
} from "./services";
import type {
  FungibleAsset,
  NFT,
  WalletTransaction,
  DeFiPosition,
  PortfolioMetrics,
  PortfolioHistoryPoint,
  PortfolioSummary,
  PaginatedResponse,
} from "./types";

// Re-export types for backward compatibility
export type {
  FungibleAsset,
  NFT,
  WalletTransaction,
  DeFiPosition,
  PortfolioMetrics,
  PortfolioHistoryPoint,
  PortfolioSummary,
} from "./types";

// Re-export main functions as direct exports for backward compatibility
export async function getWalletAssets(
  address: string,
): Promise<FungibleAsset[]> {
  return AssetService.getWalletAssets(address);
}

export async function getWalletNFTs(
  address: string,
  page: number = 1,
  limit: number = 100,
): Promise<PaginatedResponse<NFT>> {
  return NFTService.getWalletNFTs(address, page, limit);
}

export async function getAllWalletNFTs(address: string): Promise<NFT[]> {
  return NFTService.getAllWalletNFTs(address);
}

export async function getWalletTransactions(
  address: string,
  limit: number = 50,
): Promise<WalletTransaction[]> {
  return TransactionService.getWalletTransactions(address, limit);
}

export async function getWalletDeFiPositions(
  address: string,
): Promise<DeFiPosition[]> {
  return DeFiService.getWalletDeFiPositions(address);
}

export async function getPortfolioHistory(
  address: string,
  days: number = 30,
): Promise<PortfolioHistoryPoint[]> {
  return PortfolioHistoryService.getPortfolioHistory(address, days);
}

export async function calculatePortfolioMetrics(
  assets: FungibleAsset[],
  defiPositions: DeFiPosition[] = [],
): Promise<PortfolioMetrics> {
  return MetricsService.calculatePortfolioMetrics(assets, defiPositions);
}

export async function getAssetPrices(assetTypes: string[]) {
  return AssetService.getAssetPrices(assetTypes);
}

export async function getNFTTransferHistory(
  tokenDataId: string,
  limit: number = 50,
) {
  return NFTService.getNFTTransferHistory(tokenDataId, limit);
}

// New unified portfolio summary function
export async function getPortfolioSummary(
  address: string,
): Promise<PortfolioSummary> {
  try {
    // Fetch all data in parallel
    const [fungibleAssets, nfts, defiPositions] = await Promise.all([
      AssetService.getWalletAssets(address),
      NFTService.getAllWalletNFTs(address),
      DeFiService.getWalletDeFiPositions(address),
    ]);

    // Calculate metrics
    const metrics = await MetricsService.calculatePortfolioMetrics(
      fungibleAssets,
      defiPositions,
    );

    return {
      totalValue: metrics.totalValue,
      fungibleAssets,
      nfts,
      defiPositions,
      metrics,
    };
  } catch (error) {
    logger.error("Failed to get portfolio summary:", error);
    throw error;
  }
}
