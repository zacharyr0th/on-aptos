import type { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/utils/core/logger";
import { errorResponse, successResponse } from "./response";

// Cache durations and headers moved to cache-headers.ts
export { CACHE_DURATIONS, getCacheHeaders } from "./cache-headers";

/**
 * Extract and validate common query parameters
 */
export interface CommonParams {
  address?: string;
  walletAddress?: string;
  limit?: number;
  offset?: number;
  [key: string]: any;
}

export function extractParams(request: NextRequest): CommonParams {
  const { searchParams } = new URL(request.url);

  return {
    address: searchParams.get("address") || searchParams.get("walletAddress") || undefined,
    walletAddress: searchParams.get("walletAddress") || searchParams.get("address") || undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
    offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined,
  };
}

// Response builders moved to response.ts - re-exported for backward compatibility
export { errorResponse, successResponse };

/**
 * Get API authentication headers
 */
export function getAptosAuthHeaders(): Record<string, string> {
  const apiKey = process.env.APTOS_BUILD_SECRET || process.env.APTOS_BUILD_KEY;

  if (!apiKey) {
    logger.warn("No Aptos API key found in environment");
    return {};
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

/**
 * Get Panora API headers
 */
export function getPanoraAuthHeaders(): Record<string, string> {
  let apiKey =
    process.env.PANORA_API_KEY ||
    "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi";

  // Strip quotes if present (in case they're included in the env var)
  apiKey = apiKey.replace(/^["']|["']$/g, "");

  // Debug: Log the API key being used (first 10 chars only for security)
  logger.debug("Using Panora API key:", {
    keyPrefix: apiKey?.substring(0, 10),
    keyLength: apiKey?.length,
    hasEnvVar: !!process.env.PANORA_API_KEY,
    envValue: process.env.PANORA_API_KEY?.substring(0, 10),
    envLength: process.env.PANORA_API_KEY?.length,
  });

  return {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  };
}

/**
 * Standard API wrapper with error handling
 */
export async function apiHandler<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  options?: {
    maxBodySize?: number; // Max body size in bytes
    allowedMethods?: string[]; // Allowed HTTP methods
  }
): Promise<(request: NextRequest) => Promise<NextResponse>> {
  return async (request: NextRequest) => {
    try {
      // Check allowed methods
      if (options?.allowedMethods && !options.allowedMethods.includes(request.method)) {
        return errorResponse(`Method ${request.method} not allowed`, 405);
      }

      // Check body size for POST/PUT/PATCH requests
      if (options?.maxBodySize && ["POST", "PUT", "PATCH"].includes(request.method)) {
        const contentLength = request.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > options.maxBodySize) {
          return errorResponse("Request body too large", 413);
        }
      }

      return await handler(request);
    } catch (error) {
      logger.error("Unhandled API error", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        url: request.url,
        method: request.method,
      });

      return errorResponse(
        "Internal server error",
        500,
        process.env.NODE_ENV === "development" ? error : undefined
      );
    }
  };
}

/**
 * Validate required parameters
 */
export function validateRequiredParams(params: CommonParams, required: string[]): string | null {
  for (const param of required) {
    if (!params[param]) {
      return `Missing required parameter: ${param}`;
    }
  }
  return null;
}

/**
 * Parse and validate numeric parameter
 */
export function parseNumericParam(
  value: string | null,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) return defaultValue;
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;

  return parsed;
}
