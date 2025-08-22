import { NextRequest, NextResponse } from "next/server";

import { createApiResponse } from "@/lib/utils/api-response";
import { SimpleCache } from "@/lib/utils/simple-cache";

export const runtime = "edge";

interface PriceData {
  symbol: string;
  price: number;
  change24h?: number;
  source: string;
}

const priceCache = new SimpleCache<unknown>(5 * 60 * 1000); // 5 minutes

// interface PriceRequest {
//   tokens?: string[]; // Token addresses or symbols
//   source?: "panora" | "cmc" | "all";
// }

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tokens = searchParams.get("tokens")?.split(",") || [];
    const source = searchParams.get("source") || "panora";

    const cacheKey = `prices-${source}-${tokens.join(",")}`;
    const cached = priceCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "X-Cache": "HIT",
        },
      });
    }

    const prices: Record<string, unknown> = {};

    // Fetch from Panora
    if (source === "panora" || source === "all") {
      try {
        const panoraUrl =
          tokens.length > 0
            ? `https://api.panora.exchange/prices?tokenAddress=${tokens.join(",")}`
            : "https://api.panora.exchange/prices";

        const panoraResponse = await fetch(panoraUrl, {
          headers: {
            "x-api-key":
              "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi",
          },
        });

        if (panoraResponse.ok) {
          const panoraData = await panoraResponse.json();
          prices.panora = panoraData;
        }
      } catch (error) {
        apiLogger.error(`Failed to fetch Panora prices: ${error}`);
      }
    }

    // Fetch from CoinMarketCap for specific tokens
    if (source === "cmc" || source === "all") {
      const cmcTokens = ["BTC", "APT", "USDC", "USDT"];
      const cmcPrices: Record<string, PriceData> = {};

      for (const token of cmcTokens) {
        if (tokens.length === 0 || tokens.includes(token.toLowerCase())) {
          try {
            // This would fetch from CMC API
            // For now, using placeholder
            cmcPrices[token] = {
              symbol: token,
              price: 0,
              change24h: 0,
              source: "cmc",
            };
          } catch (error) {
            apiLogger.error(`Failed to fetch CMC price for ${token}: ${error}`);
          }
        }
      }

      if (Object.keys(cmcPrices).length > 0) {
        prices.cmc = cmcPrices;
      }
    }

    // Format response to match what APTChart expects
    let formattedData: unknown[] = [];

    if (prices.panora && Array.isArray(prices.panora)) {
      formattedData = prices.panora.map((item: Record<string, unknown>) => ({
        ...item,
        price_usd: item.usdPrice || item.price || "0",
      }));
    }

    const result = {
      data: formattedData,
      timestamp: Date.now(),
      source: source === "all" ? ["panora", "cmc"] : [source],
    };

    priceCache.set(cacheKey, result);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    apiLogger.error(`Failed to fetch current prices: ${error}`);
    return createApiResponse(
      { error: "Failed to fetch current prices" },
      500,
      "/api/prices/current",
    );
  }
}
