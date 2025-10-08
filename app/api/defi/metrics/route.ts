import { NextResponse } from "next/server";
import { apiLogger } from "@/lib/utils/core/logger";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    apiLogger.info("Fetching DeFi metrics from DeFiLlama");

    // Fetch Aptos chain data
    const chainsResponse = await fetch("https://api.llama.fi/v2/chains", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!chainsResponse.ok) {
      throw new Error(`Failed to fetch chains: ${chainsResponse.status}`);
    }

    const chains = await chainsResponse.json();
    const aptosChain = chains.find(
      (chain: any) => chain.name === "Aptos" || chain.gecko_id === "aptos"
    );

    if (!aptosChain) {
      throw new Error("Aptos chain not found");
    }

    // Fetch volume data
    let volumeData = null;
    try {
      const volumeResponse = await fetch(
        "https://api.llama.fi/overview/dexs/Aptos?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume"
      );
      if (volumeResponse.ok) {
        volumeData = await volumeResponse.json();
      }
    } catch (error) {
      apiLogger.warn("Failed to fetch volume data:", error);
    }

    // Fetch fees data
    let feesData = null;
    try {
      const feesResponse = await fetch(
        "https://api.llama.fi/overview/fees/Aptos?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyFees"
      );
      if (feesResponse.ok) {
        feesData = await feesResponse.json();
      }
    } catch (error) {
      apiLogger.warn("Failed to fetch fees data:", error);
    }

    // Fetch historical TVL for change calculation
    let tvlChange24h;
    let tvlChange7d;
    try {
      const historicalResponse = await fetch("https://api.llama.fi/v2/historicalChainTvl/Aptos");
      if (historicalResponse.ok) {
        const historicalData = await historicalResponse.json();
        if (Array.isArray(historicalData) && historicalData.length > 0) {
          const currentTvl = aptosChain.tvl;
          const dayAgo = historicalData[historicalData.length - 2];
          const weekAgo = historicalData[Math.max(0, historicalData.length - 8)];

          if (dayAgo && dayAgo.tvl) {
            tvlChange24h = ((currentTvl - dayAgo.tvl) / dayAgo.tvl) * 100;
          }
          if (weekAgo && weekAgo.tvl) {
            tvlChange7d = ((currentTvl - weekAgo.tvl) / weekAgo.tvl) * 100;
          }
        }
      }
    } catch (error) {
      apiLogger.warn("Failed to fetch historical TVL:", error);
    }

    const metrics = {
      tvl: aptosChain.tvl || 0,
      tvlChange24h,
      tvlChange7d,
      spotVolume: volumeData?.total24h || 0,
      volumeChange24h: volumeData?.change_1d,
      fees: {
        total24h: feesData?.total24h || 0,
        change24h: feesData?.change_1d,
      },
      protocols: 50, // Static for now
      lastUpdated: new Date().toISOString(),
    };

    apiLogger.info("DeFi metrics fetched successfully", { tvl: metrics.tvl });

    return NextResponse.json(metrics, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    apiLogger.error("Error fetching DeFi metrics:", error);
    return NextResponse.json({ error: "Failed to fetch DeFi metrics" }, { status: 500 });
  }
}
