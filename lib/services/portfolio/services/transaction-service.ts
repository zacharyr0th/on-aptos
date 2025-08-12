import { PORTFOLIO_QUERY_LIMITS } from "@/lib/constants";
import { logger } from "@/lib/utils/core/logger";

import type { WalletTransaction } from "../types";
import { UnifiedGraphQLClient, UNIFIED_QUERIES } from "../../shared/utils/unified-graphql-client";

export class TransactionService {
  static async getWalletTransactions(
    address: string,
    limit: number = PORTFOLIO_QUERY_LIMITS.TRANSACTIONS,
  ): Promise<WalletTransaction[]> {
    try {
      // Fetch transactions directly with all required data in single query
      const response = await UnifiedGraphQLClient.query<{
        account_transactions: Array<{
          transaction_version: string;
          account_address: string;
          user_transaction?: {
            sender: string;
            timestamp: string;
            success: boolean;
            gas_used: string;
            gas_unit_price: string;
            max_gas_amount: string;
            entry_function_id_str?: string;
            payload?: any;
          };
        }>;
      }>(
        UNIFIED_QUERIES.WALLET_TRANSACTIONS,
        {
          ownerAddress: address,
          limit,
        },
        {
          includeAuth: true, // Use API key for auth
        },
      );

      const accountTxns = response.account_transactions || [];

      if (accountTxns.length === 0) {
        return [];
      }

      // Process and return the transaction data
      return accountTxns.map((tx) => {
        const userTx = tx.user_transaction;
        
        return {
          transaction_version: tx.transaction_version,
          transaction_timestamp: userTx?.timestamp || "",
          type: userTx?.entry_function_id_str ? "entry_function_payload" : "unknown",
          amount: "0", // Would need to parse from payload for token transfers
          asset_type: "APT", // Default, would need to parse from payload
          success: userTx?.success || false,
          function: userTx?.entry_function_id_str || undefined,
          gas_fee: userTx?.gas_used || undefined,
        };
      });
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
      const response = await UnifiedGraphQLClient.query<{
        fungible_asset_activities: any[];
        coin_activities: any[];
      }>(
        UNIFIED_QUERIES.HISTORICAL_ACTIVITIES,
        {
          ownerAddress: address,
          startTime,
        },
        {
          includeAuth: true, // Use API key for auth
        },
      );

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
