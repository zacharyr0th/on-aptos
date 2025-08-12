/**
 * Portfolio Query Limits
 * Consolidated from various portfolio services
 */

export const PORTFOLIO_QUERY_LIMITS = {
  // From portfolio/constants.ts
  NFT: 25,
  TRANSACTIONS: 50,
  ASSETS: 100,
  ACTIVITIES: 100,

  // From portfolio/constants/index.ts (higher limits)
  DEFAULT: 1000,
  TRANSACTIONS_MAX: 500,
  NFTS_MAX: 100,
  ASSETS_MAX: 200,
} as const;
