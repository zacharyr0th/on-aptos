// Server-side only utilities
// IMPORTANT: Only import this file in server-side code (API routes, Server Components, etc.)

export {
  getClientIp,
  checkRateLimit,
  getSecurityHeaders,
  withApiEnhancements,
  withTrpcApiEnhancements,
  generateETag,
} from './server-api';

export {
  getCachedData,
  setCachedData,
  hasCachedData,
  isNearingExpiration,
  type CacheInstanceName,
} from './cache-manager';

export { enhancedFetch, apiRequest, graphQLRequest } from './fetch-utils';
export * from './types';
