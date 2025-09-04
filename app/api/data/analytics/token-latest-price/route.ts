import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";
import { apiLogger } from "@/lib/utils/core/logger";

// This endpoint is deprecated - redirecting to unified prices endpoint
// Kept for backward compatibility
export const revalidate = 300;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function tokenLatestPriceHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const baseUrl = request.nextUrl.origin;
  
  // Get address from either "address" or "tokenAddress" parameter
  const address = searchParams.get("address") || searchParams.get("tokenAddress");
  const date_utc = searchParams.get("date_utc");
  
  apiLogger.debug("Token price request redirected to unified endpoint");
  
  // Build redirect URL
  const redirectUrl = new URL(`${baseUrl}/api/unified/prices`);
  redirectUrl.searchParams.set("source", "auto");
  
  if (address) {
    redirectUrl.searchParams.set("tokens", address);
  }
  
  if (date_utc) {
    redirectUrl.searchParams.set("date_utc", date_utc);
  }
  
  // Fetch from unified endpoint
  const response = await fetch(redirectUrl.toString());
  const data = await response.json();
  
  // Transform response to match original format
  if (data.prices && address && data.prices[address]) {
    const price = data.prices[address];
    return NextResponse.json(
      {
        price: price.usdPrice || price,
        address,
        source: data.source,
        timestamp: data.timestamp,
      },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "X-Deprecated": "true",
          "X-Redirect-To": "/api/unified/prices",
        },
      }
    );
  }
  
  return NextResponse.json(
    { error: "Price not found", address },
    {
      status: 404,
      headers: {
        ...corsHeaders,
        "X-Deprecated": "true",
        "X-Redirect-To": "/api/unified/prices",
      },
    }
  );
}

export const GET = withRateLimit(tokenLatestPriceHandler, { name: "token-latest-price", ...RATE_LIMIT_TIERS.STANDARD });
export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
};