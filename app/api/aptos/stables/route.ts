import { NextRequest } from "next/server";

import { StablecoinService } from "@/lib/services/asset-types/stablecoin-service";
import {
  successResponse,
  errorResponse,
  CACHE_DURATIONS,
} from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";
import { logger } from "@/lib/utils/core/logger";

async function handler(request: NextRequest) {
  try {
    const data = await StablecoinService.getStablecoinSupplies();

    const headers = {
      "X-Content-Type": "application/json",
      "X-Service": "stables-data",
      "X-API-Version": "2.0",
      "X-Data-Source": "Aptos Indexer",
      Vary: "Accept-Encoding",
    };

    return successResponse(data, CACHE_DURATIONS.MEDIUM, headers);
  } catch (error) {
    logger.error("Stablecoin Supply API error", {
      error: error instanceof Error ? error.message : String(error),
      endpoint: "/api/aptos/stables",
    });
    return errorResponse(
      "Failed to fetch stablecoin data",
      500,
      error instanceof Error ? error.message : undefined,
    );
  }
}

export const GET = withRateLimit(handler, {
  name: "stables-supply",
  ...RATE_LIMIT_TIERS.PUBLIC,
});
