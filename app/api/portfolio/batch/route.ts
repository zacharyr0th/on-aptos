import { NextRequest, NextResponse } from "next/server";

import { AssetService } from "@/lib/services/portfolio/services/asset-service";
import { DeFiService } from "@/lib/services/portfolio/services/defi-service";
import { NFTService } from "@/lib/services/portfolio/services/nft-service";
import { logger } from "@/lib/utils/logger";

// Revalidate cache every 5 minutes
export const revalidate = 300;

interface BatchResponse {
  assets: any[] | null;
  defiPositions: any[] | null;
  nfts: any[] | null;
  nftTotalCount: number | null;
  nftCollectionStats: {
    collections: Array<{ name: string; count: number }>;
    totalCollections: number;
  } | null;
  metrics: any | null;
  summary: any | null;
  hasMoreNFTs: boolean;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("walletAddress");
  const nftLimit = parseInt(searchParams.get("nftLimit") || "50");
  const includeAllNFTs = searchParams.get("includeAllNFTs") === "true";

  try {
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 },
      );
    }

    logger.info("[Portfolio Batch API] Fetching all data for:", walletAddress);

    // Parallel fetch all portfolio data
    const [
      assetsResult,
      defiResult,
      nftCountResult,
      nftResult,
      nftStatsResult,
    ] = await Promise.allSettled([
      AssetService.getWalletAssets(walletAddress),
      Promise.all([
        DeFiService.getWalletDeFiPositions(walletAddress),
        DeFiService.calculateDeFiMetrics([]), // Will be updated with positions
        DeFiService.getDeFiSummary(walletAddress),
      ]),
      NFTService.getTotalNFTCount(walletAddress),
      includeAllNFTs
        ? NFTService.getAllWalletNFTs(walletAddress)
        : NFTService.getWalletNFTs(walletAddress, 1, nftLimit),
      NFTService.getCollectionStats(walletAddress),
    ]);

    // Process results with error handling
    const response: BatchResponse = {
      assets: null,
      defiPositions: null,
      nfts: null,
      nftTotalCount: null,
      nftCollectionStats: null,
      metrics: null,
      summary: null,
      hasMoreNFTs: false,
    };

    // Handle assets
    if (assetsResult.status === "fulfilled") {
      response.assets = assetsResult.value;
    } else {
      logger.error("Failed to fetch assets:", assetsResult.reason);
    }

    // Handle DeFi data
    if (defiResult.status === "fulfilled") {
      const [positions, , summary] = defiResult.value;
      response.defiPositions = positions;
      response.summary = summary;

      // Calculate metrics with actual positions
      if (positions.length > 0) {
        response.metrics = await DeFiService.calculateDeFiMetrics(positions);
      }
    } else {
      logger.error("Failed to fetch DeFi data:", defiResult.reason);
    }

    // Handle NFT count
    if (nftCountResult.status === "fulfilled") {
      response.nftTotalCount = nftCountResult.value;
      logger.info(
        `[Portfolio Batch API] NFT count fetched: ${nftCountResult.value}`,
      );
    } else {
      logger.error("Failed to fetch NFT count:", nftCountResult.reason);
    }

    // Handle NFTs
    if (nftResult.status === "fulfilled") {
      if (includeAllNFTs) {
        response.nfts = nftResult.value as any[];
        response.hasMoreNFTs = false;
      } else {
        const paginatedResult = nftResult.value as any;
        response.nfts = paginatedResult.data;
        response.hasMoreNFTs = paginatedResult.hasMore;
      }
    } else {
      logger.error("Failed to fetch NFTs:", nftResult.reason);
    }

    // Handle NFT collection stats
    if (nftStatsResult.status === "fulfilled") {
      response.nftCollectionStats = nftStatsResult.value;
      logger.info(
        `[Portfolio Batch API] NFT collection stats fetched: ${nftStatsResult.value.totalCollections} collections`,
      );
    } else {
      logger.error(
        "Failed to fetch NFT collection stats:",
        nftStatsResult.reason,
      );
    }

    logger.info(`[Portfolio Batch API] Response summary:`, {
      assets: response.assets?.length || 0,
      defiPositions: response.defiPositions?.length || 0,
      nfts: response.nfts?.length || 0,
      nftTotalCount: response.nftTotalCount,
    });

    // Set cache headers
    const headers = new Headers();
    headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600",
    );

    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      { headers },
    );
  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : "Unknown error",
      walletAddress,
      timestamp: new Date().toISOString(),
    };

    logger.error("Portfolio batch API error:", errorDetails);

    return NextResponse.json(
      {
        error: "Failed to fetch portfolio data",
        details: errorDetails.message,
      },
      { status: 500 },
    );
  }
}
