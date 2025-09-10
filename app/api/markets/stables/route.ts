import { type NextRequest, NextResponse } from "next/server";
import { RATE_LIMIT_TIERS, withRateLimit } from "@/lib/utils/api/rate-limiter";
import { logger } from "@/lib/utils/core/logger";

// This endpoint is deprecated - redirecting to unified assets endpoint
// Kept for backward compatibility
export const revalidate = 600;

// Deprecation date: March 1, 2025
const SUNSET_DATE = "2025-03-01T00:00:00Z";

async function handler(request: NextRequest) {
  try {
    const baseUrl = request.nextUrl.origin;

    // Log usage of deprecated endpoint
    logger.warn("Deprecated endpoint accessed", {
      endpoint: "/api/data/aptos/stables",
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
      redirectTo: "/api/unified/assets?type=stables",
    });

    const redirectUrl = new URL(`${baseUrl}/api/unified/assets`);
    redirectUrl.searchParams.set("type", "stables");

    // Fetch from unified endpoint
    const response = await fetch(redirectUrl.toString());
    const data = await response.json();

    // Return data in original format with full structure
    const stableData = data;

    return NextResponse.json(stableData, {
      status: response.status,
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
      },
    });
  } catch (error) {
    logger.error("Stablecoin Supply API redirect error", {
      error: error instanceof Error ? error.message : String(error),
      endpoint: "/api/data/aptos/stables",
    });
    return NextResponse.json({ error: "Failed to fetch stablecoin data" }, { status: 500 });
  }
}

export const GET = withRateLimit(handler, {
  name: "stables-supply",
  ...RATE_LIMIT_TIERS.PUBLIC,
});
