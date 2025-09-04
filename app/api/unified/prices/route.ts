import { NextRequest } from "next/server";

import { aptosAnalytics } from "@/lib/services/blockchain/aptos-analytics";
import { UnifiedPanoraService } from "@/lib/services/portfolio/unified-panora-service";
import {
  errorResponse,
  successResponse,
  CACHE_DURATIONS,
  getPanoraAuthHeaders,
} from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";
import { apiLogger } from "@/lib/utils/core/logger";
import {
  PANORA_API_ENDPOINT,
  extractTokensFromParams,
  getResponseTimeHeaders,
  OPTIONS,
} from "../shared";

// Cache price data for 5 minutes
export const revalidate = 300;

interface PriceData {
  [tokenAddress: string]: number;
}

interface UnifiedPriceResponse {
  prices: PriceData;
  source: string;
  tokens: number;
  requested?: number;
  timestamp: string;
}

async function unifiedPricesHandler(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);

  const tokens = extractTokensFromParams(searchParams);
  const source = searchParams.get("source") || "auto"; // auto, panora, analytics
  const date_utc = searchParams.get("date_utc");

  apiLogger.debug("Unified price request", {
    tokens: tokens.length,
    source,
    date_utc,
  });

  try {
    // If no tokens specified, return all available prices
    if (tokens.length === 0 || tokens[0] === "") {
      const response = await fetch(PANORA_API_ENDPOINT, {
        method: "GET",
        headers: {
          ...getPanoraAuthHeaders(),
          "Accept-Encoding": "gzip",
          Accept: "application/json",
          "User-Agent": "OnAptos-Unified/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Panora API error: ${response.status}`);
      }

      const data = await response.json();
      const prices = Array.isArray(data) ? data : [];

      return successResponse(
        { prices, source: "panora", tokens: prices.length },
        CACHE_DURATIONS.MEDIUM,
        {
          ...getResponseTimeHeaders(startTime),
          "X-Data-Source": "panora",
        },
      );
    }

    // Handle specific token price requests
    let priceData: PriceData = {};
    let dataSource = source;

    if (source === "panora" || source === "auto") {
      try {
        // Try Panora first
        const panoraPrices = await UnifiedPanoraService.getTokenPrices(tokens);

        if (panoraPrices && panoraPrices.size > 0) {
          priceData = Object.fromEntries(panoraPrices);
          dataSource = "panora";
        }
      } catch (panoraError) {
        apiLogger.warn("Panora price fetch failed", {
          error:
            panoraError instanceof Error
              ? panoraError.message
              : String(panoraError),
        });

        if (source === "panora") {
          throw panoraError; // If explicitly requested Panora, fail
        }
      }
    }

    // Fallback to analytics if needed
    if (
      (source === "analytics" || source === "auto") &&
      Object.keys(priceData).length === 0
    ) {
      try {
        const analyticsPromises = tokens.map(async (token) => {
          const priceArray = await aptosAnalytics.getTokenLatestPrice({
            address: token,
            date_utc,
          });
          // Extract the price from the first element of the array
          const price =
            Array.isArray(priceArray) && priceArray.length > 0
              ? priceArray[0]?.price_usd
              : null;
          return { token, price };
        });

        const analyticsResults = await Promise.allSettled(analyticsPromises);

        analyticsResults.forEach((result) => {
          if (
            result.status === "fulfilled" &&
            result.value.price &&
            typeof result.value.price === "number"
          ) {
            priceData[result.value.token] = result.value.price;
          }
        });

        if (Object.keys(priceData).length > 0) {
          dataSource = "analytics";
        }
      } catch (analyticsError) {
        apiLogger.warn("Analytics price fetch failed", {
          error:
            analyticsError instanceof Error
              ? analyticsError.message
              : String(analyticsError),
        });
      }
    }

    // Format response
    const response: UnifiedPriceResponse = {
      prices: priceData,
      source: dataSource,
      tokens: Object.keys(priceData).length,
      requested: tokens.length,
      timestamp: new Date().toISOString(),
    };

    return successResponse(response, CACHE_DURATIONS.MEDIUM, {
      ...getResponseTimeHeaders(startTime),
      "X-Data-Source": dataSource,
    });
  } catch (error) {
    apiLogger.error("Unified price API error", {
      error: error instanceof Error ? error.message : String(error),
      tokens: tokens.length,
      source,
    });

    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch price data",
      500,
    );
  }
}

export const GET = withRateLimit(unifiedPricesHandler, {
  name: "unified-prices",
  ...RATE_LIMIT_TIERS.STANDARD,
});
export { OPTIONS };
