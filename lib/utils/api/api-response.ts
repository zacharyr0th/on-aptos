/**
 * Enterprise-grade API response utilities
 * Standardized response building and error handling
 */

import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import {
  type APIError,
  APIErrorCode,
  type ResponseMeta,
  type StandardAPIResponse,
} from "@/lib/types/api";
import { logger } from "@/lib/utils/core/logger";

/**
 * Build a successful API response with metadata
 */
export function buildSuccessResponse<T>(
  data: T,
  options: {
    startTime?: number;
    cacheHit?: boolean;
    apiCalls?: number;
    pagination?: ResponseMeta["pagination"];
  } = {}
): StandardAPIResponse<T> {
  const { startTime, cacheHit = false, apiCalls, pagination } = options;

  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: randomUUID(),
      performance: {
        responseTimeMs: startTime ? Date.now() - startTime : 0,
        cacheHit,
        ...(apiCalls && { apiCalls }),
      },
      ...(pagination && { pagination }),
    },
  };
}

/**
 * Build an error API response with proper logging
 */
export function buildErrorResponse(
  code: APIErrorCode,
  message: string,
  details?: Record<string, any>,
  httpStatus: number = 500
): NextResponse<StandardAPIResponse<never>> {
  const isDev = process.env.NODE_ENV === "development";

  const error: APIError = {
    code,
    message,
    ...(details && { details }),
    ...(isDev && details?.stack && { stack: details.stack }),
  };

  const response: StandardAPIResponse<never> = {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: randomUUID(),
    },
  };

  // Log error for monitoring
  logger.error("API Error", {
    code,
    message,
    details,
    httpStatus,
    requestId: response.meta.requestId,
  });

  return NextResponse.json(response, { status: httpStatus });
}

/**
 * Handle common API errors with proper HTTP status codes
 */
export const APIResponses = {
  invalidInput: (message: string, details?: Record<string, any>) =>
    buildErrorResponse(APIErrorCode.INVALID_INPUT, message, details, 400),

  missingParameter: (parameter: string) =>
    buildErrorResponse(
      APIErrorCode.MISSING_PARAMETER,
      `Missing required parameter: ${parameter}`,
      { parameter },
      400
    ),

  invalidAddress: (address: string) =>
    buildErrorResponse(
      APIErrorCode.INVALID_ADDRESS,
      "Invalid Aptos address format",
      { address },
      400
    ),

  rateLimited: (limit: number, windowMs: number) =>
    buildErrorResponse(APIErrorCode.RATE_LIMITED, "Rate limit exceeded", { limit, windowMs }, 429),

  notFound: (resource: string) =>
    buildErrorResponse(APIErrorCode.NOT_FOUND, `${resource} not found`, { resource }, 404),

  internalError: (message: string = "Internal server error", error?: Error) =>
    buildErrorResponse(
      APIErrorCode.INTERNAL_ERROR,
      message,
      error ? { stack: error.stack, name: error.name } : undefined,
      500
    ),

  serviceUnavailable: (service: string) =>
    buildErrorResponse(
      APIErrorCode.SERVICE_UNAVAILABLE,
      `${service} is currently unavailable`,
      { service },
      503
    ),

  timeout: (operation: string) =>
    buildErrorResponse(
      APIErrorCode.TIMEOUT,
      `Operation timed out: ${operation}`,
      { operation },
      504
    ),

  externalAPIError: (service: string, originalError?: string) =>
    buildErrorResponse(
      APIErrorCode.EXTERNAL_API_ERROR,
      `External API error from ${service}`,
      { service, originalError },
      502
    ),
};

/**
 * Wrap async handlers with error catching and response formatting
 */
export function withAPIHandler<T>(
  handler: () => Promise<T>,
  options: {
    startTime?: number;
    operation?: string;
    cacheHit?: boolean;
    apiCalls?: number;
  } = {}
) {
  return async (): Promise<NextResponse<StandardAPIResponse<T>>> => {
    const { startTime = Date.now(), operation = "API operation", cacheHit, apiCalls } = options;

    try {
      const data = await handler();

      const response = buildSuccessResponse(data, {
        startTime,
        cacheHit,
        apiCalls,
      });

      return NextResponse.json(response);
    } catch (error) {
      logger.error(`Error in ${operation}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes("rate limit") || error.message.includes("429")) {
          return APIResponses.rateLimited(100, 60000);
        }

        if (error.message.includes("timeout")) {
          return APIResponses.timeout(operation);
        }

        if (error.message.includes("not found") || error.message.includes("404")) {
          return APIResponses.notFound(operation);
        }

        return APIResponses.internalError(error.message, error);
      }

      return APIResponses.internalError();
    }
  };
}

/**
 * Create cache headers for responses
 */
export function createCacheHeaders(
  maxAge: number,
  staleWhileRevalidate?: number,
  additionalHeaders: Record<string, string> = {}
): Record<string, string> {
  return {
    "Cache-Control": `public, max-age=${maxAge}${
      staleWhileRevalidate ? `, stale-while-revalidate=${staleWhileRevalidate}` : ""
    }`,
    "X-Content-Type": "application/json",
    Vary: "Accept-Encoding",
    ...additionalHeaders,
  };
}
