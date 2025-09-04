import { NextResponse } from "next/server";

import { apiLogger } from "@/lib/utils/core/logger";
import { UnifiedCache } from "@/lib/utils/cache/unified-cache";

const cache = new UnifiedCache({ ttl: 5 * 60 * 1000 }); // 5 minutes

export async function GET() {
  try {
    const cacheKey = "stablecoin-metrics";
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch stablecoin market cap data
    const stablecoinResponse = await fetch(
      "https://stablecoins.llama.fi/stablecoins",
      {
        next: { revalidate: 300 },
      },
    );

    if (!stablecoinResponse.ok) {
      throw new Error(`Stablecoin API error: ${stablecoinResponse.status}`);
    }

    const stablecoinsData = await stablecoinResponse.json();

    // Fetch Aptos-specific stablecoin data
    const chainsResponse = await fetch(
      "https://stablecoins.llama.fi/stablecoinchains",
      {
        next: { revalidate: 300 },
      },
    );

    let aptosStableData = null;
    if (chainsResponse.ok) {
      const chainsData = await chainsResponse.json();
      aptosStableData = chainsData.find(
        (chain: any) =>
          chain.name.toLowerCase() === "aptos" || chain.gecko_id === "aptos",
      );
    }

    // Process stablecoin metrics
    const stablecoinMetrics = {
      global: {
        totalMarketCap: stablecoinsData?.totalMcap || 0,
        totalStablecoins: stablecoinsData?.stablecoins?.length || 0,
        dominance:
          stablecoinsData?.stablecoins?.slice(0, 3).map((stable: any) => ({
            name: stable.name,
            symbol: stable.symbol,
            mcap: stable.mcap,
            dominancePercentage:
              (stable.mcap / stablecoinsData.totalMcap) * 100,
          })) || [],
      },
      aptos: {
        totalMarketCap: aptosStableData?.totalCirculating || 0,
        stablecoins:
          aptosStableData?.stablecoins?.map((stable: any) => ({
            name: stable.name,
            symbol: stable.symbol,
            circulating: stable.circulating,
            dominancePercentage:
              aptosStableData.totalCirculating > 0
                ? (stable.circulating / aptosStableData.totalCirculating) * 100
                : 0,
            pegStability: Math.abs(1 - (stable.price || 1)), // Distance from $1 peg
          })) || [],
        pegStability:
          aptosStableData?.stablecoins?.reduce(
            (avg: number, stable: any, index: number, array: any[]) => {
              const stability = 1 - Math.abs(1 - (stable.price || 1));
              return avg + stability / array.length;
            },
            0,
          ) || 0,
      },
      growth: {
        // Calculate growth metrics if historical data available
        marketCapGrowth: 0, // Placeholder
        adoptionGrowth: 0, // Placeholder
      },
    };

    cache.set(cacheKey, stablecoinMetrics, 300000); // 5 minutes

    apiLogger.info("Stablecoin metrics fetched successfully", {
      globalTotalMcap: stablecoinMetrics.global.totalMarketCap,
      aptosTotalMcap: stablecoinMetrics.aptos.totalMarketCap,
      aptosStablecoins: stablecoinMetrics.aptos.stablecoins.length,
    });

    return NextResponse.json(stablecoinMetrics);
  } catch (error) {
    apiLogger.error("Error fetching stablecoin metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch stablecoin metrics" },
      { status: 500 },
    );
  }
}
