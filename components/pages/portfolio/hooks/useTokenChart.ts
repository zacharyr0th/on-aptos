import { useState, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';

interface TokenPriceData {
  bucketed_timestamp_minutes_utc: string;
  price_usd: number;
}

interface UseTokenChartProps {
  tokenAddress?: string;
  timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
}

export function useTokenChart({
  tokenAddress,
  timeframe = 'month',
}: UseTokenChartProps) {
  const [data, setData] = useState<TokenPriceData[]>([]);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress) {
      setData([]);
      setLatestPrice(null);
      return;
    }

    const fetchTokenData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch both historical data and latest price in parallel
        const [historyResponse, latestResponse] = await Promise.all([
          fetch(
            `/api/analytics/token-price-history?${new URLSearchParams({
              address: tokenAddress,
              lookback: timeframe,
              downsample_to: '100',
            })}`
          ),
          fetch(
            `/api/analytics/token-latest-price?${new URLSearchParams({
              address: tokenAddress,
            })}`
          ),
        ]);

        if (!historyResponse.ok) {
          const errorData = await historyResponse.json();
          logger.error('Token price history API error:', errorData);
          throw new Error(
            errorData.error || 'Failed to fetch token price history'
          );
        }

        const historyResult = await historyResponse.json();
        const historyData = historyResult.data || [];

        // Try to get latest price, but don't fail if it's not available
        let currentPrice = null;
        if (latestResponse.ok) {
          const latestResult = await latestResponse.json();
          currentPrice = latestResult.data?.[0]?.price_usd || null;
        }

        logger.debug('Token data:', {
          tokenAddress,
          timeframe,
          historyDataLength: historyData.length,
          firstPrice: historyData[0]?.price_usd,
          lastHistoricalPrice: historyData[historyData.length - 1]?.price_usd,
          latestPriceFromAPI: currentPrice,
        });

        setData(historyData);
        setLatestPrice(currentPrice);
      } catch (err) {
        logger.error('Token data fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setData([]);
        setLatestPrice(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenData();
  }, [tokenAddress, timeframe]);

  // Calculate price change percentage using accurate latest price and appropriate historical comparison
  const priceChange =
    data.length > 0
      ? (() => {
          const current = latestPrice || data[data.length - 1]?.price_usd || 0;
          const previous = data[0]?.price_usd || 0;

          const change = {
            current,
            previous,
            get percentage() {
              if (this.previous === 0) return 0;
              const pct =
                ((this.current - this.previous) / this.previous) * 100;
              logger.debug('Percentage calculation:', {
                current: this.current,
                previous: this.previous,
                percentage: pct,
                timeframe,
              });
              return pct;
            },
          };

          return change;
        })()
      : null;

  return {
    data,
    latestPrice,
    isLoading,
    error,
    priceChange,
  };
}
