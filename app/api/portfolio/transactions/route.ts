import type { NextRequest } from "next/server";

import { TransactionService } from "@/lib/services/portfolio/services/transaction-service";
import {
  errorResponse,
  extractParams,
  parseNumericParam,
  successResponse,
  validateRequiredParams,
} from "@/lib/utils/api/common";
import { apiLogger } from "@/lib/utils/core/logger";

// Simple transactions endpoint for pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = extractParams(request);

  const walletAddress = params.address || params.walletAddress;
  const limit = parseNumericParam(searchParams.get("limit"), 100, 1, 500);
  const offset = parseNumericParam(searchParams.get("offset"), 0, 0, 10000);

  const validation = validateRequiredParams({ walletAddress }, ["walletAddress"]);
  if (validation) {
    return errorResponse(validation, 400);
  }

  try {
    apiLogger.info(
      `Fetching transactions: address=${walletAddress}, limit=${limit}, offset=${offset}`
    );

    const result = await TransactionService.fetchTransactionsWithDetails(
      walletAddress!,
      limit,
      offset
    );

    return successResponse({
      success: true,
      data: result.data || [],
      totalCount: result.totalCount || 0,
    });
  } catch (error) {
    apiLogger.error(`Failed to fetch transactions:`, error);
    return errorResponse(
      `Failed to fetch transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  }
}
