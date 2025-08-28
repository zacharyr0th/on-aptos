import { NextRequest, NextResponse } from "next/server";

import { aptosAnalytics } from "@/lib/services/blockchain/aptos-analytics";
import { UnifiedPanoraService } from "@/lib/services/portfolio/unified-panora-service";
import {
  extractParams,
  errorResponse,
  successResponse,
  CACHE_DURATIONS,
  validateRequiredParams,
} from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";
import { apiLogger } from "@/lib/utils/core/logger";

// Cache price data for 5 minutes
export const revalidate = 300;

// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function tokenLatestPriceHandler(request: NextRequest) {
  const startTime = Date.now();
  const params = extractParams(request);
  const searchParams = request.nextUrl.searchParams;
  const date_utc = searchParams.get("date_utc");

  // Get address from either "address" or "tokenAddress" parameter
  const address =
    params.address || searchParams.get("tokenAddress") || undefined;

  apiLogger.debug("Token price request received for address");

  // Validate required parameters
  const validation = validateRequiredParams({ address }, ["address"]);
  if (validation) {
    return errorResponse(validation, 400);
  }

  // First try Panora API for better coverage
  try {
    const panoraPrices = await UnifiedPanoraService.getTokenPrices([address!]);

    if (panoraPrices && panoraPrices.size > 0) {
      const panoraPrice = panoraPrices.get(address!);

      // Check if the response has valid data (not null values)
      if (panoraPrice && panoraPrice > 0) {
        // Convert Panora response to match expected format
        const data = [
          {
            bucketed_timestamp_minutes_utc: new Date().toISOString(),
            price_usd: panoraPrice,
            token_address: address,
          },
        ];

        apiLogger.debug(
          `Token price fetched from Panora: $${panoraPrice} (took ${Date.now() - startTime}ms)`,
        );
        return successResponse(
          { data, source: "panora" },
          CACHE_DURATIONS.MEDIUM,
          corsHeaders,
        );
      } else {
        apiLogger.debug(
          "Panora returned null/invalid data, falling back to Aptos Analytics",
        );
      }
    }
  } catch (panoraError) {
    apiLogger.error(
      `Failed to fetch price from Panora: ${panoraError instanceof Error ? panoraError.message : String(panoraError)}`,
    );
  }

  // Fallback to Aptos Analytics API
  try {
    const data = await aptosAnalytics.getTokenLatestPrice({
      address: address!,
      date_utc: date_utc || undefined,
    });

    if (data && data.length > 0) {
      apiLogger.debug(
        `Token price fetched from Aptos Analytics (took ${Date.now() - startTime}ms)`,
      );
      return successResponse(
        { data, source: "aptos-analytics" },
        CACHE_DURATIONS.MEDIUM,
        corsHeaders,
      );
    }
  } catch (aptosError) {
    apiLogger.error(
      `Failed to fetch price from Aptos Analytics: ${aptosError instanceof Error ? aptosError.message : String(aptosError)}`,
    );
  }

  // If both fail, return empty data
  apiLogger.warn(
    `No price data found for token (took ${Date.now() - startTime}ms)`,
  );
  return successResponse(
    {
      data: [],
      message: "No price data available for this token",
    },
    CACHE_DURATIONS.VERY_SHORT,
    corsHeaders,
  );
}

export const GET = withRateLimit(tokenLatestPriceHandler, {
  name: "token-latest-price",
  ...RATE_LIMIT_TIERS.PUBLIC,
});

// OPTIONS handler for CORS preflight
export async function OPTIONS(_request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
