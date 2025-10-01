import { NextResponse } from "next/server";
import { apiLogger } from "@/lib/utils/core/logger";

export const dynamic = "force-dynamic";
export const revalidate = 60; // 1 minute cache

interface AssetMetrics {
  stables: {
    value: number;
    label: string;
    description: string;
  };
  rwas: {
    value: number;
    label: string;
    description: string;
  };
  btc: {
    value: number;
    label: string;
    description: string;
  };
  tokens: {
    value: number;
    label: string;
    description: string;
  };
}

export async function GET() {
  try {
    apiLogger.info("Fetching asset values for Aptos");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    
    // xBTC address for fetching Bitcoin price
    const xBTCAddress = "0x81214a80d82035a190fcb76b6ff3c0145161c3a9f33d137f2bbaee4cfec8a387";
    
    // Fetch all real data in parallel
    const [stablesRes, rwaRes, btcRes, defiRes, btcPriceRes] = await Promise.all([
      fetch(`${baseUrl}/api/aptos/stables`),
      fetch(`${baseUrl}/api/aptos/rwa`),
      fetch(`${baseUrl}/api/aptos/btc`),
      fetch(`${baseUrl}/api/defi/metrics`),
      fetch(`${baseUrl}/api/unified/prices?tokens=${xBTCAddress}`)
    ]);

    // Parse responses
    const stablesData = await stablesRes.json();
    const rwaData = await rwaRes.json();
    const btcData = await btcRes.json();
    const defiData = await defiRes.json();
    const btcPriceData = await btcPriceRes.json();

    // Extract actual values
    // Stables total is already in dollar units (e.g., "1038744887" = $1.038B)
    const stablesValue = stablesData?.data?.total ? parseInt(stablesData.data.total) : 0;
    const rwasValue = rwaData?.data?.totalAptosValue ? Math.round(rwaData.data.totalAptosValue) : 0;
    
    // Calculate BTC value using REAL price from the same source as BTC page
    const btcSupply = parseFloat(btcData?.data?.total_supply_formatted || "0");
    const btcPrice = btcPriceData?.prices?.[xBTCAddress] || 96000; // Use real price, fallback to 96k
    const btcValue = Math.round(btcSupply * btcPrice);
    
    const totalTokensValue = defiData?.tvl ? Math.round(defiData.tvl) : 0;

    // Format the response with REAL values from your APIs
    const metrics: AssetMetrics = {
      stables: {
        value: stablesValue,
        label: "Stablecoins",
        description: "USDC, USDT, USDe, USDA & more on Aptos"
      },
      rwas: {
        value: rwasValue,
        label: "Real World Assets",
        description: "BlackRock BUIDL, Franklin Templeton & more"
      },
      btc: {
        value: btcValue,
        label: "Bitcoin",
        description: "aBTC, SBTC, xBTC & wrapped variants"
      },
      tokens: {
        value: totalTokensValue,
        label: "Total Value Locked",
        description: "Total value across all Aptos protocols"
      }
    };

    apiLogger.info("Asset values fetched successfully", metrics);

    return NextResponse.json(metrics, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    apiLogger.error("Error fetching asset values:", error);
    
    // Return error response
    return NextResponse.json(
      {
        error: "Failed to fetch asset values",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}