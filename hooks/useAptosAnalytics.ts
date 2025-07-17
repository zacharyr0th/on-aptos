import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

interface GasUsageData {
  total_gas_used_octas: number;
  total_gas_used_usd: number;
}

interface TokenPriceData {
  bucketed_timestamp_minutes_utc: string;
  price_usd: number;
}

interface BalanceHistoryData {
  hourly_timestamp: string;
  total_store_balance_usd: number;
}

interface TopPriceChangeData {
  asset_address: string;
  asset_name: string;
  asset_symbol: string;
  price_change_percentage: number;
  current_price_usd: number;
  previous_price_usd: number;
}

interface TransactionHistoryData {
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

export function useGasUsage(
  address: string | null,
  startDate: Date,
  endDate: Date,
  granularity?: string
) {
  const [data, setData] = useState<GasUsageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use timestamps for stable comparison
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime();

  useEffect(() => {
    if (!address) return;

    const fetchGasUsage = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          gas_payer_address: address,
          start_unix_secs: Math.floor(startTimestamp / 1000).toString(),
          end_unix_secs: Math.floor(endTimestamp / 1000).toString(),
        });

        // Add bucket granularity if specified
        if (granularity) {
          params.append('bucket_granularity', granularity);
        }

        const response = await fetch(`/api/analytics/gas-usage?${params}`);
        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        setData(result.data || []);
      } catch (err) {
        logger.error('Failed to fetch gas usage:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchGasUsage();
  }, [address, startTimestamp, endTimestamp, granularity]);

  return { data, loading, error };
}

export function useTokenPriceHistory(
  tokenAddress: string | null,
  lookback: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'
) {
  const [data, setData] = useState<TokenPriceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tokenAddress) return;

    const fetchPriceHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          address: tokenAddress,
          lookback,
        });

        const response = await fetch(
          `/api/analytics/token-price-history?${params}`
        );
        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        setData(result.data || []);
      } catch (err) {
        logger.error('Failed to fetch token price history:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceHistory();
  }, [tokenAddress, lookback]);

  return { data, loading, error };
}

export function useBalanceHistory(
  address: string | null,
  lookback: 'year' | 'all' = 'year'
) {
  const [data, setData] = useState<BalanceHistoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalanceHistory = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        account_address: address,
        lookback,
      });

      const response = await fetch(
        `/api/analytics/balance-history?${params}`
      );
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setData(result.data || []);
    } catch (err) {
      logger.error('Failed to fetch balance history:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [address, lookback]);

  useEffect(() => {
    fetchBalanceHistory();
  }, [fetchBalanceHistory]);

  return { data, loading, error, refetch: fetchBalanceHistory };
}

export function useTopPriceChanges(
  lookback: 'hour' | 'day' | 'week' | 'month',
  limit: number = 10,
  gainers: boolean = true
) {
  const [data, setData] = useState<TopPriceChangeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTopChanges = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          lookback,
          limit: limit.toString(),
          gainers: gainers.toString(),
        });

        const response = await fetch(
          `/api/analytics/top-price-changes?${params}`
        );
        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        setData(result.data || []);
      } catch (err) {
        logger.error('Failed to fetch top price changes:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopChanges();
  }, [lookback, limit, gainers]);

  return { data, loading, error };
}

export function useTransactionHistory(
  address: string | null,
  options?: {
    dateStart?: string;
    dateEnd?: string;
    assetSymbol?: string;
    limit?: number;
    offset?: number;
  }
) {
  const [data, setData] = useState<TransactionHistoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) return;

    const fetchTransactionHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          account_address: address,
        });

        if (options?.dateStart) params.append('date_start', options.dateStart);
        if (options?.dateEnd) params.append('date_end', options.dateEnd);
        if (options?.assetSymbol)
          params.append('asset_symbol', options.assetSymbol);
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.offset) params.append('offset', options.offset.toString());

        const response = await fetch(
          `/api/analytics/transaction-history?${params}`
        );
        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        setData(result.data || []);
      } catch (err) {
        logger.error('Failed to fetch transaction history:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionHistory();
  }, [
    address,
    options?.dateStart,
    options?.dateEnd,
    options?.assetSymbol,
    options?.limit,
    options?.offset,
  ]);

  return { data, loading, error };
}
