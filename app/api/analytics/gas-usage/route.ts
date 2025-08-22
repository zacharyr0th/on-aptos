import { NextRequest, NextResponse } from "next/server";

import { createApiResponse } from "@/lib/utils/api-response";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get("walletAddress");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!walletAddress) {
      return createApiResponse(
        { error: "Wallet address is required" },
        400,
        "/api/analytics/gas-usage",
      );
    }

    // This would typically fetch from Aptos indexer
    // For now, returning mock structure to prevent errors
    const gasUsage = {
      walletAddress,
      period: {
        start:
          startDate ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: endDate || new Date().toISOString(),
      },
      totalGasUsed: 0,
      totalTransactions: 0,
      averageGasPerTransaction: 0,
      dailyUsage: [],
    };

    apiLogger.info(`Gas usage fetched for wallet ${walletAddress}`);

    return NextResponse.json(gasUsage, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    apiLogger.error(`Failed to fetch gas usage: ${error}`);
    return createApiResponse(
      { error: "Failed to fetch gas usage" },
      500,
      "/api/analytics/gas-usage",
    );
  }
}
