import { NextRequest, NextResponse } from "next/server";

import { DeFiService } from "@/lib/services/portfolio/services/defi-service";
import { logger } from "@/lib/utils/logger";

// Cache for 5 minutes
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 },
      );
    }

    logger.info(
      "[Portfolio DeFi API] Fetching DeFi positions for:",
      walletAddress,
    );

    // Get DeFi positions using the new provider
    const positions = await DeFiService.getWalletDeFiPositions(walletAddress);

    // Get aggregated metrics
    const metrics = await DeFiService.calculateDeFiMetrics(positions);

    // Get summary data
    const summary = await DeFiService.getDeFiSummary(walletAddress);

    logger.info(
      `[Portfolio DeFi API] Found ${positions.length} DeFi positions`,
    );

    // Set cache headers
    const headers = new Headers();
    headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600",
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          positions,
          totalCount: positions.length,
          metrics,
          summary,
        },
      },
      { headers },
    );
  } catch (error) {
    logger.error("Portfolio DeFi API error:", error);
    logger.error("[Portfolio DeFi API] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch DeFi positions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
