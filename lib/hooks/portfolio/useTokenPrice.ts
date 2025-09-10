import { useCallback, useEffect, useMemo, useState } from "react";

import { dedupeFetch } from "@/lib/utils/cache/request-deduplication";
import { logger } from "@/lib/utils/core/logger";

interface TokenPriceOptions {
  refreshInterval?: number;
  includeHistory?: boolean;
  historyTimeframe?: "hour" | "day" | "week" | "month" | "year" | "all";
  downsampleTo?: number;
}

interface TokenPriceResult {
  price: number | null;
  priceHistory?: Array<{
    timestamp: string;
    price: number;
  }>;
  priceChange?: {
    current: number;
    previous: number;
    percentage: number;
  };
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Unified hook for fetching token prices with optional history
 * Replaces useAptPrice, useMarketPrice, and price fetching from useTokenChart
 */
export function useTokenPrice(
  tokenAddress?: string,
  options: TokenPriceOptions = {}
): TokenPriceResult {
  const {
    refreshInterval = 60000,
    includeHistory = false,
    historyTimeframe = "month",
    downsampleTo = 100,
  } = options;

  const [price, setPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<Array<{ timestamp: string; price: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!tokenAddress) {
      setPrice(null);
      setPriceHistory([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requests: Promise<Response>[] = [
        dedupeFetch(`/api/unified/prices?tokens=${encodeURIComponent(tokenAddress)}`),
      ];

      if (includeHistory) {
        requests.push(
          dedupeFetch(
            `/api/data/analytics/token-price-history?${new URLSearchParams({
              address: tokenAddress,
              lookback: historyTimeframe,
              downsample_to: downsampleTo.toString(),
            })}`
          )
        );
      }

      const responses = await Promise.all(requests);
      const [latestResponse, historyResponse] = responses;

      // Process latest price
      if (!latestResponse.ok) {
        throw new Error(`Failed to fetch token price: ${latestResponse.status}`);
      }

      const latestData = await latestResponse.json();
      const currentPrice = latestData.prices?.[tokenAddress] || null;
      setPrice(currentPrice);
      setLastUpdated(new Date());

      // Process price history if requested
      if (includeHistory && historyResponse) {
        if (!historyResponse.ok) {
          logger.warn(`Failed to fetch price history: ${historyResponse.status}`);
        } else {
          const historyData = await historyResponse.json();
          const history = (historyData.data || []).map((item: any) => ({
            timestamp: item.bucketed_timestamp_minutes_utc,
            price: item.price_usd,
          }));
          setPriceHistory(history);
        }
      }

      logger.debug("Token price fetched", {
        tokenAddress,
        price: currentPrice,
        historyLength: priceHistory.length,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.error(`Failed to fetch token price: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, includeHistory, historyTimeframe, downsampleTo]);

  // Calculate price change
  const priceChange = useMemo(() => {
    if (!price || priceHistory.length === 0) return undefined;

    const current = price;
    const previous = priceHistory[0]?.price || 0;

    if (previous === 0) return undefined;

    return {
      current,
      previous,
      percentage: ((current - previous) / previous) * 100,
    };
  }, [price, priceHistory]);

  // Initial fetch and refresh interval
  useEffect(() => {
    fetchPrice();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchPrice, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPrice, refreshInterval]);

  return {
    price,
    priceHistory: includeHistory ? priceHistory : undefined,
    priceChange,
    isLoading,
    error,
    refetch: fetchPrice,
    lastUpdated,
  };
}

/**
 * Convenience hook for APT price
 */
export function useAptPrice(refreshInterval = 60000) {
  return useTokenPrice("0x1::aptos_coin::AptosCoin", { refreshInterval });
}

/**
 * Hook for token price with chart data
 */
export function useTokenChart(
  tokenAddress?: string,
  timeframe: "hour" | "day" | "week" | "month" | "year" | "all" = "month"
) {
  const result = useTokenPrice(tokenAddress, {
    includeHistory: true,
    historyTimeframe: timeframe,
    refreshInterval: 0, // Don't auto-refresh for charts
  });

  // Transform for backward compatibility with existing chart components
  const data = useMemo(() => {
    return (
      result.priceHistory?.map((item) => ({
        bucketed_timestamp_minutes_utc: item.timestamp,
        price_usd: item.price,
      })) || []
    );
  }, [result.priceHistory]);

  return {
    data,
    latestPrice: result.price,
    isLoading: result.isLoading,
    error: result.error,
    priceChange: result.priceChange,
  };
}
