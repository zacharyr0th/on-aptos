import { BaseResponseSchema } from '@/lib/trpc/schemas';
import { z } from 'zod';
import { ApiError, TimeoutError } from './types';

export interface ResponseMetrics {
  startTime: number;
  cacheHits?: number;
  cacheMisses?: number;
  apiCalls?: number;
  cached?: boolean;
}

/**
 * Centralized response builder to eliminate redundant response structure patterns
 */
export function buildTRPCResponse<T>(
  data: T,
  metrics: ResponseMetrics
): z.infer<typeof BaseResponseSchema> & { data: T } {
  const responseTimeMs = Date.now() - metrics.startTime;

  return {
    timestamp: new Date().toISOString(),
    performance: {
      responseTimeMs,
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
 * Helper for cached responses
 */
export function buildCachedResponse<T>(
  data: T,
  startTime: number
): z.infer<typeof BaseResponseSchema> & { data: T } {
  return buildTRPCResponse(data, {
    startTime,
    cacheHits: 1,
    cacheMisses: 0,
    apiCalls: 0,
    cached: true,
  });
}

/**
 * Helper for fresh API responses
 */
export function buildFreshResponse<T>(
  data: T,
  startTime: number,
  apiCalls = 1
): z.infer<typeof BaseResponseSchema> & { data: T } {
  return buildTRPCResponse(data, {
    startTime,
    cacheHits: 0,
    cacheMisses: 1,
    apiCalls,
    cached: false,
  });
}

/**
 * Helper for fallback responses
 */
export function buildFallbackResponse<T>(
  data: T,
  startTime: number
): z.infer<typeof BaseResponseSchema> & { data: T } {
  return buildTRPCResponse(data, {
    startTime,
    cacheHits: 0,
    cacheMisses: 1,
    apiCalls: 0,
    cached: false,
  });
}

// ===== ERROR HELPERS (formerly from error-helpers.ts) =====

export interface ErrorContext {
  operation: string;
  service: string;
  details?: Record<string, unknown>;
}

/**
 * Format API error messages consistently
 */
export function formatApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Centralized error handling for API operations
 */
export function handleApiError(error: unknown, context: ErrorContext): never {
  // Re-throw known errors as-is
  if (error instanceof ApiError || error instanceof TimeoutError) {
    throw error;
  }

  // Convert unknown errors to ApiError
  const message = error instanceof Error ? error.message : 'Unknown error';
  throw new ApiError(
    `${context.operation} failed: ${message}`,
    undefined,
    context.service
  );
}

/**
 * Wrapper for async operations with centralized error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    handleApiError(error, context);
  }
}

/**
 * Wrapper for async operations with fallback support
 */
export async function withErrorHandlingAndFallback<T>(
  operation: () => Promise<T>,
  fallback: () => T,
  context: ErrorContext
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`${context.operation} failed, using fallback:`, error);
    return fallback();
  }
}
