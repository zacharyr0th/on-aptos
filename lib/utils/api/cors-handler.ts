/**
 * Standardized CORS handling for API routes
 * Eliminates duplicate CORS handlers across all API endpoints
 */

import { NextResponse } from "next/server";

/**
 * Standard CORS headers used across all API endpoints
 */
export const STANDARD_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
  "Access-Control-Max-Age": "86400", // 24 hours
} as const;

/**
 * CORS headers for read-only endpoints
 */
export const READONLY_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
  "Access-Control-Max-Age": "86400",
} as const;

/**
 * Create standard OPTIONS handler for CORS preflight requests
 */
export function createCORSHandler(headers = READONLY_CORS_HEADERS) {
  return async () => {
    return new NextResponse(null, {
      status: 200,
      headers,
    });
  };
}

/**
 * Add CORS headers to any response
 */
export function addCORSHeaders(
  response: NextResponse,
  headers = READONLY_CORS_HEADERS
): NextResponse {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Create a JSON response with CORS headers
 */
export function createCORSResponse<T>(
  data: T,
  status = 200,
  additionalHeaders: Record<string, string> = {},
  corsHeaders = READONLY_CORS_HEADERS
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      ...corsHeaders,
      ...additionalHeaders,
    },
  });
}

/**
 * Standard OPTIONS handler - most commonly used pattern
 */
export const OPTIONS = createCORSHandler();
