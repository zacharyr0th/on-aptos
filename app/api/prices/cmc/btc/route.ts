import { NextRequest, NextResponse } from "next/server";

import { SERVICE_CONFIG } from "@/lib/config/cache";
import {
  ApiError,
  formatApiError,
  withErrorHandling,
  type ErrorContext,
} from "@/lib/utils";
import { enhancedFetch } from "@/lib/utils/api/fetch-utils";
import { errorLogger } from "@/lib/utils/core/logger";

// Revalidate this route every 5 minutes
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const errorContext: ErrorContext = {
    operation: "CMC Bitcoin Price API",
    service: "CMC-BTC",
    details: {
      endpoint: "/api/prices/cmc/btc",
      userAgent: request.headers.get("user-agent")?.slice(0, 50) || "unknown",
    },
  };

  return withErrorHandling(async () => {
    // Validate API key
    const apiKey = process.env.CMC_API_KEY;
    if (!apiKey) {
      throw new ApiError(
        "CMC API key is required but not configured",
        500,
        "CMC-Config",
      );
    }

    try {
      // Bitcoin's ID on CMC is 1
      const response = await enhancedFetch(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=1",
        {
          headers: {
            "X-CMC_PRO_API_KEY": apiKey,
            Accept: "application/json",
            "User-Agent": "OnAptos-BTC-Tracker/1.0",
          },
          timeout: SERVICE_CONFIG.prices.timeout,
          next: { revalidate },
        },
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new ApiError(
          `CMC API error: ${response.status} - ${errorBody}`,
          response.status,
          "CMC-API",
        );
      }

      const data = await response.json();
      const price = data?.data?.["1"]?.quote?.USD?.price;

      if (typeof price !== "number" || price <= 0) {
        throw new ApiError(
          "Invalid Bitcoin price data received from CMC",
          502,
          "CMC-Data",
        );
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

      return NextResponse.json(responseData, {
        headers: {
          "Cache-Control": `public, max-age=${Math.floor(SERVICE_CONFIG.prices.ttl / 1000)}, stale-while-revalidate=${Math.floor(SERVICE_CONFIG.prices.ttl / 2000)}`,
          "X-Content-Type": "application/json",
          "X-Service": "btc-price",
          "X-API-Version": "2.0",
          "X-Data-Source": "CoinMarketCap",
          Vary: "Accept-Encoding",
        },
      });
    } catch (error) {
      errorLogger.error(formatApiError(error), "CMC Bitcoin price fetch error");

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === "TimeoutError") {
        throw new ApiError("CMC API request timed out", 504, "CMC-Timeout");
      }

      throw new ApiError(
        `CMC Bitcoin price fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
        "CMC-BTC",
      );
    }
  }, errorContext);
}
