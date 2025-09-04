import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";
import { logger } from "@/lib/utils/core/logger";

// This endpoint is deprecated - redirecting to unified assets endpoint
// Kept for backward compatibility
export const revalidate = 600;

async function handler(request: NextRequest) {
  try {
    const baseUrl = request.nextUrl.origin;
    const redirectUrl = new URL(`${baseUrl}/api/unified/assets`);
    redirectUrl.searchParams.set("type", "btc");
    
    const forceRefresh = request.nextUrl.searchParams.get("refresh");
    if (forceRefresh) {
      redirectUrl.searchParams.set("refresh", forceRefresh);
    }
    
    // Fetch from unified endpoint
    const response = await fetch(redirectUrl.toString());
    const data = await response.json();
    
    // Return data in original format
    const btcData = data.supplies || data;
    
    return NextResponse.json(btcData, {
      status: response.status,
      headers: {
        "X-Deprecated": "true",
        "X-Redirect-To": "/api/unified/assets?type=btc",
        "X-Content-Type": "application/json",
        "X-Service": "btc-supply",
        "X-API-Version": "2.0",
        "X-Data-Source": "Aptos Indexer",
        Vary: "Accept-Encoding",
      },
    });
  } catch (error) {
    logger.error("Bitcoin Supply API redirect error", {
      error: error instanceof Error ? error.message : String(error),
      endpoint: "/api/data/aptos/btc",
    });
    return NextResponse.json(
      { error: "Failed to fetch Bitcoin data" },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handler, {
  name: "btc-supply",
  ...RATE_LIMIT_TIERS.PUBLIC,
});
