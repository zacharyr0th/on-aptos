import { NextResponse } from "next/server";

import { apiLogger } from "@/lib/utils/core/logger";
import { UnifiedCache } from "@/lib/utils/cache/unified-cache";

const cache = new UnifiedCache({ ttl: 5 * 60 * 1000 }); // 5 minutes

export async function GET() {
  try {
    const cacheKey = "aptos-tvl";
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch chain comparison data (this also gives us current TVL)
    const chainsResponse = await fetch("https://api.llama.fi/v2/chains", {
      next: { revalidate: 300 },
    });

    let currentTvl = 0;
    let chainsData = null;

    if (chainsResponse.ok) {
      chainsData = await chainsResponse.json();
      const aptos = chainsData.find((chain: any) => chain.name === "Aptos");
      currentTvl = aptos?.tvl || 0;
      apiLogger.info("Aptos TVL from chains endpoint:", currentTvl);
    }

    // Fallback to direct TVL endpoint if chains failed
    if (currentTvl === 0) {
      const tvlResponse = await fetch("https://api.llama.fi/tvl/aptos", {
        next: { revalidate: 300 },
      });

      if (tvlResponse.ok) {
        currentTvl = await tvlResponse.json();
        apiLogger.info(
          "Aptos TVL from direct endpoint (fallback):",
          currentTvl,
        );
      }
    }

    // Fetch historical TVL data
    const historicalResponse = await fetch(
      "https://api.llama.fi/v2/historicalChainTvl/aptos",
      {
        next: { revalidate: 300 },
      },
    );

    let historicalData = null;
    if (historicalResponse.ok) {
      historicalData = await historicalResponse.json();
    }

    // Process chain comparison data
    let chainComparison = null;
    let marketShare = null;

    if (chainsData) {
      const aptos = chainsData.find((chain: any) => chain.name === "Aptos");
      const totalTvl = chainsData.reduce(
        (sum: number, chain: any) => sum + (chain.tvl || 0),
        0,
      );

      chainComparison = {
        aptos: aptos?.tvl || 0,
        totalDeFiTvl: totalTvl,
        aptosRank:
          chainsData
            .sort((a: any, b: any) => (b.tvl || 0) - (a.tvl || 0))
            .findIndex((chain: any) => chain.name === "Aptos") + 1,
        topChains: chainsData
          .sort((a: any, b: any) => (b.tvl || 0) - (a.tvl || 0))
          .slice(0, 10)
          .map((chain: any) => ({
            name: chain.name,
            tvl: chain.tvl || 0,
          })),
      };

      marketShare = aptos ? (aptos.tvl / totalTvl) * 100 : 0;
    }

    const result = {
      currentTvl: currentTvl,
      historical: historicalData,
      chainComparison,
      marketShare,
      lastUpdated: new Date().toISOString(),
    };

    cache.set(cacheKey, result, 300000); // 5 minutes

    apiLogger.info("Aptos TVL data fetched successfully", {
      currentTvl: result.currentTvl,
      historicalPoints: result.historical?.length || 0,
      marketShare: result.marketShare,
    });

    return NextResponse.json(result);
  } catch (error) {
    apiLogger.error("Error fetching Aptos TVL data:", error);
    return NextResponse.json(
      { error: "Failed to fetch TVL data" },
      { status: 500 },
    );
  }
}
