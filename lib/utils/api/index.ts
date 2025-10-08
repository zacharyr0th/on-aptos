// Consolidated API response utilities (from response.ts)

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
export {
  APIResponses,
  ApiError,
  buildCachedResponse,
  buildErrorResponse,
  buildFallbackResponse,
  buildFreshResponse,
  buildSuccessResponse,
  buildTRPCResponse,
  CACHE_DURATIONS,
  CACHE_HEADERS,
  type CacheOptions,
  CORS_HEADERS,
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
  validateParams,
  validationError,
  withAPIHandler,
  withErrorHandling,
  withErrorHandlingAndFallback,
} from "./response";

// Server utilities - DO NOT EXPORT HERE
// Import these directly from their files when needed in server components:
// import { ... } from "@/lib/utils/api/server-api"
// import { ... } from "@/lib/utils/api/server"
