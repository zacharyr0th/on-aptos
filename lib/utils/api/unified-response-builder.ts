/**
 * Unified API response builder - consolidates all response construction patterns
 * Standardizes responses across all API endpoints
 */

import { NextResponse } from "next/server";
import { apiLogger } from "../core/logger";

// Standard response interfaces
export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  responseTimeMs: number;
  cacheHit?: boolean;
  cached?: boolean;
  source?: string;
  requestId?: string;
  apiCalls?: number;
  pagination?: PaginationMeta;
  version?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total?: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
  meta: ResponseMeta;
}

export interface CacheResponseOptions {
  maxAge?: number;
  staleWhileRevalidate?: number;
  cacheControl?: string;
}

// Standard cache headers
export const CACHE_HEADERS = {
  SHORT: "public, s-maxage=60, stale-while-revalidate=300", // 1 min cache, 5 min stale
  MEDIUM: "public, s-maxage=300, stale-while-revalidate=600", // 5 min cache, 10 min stale
  LONG: "public, s-maxage=900, stale-while-revalidate=1800", // 15 min cache, 30 min stale
  VERY_LONG: "public, s-maxage=3600, stale-while-revalidate=7200", // 1 hr cache, 2 hr stale
  NO_CACHE: "no-cache, no-store, must-revalidate",
  REVALIDATE: "public, must-revalidate, stale-while-revalidate=60",
} as const;

// CORS headers
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
  "Access-Control-Max-Age": "86400", // 24 hours
} as const;

export class UnifiedResponseBuilder {
  /**
   * Build a successful response with proper headers and metadata
   */
  static success<T>(
    data: T,
    options: {
      startTime?: number;
      cached?: boolean;
      cacheHit?: boolean;
      source?: string;
      apiCalls?: number;
      pagination?: PaginationMeta;
      cacheHeaders?: keyof typeof CACHE_HEADERS | string;
      cors?: boolean;
    } = {},
  ): NextResponse<StandardResponse<T>> {
    const {
      startTime = Date.now(),
      cached = false,
      cacheHit = false,
      source,
      apiCalls = 1,
      pagination,
      cacheHeaders = "MEDIUM",
      cors = true,
    } = options;

    const responseTimeMs = Date.now() - startTime;

    const response: StandardResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      meta: {
        responseTimeMs,
        cached,
        cacheHit,
        source,
        apiCalls,
        pagination,
        version: "1.0",
      },
    };

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add cache headers
    if (typeof cacheHeaders === "string") {
      if (cacheHeaders in CACHE_HEADERS) {
        headers["Cache-Control"] =
          CACHE_HEADERS[cacheHeaders as keyof typeof CACHE_HEADERS];
      } else {
        headers["Cache-Control"] = cacheHeaders;
      }
    }

    // Add CORS headers if requested
    if (cors) {
      Object.assign(headers, CORS_HEADERS);
    }

    apiLogger.debug(`API response: ${responseTimeMs}ms`, {
      cached,
      source,
      apiCalls,
      dataSize: JSON.stringify(data).length,
    });

    return NextResponse.json(response, { headers });
  }

  /**
   * Build an error response with proper status and metadata
   */
  static error(
    error: string | Error,
    status: number = 500,
    options: {
      startTime?: number;
      code?: string;
      details?: Record<string, any>;
      cors?: boolean;
    } = {},
  ): NextResponse<ErrorResponse> {
    const { startTime = Date.now(), code, details, cors = true } = options;

    const responseTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : error;

    const response: ErrorResponse = {
      success: false,
      error: errorMessage,
      code,
      details,
      timestamp: new Date().toISOString(),
      meta: {
        responseTimeMs,
        version: "1.0",
      },
    };

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add CORS headers if requested
    if (cors) {
      Object.assign(headers, CORS_HEADERS);
    }

    apiLogger.error(`API error (${status}): ${errorMessage}`, {
      code,
      details,
      responseTimeMs,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(response, { status, headers });
  }

  /**
   * Build a cached response with cache hit indicators
   */
  static cached<T>(
    data: T,
    startTime: number,
    source: string = "cache",
  ): NextResponse<StandardResponse<T>> {
    return this.success(data, {
      startTime,
      cached: true,
      cacheHit: true,
      source,
      apiCalls: 0,
      cacheHeaders: "LONG",
    });
  }

  /**
   * Build a fresh response indicating data was fetched
   */
  static fresh<T>(
    data: T,
    startTime: number,
    apiCalls: number = 1,
    source?: string,
  ): NextResponse<StandardResponse<T>> {
    return this.success(data, {
      startTime,
      cached: false,
      cacheHit: false,
      source: source || "api",
      apiCalls,
      cacheHeaders: "MEDIUM",
    });
  }

  /**
   * Build a fallback response when using default data
   */
  static fallback<T>(
    data: T,
    startTime: number,
    error?: Error,
  ): NextResponse<StandardResponse<T>> {
    const response = this.success(data, {
      startTime,
      cached: false,
      source: "fallback",
      apiCalls: 0,
      cacheHeaders: "SHORT",
    });

    if (error) {
      apiLogger.warn("Using fallback data due to error", {
        error: error.message,
        responseTimeMs: Date.now() - startTime,
      });
    }

    return response;
  }

  /**
   * Build a paginated response
   */
  static paginated<T>(
    data: T[],
    pagination: PaginationMeta,
    options: {
      startTime?: number;
      source?: string;
      apiCalls?: number;
      cacheHeaders?: keyof typeof CACHE_HEADERS | string;
    } = {},
  ): NextResponse<StandardResponse<T[]>> {
    return this.success(data, {
      ...options,
      pagination,
    });
  }

  /**
   * Handle validation errors with 400 status
   */
  static validationError(
    field: string,
    message: string,
    startTime?: number,
  ): NextResponse<ErrorResponse> {
    return this.error(`Validation error: ${field} - ${message}`, 400, {
      startTime,
      code: "VALIDATION_ERROR",
      details: { field, message },
    });
  }

  /**
   * Handle rate limiting with 429 status
   */
  static rateLimited(
    limit: number,
    resetTime: Date,
    startTime?: number,
  ): NextResponse<ErrorResponse> {
    const response = this.error("Rate limit exceeded", 429, {
      startTime,
      code: "RATE_LIMITED",
      details: { limit, resetTime },
    });

    // Add rate limiting headers
    const headers = new Headers(response.headers);
    headers.set(
      "Retry-After",
      Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString(),
    );
    headers.set("X-RateLimit-Limit", limit.toString());
    headers.set("X-RateLimit-Reset", resetTime.toISOString());

    return new NextResponse(response.body, {
      status: 429,
      headers,
    });
  }

  /**
   * Handle service unavailable with 503 status
   */
  static serviceUnavailable(
    service: string,
    startTime?: number,
  ): NextResponse<ErrorResponse> {
    return this.error(`Service unavailable: ${service}`, 503, {
      startTime,
      code: "SERVICE_UNAVAILABLE",
      details: { service },
    });
  }

  /**
   * Handle not found with 404 status
   */
  static notFound(
    resource: string,
    startTime?: number,
  ): NextResponse<ErrorResponse> {
    return this.error(`Resource not found: ${resource}`, 404, {
      startTime,
      code: "NOT_FOUND",
      details: { resource },
    });
  }

  /**
   * Handle OPTIONS requests for CORS
   */
  static options(): NextResponse {
    return new NextResponse(null, {
      status: 200,
      headers: CORS_HEADERS,
    });
  }

  /**
   * Wrap an async handler with error boundary and timing
   */
  static async withErrorBoundary<T>(
    handler: () => Promise<NextResponse<StandardResponse<T>>>,
    fallbackData?: T,
  ): Promise<NextResponse<StandardResponse<T> | ErrorResponse>> {
    const startTime = Date.now();

    try {
      return await handler();
    } catch (error) {
      apiLogger.error("Unhandled API error", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        responseTimeMs: Date.now() - startTime,
      });

      if (fallbackData) {
        return this.fallback(fallbackData, startTime, error as Error);
      }

      return this.error(error as Error, 500, { startTime });
    }
  }
}

// Convenience functions for backward compatibility
export const successResponse = UnifiedResponseBuilder.success;
export const errorResponse = UnifiedResponseBuilder.error;
export const buildCachedResponse = UnifiedResponseBuilder.cached;
export const buildFreshResponse = UnifiedResponseBuilder.fresh;
export const buildFallbackResponse = UnifiedResponseBuilder.fallback;

// Legacy support for existing patterns
export function buildResponse<T>(
  data: T,
  startTime: number,
  cached: boolean = false,
  apiCalls: number = 1,
): NextResponse<StandardResponse<T>> {
  if (cached) {
    return UnifiedResponseBuilder.cached(data, startTime);
  }
  return UnifiedResponseBuilder.fresh(data, startTime, apiCalls);
}

// Types are exported via lib/utils/index.ts to avoid conflicts
