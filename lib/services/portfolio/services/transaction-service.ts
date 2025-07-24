import { logger } from '@/lib/utils/logger';

import { QUERY_LIMITS } from '../constants';
import type { WalletTransaction } from '../types';
import { executeGraphQLQuery, QUERIES } from '../utils/graphql-helpers';

export class TransactionService {
  static async getWalletTransactions(
    address: string,
    limit: number = QUERY_LIMITS.TRANSACTIONS
  ): Promise<WalletTransaction[]> {
    try {
      const response = await executeGraphQLQuery<{
        fungible_asset_activities: Array<{
          transaction_version: string;
          transaction_timestamp: string;
          type: string;
          amount: string;
          asset_type: string;
          entry_function_id_str?: string;
          is_transaction_success: boolean;
          gas_fee_payer_address?: string;
        }>;
      }>(QUERIES.WALLET_TRANSACTIONS, {
        ownerAddress: address,
        limit,
      });

      const activities = response.fungible_asset_activities || [];

      return activities.map(activity => ({
        transaction_version: activity.transaction_version,
        transaction_timestamp: activity.transaction_timestamp,
        type: activity.type,
        amount: activity.amount,
        asset_type: activity.asset_type,
        success: activity.is_transaction_success,
        function: activity.entry_function_id_str,
        gas_fee: activity.gas_fee_payer_address ? '0' : undefined, // Placeholder
      }));
    } catch (error) {
      logger.error('Failed to fetch wallet transactions:', error);
      throw error;
    }
  }

  static async getHistoricalActivities(
    address: string,
    startTime: string
  ): Promise<{
    fungibleActivities: any[];
    coinActivities: any[];
  }> {
    try {
      const response = await executeGraphQLQuery<{
        fungible_asset_activities: any[];
        coin_activities: any[];
      }>(QUERIES.HISTORICAL_ACTIVITIES, {
        ownerAddress: address,
        startTime,
      });

      return {
        fungibleActivities: response.fungible_asset_activities || [],
        coinActivities: response.coin_activities || [],
      };
    } catch (error) {
      logger.error('Failed to fetch historical activities:', error);
      throw error;
    }
  }
}
