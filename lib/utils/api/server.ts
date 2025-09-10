// Server-side only utilities
// IMPORTANT: Only import this file in server-side code (API routes, Server Components, etc.)

// Cache utilities removed - TanStack Query handles client-side caching
// For rate-limited API caching, use simple-cache.ts

export * from "../core/types";
export { apiRequest, enhancedFetch, graphQLRequest } from "./fetch-utils";
