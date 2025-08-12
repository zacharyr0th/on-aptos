import { NextRequest, NextResponse } from "next/server";
import { RWAService } from "@/lib/services/asset-types/rwa-service";
import { withErrorHandling, type ErrorContext } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const errorContext: ErrorContext = {
    operation: "RWA Data API",
    service: "RWA-API",
    details: {
      endpoint: "/api/rwa",
      userAgent: request.headers.get("user-agent") || "unknown",
    },
  };

  return withErrorHandling(async () => {
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";
    const data = await RWAService.getRWAData(forceRefresh);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": data.success
          ? "public, max-age=86400, stale-while-revalidate=43200"
          : "public, max-age=60, stale-while-revalidate=120",
        "X-Content-Type": "application/json",
        "X-Service": "rwa-data",
        "X-API-Version": "3.0",
        "X-Data-Source": "RWA.xyz",
        Vary: "Accept-Encoding",
      },
      status: data.success ? 200 : 503,
    });
  }, errorContext);
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}