/**
 * Standard cache header configurations for API routes
 */

export const CACHE_HEADERS = {
  // Short-term cache for dynamic data (5 minutes)
  SHORT: "public, s-maxage=300, stale-while-revalidate=600",

  // Medium-term cache for semi-static data (15 minutes)
  MEDIUM: "public, s-maxage=900, stale-while-revalidate=1800",

  // Long-term cache for static data (1 hour)
  LONG: "public, s-maxage=3600, stale-while-revalidate=7200",

  // No cache for real-time data
  NO_CACHE: "no-cache, no-store, must-revalidate",

  // Portfolio-specific cache durations
  PORTFOLIO: {
    ASSETS: "public, s-maxage=300, stale-while-revalidate=600", // 5 minutes
    NFTS: "public, s-maxage=120, stale-while-revalidate=240", // 2 minutes
    DEFI: "public, s-maxage=300, stale-while-revalidate=600", // 5 minutes
    TRANSACTIONS: "public, s-maxage=60, stale-while-revalidate=120", // 1 minute
    BATCH: "public, s-maxage=300, stale-while-revalidate=600", // 5 minutes
  },

  // Market data cache durations
  MARKETS: {
    PRICES: "public, s-maxage=30, stale-while-revalidate=60", // 30 seconds
    ANALYTICS: "public, s-maxage=180, stale-while-revalidate=360", // 3 minutes
    TOKENS: "public, s-maxage=900, stale-while-revalidate=1800", // 15 minutes
  },
} as const;

/**
 * Helper function to add cache headers to a Response
 */
export function addCacheHeaders(response: Response, cacheControl: string): Response {
  response.headers.set("Cache-Control", cacheControl);
  return response;
}

/**
 * Helper function to create headers object with cache control
 */
export function createCacheHeaders(cacheControl: string): Record<string, string> {
  return {
    "Cache-Control": cacheControl,
  };
}
