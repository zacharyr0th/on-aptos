import { NextRequest, NextResponse } from "next/server";

import { RWAService } from "@/lib/services/asset-types/rwa-service";
import {
  successResponse,
  errorResponse,
  CACHE_DURATIONS,
} from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";
import { logger } from "@/lib/utils/core/logger";

const DAY_IN_SECONDS = 86400;

async function handler(request: NextRequest) {
  try {
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";
    const data = await RWAService.getRWAData(forceRefresh);

    const headers = {
      "X-Content-Type": "application/json",
      "X-Service": "rwa-data",
      "X-API-Version": "3.0",
      "X-Data-Source": "RWA.xyz",
      Vary: "Accept-Encoding",
    };

    if (!data.success) {
      return errorResponse("Failed to fetch RWA data", 503, data);
    }

    // RWA data changes infrequently, cache for 1 day
    return successResponse(data, DAY_IN_SECONDS, headers);
  } catch (error) {
    logger.error("RWA Data API error", {
      error: error instanceof Error ? error.message : String(error),
      endpoint: "/api/data/aptos/rwa",
    });
    return errorResponse(
      "Failed to fetch RWA data",
      500,
      error instanceof Error ? error.message : undefined,
    );
  }
}

export const GET = withRateLimit(handler, {
  name: "rwa-data",
  ...RATE_LIMIT_TIERS.PUBLIC,
});

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
