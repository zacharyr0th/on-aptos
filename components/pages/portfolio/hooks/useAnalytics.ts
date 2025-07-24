import { useState, useEffect, useCallback } from 'react';

import { logger } from '@/lib/utils/logger';

interface PortfolioPerformanceData {
  timestamp: string;
  value: number;
  price: number;
  balance: number;
}

interface TokenPriceData {
  bucketed_timestamp_minutes_utc: string;
  price_usd: number;
}

interface BalanceHistoryData {
  hourly_timestamp: string;
  total_store_balance_usd: number;
}

interface TransactionData {
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

interface GasUsageData {
  total_gas_used_octas: number;
  total_gas_used_usd: number;
}

interface TopPriceChangeData {
  asset_address: string;
  asset_name: string;
  asset_symbol: string;
  price_change_percentage: number;
  current_price_usd: number;
  previous_price_usd: number;
}

interface AriesRewardData {
  asset_type: string;
  reward_asset_type: string;
  total_reward_balance: number;
}

interface AriesPoolAPRData {
  borrow_apr: number;
  date_day: string;
  deposit_apr: number;
  lp_price_ratio: number;
  utilization_percentage: number;
}

export interface AnalyticsData {
  portfolioPerformance: PortfolioPerformanceData[] | null;
  balanceHistory: BalanceHistoryData[] | null;
  tokenLatestPrice: number | null;
  tokenPriceHistory: TokenPriceData[] | null;
  topPriceChanges: TopPriceChangeData[] | null;
  gasUsage: GasUsageData[] | null;
  transactionHistory: TransactionData[] | null;
  ariesRewards: AriesRewardData[] | null;
  ariesPoolAPR: AriesPoolAPRData[] | null;
}

interface UseAnalyticsResult extends AnalyticsData {
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  lastUpdated: Date | null;
}

export function useAnalytics(
  walletAddress: string | undefined,
  timeframe: string = '7d'
): UseAnalyticsResult {
  const [data, setData] = useState<AnalyticsData>({
    portfolioPerformance: null,
    balanceHistory: null,
    tokenLatestPrice: null,
    tokenPriceHistory: null,
    topPriceChanges: null,
    gasUsage: null,
    transactionHistory: null,
    ariesRewards: null,
    ariesPoolAPR: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!walletAddress) {
      console.log('[useAnalytics] No wallet address provided');
      setData({
        portfolioPerformance: null,
        balanceHistory: null,
        tokenLatestPrice: null,
        tokenPriceHistory: null,
        topPriceChanges: null,
        gasUsage: null,
        transactionHistory: null,
        ariesRewards: null,
        ariesPoolAPR: null,
      });
      return;
    }

    console.log('[useAnalytics] Fetching analytics for wallet:', walletAddress);
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all analytics endpoints in parallel
      const [
        portfolioPerformanceRes,
        balanceHistoryRes,
        tokenLatestPriceRes,
        tokenPriceHistoryRes,
        topPriceChangesRes,
        gasUsageRes,
        transactionHistoryRes,
        ariesRewardsRes,
        ariesPoolAPRRes,
      ] = await Promise.allSettled([
        // Portfolio Performance
        fetch(
          `/api/analytics/portfolio-performance?address=${walletAddress}&timeframe=${timeframe}`
        ),

        // Balance History
        fetch(`/api/analytics/balance-history?address=${walletAddress}`),

        // Token Latest Price (APT)
        fetch(
          `/api/analytics/token-latest-price?address=0x1::aptos_coin::AptosCoin`
        ),

        // Token Price History (APT)
        fetch(
          `/api/analytics/token-price-history?address=0x1::aptos_coin::AptosCoin&timeframe=${timeframe}`
        ),

        // Top Price Changes
        fetch(`/api/analytics/top-price-changes?lookback=day&limit=10`),

        // Gas Usage (last 30 days)
        fetch(`/api/analytics/gas-usage?address=${walletAddress}&days=30`),

        // Transaction History
        fetch(`/api/analytics/transaction-history?address=${walletAddress}`),

        // Aries Rewards (if profile address is available)
        fetch(
          `/api/analytics/aries-rewards?address=${walletAddress}&profile_address=${walletAddress}`
        ).catch(() => null),

        // Aries Pool APR (USDC as example)
        fetch(
          `/api/analytics/aries-pool-apr?reserve_asset_type=0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC`
        ).catch(() => null),
      ]);

      // Process results
      const processResponse = async (
        result: PromiseSettledResult<Response | null>
      ) => {
        if (result.status === 'rejected') return null;
        if (!result.value) return null;

        const response = result.value;
        if (!response.ok) {
          logger.warn(
            `Analytics endpoint failed: ${response.status} ${response.url}`
          );
          return null;
        }

        try {
          const json = await response.json();
          return json.data || json;
        } catch (e) {
          logger.warn(
            `Failed to parse analytics response from ${response.url}`
          );
          return null;
        }
      };

      const [
        portfolioPerformance,
        balanceHistory,
        tokenLatestPriceData,
        tokenPriceHistory,
        topPriceChanges,
        gasUsage,
        transactionHistory,
        ariesRewards,
        ariesPoolAPR,
      ] = await Promise.all([
        processResponse(portfolioPerformanceRes),
        processResponse(balanceHistoryRes),
        processResponse(tokenLatestPriceRes),
        processResponse(tokenPriceHistoryRes),
        processResponse(topPriceChangesRes),
        processResponse(gasUsageRes),
        processResponse(transactionHistoryRes),
        processResponse(ariesRewardsRes),
        processResponse(ariesPoolAPRRes),
      ]);

      // Extract latest price from token price data
      const tokenLatestPrice =
        tokenLatestPriceData &&
        Array.isArray(tokenLatestPriceData) &&
        tokenLatestPriceData.length > 0
          ? tokenLatestPriceData[0].price_usd
          : null;

      console.log('[useAnalytics] Analytics data fetched:', {
        portfolioPerformance: portfolioPerformance?.length || 0,
        balanceHistory: balanceHistory?.length || 0,
        tokenLatestPrice,
        tokenPriceHistory: tokenPriceHistory?.length || 0,
        topPriceChanges: topPriceChanges?.length || 0,
        gasUsage: gasUsage?.length || 0,
        transactionHistory: transactionHistory?.length || 0,
        ariesRewards: ariesRewards?.length || 0,
        ariesPoolAPR: ariesPoolAPR?.length || 0,
      });

      setData({
        portfolioPerformance,
        balanceHistory,
        tokenLatestPrice,
        tokenPriceHistory,
        topPriceChanges,
        gasUsage,
        transactionHistory,
        ariesRewards,
        ariesPoolAPR,
      });

      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useAnalytics] Error:', err);
      logger.error('Failed to fetch analytics data:', {
        error: errorMessage,
        walletAddress,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, timeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    ...data,
    isLoading,
    error,
    refetch: fetchAnalytics,
    lastUpdated,
  };
}
