/**
 * Constants for unified API endpoints
 * Separated from shared.ts to improve maintainability
 */

// External API endpoints
export const DEFI_LLAMA_BASE = "https://api.llama.fi";
export const PANORA_API_ENDPOINT = "https://api.panora.exchange/prices";

// Request headers for external APIs
export const FETCH_HEADERS = {
  "User-Agent": "OnAptos-Unified/1.0",
} as const;

// CORS headers for unified endpoints
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;
