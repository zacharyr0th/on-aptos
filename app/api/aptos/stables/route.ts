import { NextRequest, NextResponse } from "next/server";
import { StablecoinService } from "@/lib/services/asset-types/stablecoin-service";
import { withErrorHandling, type ErrorContext } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const errorContext: ErrorContext = {
    operation: "Stablecoin Supply API",
    service: "Stables-API",
    details: {
      endpoint: "/api/aptos/stables",
      userAgent: request.headers.get("user-agent") || "unknown",
    },
  };

  return withErrorHandling(async () => {
    const data = await StablecoinService.getStablecoinSupplies();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Content-Type": "application/json",
        "X-Service": "stables-data",
        "X-API-Version": "2.0",
        "X-Data-Source": "Aptos Indexer",
        Vary: "Accept-Encoding",
      },
    });
  }, errorContext);
}