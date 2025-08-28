import { NextResponse } from "next/server";

import { apiLogger } from "@/lib/utils/core/logger";
import { UnifiedCache } from "@/lib/utils/cache/unified-cache";

const cache = new UnifiedCache({ ttl: 5 * 60 * 1000 }); // 5 minutes

export async function GET() {
  try {
    const cacheKey = "aptos-yields";
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch yield pool data
    const poolsResponse = await fetch("https://yields.llama.fi/pools", {
      next: { revalidate: 300 },
    });

    if (!poolsResponse.ok) {
      throw new Error(`Pools API error: ${poolsResponse.status}`);
    }

    const poolsData = await poolsResponse.json();

    // Filter for Aptos pools
    const aptosPools =
      poolsData.data?.filter(
        (pool: any) => pool.chain?.toLowerCase() === "aptos",
      ) || [];

    // Calculate yield metrics
    const yieldMetrics = {
      totalPools: aptosPools.length,
      totalTvl: aptosPools.reduce(
        (sum: number, pool: any) => sum + (pool.tvlUsd || 0),
        0,
      ),
      averageApy:
        aptosPools.reduce(
          (sum: number, pool: any) => sum + (pool.apy || 0),
          0,
        ) / (aptosPools.length || 1),
      medianApy: (() => {
        const apys = aptosPools
          .map((pool: any) => pool.apy || 0)
          .sort((a: number, b: number) => a - b);
        const mid = Math.floor(apys.length / 2);
        return apys.length % 2 === 0
          ? (apys[mid - 1] + apys[mid]) / 2
          : apys[mid];
      })(),
      highestApy: Math.max(...aptosPools.map((pool: any) => pool.apy || 0)),
      topPools: aptosPools
        .sort((a: any, b: any) => (b.tvlUsd || 0) - (a.tvlUsd || 0))
        .slice(0, 20)
        .map((pool: any) => ({
          pool: pool.pool,
          project: pool.project,
          symbol: pool.symbol,
          tvlUsd: pool.tvlUsd || 0,
          apy: pool.apy || 0,
          apyBase: pool.apyBase || 0,
          apyReward: pool.apyReward || 0,
          il7d: pool.il7d,
          volumeUsd1d: pool.volumeUsd1d || 0,
        })),
      categories: {
        dex: aptosPools.filter(
          (pool: any) =>
            pool.project?.toLowerCase().includes("swap") ||
            pool.project?.toLowerCase().includes("dex"),
        ),
        lending: aptosPools.filter(
          (pool: any) =>
            pool.project?.toLowerCase().includes("lend") ||
            pool.project?.toLowerCase().includes("borrow"),
        ),
        staking: aptosPools.filter(
          (pool: any) =>
            pool.project?.toLowerCase().includes("stake") ||
            pool.project?.toLowerCase().includes("staking"),
        ),
        yield: aptosPools.filter(
          (pool: any) =>
            !pool.project?.toLowerCase().includes("swap") &&
            !pool.project?.toLowerCase().includes("dex") &&
            !pool.project?.toLowerCase().includes("lend") &&
            !pool.project?.toLowerCase().includes("borrow") &&
            !pool.project?.toLowerCase().includes("stake"),
        ),
      },
      riskMetrics: {
        stablecoinPools: aptosPools.filter(
          (pool: any) =>
            pool.symbol?.toLowerCase().includes("usdc") ||
            pool.symbol?.toLowerCase().includes("usdt") ||
            pool.symbol?.toLowerCase().includes("dai"),
        ).length,
        highRiskPools: aptosPools.filter((pool: any) => (pool.apy || 0) > 100)
          .length,
        impermanentLossRisk: aptosPools.filter(
          (pool: any) => Math.abs(pool.il7d || 0) > 5,
        ).length,
      },
    };

    cache.set(cacheKey, yieldMetrics, 300000); // 5 minutes

    apiLogger.info("Aptos yield metrics fetched successfully", {
      totalPools: yieldMetrics.totalPools,
      totalTvl: yieldMetrics.totalTvl,
      averageApy: yieldMetrics.averageApy,
    });

    return NextResponse.json(yieldMetrics);
  } catch (error) {
    apiLogger.error("Error fetching Aptos yield data:", error);
    return NextResponse.json(
      { error: "Failed to fetch yield data" },
      { status: 500 },
    );
  }
}
