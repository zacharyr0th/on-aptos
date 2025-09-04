import { useState, useEffect, useCallback } from "react";

import { dedupeFetch } from "@/lib/utils/cache/request-deduplication";

interface MarketPriceData {
  symbol: string;
  name: string;
  price: number;
  updated: string;
}

interface UseMarketPriceResult {
  data: MarketPriceData | null;
  error: string | null;
  loading: boolean;
  lastUpdated?: Date | null;
  refetch?: () => void;
}

export function useMarketPrice(symbol: string): UseMarketPriceResult {
  const [data, setData] = useState<MarketPriceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // For Bitcoin, use xBTC price from token-latest-price API
      if (
        symbol.toLowerCase() === "btc" ||
        symbol.toLowerCase() === "bitcoin"
      ) {
        const xBTCAddress =
          "0x81214a80d82035a190fcb76b6ff3c0145161c3a9f33d137f2bbaee4cfec8a387";
        const response = await dedupeFetch(
          `/api/unified/prices?tokens=${xBTCAddress}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.prices && result.prices[xBTCAddress]) {
          setData({
            symbol: "BTC",
            name: "Bitcoin",
            price: result.prices[xBTCAddress],
            updated: result.timestamp || new Date().toISOString(),
          });
          setLastUpdated(new Date());
        } else {
          throw new Error("No price data available");
        }
      } else {
        // For other symbols, price API not available
        setData(null);
        setError("Price API not available for this symbol");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch price");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Auto-refetch every 5 minutes
  useEffect(() => {
    fetchPrice();

    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  const refetch = useCallback(() => {
    return fetchPrice();
  }, [fetchPrice]);

  return { data, error, loading, lastUpdated, refetch };
}

// Convenience hooks for common symbols
export function useBitcoinPrice(): UseMarketPriceResult {
  return useMarketPrice("btc");
}
