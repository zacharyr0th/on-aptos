import { NextRequest, NextResponse } from "next/server";

import {
  successResponse,
  errorResponse,
  CACHE_DURATIONS,
} from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";
import { logger } from "@/lib/utils/core/logger";

interface GlobalStablecoinData {
  totalMarketCap: number;
  totalStablecoins: number;
  topStablecoins: {
    name: string;
    symbol: string;
    mcap: number;
    dominancePercentage: number;
  }[];
}

async function handler(_request: NextRequest): Promise<NextResponse> {
  try {
    // Fetch global stablecoin data from DeFiLlama
    const response = await fetch(
      "https://stablecoins.llama.fi/stablecoins?includePrices=true",
      {
        headers: {
          "User-Agent":
            "Next.js/14 DeFi-Dashboard (Global-Stablecoin-Analytics)",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.peggedAssets || !Array.isArray(data.peggedAssets)) {
      throw new Error("Invalid response format from DeFiLlama");
    }

    // Calculate total market cap and process stablecoins
    let totalMarketCap = 0;
    const processedStablecoins = data.peggedAssets
      .filter(
        (asset: any) =>
          asset.circulating?.peggedUSD && asset.circulating.peggedUSD > 0,
      )
      .map((asset: any) => {
        const mcap = asset.circulating.peggedUSD || 0;
        totalMarketCap += mcap;

        return {
          name: asset.name || "Unknown",
          symbol: asset.symbol || "Unknown",
          mcap,
          dominancePercentage: 0, // Will calculate after getting total
        };
      })
      .sort((a: any, b: any) => b.mcap - a.mcap);

    // Calculate dominance percentages
    processedStablecoins.forEach((stable: any) => {
      stable.dominancePercentage =
        totalMarketCap > 0 ? (stable.mcap / totalMarketCap) * 100 : 0;
    });

    const result: GlobalStablecoinData = {
      totalMarketCap,
      totalStablecoins: processedStablecoins.length,
      topStablecoins: processedStablecoins.slice(0, 10), // Top 10 stablecoins
    };

    logger.info("Global stablecoin data fetched successfully", {
      totalMarketCap: result.totalMarketCap,
      stablecoinCount: result.totalStablecoins,
    });

    const headers = {
      "X-Content-Type": "application/json",
      "X-Service": "global-stablecoin-analytics",
      "X-API-Version": "1.0",
      "X-Data-Source": "DeFiLlama",
      Vary: "Accept-Encoding",
    };

    return successResponse(result, CACHE_DURATIONS.MEDIUM, headers);
  } catch (error) {
    logger.error("Global stablecoin API error", {
      error: error instanceof Error ? error.message : String(error),
      endpoint: "/api/analytics/stablecoins/global",
    });

    return errorResponse(
      "Failed to fetch global stablecoin data",
      500,
      error instanceof Error ? error.message : undefined,
    );
  }
}

export const GET = withRateLimit(handler, {
  name: "global-stablecoins",
  ...RATE_LIMIT_TIERS.PUBLIC,
});
