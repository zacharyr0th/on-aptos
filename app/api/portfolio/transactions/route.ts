import { NextRequest, NextResponse } from "next/server";

import { TransactionService } from "@/lib/services/portfolio/services/transaction-service";
import { apiLogger } from "@/lib/utils/core/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (!address) {
      apiLogger.warn("Transaction API: Missing address parameter");
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 },
      );
    }

    // Use the shared TransactionService
    const result = await TransactionService.fetchTransactionsWithDetails(
      address,
      limit,
      offset,
    );

    if (!result.success) {
      throw new Error("Failed to fetch transactions");
    }

    apiLogger.info(
      `Transaction fetch completed: ${result.data.length} transactions, ${result.totalCount} total`,
    );

    return NextResponse.json(
      {
        success: result.success,
        data: result.data,
        count: result.data.length,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        nextOffset: result.nextOffset,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    apiLogger.error("Transaction API error", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transactions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
