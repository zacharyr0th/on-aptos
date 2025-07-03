import { trpc } from '@/lib/trpc/client';

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
  const {
    data: queryData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = trpc.domains.marketData.prices.getCMCPrice.useQuery(
    { symbol },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
      refetchIntervalInBackground: true,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (like rate limits)
        if (error?.message?.includes('429')) return false;
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  // Transform error to match expected format
  const error = queryError?.message || null;
  const data = queryData?.data || null;

  // Get last updated time from the response
  const lastUpdated = data?.updated ? new Date(data.updated) : null;

  return { data, error, loading, lastUpdated, refetch };
}

// Convenience hooks for common symbols
export function useBitcoinPrice(): UseMarketPriceResult {
  return useMarketPrice('btc');
}

export function useCMCData(): UseMarketPriceResult {
  return useMarketPrice('susde');
}
