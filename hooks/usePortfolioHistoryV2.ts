import { useState, useEffect } from 'react';
import {
  PortfolioHistoryPoint,
  UsePortfolioHistoryResult,
} from '@/lib/utils/portfolio-utils';

export function usePortfolioHistoryV2(
  walletAddress: string | null
): UsePortfolioHistoryResult {
  const [data, setData] = useState<PortfolioHistoryPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!walletAddress) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch both APIs in parallel
      const [balanceResponse, priceResponse] = await Promise.all([
        fetch(
          `/api/portfolio/balance-history?address=${encodeURIComponent(walletAddress)}`
        ),
        fetch('/api/portfolio/apt-price-history'),
      ]);

      console.log(
        '[usePortfolioHistoryV2] Using wallet address:',
        walletAddress
      );

      const balanceResult = await balanceResponse.json();
      const priceResult = await priceResponse.json();

      // Handle partial failures gracefully
      if (!balanceResponse.ok && !priceResponse.ok) {
        throw new Error('Both APIs failed');
      }

      if (!balanceResult.success && !priceResult.success) {
        throw new Error(
          `Balance API: ${balanceResult.error || 'failed'}, Price API: ${priceResult.error || 'failed'}`
        );
      }

      // Continue with partial data if one API succeeds
      const hasBalanceData = balanceResult.success && balanceResult.data;
      const hasPriceData = priceResult.success && priceResult.data;

      // Combine the data
      const portfolioHistory: PortfolioHistoryPoint[] = [];

      for (let i = 0; i < balanceResult.data.length; i++) {
        const balanceData = balanceResult.data[i];
        const priceData = priceResult.data[i];

        if (balanceData.date !== priceData.date) {
          console.warn('Date mismatch:', balanceData.date, priceData.date);
          continue;
        }

        let totalValue = 0;
        const assets = [];

        // Calculate portfolio value for this date
        for (const [assetType, balance] of Object.entries(
          balanceData.balances
        )) {
          const balanceNum = balance as number;

          // For now, we only have APT price
          let price = 0;
          let symbol = 'Unknown';

          if (
            assetType === '0x1::aptos_coin::AptosCoin' ||
            assetType === '0xa' ||
            assetType.toLowerCase().includes('aptos')
          ) {
            price = priceData.price || 0;
            symbol = 'APT';
          }

          const value = balanceNum * price;
          totalValue += value;

          if (balanceNum > 0) {
            assets.push({
              assetType,
              symbol,
              balance: balanceNum,
              price,
              value,
            });
          }
        }

        portfolioHistory.push({
          date: balanceData.date,
          totalValue,
          assets,
          rateLimited: priceData.rateLimited,
        });
      }

      setData(portfolioHistory);
    } catch (err) {
      console.error('Portfolio history fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [walletAddress]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
