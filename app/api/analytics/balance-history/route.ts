import { NextRequest, NextResponse } from "next/server";

import { aptosAnalytics } from "@/lib/services/blockchain/aptos-analytics";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const account_address =
      searchParams.get("address") || searchParams.get("account_address");
    const lookback = searchParams.get("lookback") as "year" | "all";

    if (!account_address || !lookback) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const data = await aptosAnalytics.getHistoricalStoreBalances({
      account_address,
      lookback,
    });

    return NextResponse.json({ data });
  } catch {
    // Error handled
    return NextResponse.json(
      { error: "Failed to fetch balance history" },
      { status: 500 },
    );
  }
}
