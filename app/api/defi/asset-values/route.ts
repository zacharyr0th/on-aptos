import { NextResponse } from "next/server";
import { apiLogger } from "@/lib/utils/core/logger";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 minute cache

// In-memory cache to reduce API calls
let cachedData: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 300000; // 5 minutes in milliseconds

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

export async function GET(request: Request) {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      apiLogger.info("Returning cached asset values");
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    apiLogger.info("Fetching fresh asset values for Aptos");

    // Get the base URL from the request headers
    const host = request.headers.get('host') || 'localhost:3001';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    // xBTC address for fetching Bitcoin price
    const xBTCAddress = "0x81214a80d82035a190fcb76b6ff3c0145161c3a9f33d137f2bbaee4cfec8a387";

    // Fetch all real data in parallel with error handling
    const [stablesRes, rwaRes, btcRes, defiRes, btcPriceRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/aptos/stables`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/aptos/rwa`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/aptos/btc`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/defi/metrics`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/unified/prices?tokens=${xBTCAddress}`, { cache: 'no-store' })
    ]);

    // Safely parse responses with fallbacks
    let stablesData: any = {};
    let rwaData: any = {};
    let btcData: any = {};
    let defiData: any = {};
    let btcPriceData: any = {};

    try {
      if (stablesRes.status === 'fulfilled' && stablesRes.value.ok) {
        stablesData = await stablesRes.value.json();
      }
    } catch (e) {
      apiLogger.warn("Failed to parse stables data", e);
    }

    try {
      if (rwaRes.status === 'fulfilled' && rwaRes.value.ok) {
        rwaData = await rwaRes.value.json();
      }
    } catch (e) {
      apiLogger.warn("Failed to parse RWA data", e);
    }

    try {
      if (btcRes.status === 'fulfilled' && btcRes.value.ok) {
        btcData = await btcRes.value.json();
      }
    } catch (e) {
      apiLogger.warn("Failed to parse BTC data", e);
    }

    try {
      if (defiRes.status === 'fulfilled' && defiRes.value.ok) {
        defiData = await defiRes.value.json();
      }
    } catch (e) {
      apiLogger.warn("Failed to parse DeFi data", e);
    }

    try {
      if (btcPriceRes.status === 'fulfilled' && btcPriceRes.value.ok) {
        btcPriceData = await btcPriceRes.value.json();
      }
    } catch (e) {
      apiLogger.warn("Failed to parse BTC price data", e);
    }

    // Extract actual values with fallbacks
    const stablesValue = stablesData?.data?.total ? parseInt(stablesData.data.total) : 0;
    const rwasValue = rwaData?.data?.totalAptosValue ? Math.round(rwaData.data.totalAptosValue) : 0;

    // Calculate BTC value using REAL price from the same source as BTC page
    const btcSupply = parseFloat(btcData?.data?.total_supply_formatted || "0");
    const btcPrice = btcPriceData?.prices?.[xBTCAddress] || 96000;
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

    // Update cache
    cachedData = metrics;
    cacheTimestamp = Date.now();

    return NextResponse.json(metrics, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
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