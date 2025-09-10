/**
 * Legacy tRPC Response Builder
 * Provides backward compatibility for existing tRPC endpoints
 * For new APIs, use api-response.ts instead
 */

import { NextResponse } from "next/server";
import { z } from "zod";

// Re-export the main response builders for backward compatibility
export {
  APIResponses,
  buildErrorResponse,
  buildSuccessResponse,
} from "./api-response";

// Response schemas (kept for existing tRPC validation)
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

// Legacy types for backward compatibility
export interface ResponseMetrics {
  startTime: number;
  cached?: boolean;
}

/**
 * Legacy tRPC response builder (for backward compatibility)
 */
export function buildTRPCResponse<T>(
  data: T,
  metrics: ResponseMetrics & {
    cacheHits?: number;
    cacheMisses?: number;
    apiCalls?: number;
  }
): unknown {
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
export function buildCachedResponse<T>(data: T, startTime: number): unknown {
  return buildTRPCResponse(data, {
    startTime,
    cacheHits: 1,
    cacheMisses: 0,
    apiCalls: 0,
    cached: true,
  });
}

export function buildFreshResponse<T>(data: T, startTime: number, apiCalls = 1): unknown {
  return buildTRPCResponse(data, {
    startTime,
    cacheHits: 0,
    cacheMisses: 1,
    apiCalls,
    cached: false,
  });
}

export function buildFallbackResponse<T>(data: T, startTime: number): unknown {
  return buildTRPCResponse(data, {
    startTime,
    cacheHits: 0,
    cacheMisses: 1,
    apiCalls: 0,
    cached: false,
  });
}

// Legacy error helpers - use withAPIHandler from api-response.ts for new code
export interface ErrorContext {
  operation: string;
  service: string;
  details?: Record<string, unknown>;
}

import { ApiError, logError } from "./errors";

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
