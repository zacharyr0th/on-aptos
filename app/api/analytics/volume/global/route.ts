import { NextResponse } from "next/server";

import { apiLogger } from "@/lib/utils/core/logger";
import { UnifiedCache } from "@/lib/utils/cache/unified-cache";

const cache = new UnifiedCache({ ttl: 5 * 60 * 1000 }); // 5 minutes

export async function GET() {
  try {
    const cacheKey = "global-dex-volume";
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch global DEX volume data from DeFiLlama
    const response = await fetch(
      "https://api.llama.fi/overview/dexs?excludeTotalDataChart=true",
      {
        next: { revalidate: 300 },
      },
    );

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status}`);
    }

    const data = await response.json();

    const result = {
      volume24h: data.total24h || 0,
      volume7d: data.total7d || 0,
      volume1d: data.total48hto24h || 0,
      change1d: data.change_1d || 0,
      change7d: data.change_7d || 0,
      lastUpdated: new Date().toISOString(),
    };

    cache.set(cacheKey, result, 300000); // 5 minutes

    apiLogger.info("Global DEX volume data fetched successfully", {
      volume24h: result.volume24h,
      volume7d: result.volume7d,
      change1d: result.change1d,
      change7d: result.change7d,
    });

    return NextResponse.json(result);
  } catch (error) {
    apiLogger.error("Error fetching global DEX volume data:", error);
    return NextResponse.json(
      { error: "Failed to fetch global DEX volume data" },
      { status: 500 },
    );
  }
}
