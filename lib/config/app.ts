/**
 * Application configuration
 * Centralizes all environment-dependent settings
 */

import { env, isDevelopment, isProduction } from "./validate-env";

export const APP_CONFIG = {
  // Site configuration
  siteUrl: env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  appName: process.env.NEXT_PUBLIC_APP_NAME || "On Aptos",
  siteDescription: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Aptos DeFi ecosystem tracker",

  // CORS configuration
  corsOrigins: process.env.NEXT_PUBLIC_CORS_ORIGINS?.split(",") || ["http://localhost:3000"],

  // Port configuration
  port: process.env.PORT || process.env.DEV_PORT || "3000",

  // Development settings
  isDevelopment: isDevelopment,
  isProduction: isProduction,
} as const;

export const DEVELOPER_CONFIG = {
  name: process.env.DEVELOPER_NAME || "Your Team",
  email: process.env.DEVELOPER_EMAIL || "hello@your-domain.com",
  website: process.env.DEVELOPER_WEBSITE || "https://your-domain.com",
  twitter: process.env.DEVELOPER_TWITTER || "https://x.com/yourhandle",
  twitterHandle: process.env.DEVELOPER_TWITTER_HANDLE || "yourhandle",
  github: process.env.DEVELOPER_GITHUB || "https://github.com/yourusername/on-aptos",
  linkedin: process.env.DEVELOPER_LINKEDIN || "",
} as const;

export const API_CONFIG = {
  // RWA API
  rwa: {
    baseUrl: process.env.RWA_API_BASE_URL || "https://api.rwa.xyz/v4/assets",
    apiKey: env.RWA_API_KEY || "",
  },

  // CoinMarketCap API
  cmc: {
    baseUrl: process.env.CMC_API_BASE_URL || "https://pro-api.coinmarketcap.com/v1",
    apiKey: env.CMC_API_KEY || "",
  },

  // Other APIs
  panora: {
    baseUrl: "https://api.panora.exchange",
  },

  llama: {
    baseUrl: "https://api.llama.fi",
  },
} as const;

// Validation is now handled by validate-env.ts
// This function is kept for backward compatibility but will use the new validation
export function validateConfig() {
  // Validation is performed on import through validate-env.ts
  // If we reach this point, all required env vars are already validated
}
