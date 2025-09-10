import type { NextRequest } from "next/server";

import { aptosAnalytics } from "@/lib/services/blockchain/aptos-analytics";
import {
  CACHE_DURATIONS,
  errorResponse,
  extractParams,
  successResponse,
  validateRequiredParams,
} from "@/lib/utils/api/common";
import { RATE_LIMIT_TIERS, withRateLimit } from "@/lib/utils/api/rate-limiter";

async function handler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params = extractParams(request);

  const account_address = params.address || searchParams.get("account_address");
  const lookback = searchParams.get("lookback") as "year" | "all";

  const validationError = validateRequiredParams({ account_address, lookback }, [
    "account_address",
    "lookback",
  ]);

  if (validationError) {
    return errorResponse(validationError, 400);
  }

  try {
    const data = await aptosAnalytics.getHistoricalStoreBalances({
      account_address: account_address!,
      lookback: lookback!,
    });

    return successResponse({ data }, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    return errorResponse(
      "Failed to fetch balance history",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

export const GET = withRateLimit(handler, {
  name: "balance-history",
  ...RATE_LIMIT_TIERS.STANDARD,
});
