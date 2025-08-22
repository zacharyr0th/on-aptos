import { NextRequest, NextResponse } from "next/server";


// const PANORA_API_BASE = "https://api.panora.exchange";
// This is Panora's public API key from their documentation: https://docs.panora.exchange/
// const PANORA_API_KEY = process.env.PANORA_API_KEY || "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi";

// interface PanoraToken {
//   chainId: number;
//   tokenAddress: string | null;
//   faAddress: string;
//   name: string;
//   symbol: string;
//   decimals: number;
//   usdPrice: string;
//   logoUrl?: string;
//   panoraTags: string[];
// }

// interface PanoraPrice {
//   chainId: number;
//   tokenAddress: string | null;
//   faAddress: string;
//   name: string;
//   symbol: string;
//   decimals: number;
//   usdPrice: string;
//   nativePrice: string;
// }

interface PerformanceDataPoint {
  timestamp: string;
  value: number;
  tokens: {
    symbol: string;
    address: string;
    balance: number;
    usdValue: number;
    price: number;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress =
      searchParams.get("walletAddress") || searchParams.get("address");
    const timeframe = searchParams.get("timeframe") || "7d";

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 },
      );
    }

    apiLogger.info(
      `[Panora Portfolio Performance] Fetching for ${walletAddress}, timeframe: ${timeframe}`,
    );

    // Step 1: Get current portfolio composition from our existing portfolio API
    const portfolioResponse = await fetch(
      `${request.nextUrl.origin}/api/portfolio/batch?walletAddress=${walletAddress}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!portfolioResponse.ok) {
      throw new Error(`Portfolio API error: ${portfolioResponse.status}`);
    }

    const portfolioData = await portfolioResponse.json();
    const assets = portfolioData.data?.assets || portfolioData.assets || [];

    apiLogger.info(
      {
        hasAssets: !!portfolioData.data?.assets,
        assetsLength: assets.length,
        portfolioKeys: Object.keys(portfolioData),
        dataKeys: portfolioData.data ? Object.keys(portfolioData.data) : [],
        sampleAsset: assets[0],
      },
      `[Panora Portfolio Performance] Portfolio data structure`,
    );

    if (assets.length === 0) {
      apiLogger.warn(
        {
          portfolioData,
          walletAddress,
        },
        `[Panora Portfolio Performance] No assets found`,
      );
      return NextResponse.json({
        success: true,
        data: [],
        timeframe,
        message: "No assets found in portfolio",
      });
    }

    // Step 2: Calculate current portfolio value using existing asset prices
    const currentDataPoint = generateCurrentDataPointFromAssets(assets);

    apiLogger.info(
      `[Panora Portfolio Performance] Generated current data point only - NO MOCK DATA`,
    );

    // Return only current snapshot - no historical simulation
    return NextResponse.json({
      success: true,
      data: [currentDataPoint], // Single current point only
      timeframe,
      dataPoints: 1,
      tokens: assets.length,
      message: "Current portfolio value only - no historical mock data",
    });
  } catch (error) {
    apiLogger.error({ error }, "[Panora Portfolio Performance] Error");
    return NextResponse.json(
      { error: "Failed to fetch portfolio performance data" },
      { status: 500 },
    );
  }
}

interface AssetData {
  balance: string;
  value: string;
  asset_type: string;
  price?: string;
  metadata?: {
    symbol?: string;
  };
}

function generateCurrentDataPointFromAssets(
  assets: AssetData[],
): PerformanceDataPoint {
  const now = new Date();
  let totalValue = 0;
  const tokenBreakdown: Array<{
    symbol: string;
    address: string;
    balance: number;
    usdValue: number;
    price: number;
    value: number;
    percentage: number;
  }> = [];

  // Calculate current portfolio value using asset prices from portfolio API
  assets.forEach((asset) => {
    const balance = parseFloat(asset.balance || "0");
    const value = parseFloat(asset.value || "0");

    if (balance <= 0) return;

    totalValue += value;

    tokenBreakdown.push({
      symbol: asset.metadata?.symbol || "Unknown",
      address: asset.asset_type,
      balance,
      usdValue: value,
      price: parseFloat(asset.price || "0"),
      value: value,
      percentage: 0, // Will be calculated after totals
    });
  });

  // Calculate percentages
  tokenBreakdown.forEach((token) => {
    token.percentage = totalValue > 0 ? (token.value / totalValue) * 100 : 0;
  });

  return {
    timestamp: now.toISOString(),
    value: totalValue,
    tokens: tokenBreakdown,
  };
}
