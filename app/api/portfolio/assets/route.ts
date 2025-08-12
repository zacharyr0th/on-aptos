import { NextRequest } from "next/server";
import { AssetService } from "@/lib/services/portfolio/services/asset-service";
import { withErrorHandling, type ErrorContext } from "@/lib/utils";
import { 
  successResponse, 
  validationError,
  validateParams,
  CACHE_HEADERS 
} from "@/lib/utils/api/standard-response";

// Cache for 5 minutes
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const errorContext: ErrorContext = {
    operation: "Portfolio Assets API",
    service: "Portfolio-Assets",
    details: {
      endpoint: "/api/portfolio/assets",
      userAgent: request.headers.get("user-agent") || "unknown",
    },
  };

  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    // Validate required parameters
    const validation = validateParams({ walletAddress }, ["walletAddress"]);
    if (!validation.valid) {
      return validationError(validation.missing!);
    }

    // Get wallet assets using our service
    const assets = await AssetService.getWalletAssets(walletAddress!);

    // Return response with standard headers
    return successResponse(
      {
        success: true,
        data: {
          assets: assets,
          totalCount: assets.length,
        },
      },
      {
        cache: "SHORT",
        headers: {
          "X-Service": "portfolio-assets",
          "X-API-Version": "2.0",
          "X-Data-Source": "Aptos Indexer",
        },
      }
    );
  }, errorContext);
}