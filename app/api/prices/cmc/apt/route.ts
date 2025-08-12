import { NextRequest } from "next/server";

import { SERVICE_CONFIG } from "@/lib/config/cache";
import { PriceResponse } from "@/lib/types/api";
import { withAPIHandler } from "@/lib/utils/api/api-response";
import { enhancedFetch } from "@/lib/utils/api/fetch-utils";

// Revalidate this route every 1 minute
export const revalidate = 60;

export async function GET(_request: NextRequest) {
  const startTime = Date.now();

  return await withAPIHandler(
    async (): Promise<PriceResponse> => {
      // Validate API key
      const apiKey = process.env.CMC_API_KEY;
      if (!apiKey) {
        throw new Error("CMC API key is required but not configured");
      }

      // apiLogger.info("[CMC APT] Fetching APT price from CoinMarketCap");

      // APT's ID on CMC is 21794
      const response = await enhancedFetch(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=21794",
        {
          headers: {
            "X-CMC_PRO_API_KEY": apiKey,
            Accept: "application/json",
            "User-Agent": "OnAptos-APT-Tracker/1.0",
          },
          timeout: SERVICE_CONFIG.prices.timeout,
          next: { revalidate },
        },
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new Error(`CMC API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      const aptData = data?.data?.["21794"];
      const price = aptData?.quote?.USD?.price;

      if (typeof price !== "number" || price <= 0) {
        throw new Error("Invalid APT price data received from CMC");
      }

      // apiLogger.info(`[CMC APT] Successfully fetched APT price: $${price}`);

      return {
        price: {
          symbol: "APT",
          price,
          change24h: aptData?.quote?.USD?.percent_change_24h || 0,
          marketCap: aptData?.quote?.USD?.market_cap || 0,
          volume24h: aptData?.quote?.USD?.volume_24h || 0,
          lastUpdated: new Date().toISOString(),
        },
        source: "CoinMarketCap",
      };
    },
    {
      startTime,
      operation: "CMC APT Price Fetch",
      apiCalls: 1,
      cacheHit: false,
    },
  )();
}
