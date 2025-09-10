export const APP_ROUTES = {
  // Main pages
  HOME: "/",

  // Markets
  MARKETS: {
    BITCOIN: "/markets/bitcoin",
    STABLES: "/markets/stables",
    RWAS: "/markets/rwas",
    TOKENS: "/markets/tokens",
  },

  // Protocols
  PROTOCOLS: {
    DEFI: "/protocols/defi",
    LST: "/protocols/lst",
    YIELDS: "/protocols/yields",
  },

  // Tools
  TOOLS: {
    PORTFOLIO: "/tools/portfolio",
    METRICS: "/tools/metrics",
  },

  // Legacy aliases for backward compatibility
  DEFI: "/protocols/defi",
  BITCOIN: "/markets/bitcoin",
  BTC: "/markets/bitcoin",
  STABLES: "/markets/stables",
  RWAS: "/markets/rwas",
  TOKENS: "/markets/tokens",
  YIELDS: "/protocols/yields",
  PORTFOLIO: "/tools/portfolio",
  METRICS: "/tools/metrics",
  LST: "/protocols/lst",

  // API routes
  API: {
    BTC: "/api/markets/bitcoin",
    STABLES: "/api/markets/stables",
    RWAS: "/api/markets/rwas",
    TOKENS: "/api/markets/tokens",
    PRICES: "/api/prices",
    ANALYTICS: "/api/analytics",
    PORTFOLIO: "/api/portfolio",
    SEO: {
      LLM_METADATA: "/api/seo/llm-metadata",
      LLM_README: "/api/seo/llm-readme",
      LLMS_TXT: "/api/seo/llms.txt",
      API_SITEMAP: "/api/seo/api-sitemap.xml",
    },
  },
} as const;

// PWA shortcuts configuration
export const PWA_SHORTCUTS = [
  {
    name: "DeFi",
    url: APP_ROUTES.PROTOCOLS.DEFI,
    icons: [{ src: "/icons/defi.png", sizes: "192x192", type: "image/png" }],
  },
  {
    name: "Bitcoin",
    url: APP_ROUTES.MARKETS.BITCOIN,
    icons: [{ src: "/icons/bitcoin.png", sizes: "192x192", type: "image/png" }],
  },
  {
    name: "Stablecoins",
    url: APP_ROUTES.MARKETS.STABLES,
    icons: [{ src: "/icons/stablecoins.png", sizes: "192x192", type: "image/png" }],
  },
  {
    name: "RWAs",
    url: APP_ROUTES.MARKETS.RWAS,
    icons: [{ src: "/icons/rwas.png", sizes: "192x192", type: "image/png" }],
  },
] as const;

export const SITEMAP_ROUTES = [
  { path: APP_ROUTES.HOME, priority: 1.0, changeFreq: "daily" as const },
  { path: APP_ROUTES.DEFI, priority: 0.9, changeFreq: "weekly" as const },
  { path: APP_ROUTES.BITCOIN, priority: 0.9, changeFreq: "weekly" as const },
  { path: APP_ROUTES.BTC, priority: 0.9, changeFreq: "weekly" as const },
  { path: APP_ROUTES.STABLES, priority: 0.9, changeFreq: "weekly" as const },
  { path: APP_ROUTES.RWAS, priority: 0.9, changeFreq: "weekly" as const },
  { path: APP_ROUTES.TOKENS, priority: 0.9, changeFreq: "weekly" as const },
  { path: APP_ROUTES.YIELDS, priority: 0.8, changeFreq: "weekly" as const },
  { path: APP_ROUTES.PORTFOLIO, priority: 0.8, changeFreq: "daily" as const },
  { path: APP_ROUTES.METRICS, priority: 0.7, changeFreq: "weekly" as const },
] as const;
