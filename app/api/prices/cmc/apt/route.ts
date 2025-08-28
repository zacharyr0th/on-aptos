import { NextRequest } from "next/server";

import { successResponse, CACHE_DURATIONS } from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";

// Revalidate this route every 1 minute
export const revalidate = 60;

async function cmcAPTHandler(_request: NextRequest) {
  // Validate API key
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) {
    throw new Error("CMC API key is required but not configured");
  }

  // APT's ID on CMC is 21794
  const response = await fetch(
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=21794",
    {
      headers: {
        "X-CMC_PRO_API_KEY": apiKey,
        Accept: "application/json",
        "User-Agent": "OnAptos-APT-Tracker/1.0",
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`CMC API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  const aptData = data?.data?.["21794"];
  const price = aptData?.quote?.USD?.price;

  if (typeof price !== "number" || price <= 0) {
    throw new Error("Invalid APT price data received from CMC");
  }

  const responseData = {
    price: {
      symbol: "APT",
      price,
      change24h: aptData?.quote?.USD?.percent_change_24h || 0,
      marketCap: aptData?.quote?.USD?.market_cap || 0,
      volume24h: aptData?.quote?.USD?.volume_24h || 0,
      lastUpdated: new Date().toISOString(),
    },
    source: "CoinMarketCap",
  };

  return successResponse(responseData, CACHE_DURATIONS.VERY_SHORT, {
    "X-Service": "apt-price",
    "X-API-Version": "2.0",
    "X-Data-Source": "CoinMarketCap",
  });
}

export const GET = withRateLimit(cmcAPTHandler, {
  name: "cmc-apt-price",
  ...RATE_LIMIT_TIERS.PUBLIC,
});
