import type { NextRequest } from "next/server";

import { LiquidStakingService } from "@/lib/services/asset-types/liquid-staking-service";
import { CACHE_DURATIONS, errorResponse, successResponse } from "@/lib/utils/api/common";
import { RATE_LIMIT_TIERS, withRateLimit } from "@/lib/utils/api/rate-limiter";
import { logger } from "@/lib/utils/core/logger";

async function handler(request: NextRequest) {
  try {
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";
    const data = await LiquidStakingService.getLSTSupplyDetailed(forceRefresh);

    const headers = {
      "X-Content-Type": "application/json",
      "X-Service": "lst-supplies",
      "X-API-Version": "2.0",
      "X-Data-Source": "Aptos Indexer",
      Vary: "Accept-Encoding",
    };

    if (!data.success) {
      return errorResponse("Failed to fetch LST data", 503, data);
    }

    return successResponse(data, CACHE_DURATIONS.MEDIUM, headers);
  } catch (error) {
    logger.error("LST Supply API error", {
      error: error instanceof Error ? error.message : String(error),
      endpoint: "/api/data/aptos/lst",
    });
    return errorResponse(
      "Failed to fetch LST supply data",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

export const GET = withRateLimit(handler, {
  name: "lst-supply",
  ...RATE_LIMIT_TIERS.PUBLIC,
});
