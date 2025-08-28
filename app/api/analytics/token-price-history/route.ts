import { NextRequest, NextResponse } from "next/server";

import { aptosAnalytics } from "@/lib/services/blockchain/aptos-analytics";
import {
  extractParams,
  errorResponse,
  successResponse,
  CACHE_DURATIONS,
  validateRequiredParams,
} from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";

async function tokenPriceHistoryHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params = extractParams(request);

  const address = params.address || searchParams.get("tokenAddress");
  const lookback = (searchParams.get("lookback") ||
    searchParams.get("timeframe")) as
    | "hour"
    | "day"
    | "week"
    | "month"
    | "year"
    | "all";
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");
  const downsample_to = searchParams.get("downsample_to");

  // Validate required parameters
  const validation = validateRequiredParams(
    { address: address || undefined, lookback: lookback || undefined },
    ["address", "lookback"],
  );
  if (validation) {
    return errorResponse(validation, 400);
  }

  const data = await aptosAnalytics.getTokenHistoricalPrices({
    address: address!,
    lookback: lookback!,
    limit: limit ? parseInt(limit) : undefined,
    offset: offset ? parseInt(offset) : undefined,
    downsample_to: downsample_to ? parseInt(downsample_to) : undefined,
  });

  return successResponse({ data }, CACHE_DURATIONS.MEDIUM);
}

export const GET = withRateLimit(tokenPriceHistoryHandler, {
  name: "token-price-history",
  ...RATE_LIMIT_TIERS.STANDARD,
});
