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
      endpoint: "/api/data/aptos/btc",
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
      redirectTo: "/api/unified/assets?type=btc",
    });

    const redirectUrl = new URL(`${baseUrl}/api/unified/assets`);
    redirectUrl.searchParams.set("type", "btc");

    const forceRefresh = request.nextUrl.searchParams.get("refresh");
    if (forceRefresh) {
      redirectUrl.searchParams.set("refresh", forceRefresh);
    }

    // Fetch from unified endpoint
    const response = await fetch(redirectUrl.toString());
    const data = await response.json();

    // Transform unified data format to match expected BTC page format
    const transformedData = {
      ...data,
      supplies:
        data.sources?.map((source: any) => ({
          symbol: source.protocol,
          supply: source.displayAmount || source.formattedAmount?.toString() || "0",
          supply_raw: source.rawAmount?.toString() || source.amount?.toString() || "0",
          formatted_supply: source.displayAmount || source.formattedAmount?.toString() || "0",
          decimals: source.decimals || 8,
          percentage: source.percentage,
        })) || [],
      total_supply_formatted: data.total?.toString() || "0",
    };

    // Return data in original format with transformed structure
    const btcData = transformedData;

    return NextResponse.json(btcData, {
      status: response.status,
      headers: {
        "X-Deprecated": "true",
        "X-Redirect-To": "/api/unified/assets?type=btc",
        Sunset: SUNSET_DATE,
        Warning:
          '299 - "This API endpoint is deprecated and will be removed on March 1, 2025. Please use /api/unified/assets?type=btc instead."',
        Link: '</api/unified/assets?type=btc>; rel="successor-version"',
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
    return NextResponse.json({ error: "Failed to fetch Bitcoin data" }, { status: 500 });
  }
}

export const GET = withRateLimit(handler, {
  name: "btc-supply",
  ...RATE_LIMIT_TIERS.PUBLIC,
});
