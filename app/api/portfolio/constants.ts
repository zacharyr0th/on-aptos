export const PORTFOLIO_CACHE = {
  ASSETS: 300, // 5 minutes - moderate update frequency
  NFTS: 120, // 2 minutes - more dynamic content
  DEFI: 300, // 5 minutes - moderate update frequency
  TRANSACTIONS: 60, // 1 minute - most dynamic content
  ANS: 600, // 10 minutes - least dynamic content
  YIELD: 300, // 5 minutes - moderate update frequency
  BATCH: 300, // 5 minutes - same as individual components
} as const;

export const PORTFOLIO_RATE_LIMIT_NAMES = {
  ASSETS: "portfolio-assets",
  NFTS: "portfolio-nfts",
  DEFI: "portfolio-defi",
  TRANSACTIONS: "portfolio-transactions",
  ANS: "portfolio-ans",
  ANS_NAMES: "portfolio-ans-names",
  YIELD: "portfolio-yield",
  BATCH: "portfolio-batch",
} as const;
