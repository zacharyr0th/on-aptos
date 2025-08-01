import { NextRequest, NextResponse } from "next/server";

import { NFTService } from "@/lib/services/portfolio/services/nft-service";
import { logger } from "@/lib/utils/logger";

// Cache for 2 minutes (NFTs change more frequently)
export const revalidate = 120;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const getAllNFTs = searchParams.get("all") === "true";

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 },
      );
    }

    logger.info("[Portfolio NFTs API] Fetching NFTs for:", walletAddress, {
      page,
      limit,
      getAllNFTs,
    });

    if (getAllNFTs) {
      // Get all NFTs without pagination
      const nfts = await NFTService.getAllWalletNFTs(walletAddress);
      const totalCount = await NFTService.getTotalNFTCount(walletAddress);

      logger.info(`[Portfolio NFTs API] Found ${nfts.length} total NFTs`);

      // Set cache headers
      const headers = new Headers();
      headers.set(
        "Cache-Control",
        "public, s-maxage=120, stale-while-revalidate=240",
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            nfts,
            totalCount,
            hasMore: false,
          },
        },
        { headers },
      );
    } else {
      // Get paginated NFTs
      const result = await NFTService.getWalletNFTs(walletAddress, page, limit);

      logger.info(
        `[Portfolio NFTs API] Found ${result.data.length} NFTs (page ${page})`,
      );

      // Set cache headers
      const headers = new Headers();
      headers.set(
        "Cache-Control",
        "public, s-maxage=120, stale-while-revalidate=240",
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            nfts: result.data,
            hasMore: result.hasMore,
            nextCursor: result.nextCursor,
            page,
            limit,
          },
        },
        { headers },
      );
    }
  } catch (error) {
    logger.error("Portfolio NFTs API error:", error);
    logger.error("[Portfolio NFTs API] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch portfolio NFTs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
