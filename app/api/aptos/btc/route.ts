import { NextRequest, NextResponse } from "next/server";
import { BitcoinService } from "@/lib/services/asset-types/bitcoin-service";
import { withErrorHandling, type ErrorContext } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const errorContext: ErrorContext = {
    operation: "Bitcoin Supply API",
    service: "BTC-API",
    details: {
      endpoint: "/api/aptos/btc",
      userAgent: request.headers.get("user-agent") || "unknown",
    },
  };

  return withErrorHandling(async () => {
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";
    const data = await BitcoinService.getBTCSupplyDetailed(forceRefresh);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": data.success
          ? "public, s-maxage=300, stale-while-revalidate=600" 
          : "public, max-age=60, stale-while-revalidate=120",
        "X-Content-Type": "application/json",
        "X-Service": "btc-supply",
        "X-API-Version": "2.0",
        "X-Data-Source": "Aptos Indexer",
        Vary: "Accept-Encoding",
      },
      status: data.success ? 200 : 503,
    });
  }, errorContext);
}