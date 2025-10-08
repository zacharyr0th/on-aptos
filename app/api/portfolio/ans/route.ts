import { type NextRequest, NextResponse } from "next/server";

import {
  CACHE_DURATIONS,
  errorResponse,
  extractParams,
  getAptosAuthHeaders,
  successResponse,
  validateRequiredParams,
} from "@/lib/utils/api/common";
import { RATE_LIMIT_TIERS, withRateLimit } from "@/lib/utils/api/rate-limiter";
import { apiLogger } from "@/lib/utils/core/logger";

import { PORTFOLIO_CACHE, PORTFOLIO_RATE_LIMIT_NAMES } from "../constants";

export const revalidate = 300;

async function portfolioANSHandler(request: NextRequest) {
  const params = extractParams(request);

  // Validate required parameters
  const validation = validateRequiredParams(params, ["address"]);
  if (validation) {
    return errorResponse(validation, 400);
  }

  const address = params.address!;

  // First, try the official ANS REST API
  try {
    const ansApiUrl = `https://www.aptosnames.com/api/mainnet/v1/primary-name/${address}`;
    // apiLogger.info(`[ANS] Fetching primary name from ANS API for ${address}`);

    const ansResponse = await fetch(ansApiUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "On-Aptos/1.0",
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000),
    });

    if (ansResponse.ok) {
      const ansData = await ansResponse.json();
      if (ansData?.name) {
        return successResponse(
          {
            success: true,
            data: {
              name: ansData.name,
              domain: ansData.name.split(".")[0],
              subdomain: null,
              address: address,
              source: "ans-api",
            },
          },
          PORTFOLIO_CACHE.ANS
        );
      }
    }
  } catch (error) {
    apiLogger.warn(
      `[ANS] ANS API failed, falling back to GraphQL: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Fallback to GraphQL if ANS API fails
  const INDEXER = "https://api.mainnet.aptoslabs.com/v1/graphql";

  // Query for ANS name
  const query = `
      query GetPrimaryName($owner_address: String!) {
        current_aptos_names(
          where: {
            owner_address: {_eq: $owner_address}
            is_primary: {_eq: true}
          }
          limit: 1
        ) {
          domain
          subdomain
          registered_address
          expiration_timestamp
        }
      }
    `;

  const headers = {
    "Content-Type": "application/json",
    ...getAptosAuthHeaders(),
  };

  const response = await fetch(INDEXER, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      variables: {
        owner_address: address.toLowerCase(),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors) {
    // apiLogger.error(`[ANS] GraphQL errors:: ${result.errors instanceof Error ? result.errors.message : result.errors}`);
    throw new Error("GraphQL query failed");
  }

  const primaryName = result.data?.current_aptos_names?.[0];

  if (primaryName) {
    const fullName = primaryName.subdomain
      ? `${primaryName.subdomain}.${primaryName.domain}.apt`
      : `${primaryName.domain}.apt`;

    return successResponse(
      {
        success: true,
        data: {
          name: fullName,
          domain: primaryName.domain,
          subdomain: primaryName.subdomain,
          address: primaryName.registered_address,
          expiration: primaryName.expiration_timestamp,
          source: "graphql",
        },
      },
      PORTFOLIO_CACHE.ANS
    );
  }

  // No primary name found
  return successResponse(
    {
      success: true,
      data: null,
    },
    CACHE_DURATIONS.LONG
  );
}

export const GET = withRateLimit(portfolioANSHandler, {
  name: PORTFOLIO_RATE_LIMIT_NAMES.ANS,
  ...RATE_LIMIT_TIERS.RELAXED, // ANS lookups are lightweight
});
