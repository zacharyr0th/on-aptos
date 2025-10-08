import { type NextRequest, NextResponse } from "next/server";
import { StablecoinService } from "@/lib/services/asset-types";
import { RATE_LIMIT_TIERS, withRateLimit } from "@/lib/utils/api/rate-limiter";
import { logger } from "@/lib/utils/core/logger";

// Cache stablecoin data for 10 minutes
export const revalidate = 600;

// Deprecation date: March 1, 2025
const SUNSET_DATE = "2025-03-01T00:00:00Z";

async function handler(request: NextRequest) {
  try {
    // Log usage of deprecated endpoint
    logger.warn("Deprecated endpoint accessed", {
      endpoint: "/api/markets/stables",
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
      redirectTo: "/api/unified/assets?type=stables",
    });

    // Fetch stablecoin data directly from service
    const data = await StablecoinService.getStablecoinSupplies();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "X-Deprecated": "true",
        "X-Redirect-To": "/api/unified/assets?type=stables",
        Sunset: SUNSET_DATE,
        Warning:
          '299 - "This API endpoint is deprecated and will be removed on March 1, 2025. Please use /api/unified/assets?type=stables instead."',
        Link: '</api/unified/assets?type=stables>; rel="successor-version"',
        "X-Content-Type": "application/json",
        "X-Service": "stables-data",
        "X-API-Version": "2.0",
        "X-Data-Source": "Aptos Indexer",
        Vary: "Accept-Encoding",
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (error) {
    logger.error("Stablecoin Supply API error", {
      error: error instanceof Error ? error.message : String(error),
      endpoint: "/api/markets/stables",
    });
    return NextResponse.json({ error: "Failed to fetch stablecoin data" }, { status: 500 });
  }
}

export const GET = withRateLimit(handler, {
  name: "stables-supply",
  ...RATE_LIMIT_TIERS.PUBLIC,
});
