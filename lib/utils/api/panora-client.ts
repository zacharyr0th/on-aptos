/**
 * Unified Panora API client
 * Standardizes all Panora API interactions across the application
 */

import { getPanoraAuthHeaders } from "./common";
import { apiLogger } from "../core/logger";

const PANORA_BASE_URL = "https://api.panora.exchange";

export interface PanoraClientOptions {
  timeout?: number;
  retries?: number;
}

export interface PanoraResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export class PanoraClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(options: PanoraClientOptions = {}) {
    this.baseUrl = PANORA_BASE_URL;
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
  }

  /**
   * Generic method to fetch from Panora API with error handling and retries
   */
  async fetch<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    let lastError: Error;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            ...getPanoraAuthHeaders(),
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Log successful request
        apiLogger.debug(`Panora API success: ${endpoint}`, {
          url: url.toString(),
          attempt,
          status: response.status,
        });

        // Return the data property if it exists, otherwise return the full result
        return result.data || result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        apiLogger.warn(`Panora API attempt ${attempt}/${this.retries} failed`, {
          endpoint,
          error: lastError.message,
          attempt,
        });

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error instanceof Error && error.message.includes("HTTP 4")) {
          const status = parseInt(
            error.message.match(/HTTP (\d{3})/)?.[1] || "0",
          );
          if (status !== 429) {
            throw error;
          }
        }

        // Add delay between retries (exponential backoff)
        if (attempt < this.retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    apiLogger.error(`Panora API failed after ${this.retries} attempts`, {
      endpoint,
      error: lastError!.message,
    });
    throw new Error(`Panora API request failed: ${lastError!.message}`);
  }

  /**
   * Fetch token list
   */
  async getTokenList(params?: {
    panoraUI?: boolean;
    tokenAddress?: string | string[];
    panoraTags?: string;
  }): Promise<any[]> {
    const queryParams: Record<string, string> = {};

    if (params?.panoraUI !== undefined) {
      queryParams.panoraUI = params.panoraUI.toString();
    }

    if (params?.tokenAddress) {
      queryParams.tokenAddress = Array.isArray(params.tokenAddress)
        ? params.tokenAddress.join(",")
        : params.tokenAddress;
    }

    if (params?.panoraTags) {
      queryParams.panoraTags = params.panoraTags;
    }

    return this.fetch<any[]>("/tokenlist", queryParams);
  }

  /**
   * Fetch token prices
   */
  async getPrices(tokenAddresses?: string | string[]): Promise<any[]> {
    const params: Record<string, string> = {};

    if (tokenAddresses) {
      params.tokenAddress = Array.isArray(tokenAddresses)
        ? tokenAddresses.join(",")
        : tokenAddresses;
    }

    return this.fetch<any[]>("/prices", params);
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<{ status: "ok" | "error"; timestamp: string }> {
    try {
      await this.fetch("/tokenlist", { panoraUI: "true" });
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "error",
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Default instance
export const panoraClient = new PanoraClient();

// Convenience functions using the default client
export const fetchFromPanora = <T = any>(
  endpoint: string,
  params?: Record<string, string | number | boolean>,
): Promise<T> => panoraClient.fetch<T>(endpoint, params);

export const getPanoraTokenList = (params?: {
  panoraUI?: boolean;
  tokenAddress?: string | string[];
  panoraTags?: string;
}) => panoraClient.getTokenList(params);

export const getPanoraPrices = (tokenAddresses?: string | string[]) =>
  panoraClient.getPrices(tokenAddresses);
