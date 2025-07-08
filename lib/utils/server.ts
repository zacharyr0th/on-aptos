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

// Cache utilities removed - TanStack Query handles client-side caching
// For rate-limited API caching, use simple-cache.ts

export { enhancedFetch, apiRequest, graphQLRequest } from './fetch-utils';
export * from './types';
