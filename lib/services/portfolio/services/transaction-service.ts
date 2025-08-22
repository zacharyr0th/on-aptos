import { PORTFOLIO_QUERY_LIMITS } from "@/lib/constants";

import {
  UnifiedGraphQLClient,
  UNIFIED_QUERIES,
} from "../../shared/utils/unified-graphql-client";
import type { WalletTransaction } from "../types";

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
            payload?: {
              function?: string;
              type_arguments?: string[];
              arguments?: unknown[];
              code?: {
                bytecode?: string;
              };
            };
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
          sender: userTx?.sender || "",
          sequence_number: "0", // Default value
          max_gas_amount: userTx?.max_gas_amount || "0",
          gas_unit_price: userTx?.gas_unit_price || "0",
          expiration_timestamp_secs: "0", // Default value
          payload: userTx?.payload || null,
          events: [],
          hash: tx.transaction_version, // Use version as hash fallback
          gas_used: userTx?.gas_used || "0",
          success: userTx?.success || false,
          vm_status: userTx?.success ? "Executed successfully" : "Failed",
          accumulator_root_hash: "",
          // Processed fields
          type: userTx?.entry_function_id_str
            ? "entry_function_payload"
            : "unknown",
          function: userTx?.entry_function_id_str || undefined,
        };
      });
    } catch (error) {
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
    fungibleActivities: unknown[];
    coinActivities: unknown[];
  }> {
    try {
      const response = await UnifiedGraphQLClient.query<{
        fungible_asset_activities: unknown[];
        coin_activities: unknown[];
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
      throw error;
    }
  }
}
