import { NextResponse } from "next/server";

import { logger } from "@/lib/utils/core/logger";

/**
 * Standard cache headers for API responses
 */
export const CACHE_HEADERS = {
  // 5 minutes cache with stale-while-revalidate
  SHORT: "public, s-maxage=300, stale-while-revalidate=600",
  // 1 hour cache with stale-while-revalidate
  MEDIUM: "public, s-maxage=3600, stale-while-revalidate=7200",
  // 24 hours cache with stale-while-revalidate
  LONG: "public, s-maxage=86400, stale-while-revalidate=43200",
  // No cache
  NONE: "no-store, no-cache, must-revalidate",
  // Error response cache (1 minute)
  ERROR: "public, max-age=60, stale-while-revalidate=120",
} as const;

/**
 * Standard API response headers
 */
export interface ApiHeaders {
  "Cache-Control"?: string;
  "X-Content-Type"?: string;
  "X-Service"?: string;
  "X-API-Version"?: string;
  "X-Data-Source"?: string;
  Vary?: string;
  [key: string]: string | undefined;
}

/**
 * Standard success response
 */
export function successResponse<T>(
  data: T,
  options?: {
    headers?: ApiHeaders;
    cache?: keyof typeof CACHE_HEADERS;
    status?: number;
  }
) {
  const cacheControl = options?.cache
    ? CACHE_HEADERS[options.cache]
    : options?.headers?.["Cache-Control"] || CACHE_HEADERS.SHORT;

  const headers: ApiHeaders = {
    "Cache-Control": cacheControl,
    "X-Content-Type": "application/json",
    Vary: "Accept-Encoding",
    ...options?.headers,
  };

  return NextResponse.json(data, {
    status: options?.status || 200,
    headers: headers as any,
  });
}

/**
 * Standard error response
 */
export function errorResponse(
  error: string | Error,
  options?: {
    status?: number;
    details?: any;
    service?: string;
  }
) {
  const errorMessage = error instanceof Error ? error.message : error;
  const status = options?.status || 500;

  // Log the error
  logger.error(`API Error (${status}):`, {
    message: errorMessage,
    service: options?.service,
    details: options?.details,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      ...(options?.details && { details: options.details }),
    },
    {
      status,
      headers: {
        "Cache-Control": CACHE_HEADERS.ERROR,
        "X-Content-Type": "application/json",
        ...(options?.service && { "X-Service": options.service }),
      },
    }
  );
}

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
  return errorResponse(`Missing required parameters: ${missing.join(", ")}`, {
    status: 400,
  });
}
