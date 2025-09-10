/**
 * External API clients with standardized error handling and retry logic
 * Consolidates patterns found across data API routes
 */

import { type NextRequest, NextResponse } from "next/server";
import { apiLogger } from "../core/logger";
import { getAptosAuthHeaders } from "./common";
import { STANDARD_CORS_HEADERS } from "./cors-handler";

/**
 * CoinMarketCap API Client
 * Used by /data/prices/cmc/* routes
 */
export class CMCClient {
  private static readonly BASE_URL = "https://pro-api.coinmarketcap.com/v1";
  private static readonly USER_AGENT = "OnAptos-Service/1.0";

  private static get apiKey(): string {
    const key = process.env.CMC_API_KEY;
    if (!key) {
      throw new Error("CMC API key is required but not configured");
    }
    return key;
  }

  static async fetchQuote(id: string): Promise<any> {
    const url = `${CMCClient.BASE_URL}/cryptocurrency/quotes/latest?id=${id}`;

    apiLogger.debug("CMC API request", { url, id });

    const response = await fetch(url, {
      headers: {
        "X-CMC_PRO_API_KEY": CMCClient.apiKey,
        Accept: "application/json",
        "User-Agent": CMCClient.USER_AGENT,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      const errorMessage = `CMC API error: ${response.status} - ${errorBody}`;
      apiLogger.error("CMC API failed", {
        status: response.status,
        error: errorBody,
      });
      throw new Error(errorMessage);
    }

    return response.json();
  }

  static async fetchBySymbol(symbol: string): Promise<any> {
    const url = `${CMCClient.BASE_URL}/cryptocurrency/quotes/latest?symbol=${symbol}`;

    apiLogger.debug("CMC API request by symbol", { url, symbol });

    const response = await fetch(url, {
      headers: {
        "X-CMC_PRO_API_KEY": CMCClient.apiKey,
        Accept: "application/json",
        "User-Agent": CMCClient.USER_AGENT,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      const errorMessage = `CMC API error: ${response.status} - ${errorBody}`;
      apiLogger.error("CMC API failed", {
        status: response.status,
        error: errorBody,
      });
      throw new Error(errorMessage);
    }

    return response.json();
  }
}

/**
 * Aptos GraphQL Client
 * Used by analytics/* routes and other GraphQL endpoints
 */
export class AptosGraphQLClient {
  private static readonly MAINNET_ENDPOINT = "https://api.mainnet.aptoslabs.com/v1/graphql";

  static async query<T>(
    query: string,
    variables?: Record<string, any>,
    options?: { timeout?: number }
  ): Promise<T | null> {
    const controller = new AbortController();
    const timeoutId = options?.timeout
      ? setTimeout(() => controller.abort(), options.timeout)
      : null;

    try {
      apiLogger.debug("GraphQL request", {
        endpoint: AptosGraphQLClient.MAINNET_ENDPOINT,
        hasVariables: !!variables,
        timeout: options?.timeout,
      });

      const response = await fetch(AptosGraphQLClient.MAINNET_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAptosAuthHeaders(),
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`GraphQL HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        apiLogger.warn("GraphQL query returned errors", {
          errors: result.errors,
          query: query.substring(0, 100) + "...",
        });
        return null;
      }

      return result.data as T;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  static async queryWithRetry<T>(
    query: string,
    variables?: Record<string, any>,
    maxRetries = 2
  ): Promise<T | null> {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await AptosGraphQLClient.query<T>(query, variables, { timeout: 10000 });
      } catch (error) {
        apiLogger.warn(`GraphQL attempt ${attempt} failed`, {
          error: error instanceof Error ? error.message : String(error),
          attempt,
          maxRetries: maxRetries + 1,
        });

        if (attempt > maxRetries) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 2 ** (attempt - 1) * 1000));
      }
    }

    return null;
  }
}

/**
 * Deprecated Route Handler
 * Handles redirects for deprecated API endpoints
 */
export class DeprecationHandler {
  static async createRedirect(
    request: NextRequest,
    newEndpoint: string,
    params?: Record<string, string>
  ): Promise<NextResponse> {
    const baseUrl = request.nextUrl.origin;
    const redirectUrl = new URL(`${baseUrl}${newEndpoint}`);

    // Copy existing query params
    request.nextUrl.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });

    // Add custom params
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        redirectUrl.searchParams.set(key, value);
      });
    }

    try {
      apiLogger.info("Deprecated endpoint redirect", {
        from: request.nextUrl.pathname,
        to: newEndpoint,
        params: Object.fromEntries(redirectUrl.searchParams),
      });

      const response = await fetch(redirectUrl.toString(), {
        headers: {
          // Forward important headers
          "User-Agent": request.headers.get("User-Agent") || "OnAptos-DeprecatedRedirect/1.0",
          Accept: request.headers.get("Accept") || "application/json",
        },
      });

      const data = await response.json();

      return NextResponse.json(data, {
        status: response.status,
        headers: {
          "X-Deprecated": "true",
          "X-Redirect-To": newEndpoint,
          "X-Original-Endpoint": request.nextUrl.pathname,
          ...STANDARD_CORS_HEADERS,
        },
      });
    } catch (error) {
      apiLogger.error("Redirect failed", {
        from: request.nextUrl.pathname,
        to: newEndpoint,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return error response with deprecation notice
      return NextResponse.json(
        {
          error: "Deprecated endpoint redirect failed",
          message: `This endpoint is deprecated. Please use ${newEndpoint} instead.`,
          redirectTo: newEndpoint,
        },
        {
          status: 502,
          headers: {
            "X-Deprecated": "true",
            "X-Redirect-To": newEndpoint,
            "X-Redirect-Error": "true",
            ...STANDARD_CORS_HEADERS,
          },
        }
      );
    }
  }
}
