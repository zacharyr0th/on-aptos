import type { NextRequest } from "next/server";

import {
  errorResponse,
  extractParams,
  successResponse,
  validateRequiredParams,
} from "@/lib/utils/api/common";
import { RATE_LIMIT_TIERS, withRateLimit } from "@/lib/utils/api/rate-limiter";
import { logger } from "@/lib/utils/core/logger";

import { PORTFOLIO_CACHE, PORTFOLIO_RATE_LIMIT_NAMES } from "../../constants";

export const revalidate = 300;

async function portfolioANSNamesHandler(request: NextRequest) {
  try {
    const params = extractParams(request);

    // Validate required parameters
    const validation = validateRequiredParams(params, ["address"]);
    if (validation) {
      return errorResponse(validation, 400);
    }

    const address = params.address!;

    // Validate address format
    if (!/^0x[a-fA-F0-9]{1,64}$/.test(address)) {
      return errorResponse("Invalid Aptos address format", 400);
    }

    // First try the ANS API
    try {
      const ansApiUrl = `https://www.aptosnames.com/api/mainnet/v1/name/${address}`;

      const ansResponse = await fetch(ansApiUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "On-Aptos/1.0",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (ansResponse.ok) {
        const ansData = await ansResponse.json();
        if (ansData?.name) {
          // ANS API returns single name, convert to array format
          const nameList = [ansData.name];
          return successResponse(
            {
              success: true,
              data: nameList,
              source: "ans-api",
            },
            PORTFOLIO_CACHE.ANS
          );
        }
      }
    } catch {
      logger.warn(`[ANS] ANS API failed for names, falling back to GraphQL`);
    }

    // Fallback to GraphQL
    try {
      const APTOS_GRAPHQL_URL = "https://api.mainnet.aptoslabs.com/v1/graphql";

      const query = `
    query GetAccountNames($owner_address: String!) {
      current_aptos_names(
        where: {
          owner_address: { _eq: $owner_address }
        }
        order_by: {
          is_primary: desc
          last_transaction_version: desc
        }
      ) {
        domain
        subdomain
        is_primary
      }
    }
  `;

      const response = await fetch(APTOS_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { owner_address: address },
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      const names = result.data?.current_aptos_names || [];

      // Format the names as the ANS service does
      const nameList = names
        .filter((name: any) => name.domain && !name.subdomain)
        .map((name: any) => `${name.domain}.apt`)
        .concat(
          names
            .filter((name: any) => name.subdomain && name.domain)
            .map((name: any) => `${name.subdomain}.${name.domain}.apt`)
        );

      return successResponse(
        {
          success: true,
          data: nameList,
          source: "graphql",
        },
        PORTFOLIO_CACHE.ANS
      );
    } catch (error) {
      // If GraphQL also fails, return empty list instead of error
      logger.warn(`[ANS] Both ANS API and GraphQL failed: ${error}`);
      return successResponse(
        {
          success: true,
          data: [],
          source: "none",
        },
        PORTFOLIO_CACHE.ANS
      );
    }
  } catch (error) {
    // Catch-all for any unexpected errors
    logger.warn(`[ANS] Unexpected error: ${error}`);
    return successResponse(
      {
        success: true,
        data: [],
        source: "error",
      },
      PORTFOLIO_CACHE.ANS
    );
  }
}

export const GET = withRateLimit(portfolioANSNamesHandler, {
  name: PORTFOLIO_RATE_LIMIT_NAMES.ANS_NAMES,
  maxRequests: RATE_LIMIT_TIERS.STANDARD.maxRequests,
  windowMs: RATE_LIMIT_TIERS.STANDARD.windowMs,
});
