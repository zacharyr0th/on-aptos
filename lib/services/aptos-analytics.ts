import { logger } from '@/lib/utils/logger';

const APTOS_ANALYTICS_BASE_URL =
  'https://api.mainnet.aptoslabs.com/v1/analytics';

interface AnalyticsResponse<T> {
  data: T | null;
  error: string | null;
  message: string;
  status: 'success' | 'error';
  statistics?: {
    bytes_read: number;
    elapsed: number;
    rows_read: number;
  };
}

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

export class AptosAnalyticsService {
  private async fetchAnalytics<T>(
    endpoint: string,
    params: Record<string, string | number | boolean>
  ): Promise<T> {
    const url = new URL(`${APTOS_ANALYTICS_BASE_URL}${endpoint}`);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    try {
      const response = await fetch(url.toString());
      const data = (await response.json()) as AnalyticsResponse<T>;

      if (data.status === 'error' || !data.data) {
        throw new Error(data.error || data.message || 'Unknown error');
      }

      return data.data;
    } catch (error) {
      logger.error(`Failed to fetch ${endpoint}:`, error);
      throw error;
    }
  }

  async getGasUsage(params: {
    gas_payer_address: string;
    start_unix_secs: number;
    end_unix_secs: number;
    bucket_granularity?: string;
    group_by_entry_function?: boolean;
  }): Promise<GasUsageData[]> {
    return this.fetchAnalytics<GasUsageData[]>('/gas/usage', params);
  }

  async getTokenHistoricalPrices(params: {
    address: string;
    lookback: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    limit?: number;
    offset?: number;
    downsample_to?: number;
  }): Promise<TokenPriceData[]> {
    return this.fetchAnalytics<TokenPriceData[]>(
      '/token/historical_prices',
      params
    );
  }

  async getTokenLatestPrice(params: {
    address: string;
    date_utc?: string;
  }): Promise<TokenPriceData[]> {
    return this.fetchAnalytics<TokenPriceData[]>('/token/latest_price', params);
  }

  async getHistoricalStoreBalances(params: {
    account_address: string;
    lookback: 'year' | 'all';
  }): Promise<BalanceHistoryData[]> {
    return this.fetchAnalytics<BalanceHistoryData[]>(
      '/historical_store_balances',
      params
    );
  }

  async getTopPriceChanges(params: {
    lookback: 'hour' | 'day' | 'week' | 'month';
    limit?: number;
    only_emoji?: boolean;
    gainers?: boolean;
  }): Promise<TopPriceChangeData[]> {
    return this.fetchAnalytics<TopPriceChangeData[]>(
      '/token/top_price_changes',
      params
    );
  }

  async getHistoricalTransactions(params: {
    account_address: string;
    date_start?: string;
    date_end?: string;
    asset_symbol?: string;
    limit?: number;
    offset?: number;
  }): Promise<TransactionHistoryData[]> {
    return this.fetchAnalytics<TransactionHistoryData[]>(
      '/historical_transactions',
      params
    );
  }

  async getAriesRewards(params: {
    account_address: string;
    profile_address: string;
    date_start?: string;
    date_end?: string;
  }): Promise<AriesRewardData[]> {
    return this.fetchAnalytics<AriesRewardData[]>(
      '/aries/total_rewards',
      params
    );
  }

  async getAriesPoolAPR(params: {
    reserve_asset_type: string;
    date_start?: string;
    date_end?: string;
  }): Promise<AriesPoolAPRData[]> {
    return this.fetchAnalytics<AriesPoolAPRData[]>(
      '/aries/daily_pool_apr',
      params
    );
  }
}

export const aptosAnalytics = new AptosAnalyticsService();
