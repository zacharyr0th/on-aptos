import { useState, useEffect, useMemo, useCallback } from 'react';
import { PortfolioHistoryPoint } from '@/lib/utils/portfolio-utils';

interface OptimizedPortfolioData {
  date: string;
  aptBalance: number;
  aptPrice: number | null;
  totalValue: number;
  dataSource?: string | null;
}

interface UsePortfolioHistoryOptions {
  days?: number;
  fields?: string[];
  enableDataDecimation?: boolean;
  refetchInterval?: number;
}

interface UsePortfolioHistoryResult {
  data: PortfolioHistoryPoint[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  decimatedData: PortfolioHistoryPoint[] | null;
}

export function usePortfolioHistoryV3(
  walletAddress: string | undefined,
  options: UsePortfolioHistoryOptions = {}
): UsePortfolioHistoryResult {
  const {
    days = 7,
    fields = ['date', 'aptBalance', 'aptPrice', 'totalValue'],
    enableDataDecimation = true,
    refetchInterval = 0,
  } = options;

  const [data, setData] = useState<OptimizedPortfolioData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolioHistory = useCallback(async () => {
    if (!walletAddress) {
      setData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        address: walletAddress,
        days: days.toString(),
        fields: fields.join(','),
      });

      const baseUrl =
        typeof window !== 'undefined' ? '' : 'http://localhost:3001';
      const response = await fetch(
        `${baseUrl}/api/portfolio/history?${params}`,
        {
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate, br',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to fetch: ${response.status}`
        );
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (err) {
      console.error('[usePortfolioHistoryV3] Error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch portfolio history'
      );
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, days, fields]);

  // Initial fetch and refetch interval
  useEffect(() => {
    fetchPortfolioHistory();

    if (refetchInterval > 0) {
      const interval = setInterval(fetchPortfolioHistory, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPortfolioHistory, refetchInterval]);

  // Process data into the expected format with memoization
  const processedData = useMemo<PortfolioHistoryPoint[] | null>(() => {
    if (!data) return null;

    return data.map(point => ({
      date: point.date,
      totalValue: point.totalValue || 0,
      assets: [
        {
          assetType: '0x1::aptos_coin::AptosCoin',
          symbol: 'APT',
          balance: point.aptBalance || 0,
          price: point.aptPrice || 0,
          value: point.totalValue || 0,
        },
      ],
      rateLimited: point.dataSource === null && point.aptPrice === null,
    }));
  }, [data]);

  // Data decimation for large datasets
  const decimatedData = useMemo<PortfolioHistoryPoint[] | null>(() => {
    if (!processedData || !enableDataDecimation) return processedData;

    // Simple decimation: if more than 30 points, take every nth point
    if (processedData.length <= 30) return processedData;

    const factor = Math.ceil(processedData.length / 30);
    return processedData.filter((_, index) => index % factor === 0);
  }, [processedData, enableDataDecimation]);

  return {
    data: processedData,
    isLoading,
    error,
    refetch: fetchPortfolioHistory,
    decimatedData,
  };
}

// Helper hook for chart-specific optimizations
export function usePortfolioChartData(
  walletAddress: string | undefined,
  options: UsePortfolioHistoryOptions = {}
) {
  const result = usePortfolioHistoryV3(walletAddress, {
    ...options,
    enableDataDecimation: true,
  });

  // Additional chart-specific processing
  const chartData = useMemo(() => {
    const data = result.decimatedData || result.data;
    if (!data) return null;

    return {
      data,
      domain: {
        min: Math.min(...data.map(d => d.totalValue)),
        max: Math.max(...data.map(d => d.totalValue)),
      },
      hasRateLimitedData: data.some(d => d.rateLimited),
    };
  }, [result.data, result.decimatedData]);

  return {
    ...result,
    chartData,
  };
}
