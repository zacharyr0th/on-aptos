import { NextResponse } from "next/server";

import { apiLogger } from "@/lib/utils/core/logger";
import { UnifiedCache } from "@/lib/utils/cache/unified-cache";

const cache = new UnifiedCache({ ttl: 5 * 60 * 1000 }); // 5 minutes

export async function GET() {
  try {
    const cacheKey = "aptos-protocols-tvl";
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch all protocols
    const protocolsResponse = await fetch("https://api.llama.fi/protocols", {
      next: { revalidate: 300 },
    });

    if (!protocolsResponse.ok) {
      throw new Error(`Protocols API error: ${protocolsResponse.status}`);
    }

    const allProtocols = await protocolsResponse.json();

    // Filter for Aptos protocols
    const aptosProtocols = allProtocols.filter((protocol: any) =>
      protocol.chains?.includes("Aptos"),
    );

    // Sort by TVL and calculate metrics
    const sortedProtocols = aptosProtocols
      .sort((a: any, b: any) => (b.tvl || 0) - (a.tvl || 0))
      .map((protocol: any) => ({
        name: protocol.name,
        tvl: protocol.tvl || 0,
        change1h: protocol.change_1h,
        change1d: protocol.change_1d,
        change7d: protocol.change_7d,
        mcap: protocol.mcap,
        category: protocol.category,
        chains: protocol.chains,
        gecko_id: protocol.gecko_id,
        slug: protocol.slug,
      }));

    // Calculate growth rates and rankings
    const protocolMetrics = {
      totalProtocols: aptosProtocols.length,
      totalTvl: sortedProtocols.reduce((sum: number, p: any) => sum + p.tvl, 0),
      topProtocols: sortedProtocols.slice(0, 20),
      categories: [
        ...new Set(aptosProtocols.map((p: any) => p.category).filter(Boolean)),
      ],
      newProtocols: aptosProtocols.filter((p: any) => {
        // Consider protocols newer than 30 days as "new" (rough estimation)
        return p.tvl < 1000000 && p.tvl > 0; // Small but growing TVL
      }).length,
      growthMetrics: {
        avgChange1d:
          sortedProtocols.reduce(
            (sum: number, p: any) => sum + (p.change1d || 0),
            0,
          ) / sortedProtocols.length,
        avgChange7d:
          sortedProtocols.reduce(
            (sum: number, p: any) => sum + (p.change7d || 0),
            0,
          ) / sortedProtocols.length,
        positiveGrowth1d: sortedProtocols.filter(
          (p: any) => (p.change1d || 0) > 0,
        ).length,
        positiveGrowth7d: sortedProtocols.filter(
          (p: any) => (p.change7d || 0) > 0,
        ).length,
      },
    };

    cache.set(cacheKey, protocolMetrics, 300000); // 5 minutes

    apiLogger.info("Aptos protocol metrics fetched successfully", {
      totalProtocols: protocolMetrics.totalProtocols,
      totalTvl: protocolMetrics.totalTvl,
      categories: protocolMetrics.categories.length,
    });

    return NextResponse.json(protocolMetrics);
  } catch (error) {
    apiLogger.error("Error fetching Aptos protocol data:", error);
    return NextResponse.json(
      { error: "Failed to fetch protocol data" },
      { status: 500 },
    );
  }
}
