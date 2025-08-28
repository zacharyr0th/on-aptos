import { NextRequest, NextResponse } from "next/server";

import {
  extractParams,
  errorResponse,
  successResponse,
  CACHE_DURATIONS,
  getPanoraAuthHeaders,
} from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";

// Revalidate this route every 2 minutes (Panora data is more dynamic)
export const revalidate = 120;

const PANORA_API_ENDPOINT = "https://api.panora.exchange/prices";

async function panoraPricesHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenAddresses = searchParams.get("tokens")?.split(",") || [];

  // Build URL with optional token filter
  let url = PANORA_API_ENDPOINT;
  if (tokenAddresses.length > 0) {
    const params = new URLSearchParams({
      tokenAddress: tokenAddresses.join(","),
    });
    url = `${PANORA_API_ENDPOINT}?${params.toString()}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...getPanoraAuthHeaders(),
      "Accept-Encoding": "gzip",
      Accept: "application/json",
      "User-Agent": "OnAptos-Panora/1.0",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    return errorResponse(
      `Panora API error: ${response.status} - ${errorBody}`,
      response.status,
    );
  }

  const data = await response.json();
  const prices = Array.isArray(data) ? data : [];

  // Transform data to consistent format
  const transformedPrices = prices.map((token: any) => ({
    chainId: token.chainId,
    tokenAddress: token.tokenAddress,
    faAddress: token.faAddress,
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    usdPrice: parseFloat(token.usdPrice || "0"),
    nativePrice: token.nativePrice,
    iconUrl: token.iconUrl,
  }));

  const responseData = {
    success: true,
    data: transformedPrices,
    count: transformedPrices.length,
    timestamp: new Date().toISOString(),
    source: "Panora Exchange",
  };

  return successResponse(responseData, CACHE_DURATIONS.SHORT, {
    "X-Content-Type": "application/json",
    "X-Service": "panora-prices",
    "X-API-Version": "2.0",
    "X-Data-Source": "Panora Exchange",
    Vary: "Accept-Encoding",
  });
}

export const GET = withRateLimit(panoraPricesHandler, {
  name: "panora-prices",
  ...RATE_LIMIT_TIERS.PUBLIC, // Public endpoint with caching
});
