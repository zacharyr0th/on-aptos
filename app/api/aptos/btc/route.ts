import type { NextRequest } from "next/server";
import { SERVICE_CONFIG } from "@/lib/config/cache";
import { BitcoinService } from "@/lib/services/asset-types/bitcoin-service";
import {
  ApiError,
  buildFreshResponse,
  type ErrorContext,
  formatApiError,
  withErrorHandling,
} from "@/lib/utils";
import { apiLogger } from "@/lib/utils/core/logger";
import { withApiEnhancements } from "@/lib/utils/server";

export async function GET(request: NextRequest) {
  const errorContext: ErrorContext = {
    operation: "BTC API route",
    service: "BTC-API",
    details: {
      endpoint: "/api/aptos/btc",
      userAgent: request.headers.get("user-agent") || "unknown",
    },
  };

  return withApiEnhancements(
    () =>
      withErrorHandling(async () => {
        try {
          const startTime = Date.now();
          const data = await BitcoinService.getBTCSupplyDetailed(false);

          // Return data directly - withApiEnhancements will wrap it
          return data;
        } catch (error) {
          apiLogger.error("BTC API route error:", formatApiError(error));

          if (error instanceof Error) {
            throw new ApiError(
              `BTC supplies fetch failed: ${error.message}`,
              undefined,
              "BTC-Route"
            );
          }
          throw new ApiError("BTC supplies fetch failed: Unknown error", undefined, "BTC-Route");
        }
      }, errorContext),
    {
      customHeaders: {
        "Cache-Control": `public, max-age=${Math.floor(SERVICE_CONFIG.btc.ttl / 1000)}, stale-while-revalidate=${Math.floor(SERVICE_CONFIG.btc.ttl / 2000)}`,
        "X-Content-Type": "application/json",
        "X-Service": "btc-supplies",
        "X-API-Version": "1.0",
        Vary: "Accept-Encoding",
      },
    }
  );
}
