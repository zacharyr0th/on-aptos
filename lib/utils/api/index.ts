// Consolidated API response utilities (from response.ts)
export {
  APIResponses,
  ApiError,
  type CacheOptions,
  CACHE_DURATIONS,
  CACHE_HEADERS,
  CORS_HEADERS,
  buildCachedResponse,
  buildErrorResponse,
  buildFallbackResponse,
  buildFreshResponse,
  buildSuccessResponse,
  buildTRPCResponse,
  createApiResponse,
  createCacheHeaders,
  createErrorResponse,
  createSuccessResponse,
  type ErrorContext,
  errorResponse,
  formatApiError,
  handleApiError,
  logError,
  optionsResponse,
  type ResponseMetrics,
  type ResponseOptions,
  successResponse,
  validationError,
  validateParams,
  withAPIHandler,
  withErrorHandling,
  withErrorHandlingAndFallback,
} from "./response";
// HTTP utilities
export {
  apiRequest,
  batchRequests,
  enhancedFetch,
  fetchWithRetry,
  getClientSecurityHeaders,
  getRetryDelay,
  graphQLRequest,
  isRateLimited,
  parseRateLimitHeaders,
} from "./fetch-utils";

// Server utilities - DO NOT EXPORT HERE
// Import these directly from their files when needed in server components:
// import { ... } from "@/lib/utils/api/server-api"
// import { ... } from "@/lib/utils/api/server"
