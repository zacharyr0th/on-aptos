import { NextRequest, NextResponse } from "next/server";

import { NFTService } from "@/lib/services/portfolio/services/nft-service";
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

// Cache for 2 minutes (NFTs change more frequently)
export const revalidate = 120;

async function portfolioNFTsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = extractParams(request);

  const walletAddress = params.walletAddress;
  const page = parseNumericParam(searchParams.get("page"), 1, 1, 1000);
  const limit = parseNumericParam(searchParams.get("limit"), 100, 1, 1000);
  const getAllNFTs = searchParams.get("all") === "true";

  // Validate required parameters
  const validation = validateRequiredParams(params, ["walletAddress"]);
  if (validation) {
    return errorResponse(validation, 400);
  }

  apiLogger.info(
    {
      page,
      limit,
      getAllNFTs,
    },
    `[Portfolio NFTs API] Fetching NFTs for: ${walletAddress}`,
  );

  if (getAllNFTs) {
    // Get all NFTs without pagination
    const nfts = await NFTService.getAllWalletNFTs(walletAddress!);
    const totalCount = await NFTService.getTotalNFTCount(walletAddress!);

    return successResponse(
      {
        success: true,
        data: {
          nfts,
          totalCount,
          hasMore: false,
        },
      },
      CACHE_DURATIONS.SHORT,
    );
  } else {
    // Get paginated NFTs
    const result = await NFTService.getWalletNFTs(walletAddress!, page, limit);

    apiLogger.info(
      `[Portfolio NFTs API] Found ${result.data.length} NFTs (page ${page})`,
    );

    return successResponse(
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
      CACHE_DURATIONS.SHORT,
    );
  }
}

export const GET = withRateLimit(portfolioNFTsHandler, {
  name: "portfolio-nfts",
  ...RATE_LIMIT_TIERS.STANDARD,
});
