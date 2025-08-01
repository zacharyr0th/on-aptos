import { NextRequest, NextResponse } from "next/server";

import { aptosAnalytics } from "@/lib/services/aptos-analytics";
import { PanoraService } from "@/lib/services/portfolio/panora-service";
import { logger } from "@/lib/utils/logger";

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

    logger.info(`Token price request received for address: ${address}`);

    if (!address) {
      logger.warn("Token price request missing address parameter");
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

        logger.info(
          `Token price fetched from Panora for ${address}: $${panoraPrice.usdPrice} (took ${Date.now() - startTime}ms)`,
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
      }
    } catch (panoraError) {
      logger.error(
        `Failed to fetch price from Panora for ${address}:`,
        panoraError instanceof Error ? panoraError.message : panoraError,
      );
    }

    // Fallback to Aptos Analytics API
    try {
      const data = await aptosAnalytics.getTokenLatestPrice({
        address,
        date_utc: date_utc || undefined,
      });

      if (data && data.length > 0) {
        logger.info(
          `Token price fetched from Aptos Analytics for ${address} (took ${Date.now() - startTime}ms)`,
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
      logger.error(
        `Failed to fetch price from Aptos Analytics for ${address}:`,
        aptosError instanceof Error ? aptosError.message : aptosError,
      );
    }

    // If both fail, return empty data
    logger.warn(
      `No price data found for token ${address} (took ${Date.now() - startTime}ms)`,
    );
    return NextResponse.json(
      {
        data: [],
        message: "No price data available for this token",
        address,
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
    logger.error(
      "Token latest price API error:",
      error instanceof Error ? error.message : error,
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
