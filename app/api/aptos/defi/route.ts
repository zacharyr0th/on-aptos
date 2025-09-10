import type { NextRequest } from "next/server";

import { DeFiService } from "@/lib/services/defi/services/defi-service";
import {
  errorResponse,
  extractParams,
  successResponse,
  validateRequiredParams,
} from "@/lib/utils/api/common";

// Direct DeFi route using service (no longer forwarding to deleted portfolio route)
export async function GET(request: NextRequest) {
  const params = extractParams(request);

  const validation = validateRequiredParams(params, ["walletAddress"]);
  if (validation) {
    return errorResponse(validation, 400);
  }

  try {
    const positions = await DeFiService.getWalletDeFiPositions(params.walletAddress!);
    return successResponse({
      success: true,
      data: positions,
    });
  } catch (error) {
    return errorResponse(
      `Failed to fetch DeFi positions: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  }
}
