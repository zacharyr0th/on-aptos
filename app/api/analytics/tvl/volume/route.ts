import { NextResponse } from "next/server";

import { apiLogger } from "@/lib/utils/core/logger";
import { UnifiedCache } from "@/lib/utils/cache/unified-cache";

const cache = new UnifiedCache({ ttl: 5 * 60 * 1000 }); // 5 minutes

export async function GET() {
  try {
    const cacheKey = "aptos-volume";
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch DEX volume data
    const dexResponse = await fetch(
      "https://api.llama.fi/overview/dexs/aptos",
      {
        next: { revalidate: 300 },
      },
    );

    let dexData = null;
    if (dexResponse.ok) {
      dexData = await dexResponse.json();
    }

    // Fetch options volume if available
    const optionsResponse = await fetch(
      "https://api.llama.fi/overview/options/aptos",
      {
        next: { revalidate: 300 },
      },
    );

    let optionsData = null;
    if (optionsResponse.ok) {
      try {
        optionsData = await optionsResponse.json();
      } catch {
        // Options data might not be available for Aptos
        optionsData = null;
      }
    }

    // Fetch bridge volume data
    const bridgeResponse = await fetch(
      "https://api.llama.fi/bridgevolume/aptos",
      {
        next: { revalidate: 300 },
      },
    );

    let bridgeData = null;
    if (bridgeResponse.ok) {
      try {
        bridgeData = await bridgeResponse.json();
      } catch {
        // Bridge data might not be available
        bridgeData = null;
      }
    }

    const volumeMetrics = {
      dex: dexData
        ? {
            volume24h: dexData.total24h || 0,
            volume7d: dexData.total7d || 0,
            volumeChange24h: dexData.change_24h || 0,
            volumeChange7d: dexData.change_7d || 0,
            protocols:
              dexData.protocols?.slice(0, 10).map((protocol: any) => ({
                name: protocol.name,
                volume24h: protocol.volume24h || 0,
                volume7d: protocol.volume7d || 0,
                change24h: protocol.change_24h || 0,
                change7d: protocol.change_7d || 0,
              })) || [],
          }
        : {
            volume24h: 0,
            volume7d: 0,
            volumeChange24h: 0,
            volumeChange7d: 0,
            protocols: [],
          },

      options: optionsData
        ? {
            volume24h: optionsData.total24h || 0,
            volume7d: optionsData.total7d || 0,
            volumeChange24h: optionsData.change_24h || 0,
            protocols: optionsData.protocols || [],
          }
        : {
            volume24h: 0,
            volume7d: 0,
            volumeChange24h: 0,
            protocols: [],
          },

      bridge: bridgeData
        ? {
            totalVolume: bridgeData.reduce(
              (sum: number, entry: any) =>
                sum + (entry.depositUSD || 0) + (entry.withdrawUSD || 0),
              0,
            ),
            inflows: bridgeData.reduce(
              (sum: number, entry: any) => sum + (entry.depositUSD || 0),
              0,
            ),
            outflows: bridgeData.reduce(
              (sum: number, entry: any) => sum + (entry.withdrawUSD || 0),
              0,
            ),
            netFlow: bridgeData.reduce(
              (sum: number, entry: any) =>
                sum + (entry.depositUSD || 0) - (entry.withdrawUSD || 0),
              0,
            ),
          }
        : {
            totalVolume: 0,
            inflows: 0,
            outflows: 0,
            netFlow: 0,
          },

      trading: {
        totalVolume24h: (dexData?.total24h || 0) + (optionsData?.total24h || 0),
        totalVolume7d: (dexData?.total7d || 0) + (optionsData?.total7d || 0),
        dexDominance:
          dexData?.total24h && optionsData?.total24h
            ? (dexData.total24h / (dexData.total24h + optionsData.total24h)) *
              100
            : 100,
        avgDailyVolume:
          ((dexData?.total7d || 0) + (optionsData?.total7d || 0)) / 7,
      },

      growth: {
        volume24hChange: dexData?.change_24h || 0,
        volume7dChange: dexData?.change_7d || 0,
        isGrowing:
          (dexData?.change_24h || 0) > 0 && (dexData?.change_7d || 0) > 0,
      },
    };

    cache.set(cacheKey, volumeMetrics, 300000); // 5 minutes

    apiLogger.info("Aptos volume metrics fetched successfully", {
      dexVolume24h: volumeMetrics.dex.volume24h,
      bridgeVolume: volumeMetrics.bridge.totalVolume,
      totalTradingVolume: volumeMetrics.trading.totalVolume24h,
    });

    return NextResponse.json(volumeMetrics);
  } catch (error) {
    apiLogger.error("Error fetching Aptos volume data:", error);
    return NextResponse.json(
      { error: "Failed to fetch volume data" },
      { status: 500 },
    );
  }
}
