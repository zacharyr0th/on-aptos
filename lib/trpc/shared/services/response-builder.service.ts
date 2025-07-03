/**
 * Response Builder Service
 * Provides consistent response formatting across all tRPC endpoints
 */

export interface StandardResponse<T> {
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
}

/**
 * Builds a standard response object with performance metrics
 */
export function buildStandardResponse<T>(
  data: T,
  startTime: number = Date.now(),
  cached: boolean = false,
  apiCalls: number = 0
): StandardResponse<T> {
  return {
    timestamp: new Date().toISOString(),
    performance: {
      responseTimeMs: Date.now() - startTime,
      cacheHits: cached ? 1 : 0,
      cacheMisses: cached ? 0 : 1,
      apiCalls: cached ? 0 : apiCalls,
    },
    cache: { cached },
    data,
  };
}

/**
 * Builds an error response
 */
export function buildErrorResponse(
  error: Error | string,
  startTime: number = Date.now()
): StandardResponse<null> {
  return {
    timestamp: new Date().toISOString(),
    performance: {
      responseTimeMs: Date.now() - startTime,
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
    },
    cache: { cached: false },
    data: null,
  };
}
