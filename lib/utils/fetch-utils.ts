import { CACHE_CONFIG } from "@/lib/config/cache";
import { errorLogger } from "@/lib/utils/core/logger";
import { dedupeFetch } from "./cache/request-deduplication";
import { ApiError, TimeoutError } from "./core/errors";
import type { BatchRequestOptions, FetchOptions, GraphQLRequest, RateLimitInfo } from "./types";

/**
 * Enhanced fetch with retry, timeout, and exponential backoff
 * This is the centralized HTTP client for the entire application
 */
export async function enhancedFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const {
    retries = CACHE_CONFIG.RETRY.MAX_ATTEMPTS,
    retryDelay = CACHE_CONFIG.RETRY.BASE_DELAY,
    timeout = CACHE_CONFIG.TIMEOUT.DEFAULT,
    retryCondition = (response) => !response.ok && response.status >= 500,
    ...fetchOptions
  } = options;

  // Set up timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchWithTimeout = {
    ...fetchOptions,
    signal: controller.signal,
  };

  try {
    // Use deduplicated fetch for GET requests, regular fetch for mutations
    const isGetRequest = !fetchOptions.method || fetchOptions.method.toUpperCase() === "GET";
    const response = isGetRequest
      ? await dedupeFetch(url, fetchWithTimeout)
      : await fetch(url, fetchWithTimeout);
    clearTimeout(timeoutId);

    // Don't retry client errors (4xx) or rate limits (429)
    if (response.status === 429 || (response.status >= 400 && response.status < 500)) {
      return response;
    }

    // Use custom retry condition or default server error retry
    if (retryCondition(response) && retries > 0) {
      const nextDelay = Math.min(
        retryDelay * CACHE_CONFIG.RETRY.BACKOFF_FACTOR,
        CACHE_CONFIG.RETRY.MAX_DELAY
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return enhancedFetch(url, {
        ...options,
        retries: retries - 1,
        retryDelay: nextDelay,
      });
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError(`Request timeout after ${timeout}ms`, timeout);
    }

    if (retries > 0) {
      const nextDelay = Math.min(
        retryDelay * CACHE_CONFIG.RETRY.BACKOFF_FACTOR,
        CACHE_CONFIG.RETRY.MAX_DELAY
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return enhancedFetch(url, {
        ...options,
        retries: retries - 1,
        retryDelay: nextDelay,
      });
    }

    throw error;
  }
}

/**
 * GraphQL request helper with standardized error handling
 */
export async function graphQLRequest<T = unknown>(
  endpoint: string,
  request: GraphQLRequest,
  options: FetchOptions = {}
): Promise<T> {
  const response = await enhancedFetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(request),
    cache: "no-store",
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(
      `GraphQL request failed: ${response.status} ${response.statusText}`,
      response.status,
      "GraphQL"
    );
  }

  const result = await response.json();

  // Check for GraphQL errors
  if (result.errors && result.errors.length > 0) {
    throw new ApiError(
      `GraphQL errors: ${result.errors.map((e: { message: string }) => e.message).join(", ")}`,
      undefined,
      "GraphQL"
    );
  }

  return result.data || result;
}

/**
 * API request with consistent error handling and logging
 */
export async function apiRequest<T>(
  url: string,
  options: FetchOptions = {},
  context: string = "API"
): Promise<T> {
  try {
    const response = await enhancedFetch(url, options);

    if (!response.ok) {
      errorLogger.error(
        {
          url,
          status: response.status,
          statusText: response.statusText,
        },
        `${context} request failed`
      );
      throw new ApiError(`${context} request failed: ${response.status}`, response.status, context);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError || error instanceof TimeoutError) {
      throw error;
    }

    errorLogger.error(
      `${context} request error: ${error instanceof Error ? error.message : String(error)}`
    );
    throw new ApiError(
      `${context} request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      undefined,
      context
    );
  }
}

/**
 * Batch requests with concurrency control
 */
export async function batchRequests<T>(
  requests: (() => Promise<T>)[],
  options: BatchRequestOptions = {}
): Promise<T[]> {
  const { concurrency = 3, delayBetween = 100 } = options;
  const results: T[] = [];

  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((request) =>
        request().catch((error) => {
          errorLogger.error(
            `Batch request failed: ${error instanceof Error ? error.message : String(error)}`
          );
          return null; // Return null for failed requests
        })
      )
    );

    results.push(...(batchResults.filter(Boolean) as T[]));

    // Add delay between batches to avoid rate limiting
    if (i + concurrency < requests.length && delayBetween > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetween));
    }
  }

  return results;
}

// Re-export for backward compatibility and convenience
export const fetchWithRetry = enhancedFetch;

// ===== CLIENT-SIDE API UTILITIES (formerly from client-api.ts) =====

/**
 * Get security headers for client-side responses
 * This is a simplified version for browser environments
 */
export function getClientSecurityHeaders(rateLimitInfo: RateLimitInfo): Record<string, string> {
  return {
    "X-RateLimit-Limit": rateLimitInfo.remaining.toString(),
    "X-RateLimit-Remaining": rateLimitInfo.remaining.toString(),
    "X-RateLimit-Reset": (rateLimitInfo.resetInSeconds || 60).toString(),
    "X-RateLimit-Burst-Remaining": rateLimitInfo.burstRemaining.toString(),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
  };
}

/**
 * Client-side rate limit info parser for response headers
 */
export function parseRateLimitHeaders(headers: Headers): RateLimitInfo {
  return {
    allowed: true, // If we got a response, it was allowed
    remaining: parseInt(headers.get("X-RateLimit-Remaining") || "0", 10),
    resetInSeconds: parseInt(headers.get("X-RateLimit-Reset") || "60", 10),
    burstRemaining: parseInt(headers.get("X-RateLimit-Burst-Remaining") || "0", 10),
  };
}

/**
 * Check if a response indicates rate limiting
 */
export function isRateLimited(response: Response): boolean {
  return response.status === 429;
}

/**
 * Extract retry delay from response headers
 */
export function getRetryDelay(response: Response): number {
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) {
    const delay = parseInt(retryAfter, 10);
    return isNaN(delay) ? 60 : delay;
  }
  return 60; // Default 60 seconds
}
