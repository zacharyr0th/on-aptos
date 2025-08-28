import { getEnvVar } from "@/lib/config/validate-env";
import { PORTFOLIO_QUERY_LIMITS } from "@/lib/constants";
import { logger, apiLogger } from "@/lib/utils/core/logger";

import {
  UnifiedGraphQLClient,
  UNIFIED_QUERIES,
} from "../../shared/utils/unified-graphql-client";
import type { WalletTransaction } from "../types";

const APTOS_INDEXER_URL = "https://api.mainnet.aptoslabs.com/v1/graphql";

interface TransactionData {
  transaction_version: string;
  transaction_timestamp: string;
  type: string;
  amount: string;
  asset_type: string;
  asset_name: string;
  success: boolean;
  function?: string;
  gas_fee?: string;
  gas_unit_price?: string;
  max_gas_amount?: string;
  sender?: string;
  sequence_number?: string;
  block_height?: string;
  epoch?: string;
  expiration_timestamp_secs?: string;
  events?: any[];
  signatures?: any[];
  raw_data?: any;
}

interface TransactionResult {
  data: TransactionData[];
  totalCount: number;
  hasMore: boolean;
  success: boolean;
  nextOffset?: number;
}

export class TransactionService {
  private static getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const apiKey = getEnvVar("APTOS_BUILD_SECRET");
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    return headers;
  }

  /**
   * Shared method to fetch transactions with full details (used by both API routes)
   */
  static async fetchTransactionsWithDetails(
    address: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<TransactionResult> {
    try {
      apiLogger.info(
        `Fetching ${limit} transactions starting at offset ${offset} for address ${address}`,
      );

      // Step 1: Get transaction versions and total count
      const versionsQuery = `
        query GetAccountTransactions($address: String!, $limit: Int!, $offset: Int!) {
          account_transactions(
            where: { account_address: { _eq: $address } }
            order_by: { transaction_version: desc }
            limit: $limit
            offset: $offset
          ) {
            transaction_version
          }
          account_transactions_aggregate(
            where: { account_address: { _eq: $address } }
          ) {
            aggregate {
              count
            }
          }
        }
      `;

      const versionsResponse = await fetch(APTOS_INDEXER_URL, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          query: versionsQuery,
          variables: { address, limit, offset },
        }),
      });

      if (!versionsResponse.ok) {
        throw new Error(`GraphQL request failed: ${versionsResponse.status}`);
      }

      const versionsResult = await versionsResponse.json();

      if (versionsResult.errors) {
        apiLogger.error(
          `GraphQL error: ${JSON.stringify(versionsResult.errors)}`,
        );
        throw new Error(
          `GraphQL error: ${versionsResult.errors[0]?.message || "Unknown error"}`,
        );
      }

      const accountTxns = versionsResult.data?.account_transactions || [];
      const totalCount =
        versionsResult.data?.account_transactions_aggregate?.aggregate?.count ||
        0;

      if (accountTxns.length === 0) {
        return {
          data: [],
          totalCount,
          hasMore: false,
          success: true,
          nextOffset: offset,
        };
      }

      // Step 2: Get transaction details
      const txVersions = accountTxns.map((tx: any) => tx.transaction_version);
      const processedTransactions =
        await this.fetchAndProcessTransactionDetails(txVersions);

      apiLogger.info(
        `Transaction fetch completed: ${processedTransactions.length} transactions, ${totalCount} total`,
      );

      return {
        data: processedTransactions,
        totalCount,
        hasMore: offset + processedTransactions.length < totalCount,
        success: true,
        nextOffset: offset + processedTransactions.length,
      };
    } catch (error) {
      apiLogger.error(
        `Failed to fetch transactions: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        data: [],
        totalCount: 0,
        hasMore: false,
        success: false,
      };
    }
  }

  /**
   * Helper method to fetch and process transaction details
   */
  private static async fetchAndProcessTransactionDetails(
    txVersions: string[],
  ): Promise<TransactionData[]> {
    const headers = this.getHeaders();
    const detailsBatchSize = 100;
    let allTransactions: any[] = [];
    let allEvents: any[] = [];
    let allSignatures: any[] = [];
    let allBlockMetadata: any[] = [];

    // Fetch details in batches
    for (let i = 0; i < txVersions.length; i += detailsBatchSize) {
      const batchVersions = txVersions.slice(i, i + detailsBatchSize);

      const detailsQuery = `
        query GetTransactionDetails($versions: [bigint!]) {
          user_transactions(
            where: { version: { _in: $versions } }
            order_by: { version: desc }
          ) {
            version
            block_height
            timestamp
            sender
            sequence_number
            max_gas_amount
            gas_unit_price
            expiration_timestamp_secs
            entry_function_id_str
            epoch
          }
          block_metadata_transactions(
            where: { version: { _in: $versions } }
            order_by: { version: desc }
          ) {
            version
            block_height
            timestamp
            epoch
          }
          events(
            where: { transaction_version: { _in: $versions } }
            order_by: { transaction_version: desc, event_index: asc }
            limit: 500
          ) {
            transaction_version
            type
            data
          }
          signatures(
            where: { transaction_version: { _in: $versions } }
            order_by: { transaction_version: desc }
          ) {
            transaction_version
            signer
            is_sender_primary
            type
            signature
          }
        }
      `;

      const detailsResponse = await fetch(APTOS_INDEXER_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: detailsQuery,
          variables: { versions: batchVersions },
        }),
      });

      const detailsResult = await detailsResponse.json();

      if (detailsResult.errors) {
        apiLogger.error(
          `GraphQL error for batch: ${JSON.stringify(detailsResult.errors)}`,
        );
        continue;
      }

      allTransactions = allTransactions.concat(
        detailsResult.data?.user_transactions || [],
      );
      allEvents = allEvents.concat(detailsResult.data?.events || []);
      allSignatures = allSignatures.concat(
        detailsResult.data?.signatures || [],
      );
      allBlockMetadata = allBlockMetadata.concat(
        detailsResult.data?.block_metadata_transactions || [],
      );

      if (i > 0) {
        apiLogger.info(
          `Fetched details for ${i + batchVersions.length}/${txVersions.length} transactions`,
        );
      }
    }

    // Process and return transactions
    return this.processTransactions(
      allTransactions,
      allBlockMetadata,
      allEvents,
      allSignatures,
      txVersions,
    );
  }

  /**
   * Process raw transaction data into formatted TransactionData
   */
  private static processTransactions(
    transactions: any[],
    blockMetadata: any[],
    events: any[],
    signatures: any[],
    txVersions: string[],
  ): TransactionData[] {
    // Group events and signatures by transaction version
    const eventsByVersion = events.reduce((acc: any, event: any) => {
      if (!acc[event.transaction_version]) acc[event.transaction_version] = [];
      acc[event.transaction_version].push(event);
      return acc;
    }, {});

    const signaturesByVersion = signatures.reduce((acc: any, sig: any) => {
      if (!acc[sig.transaction_version]) acc[sig.transaction_version] = [];
      acc[sig.transaction_version].push(sig);
      return acc;
    }, {});

    // Create a map of all transactions
    const allTransactionsMap = new Map();

    // Add user transactions
    transactions.forEach((tx: any) => {
      allTransactionsMap.set(tx.version, {
        ...tx,
        transaction_type: "user_transaction",
      });
    });

    // Add block metadata transactions
    blockMetadata.forEach((tx: any) => {
      if (!allTransactionsMap.has(tx.version)) {
        allTransactionsMap.set(tx.version, {
          ...tx,
          transaction_type: "block_metadata",
          entry_function_id_str: "Block Metadata",
          sender: "system",
          gas_unit_price: "0",
          max_gas_amount: "0",
          sequence_number: "0",
        });
      }
    });

    // Add placeholder for missing transactions
    txVersions.forEach((version: string) => {
      if (!allTransactionsMap.has(version)) {
        allTransactionsMap.set(version, {
          version,
          transaction_type: "unknown",
          timestamp: new Date().toISOString(),
          entry_function_id_str: "Transaction",
          sender: "unknown",
          gas_unit_price: "0",
          max_gas_amount: "0",
          sequence_number: "0",
          block_height: "0",
          epoch: "0",
        });
      }
    });

    // Sort by version (descending)
    const sortedTransactions = Array.from(allTransactionsMap.values()).sort(
      (a, b) => Number(b.version) - Number(a.version),
    );

    return sortedTransactions.map((tx: any) => {
      // Extract amount from events
      let amount = "0";
      let assetType = "APT";
      const txEvents = eventsByVersion[tx.version] || [];

      for (const event of txEvents) {
        if (event.type && event.data) {
          try {
            const eventData =
              typeof event.data === "string"
                ? JSON.parse(event.data)
                : event.data;

            if (
              event.type.includes("CoinWithdrawEvent") ||
              event.type.includes("CoinDepositEvent") ||
              event.type.includes("WithdrawEvent") ||
              event.type.includes("DepositEvent")
            ) {
              amount = eventData.amount || "0";
              const typeMatch = event.type.match(/<([^>]+)>/);
              if (typeMatch) {
                assetType = typeMatch[1].includes("aptos_coin")
                  ? "APT"
                  : typeMatch[1];
              }
              break;
            }
          } catch {
            // Failed to parse event data
          }
        }
      }

      return {
        transaction_version: tx.version,
        transaction_timestamp: tx.timestamp,
        type: tx.entry_function_id_str || "Transaction",
        amount: amount,
        asset_type: assetType,
        asset_name: assetType === "APT" ? "Aptos" : assetType,
        success: true,
        function: tx.entry_function_id_str,
        gas_fee: tx.gas_unit_price || "0",
        gas_unit_price: tx.gas_unit_price,
        max_gas_amount: tx.max_gas_amount,
        sender: tx.sender,
        sequence_number: tx.sequence_number,
        block_height: tx.block_height,
        epoch: tx.epoch,
        expiration_timestamp_secs: tx.expiration_timestamp_secs,
        events: txEvents,
        signatures: signaturesByVersion[tx.version] || [],
        raw_data: {
          user_transaction: tx,
          events: txEvents,
          signatures: signaturesByVersion[tx.version],
          block_metadata: blockMetadata,
        },
      };
    });
  }

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
          type: userTx?.entry_function_id_str
            ? "entry_function_payload"
            : "unknown",
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
