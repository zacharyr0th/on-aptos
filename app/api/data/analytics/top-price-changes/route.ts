import { NextRequest, NextResponse } from "next/server";

import { aptosAnalytics } from "@/lib/services/blockchain/aptos-analytics";
import { apiLogger } from "@/lib/utils/core/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const lookback = searchParams.get("lookback") as
      | "hour"
      | "day"
      | "week"
      | "month";
    const limit = searchParams.get("limit");
    const only_emoji = searchParams.get("only_emoji");
    const gainers = searchParams.get("gainers");

    if (!lookback) {
      return NextResponse.json(
        { error: "Missing required parameter: lookback" },
        { status: 400 },
      );
    }

    const data = await aptosAnalytics.getTopPriceChanges({
      lookback,
      limit: limit ? parseInt(limit) : undefined,
      only_emoji: only_emoji === "true",
      gainers: gainers !== "false", // defaults to true
    });

    return NextResponse.json({ data });
  } catch (error) {
    apiLogger.error("Top price changes API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch top price changes" },
      { status: 500 },
    );
  }
}
