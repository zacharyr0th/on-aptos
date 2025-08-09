import { NextRequest, NextResponse } from "next/server";

import { AssetService } from "@/lib/services/portfolio/services/asset-service";

// Cache for 5 minutes
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("walletAddress");

  try {
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 },
      );
    }

    // apiLogger.info("[Portfolio Assets API] Fetching assets for:", walletAddress);

    // Get wallet assets using our updated service
    const assets = await AssetService.getWalletAssets(walletAddress);

    // apiLogger.info(`[Portfolio Assets API] Found ${assets.length} assets`);

    // Return ALL assets - no filtering
    const filteredAssets = assets;

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
          assets: filteredAssets,
          totalCount: filteredAssets.length,
        },
      },
      { headers },
    );
  } catch (error) {
    // Enhanced error logging with full error details
    const errorDetails = {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : "UnknownError",
      walletAddress,
      timestamp: new Date().toISOString(),
    };

    // apiLogger.error(`Portfolio assets API error:: ${errorDetails instanceof Error ? errorDetails.message : errorDetails}`);
    // apiLogger.error(`[Portfolio Assets API] Full error object:: ${error instanceof Error ? error.message : error}`);

    return NextResponse.json(
      {
        error: "Failed to fetch portfolio assets",
        details: errorDetails.message,
        walletAddress,
      },
      { status: 500 },
    );
  }
}
