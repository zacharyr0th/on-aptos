/**
 * Unified Response Builder
 * Provides consistent response formatting across all APIs and tRPC endpoints
 */

import { z } from 'zod';

// Response schemas
export const BaseResponseSchema = z.object({
  timestamp: z.string(),
  performance: z.object({
    responseTimeMs: z.number(),
  }),
  data: z.any(),
});

export const SuccessResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
});

// Types
export interface ResponseMetrics {
  startTime: number;
  cached?: boolean;
}

export interface SuccessResponse<T> {
  success: true;
  timestamp: string;
  performance: {
    responseTimeMs: number;
  };
  data: T;
  meta?: any;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}

/**
 * Build a success response
 */
export function buildSuccessResponse<T>(
  data: T,
  metrics?: ResponseMetrics,
  meta?: any
): SuccessResponse<T> {
  const startTime = metrics?.startTime ?? Date.now();

  return {
    success: true,
    timestamp: new Date().toISOString(),
    performance: {
      responseTimeMs: Date.now() - startTime,
    },
    data,
    ...(meta && { meta }),
  };
}

/**
 * Build an error response
 */
export function buildErrorResponse(
  message: string,
  details?: any
): ErrorResponse {
  return {
    error: message,
    ...(details && { details }),
  };
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
): any {
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
export function buildCachedResponse<T>(data: T, startTime: number): any {
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
): any {
  return buildTRPCResponse(data, {
    startTime,
    cacheHits: 0,
    cacheMisses: 1,
    apiCalls,
    cached: false,
  });
}

export function buildFallbackResponse<T>(data: T, startTime: number): any {
  return buildTRPCResponse(data, {
    startTime,
    cacheHits: 0,
    cacheMisses: 1,
    apiCalls: 0,
    cached: false,
  });
}

/**
 * Simplified response builders for the new pattern
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: any
): SuccessResponse<T> {
  return buildSuccessResponse(data, undefined, meta);
}

export function createErrorResponse(
  message: string,
  status?: number,
  details?: any
): ErrorResponse {
  return buildErrorResponse(message, details);
}

// ===== ERROR HELPERS =====

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
  const message = error instanceof Error ? error.message : 'Unknown error';
  throw new Error(`${context.operation} failed: ${message}`);
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
