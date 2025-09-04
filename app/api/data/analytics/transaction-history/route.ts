import { NextRequest, NextResponse } from "next/server";

import { aptosAnalytics } from "@/lib/services/blockchain/aptos-analytics";
import {
  extractParams,
  errorResponse,
  successResponse,
  CACHE_DURATIONS,
  validateRequiredParams,
  parseNumericParam,
} from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";

async function transactionHistoryHandler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params = extractParams(request);

  const account_address = params.address || searchParams.get("account_address");
  const date_start = searchParams.get("date_start");
  const date_end = searchParams.get("date_end");
  const asset_symbol = searchParams.get("asset_symbol");

  // Validate required parameters
  const validation = validateRequiredParams({ account_address }, [
    "account_address",
  ]);
  if (validation) {
    return errorResponse(validation, 400);
  }

  const data = await aptosAnalytics.getHistoricalTransactions({
    account_address: account_address!,
    date_start: date_start || undefined,
    date_end: date_end || undefined,
    asset_symbol: asset_symbol || undefined,
    limit: params.limit,
    offset: params.offset,
  });

  return successResponse({ data }, CACHE_DURATIONS.SHORT);
}

export const GET = withRateLimit(transactionHistoryHandler, {
  name: "transaction-history",
  ...RATE_LIMIT_TIERS.STANDARD,
});
