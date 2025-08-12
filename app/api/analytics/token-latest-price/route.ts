import { NextRequest, NextResponse } from "next/server";

import { aptosAnalytics } from "@/lib/services/blockchain/aptos-analytics";
import { PanoraService } from "@/lib/services/portfolio/panora-service";
import { apiLogger } from "@/lib/utils/core/logger";

// Cache price data for 5 minutes
export const revalidate = 300;

// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;

    const address =
      searchParams.get("address") || searchParams.get("tokenAddress");
    const date_utc = searchParams.get("date_utc");

    apiLogger.debug("Token price request received for address");

    if (!address) {
      apiLogger.warn("Token price request missing address parameter");
      return NextResponse.json(
        { error: "Missing required parameter: address" },
        { status: 400 },
      );
    }

    // First try Panora API for better coverage
    try {
      const panoraPrices = await PanoraService.getTokenPrices([address]);

      if (panoraPrices && panoraPrices.length > 0) {
        const panoraPrice = panoraPrices[0];

        // Check if the response has valid data (not null values)
        if (panoraPrice.usdPrice && panoraPrice.symbol) {
          // Convert Panora response to match expected format
          const data = [
            {
              bucketed_timestamp_minutes_utc: new Date().toISOString(),
              price_usd: parseFloat(panoraPrice.usdPrice),
              token_address: panoraPrice.tokenAddress || panoraPrice.faAddress,
              symbol: panoraPrice.symbol,
              name: panoraPrice.name,
              decimals: panoraPrice.decimals,
            },
          ];

          apiLogger.debug(
            `Token price fetched from Panora: $${panoraPrice.usdPrice} (took ${Date.now() - startTime}ms)`,
          );
          return NextResponse.json(
            { data, source: "panora" },
            {
              headers: {
                ...corsHeaders,
                "Cache-Control":
                  "public, s-maxage=300, stale-while-revalidate=600",
              },
            },
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
        address,
        date_utc: date_utc || undefined,
      });

      if (data && data.length > 0) {
        apiLogger.debug(
          `Token price fetched from Aptos Analytics (took ${Date.now() - startTime}ms)`,
        );
        return NextResponse.json(
          { data, source: "aptos-analytics" },
          {
            headers: {
              ...corsHeaders,
              "Cache-Control":
                "public, s-maxage=300, stale-while-revalidate=600",
            },
          },
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
    return NextResponse.json(
      {
        data: [],
        message: "No price data available for this token",
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    apiLogger.error(
      `Token latest price API error: ${error instanceof Error ? error.message : String(error)}`,
    );
    return NextResponse.json(
      {
        error: "Failed to fetch token latest price",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(_request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
