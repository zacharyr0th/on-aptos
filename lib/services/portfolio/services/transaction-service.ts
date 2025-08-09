import { PORTFOLIO_QUERY_LIMITS } from "@/lib/constants";
import { logger } from "@/lib/utils/logger";

import type { WalletTransaction } from "../types";
import { executeGraphQLQuery, QUERIES } from "../utils/graphql-helpers";

export class TransactionService {
  static async getWalletTransactions(
    address: string,
    limit: number = PORTFOLIO_QUERY_LIMITS.TRANSACTIONS,
  ): Promise<WalletTransaction[]> {
    try {
      // First get transaction versions for the account
      const response = await executeGraphQLQuery<{
        account_transactions: Array<{
          transaction_version: string;
          account_address: string;
        }>;
      }>(QUERIES.WALLET_TRANSACTIONS, {
        ownerAddress: address,
        limit,
      }, {
        includeAuth: true, // Use API key for auth
      });

      const accountTxns = response.account_transactions || [];
      
      if (accountTxns.length === 0) {
        return [];
      }

      // Get detailed transaction data
      const transactionVersions = accountTxns.map(tx => tx.transaction_version);
      
      const transactionsQuery = `
        query GetTransactionDetails($versions: [bigint!]) {
          transactions(
            where: { version: { _in: $versions } }
            order_by: { version: desc }
          ) {
            version
            block_height
            epoch
            round
            slot
            proposer
            timestamp
            inserted_at
            payload_type
            gas_unit_price
            max_gas_amount
            gas_used
            success
            vm_status
            payload
          }
        }
      `;

      const txDetails = await executeGraphQLQuery<{
        transactions: Array<{
          version: string;
          timestamp: string;
          payload_type: string;
          gas_used: string;
          success: boolean;
          payload?: any;
        }>;
      }>(transactionsQuery, {
        versions: transactionVersions,
      }, {
        includeAuth: true,
      });

      const transactions = txDetails.transactions || [];

      return transactions.map((tx) => ({
        transaction_version: tx.version,
        transaction_timestamp: tx.timestamp,
        type: tx.payload_type || "unknown",
        amount: "0", // Would need to parse from payload
        asset_type: "APT", // Default, would need to parse from payload
        success: tx.success,
        function: tx.payload?.function || undefined,
        gas_fee: tx.gas_used || undefined,
      }));
    } catch (error) {
      logger.error("Failed to fetch wallet transactions:", {
        error: error instanceof Error ? error.message : String(error),
        address,
        limit,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  static async getHistoricalActivities(
    address: string,
    startTime: string,
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
      }, {
        includeAuth: true, // Use API key for auth
      });

      return {
        fungibleActivities: response.fungible_asset_activities || [],
        coinActivities: response.coin_activities || [],
      };
    } catch (error) {
      logger.error("Failed to fetch historical activities:", error);
      throw error;
    }
  }
}
