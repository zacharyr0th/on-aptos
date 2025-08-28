import { NextRequest, NextResponse } from "next/server";

import { DeFiService } from "@/lib/services/defi/services/defi-service";
import { AssetService } from "@/lib/services/portfolio/services/asset-service";
import { NFTService } from "@/lib/services/portfolio/services/nft-service";
import { TransactionService } from "@/lib/services/portfolio/services/transaction-service";
import { TokenEnrichmentService } from "@/lib/services/portfolio/token-enrichment-service";
import type { BatchResponse } from "@/lib/types/consolidated";
import {
  extractParams,
  errorResponse,
  successResponse,
  CACHE_DURATIONS,
  validateRequiredParams,
  parseNumericParam,
} from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";
import { apiLogger } from "@/lib/utils/core/logger";

// Revalidate cache every 5 minutes
export const revalidate = 300;

async function portfolioBatchHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = extractParams(request);

  const walletAddress = params.walletAddress;
  const nftLimit = parseNumericParam(searchParams.get("nftLimit"), 50, 1, 1000);
  const includeAllNFTs = searchParams.get("includeAllNFTs") === "true";

  // Validate required parameters
  const validation = validateRequiredParams(params, ["walletAddress"]);
  if (validation) {
    return errorResponse(validation, 400);
  }

  apiLogger.info(
    `🚀 [Portfolio Batch API] Fetching ALL portfolio data INCLUDING TRANSACTIONS for: ${walletAddress}`,
  );

  // Parallel fetch all portfolio data
  const [
    assetsResult,
    defiPositionsResult,
    nftCountResult,
    nftResult,
    nftStatsResult,
    transactionsResult,
  ] = await Promise.allSettled([
    AssetService.getWalletAssets(walletAddress!),
    // Fetch DeFi positions only once - summary will be calculated from positions
    DeFiService.getWalletDeFiPositions(walletAddress!),
    NFTService.getTotalNFTCount(walletAddress!),
    includeAllNFTs
      ? NFTService.getAllWalletNFTs(walletAddress!)
      : NFTService.getWalletNFTs(walletAddress!, 1, nftLimit),
    NFTService.getCollectionStats(walletAddress!),
    // Fetch first 100 transactions immediately using shared service
    TransactionService.fetchTransactionsWithDetails(walletAddress!, 100, 0),
  ]);

  // Process results with error handling
  const response: BatchResponse = {
    assets: null,
    defiPositions: null,
    nfts: null,
    nftTotalCount: null,
    nftCollectionStats: null,
    metrics: null,
    transactions: null,
  };

  // Handle assets and enrich with Panora data
  if (assetsResult.status === "fulfilled") {
    // Enrich assets with Panora token data for consistent pricing and logos
    response.assets = await TokenEnrichmentService.enrichAssetsWithPanoraData(
      assetsResult.value,
    );
    apiLogger.info(
      `Enriched ${response.assets?.length || 0} assets with Panora data`,
    );
  } else {
    apiLogger.error(
      `Failed to fetch assets: ${assetsResult.reason instanceof Error ? assetsResult.reason.message : String(assetsResult.reason)}`,
    );
  }

  // Handle DeFi data
  if (defiPositionsResult.status === "fulfilled") {
    const positions = defiPositionsResult.value;
    response.defiPositions = positions;

    // Calculate basic metrics from positions
    if (positions.length > 0) {
      const defiMetrics = await DeFiService.calculateDeFiMetrics(positions);
      response.metrics = {
        totalValue: defiMetrics.totalValueLocked,
        totalAssets: 0,
        totalNFTs: 0,
        totalDeFi: positions.length,
      };
    }
  } else {
    apiLogger.error(
      `Failed to fetch DeFi data: ${defiPositionsResult.reason instanceof Error ? defiPositionsResult.reason.message : String(defiPositionsResult.reason)}`,
    );
  }

  // Handle NFT count
  if (nftCountResult.status === "fulfilled") {
    response.nftTotalCount = nftCountResult.value;
    apiLogger.info(
      `[Portfolio Batch API] NFT count fetched: ${nftCountResult.value}`,
    );
  } else {
    apiLogger.error(
      `Failed to fetch NFT count: ${nftCountResult.reason instanceof Error ? nftCountResult.reason.message : String(nftCountResult.reason)}`,
    );
  }

  // Handle NFTs
  if (nftResult.status === "fulfilled") {
    if (includeAllNFTs) {
      response.nfts = nftResult.value as any[];
    } else {
      const paginatedResult = nftResult.value as any;
      response.nfts = paginatedResult.data;
    }
  } else {
    apiLogger.error(
      `Failed to fetch NFTs: ${nftResult.reason instanceof Error ? nftResult.reason.message : String(nftResult.reason)}`,
    );
  }

  // Handle NFT collection stats
  if (nftStatsResult.status === "fulfilled") {
    response.nftCollectionStats = nftStatsResult.value;
    apiLogger.info(
      `[Portfolio Batch API] NFT collection stats fetched: ${nftStatsResult.value?.totalCollections || 0} collections`,
    );
  } else {
    apiLogger.error(
      `Failed to fetch NFT collection stats: ${nftStatsResult.reason instanceof Error ? nftStatsResult.reason.message : String(nftStatsResult.reason)}`,
    );
  }

  // Handle transactions
  if (transactionsResult.status === "fulfilled") {
    const transactionData = transactionsResult.value;
    response.transactions = (transactionData.data || []) as any[];
    apiLogger.info(
      `[Portfolio Batch API] Transactions fetched: ${response.transactions?.length || 0}`,
    );
  } else {
    apiLogger.error(
      `Failed to fetch transactions: ${transactionsResult.reason instanceof Error ? transactionsResult.reason.message : String(transactionsResult.reason)}`,
    );
  }

  apiLogger.info(
    {
      assets: response.assets?.length || 0,
      defiPositions: response.defiPositions?.length || 0,
      nfts: response.nfts?.length || 0,
      nftTotalCount: response.nftTotalCount,
      transactions: response.transactions?.length || 0,
    },
    `[Portfolio Batch API] Response summary`,
  );

  // Return with shorter cache for fresher transaction data
  return successResponse(
    {
      success: true,
      data: response,
    },
    CACHE_DURATIONS.VERY_SHORT, // 1 minute cache for fresh transaction data
  );
}

export const GET = withRateLimit(portfolioBatchHandler, {
  name: "portfolio-batch",
  ...RATE_LIMIT_TIERS.STRICT, // More restrictive due to expensive operations
});
