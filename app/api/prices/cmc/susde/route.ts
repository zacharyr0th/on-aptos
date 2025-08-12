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
    operation: "CMC sUSDe Price API",
    service: "CMC-sUSDe",
    details: {
      endpoint: "/api/prices/cmc/susde",
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
      // sUSDe's ID on CMC is 29471
      const response = await enhancedFetch(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=29471",
        {
          headers: {
            "X-CMC_PRO_API_KEY": apiKey,
            Accept: "application/json",
            "User-Agent": "OnAptos-sUSDe-Tracker/1.0",
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
      const price = data?.data?.["29471"]?.quote?.USD?.price;

      if (typeof price !== "number" || price <= 0) {
        throw new ApiError(
          "Invalid sUSDe price data received from CMC",
          502,
          "CMC-Data",
        );
      }

      const responseData = {
        symbol: "sUSDe",
        name: "Ethena Staked USDe",
        price,
        change24h:
          data?.data?.["29471"]?.quote?.USD?.percent_change_24h || null,
        marketCap: data?.data?.["29471"]?.quote?.USD?.market_cap || null,
        updated: new Date().toISOString(),
        source: "CoinMarketCap",
      };

      return NextResponse.json(responseData, {
        headers: {
          "Cache-Control": `public, max-age=${Math.floor(SERVICE_CONFIG.prices.ttl / 1000)}, stale-while-revalidate=${Math.floor(SERVICE_CONFIG.prices.ttl / 2000)}`,
          "X-Content-Type": "application/json",
          "X-Service": "susde-price",
          "X-API-Version": "2.0",
          "X-Data-Source": "CoinMarketCap",
          Vary: "Accept-Encoding",
        },
      });
    } catch (error) {
      errorLogger.error(formatApiError(error), "CMC sUSDe price fetch error");

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === "TimeoutError") {
        throw new ApiError("CMC API request timed out", 504, "CMC-Timeout");
      }

      throw new ApiError(
        `CMC sUSDe price fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
        "CMC-sUSDe",
      );
    }
  }, errorContext);
}
