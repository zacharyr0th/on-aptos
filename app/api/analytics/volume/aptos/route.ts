import { NextResponse } from "next/server";

import { apiLogger } from "@/lib/utils/core/logger";
import { UnifiedCache } from "@/lib/utils/cache/unified-cache";

const cache = new UnifiedCache({ ttl: 5 * 60 * 1000 }); // 5 minutes

export async function GET() {
  try {
    const cacheKey = "aptos-volume-context";
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch both global and Aptos-specific volume data concurrently
    const [globalResponse, aptosProtocolsResponse] = await Promise.allSettled([
      fetch("https://api.llama.fi/overview/dexs?excludeTotalDataChart=true", {
        next: { revalidate: 300 },
      }),
      fetch(
        "https://api.llama.fi/overview/dexs/aptos?excludeTotalDataChart=true",
        {
          next: { revalidate: 300 },
        },
      ),
    ]);

    let globalVolume = null;
    let aptosVolume = null;
    let aptosMarketShare = null;

    // Process global volume data
    if (globalResponse.status === "fulfilled" && globalResponse.value.ok) {
      const globalData = await globalResponse.value.json();
      globalVolume = {
        volume24h: globalData.total24h || 0,
        volume7d: globalData.total7d || 0,
        change1d: globalData.change_1d || 0,
        change7d: globalData.change_7d || 0,
      };
    }

    // Process Aptos volume data
    if (
      aptosProtocolsResponse.status === "fulfilled" &&
      aptosProtocolsResponse.value.ok
    ) {
      const aptosData = await aptosProtocolsResponse.value.json();
      aptosVolume = {
        volume24h: aptosData.total24h || 0,
        volume7d: aptosData.total7d || 0,
        change1d: aptosData.change_1d || 0,
        change7d: aptosData.change_7d || 0,
        topProtocols: aptosData.protocols?.slice(0, 5) || [],
      };
    }

    // Calculate market share
    if (globalVolume && aptosVolume && globalVolume.volume24h > 0) {
      aptosMarketShare = (aptosVolume.volume24h / globalVolume.volume24h) * 100;
    }

    const result = {
      globalVolume,
      aptosVolume,
      marketShare: aptosMarketShare,
      lastUpdated: new Date().toISOString(),
    };

    cache.set(cacheKey, result, 300000); // 5 minutes

    apiLogger.info("Aptos volume context data fetched successfully", {
      globalVolume24h: globalVolume?.volume24h || 0,
      aptosVolume24h: aptosVolume?.volume24h || 0,
      marketShare: aptosMarketShare || 0,
    });

    return NextResponse.json(result);
  } catch (error) {
    apiLogger.error("Error fetching Aptos volume context data:", error);
    return NextResponse.json(
      { error: "Failed to fetch volume context data" },
      { status: 500 },
    );
  }
}
