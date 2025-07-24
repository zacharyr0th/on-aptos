import { useState, useEffect } from 'react';

import { logger } from '@/lib/utils/logger';

interface PerformanceData {
  timestamp: string;
  value: number;
  price: number;
  balance: number;
}

interface UsePortfolioPerformanceProps {
  walletAddress?: string;
  timeframe?: '1h' | '12h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'all';
}

export function usePortfolioPerformance({
  walletAddress,
  timeframe = '7d',
}: UsePortfolioPerformanceProps) {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setData([]);
      return;
    }

    const fetchPortfolioPerformance = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          address: walletAddress,
          timeframe: timeframe,
        });

        const response = await fetch(
          `/api/analytics/portfolio-performance?${params}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          logger.error('Portfolio performance API error:', errorData);
          throw new Error(
            errorData.error || 'Failed to fetch portfolio performance'
          );
        }

        const result = await response.json();
        logger.debug('Portfolio performance data:', {
          walletAddress,
          timeframe,
          dataLength: result.data?.length,
          success: result.success,
          message: result.message,
          sampleData: result.data?.slice(0, 3), // Show first 3 items
          lastData: result.data?.slice(-3), // Show last 3 items
          allDataSame:
            result.data?.length > 1
              ? result.data.every(
                  (item: any) => item.value === result.data[0].value
                )
              : false,
        });

        setData(result.data || []);
      } catch (err) {
        logger.error('Portfolio performance error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolioPerformance();
  }, [walletAddress, timeframe]);

  // Calculate performance metrics
  const performanceMetrics =
    data.length > 1
      ? {
          current: data[data.length - 1]?.value || 0,
          previous: data[0]?.value || 0,
          get change() {
            return this.current - this.previous;
          },
          get percentage() {
            if (this.previous === 0) return 0;
            return ((this.current - this.previous) / this.previous) * 100;
          },
          get high() {
            return Math.max(...data.map(d => d.value));
          },
          get low() {
            return Math.min(...data.map(d => d.value));
          },
        }
      : null;

  return {
    data,
    isLoading,
    error,
    performanceMetrics,
  };
}
