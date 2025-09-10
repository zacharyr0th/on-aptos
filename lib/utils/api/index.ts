// API response utilities
export {
  APIResponses,
  buildErrorResponse,
  buildSuccessResponse,
  createCacheHeaders,
  withAPIHandler,
} from "./api-response";
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
// Legacy response builders (for backward compatibility)
export {
  buildCachedResponse,
  buildFallbackResponse,
  buildFreshResponse,
  buildTRPCResponse,
  type ErrorContext,
  formatApiError,
  handleApiError,
  type ResponseMetrics,
  withErrorHandling,
  withErrorHandlingAndFallback,
} from "./response-builder";

// Server utilities - DO NOT EXPORT HERE
// Import these directly from their files when needed in server components:
// import { ... } from "@/lib/utils/api/server-api"
// import { ... } from "@/lib/utils/api/server"
