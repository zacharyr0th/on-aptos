import { NextRequest, NextResponse } from "next/server";

import { getEnvVar } from "@/lib/config/validate-env";
import { AssetService } from "@/lib/services/portfolio/services/asset-service";
import { DeFiService } from "@/lib/services/defi/services/defi-service";
import { NFTService } from "@/lib/services/portfolio/services/nft-service";
import { apiLogger } from "@/lib/utils/core/logger";

// Revalidate cache every 5 minutes
export const revalidate = 300;

// Helper function to fetch transactions with full details
async function fetchTransactionsInternal(
  walletAddress: string,
  limit: number = 100,
) {
  apiLogger.info(
    `🔄 FETCHING TRANSACTIONS: Starting transaction fetch for ${walletAddress}, limit: ${limit}`,
  );
  try {
    const APTOS_INDEXER_URL = "https://api.mainnet.aptoslabs.com/v1/graphql";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const apiKey = getEnvVar("APTOS_BUILD_SECRET");
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // First, get transaction versions
    const versionsQuery = `
      query GetAccountTransactions($address: String!, $limit: Int!) {
        account_transactions(
          where: { account_address: { _eq: $address } }
          order_by: { transaction_version: desc }
          limit: $limit
          offset: 0
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
      headers,
      body: JSON.stringify({
        query: versionsQuery,
        variables: { address: walletAddress, limit },
      }),
    });

    if (!versionsResponse.ok) {
      throw new Error(`GraphQL request failed: ${versionsResponse.status}`);
    }

    const versionsResult = await versionsResponse.json();

    if (versionsResult.errors) {
      throw new Error(
        `GraphQL errors: ${JSON.stringify(versionsResult.errors)}`,
      );
    }

    const accountTxns = versionsResult.data?.account_transactions || [];
    const totalCount =
      versionsResult.data?.account_transactions_aggregate?.aggregate?.count ||
      0;

    if (accountTxns.length === 0) {
      return { data: [], totalCount, hasMore: false, success: true };
    }

    // Get transaction details for the fetched versions
    const txVersions = accountTxns.map((tx: any) => tx.transaction_version);

    // Fetch transaction details - get both user_transactions and block_metadata_transactions
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
      }
    `;

    const detailsResponse = await fetch(APTOS_INDEXER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: detailsQuery,
        variables: { versions: txVersions },
      }),
    });

    if (!detailsResponse.ok) {
      throw new Error(`Details request failed: ${detailsResponse.status}`);
    }

    const detailsResult = await detailsResponse.json();

    if (detailsResult.errors) {
      apiLogger.error(
        `GraphQL errors: ${JSON.stringify(detailsResult.errors)}`,
      );
      // Return basic data without details
      return {
        data: accountTxns.map((tx: any) => ({
          transaction_version: tx.transaction_version,
          transaction_timestamp: new Date().toISOString(),
          type: "Transaction",
          amount: "0",
          asset_type: "APT",
          success: true,
        })),
        totalCount,
        hasMore: accountTxns.length === limit,
        success: true,
      };
    }

    const userTransactions = detailsResult.data?.user_transactions || [];
    const blockMetadataTransactions =
      detailsResult.data?.block_metadata_transactions || [];
    const events = detailsResult.data?.events || [];

    // Combine all transaction types into a single map for easier processing
    const allTransactionsMap = new Map();

    // Add user transactions
    userTransactions.forEach((tx: any) => {
      allTransactionsMap.set(tx.version, {
        ...tx,
        transaction_type: "user_transaction",
      });
    });

    // Add block metadata transactions (these might be missing from user_transactions)
    blockMetadataTransactions.forEach((tx: any) => {
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

    // For any transaction versions we requested but didn't get details for,
    // add a basic entry so they still show up
    txVersions.forEach((version: string) => {
      if (!allTransactionsMap.has(version)) {
        apiLogger.warn(
          `Transaction ${version} not found in user or block metadata transactions`,
        );
        allTransactionsMap.set(version, {
          version,
          transaction_type: "unknown",
          timestamp: new Date().toISOString(), // Fallback timestamp
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

    // Sort by version (descending) to get most recent first
    const sortedTransactions = Array.from(allTransactionsMap.values()).sort(
      (a, b) => Number(b.version) - Number(a.version),
    );

    // Group events by transaction version
    const eventsByVersion = events.reduce((acc: any, event: any) => {
      if (!acc[event.transaction_version]) acc[event.transaction_version] = [];
      acc[event.transaction_version].push(event);
      return acc;
    }, {});

    // Process and combine transaction data
    // Log first transaction timestamp for debugging
    if (sortedTransactions.length > 0) {
      apiLogger.info(
        `First transaction timestamp from DB: ${sortedTransactions[0].timestamp}, version: ${sortedTransactions[0].version}, type: ${sortedTransactions[0].transaction_type}`,
      );
    }

    const transactions = sortedTransactions.map((tx: any) => {
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
      };
    });

    const result = {
      data: transactions,
      totalCount,
      hasMore: transactions.length === limit,
      success: true,
    };

    apiLogger.info(
      `✅ TRANSACTION FETCH SUCCESS: Found ${transactions.length} transactions with details (total: ${totalCount}, hasMore: ${result.hasMore}) for ${walletAddress}`,
    );
    return result;
  } catch (error) {
    apiLogger.error(
      `Failed to fetch transactions internally: ${error instanceof Error ? error.message : String(error)}`,
    );
    return { data: [], totalCount: 0, hasMore: false, success: false };
  }
}

interface BatchResponse {
  assets: any[] | null;
  defiPositions: any[] | null;
  nfts: any[] | null;
  nftTotalCount: number | null;
  nftCollectionStats: {
    collections: Array<{ name: string; count: number }>;
    totalCollections: number;
  } | null;
  metrics: any | null;
  summary: any | null;
  hasMoreNFTs: boolean;
  transactions: any[] | null;
  hasMoreTransactions: boolean;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("walletAddress");
  const nftLimit = parseInt(searchParams.get("nftLimit") || "50");
  const includeAllNFTs = searchParams.get("includeAllNFTs") === "true";

  try {
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 },
      );
    }

    apiLogger.info(
      `🚀 [Portfolio Batch API] Fetching ALL portfolio data INCLUDING TRANSACTIONS for: ${walletAddress}`,
    );

    // Parallel fetch all portfolio data
    const [
      assetsResult,
      defiPositionsResult,
      nftCountResult,
      nftResult,
      nftStatsResult,
      transactionsResult,
    ] = await Promise.allSettled([
      AssetService.getWalletAssets(walletAddress),
      // Fetch DeFi positions only once - summary will be calculated from positions
      DeFiService.getWalletDeFiPositions(walletAddress),
      NFTService.getTotalNFTCount(walletAddress),
      includeAllNFTs
        ? NFTService.getAllWalletNFTs(walletAddress)
        : NFTService.getWalletNFTs(walletAddress, 1, nftLimit),
      NFTService.getCollectionStats(walletAddress),
      // Fetch first 100 transactions immediately
      fetchTransactionsInternal(walletAddress, 100),
    ]);

    // Process results with error handling
    const response: BatchResponse = {
      assets: null,
      defiPositions: null,
      nfts: null,
      nftTotalCount: null,
      nftCollectionStats: null,
      metrics: null,
      summary: null,
      hasMoreNFTs: false,
      transactions: null,
      hasMoreTransactions: false,
    };

    // Handle assets
    if (assetsResult.status === "fulfilled") {
      response.assets = assetsResult.value;
    } else {
      apiLogger.error(
        `Failed to fetch assets: ${assetsResult.reason instanceof Error ? assetsResult.reason.message : String(assetsResult.reason)}`,
      );
    }

    // Handle DeFi data
    if (defiPositionsResult.status === "fulfilled") {
      const positions = defiPositionsResult.value;
      response.defiPositions = positions;

      // Calculate metrics and summary from positions (no additional API calls)
      if (positions.length > 0) {
        response.metrics = await DeFiService.calculateDeFiMetrics(positions);
        // Generate summary from existing positions instead of making another API call
        response.summary = DeFiService.generateSummaryFromPositions(positions);
      } else {
        response.summary = {
          totalPositions: 0,
          totalValueUSD: 0,
          protocolBreakdown: {},
          topProtocols: [],
        };
      }
    } else {
      apiLogger.error(
        `Failed to fetch DeFi data: ${defiPositionsResult.reason instanceof Error ? defiPositionsResult.reason.message : String(defiPositionsResult.reason)}`,
      );
    }

    // Handle NFT count
    if (nftCountResult.status === "fulfilled") {
      response.nftTotalCount = nftCountResult.value;
      apiLogger.info(
        `[Portfolio Batch API] NFT count fetched: ${nftCountResult.value}`,
      );
    } else {
      apiLogger.error(
        `Failed to fetch NFT count: ${nftCountResult.reason instanceof Error ? nftCountResult.reason.message : String(nftCountResult.reason)}`,
      );
    }

    // Handle NFTs
    if (nftResult.status === "fulfilled") {
      if (includeAllNFTs) {
        response.nfts = nftResult.value as any[];
        response.hasMoreNFTs = false;
      } else {
        const paginatedResult = nftResult.value as any;
        response.nfts = paginatedResult.data;
        response.hasMoreNFTs = paginatedResult.hasMore;
      }
    } else {
      apiLogger.error(
        `Failed to fetch NFTs: ${nftResult.reason instanceof Error ? nftResult.reason.message : String(nftResult.reason)}`,
      );
    }

    // Handle NFT collection stats
    if (nftStatsResult.status === "fulfilled") {
      response.nftCollectionStats = nftStatsResult.value;
      apiLogger.info(
        `[Portfolio Batch API] NFT collection stats fetched: ${nftStatsResult.value?.totalCollections || 0} collections`,
      );
    } else {
      apiLogger.error(
        `Failed to fetch NFT collection stats: ${nftStatsResult.reason instanceof Error ? nftStatsResult.reason.message : String(nftStatsResult.reason)}`,
      );
    }

    // Handle transactions
    if (transactionsResult.status === "fulfilled") {
      const transactionData = transactionsResult.value;
      response.transactions = transactionData.data || [];
      response.hasMoreTransactions = transactionData.hasMore || false;
      apiLogger.info(
        `[Portfolio Batch API] Transactions fetched: ${response.transactions?.length || 0} (hasMore: ${response.hasMoreTransactions})`,
      );
    } else {
      apiLogger.error(
        `Failed to fetch transactions: ${transactionsResult.reason instanceof Error ? transactionsResult.reason.message : String(transactionsResult.reason)}`,
      );
    }

    apiLogger.info(
      {
        assets: response.assets?.length || 0,
        defiPositions: response.defiPositions?.length || 0,
        nfts: response.nfts?.length || 0,
        nftTotalCount: response.nftTotalCount,
        transactions: response.transactions?.length || 0,
        hasMoreTransactions: response.hasMoreTransactions,
      },
      `[Portfolio Batch API] Response summary`,
    );

    // Set cache headers - shorter cache for fresher transaction data
    const headers = new Headers();
    headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120",
    );

    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      { headers },
    );
  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : "Unknown error",
      walletAddress,
      timestamp: new Date().toISOString(),
    };

    apiLogger.error(`Portfolio batch API error: ${errorDetails.message}`);

    return NextResponse.json(
      {
        error: "Failed to fetch portfolio data",
        details: errorDetails.message,
      },
      { status: 500 },
    );
  }
}
