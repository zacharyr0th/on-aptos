import { NextRequest, NextResponse } from "next/server";

import {
  errorResponse,
  successResponse,
  CACHE_DURATIONS,
} from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";

// Revalidate this route every 5 minutes
export const revalidate = 300;

async function cmcBTCHandler(request: NextRequest) {
  // Validate API key
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) {
    return errorResponse("CMC API key is required but not configured", 500);
  }

  // Bitcoin's ID on CMC is 1
  const response = await fetch(
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=1",
    {
      headers: {
        "X-CMC_PRO_API_KEY": apiKey,
        Accept: "application/json",
        "User-Agent": "OnAptos-BTC-Tracker/1.0",
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    return errorResponse(
      `CMC API error: ${response.status} - ${errorBody}`,
      response.status,
    );
  }

  const data = await response.json();
  const price = data?.data?.["1"]?.quote?.USD?.price;

  if (typeof price !== "number" || price <= 0) {
    return errorResponse("Invalid Bitcoin price data received from CMC", 502);
  }

  const responseData = {
    symbol: "BTC",
    name: "Bitcoin",
    price,
    change24h: data?.data?.["1"]?.quote?.USD?.percent_change_24h || null,
    marketCap: data?.data?.["1"]?.quote?.USD?.market_cap || null,
    updated: new Date().toISOString(),
    source: "CoinMarketCap",
  };

  return successResponse(responseData, CACHE_DURATIONS.MEDIUM, {
    "X-Content-Type": "application/json",
    "X-Service": "btc-price",
    "X-API-Version": "2.0",
    "X-Data-Source": "CoinMarketCap",
    Vary: "Accept-Encoding",
  });
}

export const GET = withRateLimit(cmcBTCHandler, {
  name: "cmc-btc-price",
  ...RATE_LIMIT_TIERS.PUBLIC,
});
