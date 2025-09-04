// Shared runtime configuration
export const NODEJS_RUNTIME = "nodejs" as const;
export const EDGE_RUNTIME = "edge" as const;

// Common cache durations
export const CACHE_DURATIONS = {
  STATIC_PAGE: 86400, // 24 hours
  DYNAMIC_PAGE: 3600, // 1 hour
  SITEMAP: 900, // 15 minutes
  API_RESPONSE: 300, // 5 minutes
} as const;

// Common metadata configuration
export const DEFAULT_METADATA = {
  siteName: "On Aptos",
  developer: "On Aptos Team",
  defaultTheme: "dark" as const,
} as const;
