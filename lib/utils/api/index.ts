// API response utilities
export {
  buildSuccessResponse,
  buildErrorResponse,
  APIResponses,
  withAPIHandler,
  createCacheHeaders,
} from "./api-response";

// Legacy response builders (for backward compatibility)
export {
  buildTRPCResponse,
  buildCachedResponse,
  buildFreshResponse,
  buildFallbackResponse,
  formatApiError,
  handleApiError,
  withErrorHandling,
  withErrorHandlingAndFallback,
  type ResponseMetrics,
  type ErrorContext,
} from "./response-builder";

// HTTP utilities
export {
  enhancedFetch,
  fetchWithRetry,
  graphQLRequest,
  apiRequest,
  batchRequests,
  getClientSecurityHeaders,
  parseRateLimitHeaders,
  isRateLimited,
  getRetryDelay,
} from "./fetch-utils";

// Server utilities - DO NOT EXPORT HERE
// Import these directly from their files when needed in server components:
// import { ... } from "@/lib/utils/api/server-api"
// import { ... } from "@/lib/utils/api/server"