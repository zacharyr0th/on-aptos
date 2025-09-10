/**
 * Utility functions for unified API endpoints
 * Helper functions used across multiple unified routes
 */

import { FETCH_HEADERS } from "./constants";

/**
 * DeFiLlama API fetch helper with consistent error handling
 */
export async function fetchFromDeFiLlama(endpoint: string): Promise<unknown> {
  const response = await fetch(endpoint, {
    headers: FETCH_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`DeFiLlama API error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

/**
 * Extract tokens from various parameter names used across different routes
 */
export function extractTokensFromParams(searchParams: URLSearchParams): string[] {
  return (
    searchParams.get("tokens")?.split(",") ||
    searchParams.get("tokenAddresses")?.split(",") ||
    (searchParams.get("address") ? [searchParams.get("address")!] : []) ||
    (searchParams.get("tokenAddress") ? [searchParams.get("tokenAddress")!] : []) ||
    []
  ).filter(Boolean);
}

/**
 * Response time tracking helper for performance headers
 */
export function getResponseTimeHeaders(startTime: number): Record<string, string> {
  return {
    "X-Response-Time": `${Date.now() - startTime}ms`,
  };
}

/**
 * Validate token addresses (basic validation)
 */
export function validateTokenAddress(address: string): boolean {
  // Basic Aptos address validation (0x followed by hex)
  return /^0x[a-fA-F0-9]+$/.test(address) && address.length >= 3;
}

/**
 * Clean and normalize token addresses
 */
export function normalizeTokenAddresses(tokens: string[]): string[] {
  return tokens
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token && validateTokenAddress(token))
    .slice(0, 100); // Limit to 100 tokens max
}
