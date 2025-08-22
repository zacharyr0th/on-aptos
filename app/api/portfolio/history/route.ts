import { NextRequest, NextResponse } from "next/server";

import { createApiResponse } from "@/lib/utils/api-response";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get("address");
    const timeframe = searchParams.get("timeframe") || "7d";

    if (!walletAddress) {
      return createApiResponse(
        { error: "Wallet address is required" },
        400,
        "/api/portfolio/history",
      );
    }

    // This would typically fetch historical portfolio data
    // For now, returning structure to prevent errors
    const history = {
      walletAddress,
      timeframe,
      dataPoints: [],
      totalValueChange: 0,
      percentageChange: 0,
      currentValue: 0,
    };

    apiLogger.info(
      `Portfolio history fetched for ${walletAddress} (${timeframe})`,
    );

    return NextResponse.json(history, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    apiLogger.error(`Failed to fetch portfolio history: ${error}`);
    return createApiResponse(
      { error: "Failed to fetch portfolio history" },
      500,
      "/api/portfolio/history",
    );
  }
}
