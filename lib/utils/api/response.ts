/**
 * Consolidated API Response Utilities
 * Enterprise-grade response building and error handling
 * Combines functionality from all previous response builders
 */

import { NextResponse } from "next/server";
import {
  type APIError,
  APIErrorCode,
  type ResponseMeta,
  type StandardAPIResponse,
} from "@/lib/types/api";
import { logger } from "@/lib/utils/core/logger";

// Use crypto from global object for edge compatibility
const randomUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ===== TYPES =====

export interface ResponseOptions {
  startTime?: number;
  cacheHit?: boolean;
  cached?: boolean;
  apiCalls?: number;
  pagination?: ResponseMeta["pagination"];
  source?: string;
  requestId?: string;
}

export interface CacheOptions {
  maxAge?: number;
  staleWhileRevalidate?: number;
  cacheControl?: string;
}

export interface ErrorContext {
  operation: string;
  service: string;
  details?: Record<string, unknown>;
}

// ===== CONSTANTS =====

/**
 * Standard cache durations in seconds
 */
export const CACHE_DURATIONS = {
  INSTANT: 0,
  VERY_SHORT: 60, // 1 minute - for highly volatile data like prices
  SHORT: 120, // 2 minutes - for frequently changing data
  MEDIUM: 300, // 5 minutes - standard cache duration
  LONG: 600, // 10 minutes - for stable data
  VERY_LONG: 1800, // 30 minutes - for rarely changing data
  HOUR: 3600, // 1 hour - for static data
} as const;

/**
 * Standard cache headers for different scenarios
 */
export const CACHE_HEADERS = {
  SHORT: "public, s-maxage=60, stale-while-revalidate=300", // 1 min cache, 5 min stale
  MEDIUM: "public, s-maxage=300, stale-while-revalidate=600", // 5 min cache, 10 min stale
  LONG: "public, s-maxage=900, stale-while-revalidate=1800", // 15 min cache, 30 min stale
  VERY_LONG: "public, s-maxage=3600, stale-while-revalidate=7200", // 1 hr cache, 2 hr stale
  NO_CACHE: "no-cache, no-store, must-revalidate",
  REVALIDATE: "public, must-revalidate, stale-while-revalidate=60",
  ERROR: "public, max-age=60, stale-while-revalidate=120", // Error response cache (1 minute)
} as const;

/**
 * CORS headers
 */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
  "Access-Control-Max-Age": "86400", // 24 hours
} as const;

// ===== CORE RESPONSE BUILDERS =====

/**
 * Build a successful API response with metadata
 */
export function buildSuccessResponse<T>(
  data: T,
  options: ResponseOptions = {}
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

// ===== CONVENIENCE RESPONSE BUILDERS =====

/**
 * Standard success response with optional caching
 */
export function successResponse<T>(
  data: T,
  cacheDuration?: number,
  headers?: Record<string, string>,
  options: ResponseOptions = {}
): NextResponse {
  const responseHeaders = {
    "Content-Type": "application/json",
    ...headers,
    ...(cacheDuration !== undefined && getCacheHeaders(cacheDuration)),
  };

  return NextResponse.json(data, {
    headers: responseHeaders,
  });
}

/**
 * Standard error response
 */
export function errorResponse(message: string, status: number = 500, details?: any): NextResponse {
  const response = {
    success: false,
    error: message,
    status,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
  };

  logger.error("API Error", {
    message,
    status,
    details,
  });

  return NextResponse.json(response, { status });
}

/**
 * Generate standard cache headers
 */
export function getCacheHeaders(duration: number = CACHE_DURATIONS.MEDIUM): Record<string, string> {
  return {
    "Cache-Control": `public, s-maxage=${duration}, stale-while-revalidate=${duration * 2}`,
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

// ===== LEGACY TRPC COMPATIBILITY =====

export interface ResponseMetrics {
  startTime: number;
  cached?: boolean;
  cacheHits?: number;
  cacheMisses?: number;
  apiCalls?: number;
}

/**
 * Legacy tRPC response builder (for backward compatibility)
 */
export function buildTRPCResponse<T>(
  data: T,
  metrics: ResponseMetrics
): {
  timestamp: string;
  performance: {
    responseTimeMs: number;
    cacheHits: number;
    cacheMisses: number;
    apiCalls: number;
  };
  cache: {
    cached: boolean;
  };
  data: T;
} {
  return {
    timestamp: new Date().toISOString(),
    performance: {
      responseTimeMs: Date.now() - metrics.startTime,
      cacheHits: metrics.cacheHits ?? 0,
      cacheMisses: metrics.cacheMisses ?? 1,
      apiCalls: metrics.apiCalls ?? 1,
    },
    cache: {
      cached: metrics.cached ?? false,
    },
    data,
  };
}

/**
 * Legacy helper functions for backward compatibility
 */
export function buildCachedResponse<T>(
  data: T,
  startTime: number
): ReturnType<typeof buildTRPCResponse<T>> {
  return buildTRPCResponse(data, {
    startTime,
    cacheHits: 1,
    cacheMisses: 0,
    apiCalls: 0,
    cached: true,
  });
}

export function buildFreshResponse<T>(
  data: T,
  startTime: number,
  apiCalls = 1
): ReturnType<typeof buildTRPCResponse<T>> {
  return buildTRPCResponse(data, {
    startTime,
    cacheHits: 0,
    cacheMisses: 1,
    apiCalls,
    cached: false,
  });
}

export function buildFallbackResponse<T>(
  data: T,
  startTime: number
): ReturnType<typeof buildTRPCResponse<T>> {
  return buildTRPCResponse(data, {
    startTime,
    cacheHits: 0,
    cacheMisses: 1,
    apiCalls: 0,
    cached: false,
  });
}

// ===== COMMON ERROR RESPONSES =====

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

// ===== VALIDATION UTILITIES =====

/**
 * Validate required parameters
 */
export function validateParams(
  params: Record<string, any>,
  required: string[]
): { valid: boolean; missing?: string[] } {
  const missing = required.filter((key) => !params[key]);

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  return { valid: true };
}

/**
 * Standard validation error response
 */
export function validationError(missing: string[]) {
  return errorResponse(`Missing required parameters: ${missing.join(", ")}`, 400);
}

// ===== ADVANCED RESPONSE BUILDERS =====

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

// ===== ERROR HANDLING UTILITIES =====

// Re-export ApiError from core/errors.ts for backward compatibility
import { ApiError } from "@/lib/utils/core/errors";
export { ApiError };

/**
 * Log error with context
 */
export function logError(error: unknown, context?: ErrorContext): void {
  logger.error("API Error", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
  });
}

/**
 * Format API error for response
 */
export function formatApiError(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
} {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: "UNKNOWN_ERROR",
      statusCode: 500,
    };
  }

  return {
    message: "An unknown error occurred",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}

/**
 * Handle API errors with proper logging
 */
export function handleApiError(error: unknown, context?: ErrorContext): NextResponse {
  logError(error, context);
  const formattedError = formatApiError(error);

  return NextResponse.json(
    {
      error: formattedError.message,
      code: formattedError.code,
    },
    { status: formattedError.statusCode }
  );
}

/**
 * Error handling wrapper for async functions
 */
export function withErrorHandling<T>(fn: () => Promise<T>, _context?: ErrorContext): Promise<T> {
  return fn().catch((error) => {
    throw error; // Let the caller handle the error
  });
}

/**
 * Error handling wrapper with fallback response
 */
export function withErrorHandlingAndFallback<T>(
  fn: () => Promise<NextResponse<T>>,
  context?: ErrorContext,
  fallbackData?: T
): Promise<NextResponse<T>> {
  return fn().catch((error) => {
    logError(error, context);

    if (fallbackData) {
      return NextResponse.json(fallbackData);
    }

    return handleApiError(error, context) as NextResponse<T>;
  });
}

/**
 * Create a success response with standard structure (legacy compatibility)
 */
export function createSuccessResponse<T>(data: T, headers?: HeadersInit): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers,
    }
  );
}

/**
 * Create an error response with standard structure (legacy compatibility)
 */
export function createErrorResponse(
  message: string,
  details?: string,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString(),
    },
    {
      status,
    }
  );
}

/**
 * Simple API response creator for compatibility
 */
export function createApiResponse<T>(
  data: T | { error: string },
  status: number = 200,
  endpoint?: string
): NextResponse {
  if (status >= 400) {
    return NextResponse.json(data, { status });
  }

  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: randomUUID(),
        ...(endpoint && { endpoint }),
      },
    },
    { status }
  );
}

/**
 * Handle OPTIONS requests for CORS
 */
export function optionsResponse(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

// Export all error codes for convenience
export { APIErrorCode } from "@/lib/types/api";

// Export legacy schema types for tRPC compatibility
import { z } from "zod";

export const BaseResponseSchema = z.object({
  timestamp: z.string(),
  performance: z.object({
    responseTimeMs: z.number(),
  }),
  data: z.unknown(),
});

export const SuccessResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.unknown().optional(),
});

// Export zod for backward compatibility
export { z };
