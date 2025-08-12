import { NextRequest, NextResponse } from "next/server";

import { ApiError, withErrorHandling, type ErrorContext } from "@/lib/utils";
import { enhancedFetch } from "@/lib/utils/api/fetch-utils";

// Revalidate this route every 2 minutes (Panora data is more dynamic)
export const revalidate = 120;

const PANORA_API_ENDPOINT = "https://api.panora.exchange/prices";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenAddresses = searchParams.get("tokens")?.split(",") || [];

  const errorContext: ErrorContext = {
    operation: "Panora Prices API",
    service: "Panora",
    details: {
      endpoint: "/api/prices/panora",
      tokenCount: tokenAddresses.length,
      userAgent: request.headers.get("user-agent")?.slice(0, 50) || "unknown",
    },
  };

  return withErrorHandling(async () => {
    // Get API key from environment
    const apiKey = process.env.PANORA_API_KEY;

    if (!apiKey) {
      throw new ApiError(
        "PANORA_API_KEY environment variable is required",
        500,
        "Config",
      );
    }

    try {
      // Build URL with optional token filter
      let url = PANORA_API_ENDPOINT;
      if (tokenAddresses.length > 0) {
        const params = new URLSearchParams({
          tokenAddress: tokenAddresses.join(","),
        });
        url = `${PANORA_API_ENDPOINT}?${params.toString()}`;
      }

      const response = await enhancedFetch(url, {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "Accept-Encoding": "gzip",
          Accept: "application/json",
          "User-Agent": "OnAptos-Panora/1.0",
        },
        timeout: 10000,
        retries: 3,
        next: { revalidate },
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new ApiError(
          `Panora API error: ${response.status} - ${errorBody}`,
          response.status,
          "Panora-API",
        );
      }

      const data = await response.json();
      const prices = Array.isArray(data) ? data : [];

      if (prices.length === 0) {
        // No price data returned
      }

      // Transform data to consistent format
      const transformedPrices = prices.map((token: any) => ({
        chainId: token.chainId,
        tokenAddress: token.tokenAddress,
        faAddress: token.faAddress,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        usdPrice: parseFloat(token.usdPrice || "0"),
        nativePrice: token.nativePrice,
        iconUrl: token.iconUrl,
      }));

      const responseData = {
        success: true,
        data: transformedPrices,
        count: transformedPrices.length,
        timestamp: new Date().toISOString(),
        source: "Panora Exchange",
      };

      return NextResponse.json(responseData, {
        headers: {
          "Cache-Control": `public, max-age=${revalidate}, stale-while-revalidate=${revalidate * 2}`,
          "X-Content-Type": "application/json",
          "X-Service": "panora-prices",
          "X-API-Version": "2.0",
          "X-Data-Source": "Panora Exchange",
          Vary: "Accept-Encoding",
        },
      });
    } catch (error) {
      // Panora price fetch error

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === "TimeoutError") {
        throw new ApiError(
          "Panora API request timed out",
          504,
          "Panora-Timeout",
        );
      }

      throw new ApiError(
        `Panora price fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
        "Panora",
      );
    }
  }, errorContext);
}
