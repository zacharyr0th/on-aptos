import { NextRequest, NextResponse } from "next/server";

import { aptosAnalytics } from "@/lib/services/blockchain/aptos-analytics";
import { apiLogger } from "@/lib/utils/core/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const reserve_asset_type = searchParams.get("reserve_asset_type");
    const date_start = searchParams.get("date_start");
    const date_end = searchParams.get("date_end");

    if (!reserve_asset_type) {
      return NextResponse.json(
        { error: "Missing required parameter: reserve_asset_type" },
        { status: 400 },
      );
    }

    const data = await aptosAnalytics.getAriesPoolAPR({
      reserve_asset_type,
      date_start: date_start || undefined,
      date_end: date_end || undefined,
    });

    return NextResponse.json({ data });
  } catch (error) {
    apiLogger.error("Aries pool APR API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Aries pool APR" },
      { status: 500 },
    );
  }
}
