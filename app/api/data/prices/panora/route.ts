import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";

// This endpoint is deprecated - redirecting to unified prices endpoint
// Kept for backward compatibility
export const revalidate = 120;

async function panoraPricesHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const baseUrl = request.nextUrl.origin;
  
  // Build redirect URL with same params
  const redirectUrl = new URL(`${baseUrl}/api/unified/prices`);
  redirectUrl.searchParams.set("source", "panora");
  
  // Copy over tokens parameter
  const tokens = searchParams.get("tokens");
  if (tokens) {
    redirectUrl.searchParams.set("tokens", tokens);
  }
  
  // Fetch from unified endpoint
  const response = await fetch(redirectUrl.toString());
  const data = await response.json();
  
  // Return in the original format (just the prices array for backward compatibility)
  if (data.prices && !tokens) {
    return NextResponse.json(data.prices, {
      status: response.status,
      headers: {
        "X-Deprecated": "true",
        "X-Redirect-To": "/api/unified/prices",
      },
    });
  }
  
  return NextResponse.json(data, {
    status: response.status,
    headers: {
      "X-Deprecated": "true",
      "X-Redirect-To": "/api/unified/prices",
    },
  });
}

export const GET = withRateLimit(panoraPricesHandler, { name: "panora-prices", ...RATE_LIMIT_TIERS.STANDARD });