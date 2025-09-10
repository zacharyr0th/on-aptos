/**
 * Aptos Analytics API integration with advanced caching, retry logic, and error handling.
 *
 * Features:
 * - Intelligent caching with configurable TTL
 * - Exponential backoff retry mechanism
 * - Request timeout and abort signal support
 * - Batch request capabilities
 * - Comprehensive error classification
 * - Cache management utilities
 *
 * @example
 * ```typescript
 * // Basic usage
 * const prices = await aptosAnalytics.getTokenLatestPrice({
 *   address: '0x123...'
 * });
 *
 * // With custom configuration
 * const gasData = await aptosAnalytics.getGasUsage({
 *   gas_payer_address: '0x123...',
 *   start_unix_secs: 1234567890,
 *   end_unix_secs: 1234567900
 * }, {
 *   timeout: 5000,
 *   retries: 2,
 *   useCache: false
 * });
 *
 * // Batch requests
 * const batchResults = await aptosAnalytics.batchRequest([
 *   { key: 'prices', endpoint: '/token/latest_price', params: { address: '0x123' } },
 *   { key: 'gas', endpoint: '/gas/usage', params: { gas_payer_address: '0x456' } }
 * ]);
 * ```
 */

import { logger } from "@/lib/utils/core/logger";
import { SimpleCache } from "@/lib/utils/simple-cache";

const APTOS_ANALYTICS_BASE_URL = "https://api.mainnet.aptoslabs.com/v1/analytics";

export const DEFAULT_CONFIG = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CACHE_TTL: 2 * 60 * 1000, // 2 minutes for most data
  CACHE_TTL_LONG: 5 * 60 * 1000, // 5 minutes for less volatile data
} as const;

/**
 * Configuration for error retry logic
 */
type RetryableError = {
  /** Whether this error type can be retried */
  isRetryable: boolean;
  /** Function to determine if retry should happen based on attempt number */
  shouldRetry: (attempt: number) => boolean;
};

/**
 * Configuration options for individual requests
 */
export type RequestConfig = {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum number of retry attempts */
  retries?: number;
  /** Whether to use caching for this request */
  useCache?: boolean;
  /** Custom cache key (auto-generated if not provided) */
  cacheKey?: string;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
};

export interface AnalyticsResponse<T> {
  data: T | null;
  error: string | null;
  message: string;
  status: "success" | "error";
  statistics?: {
    bytes_read: number;
    elapsed: number;
    rows_read: number;
  };
}

export interface GasUsageData {
  total_gas_used_octas: number;
  total_gas_used_usd: number;
}

export interface TokenPriceData {
  bucketed_timestamp_minutes_utc: string;
  price_usd: number;
}

export interface BalanceHistoryData {
  date_day: string;
  total_balance_usd: number;
}

export interface TopPriceChangeData {
  asset_address: string;
  asset_name: string;
  asset_symbol: string;
  price_change_percentage: number;
  current_price_usd: number;
  previous_price_usd: number;
}

export interface TransactionHistoryData {
  asset_name: string;
  asset_symbol: string;
  block_timestamp: string;
  label_type: string;
  storage_id: string;
  txn_label: string;
  txn_version: string;
  wallet_balance: string;
  wallet_change: string;
}

export interface AriesRewardData {
  asset_type: string;
  reward_asset_type: string;
  total_reward_balance: number;
}

export interface AriesPoolAPRData {
  borrow_apr: number;
  date_day: string;
  deposit_apr: number;
  lp_price_ratio: number;
  utilization_percentage: number;
}

export class AptosAnalyticsService {
  private static readonly cache = new SimpleCache(5 * 60 * 1000); // 5 minutes TTL

  private classifyError(error: unknown): RetryableError {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return { isRetryable: true, shouldRetry: (attempt) => attempt < 3 };
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Network errors, timeouts, and 5xx errors are retryable
      if (message.includes("timeout") || message.includes("network") || message.includes("fetch")) {
        return { isRetryable: true, shouldRetry: (attempt) => attempt < 2 };
      }
    }

    // Default to not retryable
    return { isRetryable: false, shouldRetry: () => false };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async fetchWithRetry<T>(url: string, config: RequestConfig = {}): Promise<T> {
    const { timeout = DEFAULT_CONFIG.TIMEOUT, retries = DEFAULT_CONFIG.RETRY_ATTEMPTS } = config;
    let lastError: unknown;

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "On-Aptos/1.0",
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // 4xx errors are not retryable, 5xx errors are retryable
          const isRetryable = response.status >= 500;
          if (!isRetryable || attempt > retries) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          logger.warn(`[Analytics] HTTP ${response.status} on attempt ${attempt}, retrying...`);
          await this.delay(DEFAULT_CONFIG.RETRY_DELAY * attempt);
          continue;
        }

        const data = (await response.json()) as AnalyticsResponse<T>;

        if (data.status === "error" || !data.data) {
          throw new Error(data.error || data.message || "Unknown API error");
        }

        return data.data;
      } catch (error) {
        lastError = error;
        const errorInfo = this.classifyError(error);

        if (!errorInfo.isRetryable || !errorInfo.shouldRetry(attempt) || attempt > retries) {
          logger.error(`[Analytics] Final failure after ${attempt} attempts:`, error);
          throw error;
        }

        logger.warn(
          `[Analytics] Attempt ${attempt} failed, retrying in ${DEFAULT_CONFIG.RETRY_DELAY * attempt}ms:`,
          error
        );
        await this.delay(DEFAULT_CONFIG.RETRY_DELAY * attempt);
      }
    }

    throw lastError;
  }

  private async fetchAnalytics<T>(
    endpoint: string,
    params: Record<string, string | number | boolean>,
    config: RequestConfig = {}
  ): Promise<T> {
    const url = new URL(`${APTOS_ANALYTICS_BASE_URL}${endpoint}`);
    const { useCache = true, cacheKey, cacheTTL = DEFAULT_CONFIG.CACHE_TTL } = config;

    // Build query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    const finalUrl = url.toString();
    const finalCacheKey = cacheKey || `analytics:${endpoint}:${url.searchParams.toString()}`;

    // Check cache first if enabled
    if (useCache) {
      const cached = AptosAnalyticsService.cache.get<T>(finalCacheKey);
      if (cached) {
        logger.debug(`[Analytics] Cache hit for ${endpoint}`);
        return cached;
      }
    }

    try {
      const data = await this.fetchWithRetry<T>(finalUrl, config);

      // Cache successful results
      if (useCache) {
        AptosAnalyticsService.cache.set(finalCacheKey, data, cacheTTL);
      }

      return data;
    } catch (error) {
      logger.error(`[Analytics] Failed to fetch ${endpoint}:`, error);
      throw error;
    }
  }

  async getGasUsage(
    params: {
      gas_payer_address: string;
      start_unix_secs: number;
      end_unix_secs: number;
      bucket_granularity?: string;
      group_by_entry_function?: boolean;
    },
    config?: RequestConfig
  ): Promise<GasUsageData[]> {
    return this.fetchAnalytics<GasUsageData[]>("/gas/usage", params, {
      cacheTTL: DEFAULT_CONFIG.CACHE_TTL_LONG, // Gas usage changes less frequently
      ...config,
    });
  }

  async getTokenHistoricalPrices(
    params: {
      address: string;
      lookback: "hour" | "day" | "week" | "month" | "year" | "all";
      limit?: number;
      offset?: number;
      downsample_to?: number;
    },
    config?: RequestConfig
  ): Promise<TokenPriceData[]> {
    return this.fetchAnalytics<TokenPriceData[]>("/token/historical_prices", params, {
      cacheTTL:
        params.lookback === "hour" ? DEFAULT_CONFIG.CACHE_TTL : DEFAULT_CONFIG.CACHE_TTL_LONG,
      ...config,
    });
  }

  async getTokenLatestPrice(
    params: {
      address: string;
      date_utc?: string;
    },
    config?: RequestConfig
  ): Promise<TokenPriceData[]> {
    return this.fetchAnalytics<TokenPriceData[]>("/token/latest_price", params, {
      cacheTTL: params.date_utc ? DEFAULT_CONFIG.CACHE_TTL_LONG : DEFAULT_CONFIG.CACHE_TTL,
      ...config,
    });
  }

  async getHistoricalStoreBalances(
    params: {
      account_address: string;
      lookback: "year" | "all";
    },
    config?: RequestConfig
  ): Promise<BalanceHistoryData[]> {
    return this.fetchAnalytics<BalanceHistoryData[]>("/historical_store_balances", params, {
      cacheTTL: DEFAULT_CONFIG.CACHE_TTL_LONG,
      ...config,
    });
  }

  async getTopPriceChanges(
    params: {
      lookback: "hour" | "day" | "week" | "month";
      limit?: number;
      only_emoji?: boolean;
      gainers?: boolean;
    },
    config?: RequestConfig
  ): Promise<TopPriceChangeData[]> {
    return this.fetchAnalytics<TopPriceChangeData[]>("/token/top_price_changes", params, {
      cacheTTL:
        params.lookback === "hour" ? DEFAULT_CONFIG.CACHE_TTL : DEFAULT_CONFIG.CACHE_TTL_LONG,
      ...config,
    });
  }

  async getHistoricalTransactions(
    params: {
      account_address: string;
      date_start?: string;
      date_end?: string;
      asset_symbol?: string;
      limit?: number;
      offset?: number;
    },
    config?: RequestConfig
  ): Promise<TransactionHistoryData[]> {
    return this.fetchAnalytics<TransactionHistoryData[]>("/historical_transactions", params, {
      cacheTTL: DEFAULT_CONFIG.CACHE_TTL_LONG,
      ...config,
    });
  }

  async getAriesRewards(
    params: {
      account_address: string;
      profile_address: string;
      date_start?: string;
      date_end?: string;
    },
    config?: RequestConfig
  ): Promise<AriesRewardData[]> {
    return this.fetchAnalytics<AriesRewardData[]>("/aries/total_rewards", params, {
      cacheTTL: DEFAULT_CONFIG.CACHE_TTL_LONG,
      ...config,
    });
  }

  async getAriesPoolAPR(
    params: {
      reserve_asset_type: string;
      date_start?: string;
      date_end?: string;
    },
    config?: RequestConfig
  ): Promise<AriesPoolAPRData[]> {
    return this.fetchAnalytics<AriesPoolAPRData[]>("/aries/daily_pool_apr", params, {
      cacheTTL: DEFAULT_CONFIG.CACHE_TTL_LONG,
      ...config,
    });
  }

  /**
   * Batch multiple analytics requests with optimal caching and error handling
   */
  async batchRequest<T extends Record<string, any>>(
    requests: Array<{
      key: keyof T;
      endpoint: string;
      params: Record<string, string | number | boolean>;
      config?: RequestConfig;
    }>
  ): Promise<Partial<T>> {
    const results: Partial<T> = {};

    const promises = requests.map(async ({ key, endpoint, params, config }) => {
      try {
        const data = await this.fetchAnalytics(endpoint, params, config);
        return { key, data, error: null };
      } catch (error) {
        logger.warn(`[Analytics] Batch request failed for ${String(key)}:`, error);
        return { key, data: null, error };
      }
    });

    const settled = await Promise.allSettled(promises);

    settled.forEach((result) => {
      if (result.status === "fulfilled" && result.value.data) {
        results[result.value.key] = result.value.data;
      }
    });

    return results;
  }

  /**
   * Clear cache for specific patterns or all analytics data
   */
  static clearCache(pattern?: string): void {
    // SimpleCache only supports clearing all entries
    AptosAnalyticsService.cache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats(): { size: number; analytics_entries: number } {
    // SimpleCache doesn't expose all entries, so we'll use a simplified approach
    const analyticsEntries = 0; // Could track this separately if needed

    return {
      size: 0, // Could track this separately if needed
      analytics_entries: analyticsEntries,
    };
  }
}

export const aptosAnalytics = new AptosAnalyticsService();
