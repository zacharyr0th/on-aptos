import { NextRequest } from "next/server";

import { AssetService } from "@/lib/services/portfolio/services/asset-service";
import {
  extractParams,
  errorResponse,
  successResponse,
  CACHE_DURATIONS,
  validateRequiredParams,
} from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";

// Cache for 5 minutes
export const revalidate = 300;

async function portfolioAssetsHandler(request: NextRequest) {
  const params = extractParams(request);

  // Validate required parameters
  const validation = validateRequiredParams(params, ["walletAddress"]);
  if (validation) {
    return errorResponse(validation, 400);
  }

  // Get wallet assets using our service
  const assets = await AssetService.getWalletAssets(params.walletAddress!);

  // Return response with standard headers
  return successResponse(
    {
      success: true,
      data: {
        assets: assets,
        totalCount: assets.length,
      },
    },
    CACHE_DURATIONS.SHORT,
    {
      "X-Service": "portfolio-assets",
      "X-API-Version": "2.0",
      "X-Data-Source": "Aptos Indexer",
    },
  );
}

export const GET = withRateLimit(portfolioAssetsHandler, {
  name: "portfolio-assets",
  ...RATE_LIMIT_TIERS.STANDARD,
});
