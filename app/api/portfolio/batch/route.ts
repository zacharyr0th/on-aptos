import { NextRequest, NextResponse } from "next/server";

import { getEnvVar } from "@/lib/config/validate-env";
import { AssetService } from "@/lib/services/portfolio/services/asset-service";
import { DeFiService } from "@/lib/services/portfolio/services/defi-service";
import { NFTService } from "@/lib/services/portfolio/services/nft-service";
import { apiLogger } from "@/lib/utils/logger";

// Revalidate cache every 5 minutes
export const revalidate = 300;

// Helper function to fetch transactions directly
async function fetchTransactionsInternal(walletAddress: string, limit: number = 100) {
  apiLogger.info(`🔄 FETCHING TRANSACTIONS: Starting transaction fetch for ${walletAddress}, limit: ${limit}`);
  try {
    const APTOS_INDEXER_URL = "https://api.mainnet.aptoslabs.com/v1/graphql";
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const apiKey = getEnvVar("APTOS_BUILD_SECRET");
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const query = `
      query GetAccountTransactions($address: String!, $limit: Int!) {
        account_transactions(
          where: { account_address: { _eq: $address } }
          order_by: { transaction_version: desc }
          limit: $limit
          offset: 0
        ) {
          transaction_version
          account_address
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

    const response = await fetch(APTOS_INDEXER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables: {
          address: walletAddress,
          limit,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const graphqlResult = await response.json();
    
    if (graphqlResult.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(graphqlResult.errors)}`);
    }

    const accountTxns = graphqlResult.data?.account_transactions || [];
    const totalCount = graphqlResult.data?.account_transactions_aggregate?.aggregate?.count || 0;

    // Transform the data to match expected format
    const transactions = accountTxns.map((tx: any) => ({
      transaction_version: tx.transaction_version,
      transaction_timestamp: new Date().toISOString(), // We'll need to get proper timestamp later
      type: "transaction",
      amount: "0",
      asset_type: "APT",
      success: true,
    }));

    const result = {
      data: transactions,
      totalCount,
      hasMore: transactions.length === limit,
      success: true,
    };
    
    apiLogger.info(`✅ TRANSACTION FETCH SUCCESS: Found ${transactions.length} transactions (total: ${totalCount}, hasMore: ${result.hasMore}) for ${walletAddress}`);
    return result;
  } catch (error) {
    apiLogger.error(`Failed to fetch transactions internally: ${error instanceof Error ? error.message : String(error)}`);
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

    apiLogger.info(`🚀 [Portfolio Batch API] Fetching ALL portfolio data INCLUDING TRANSACTIONS for: ${walletAddress}`);

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
      apiLogger.error(`Failed to fetch assets: ${assetsResult.reason instanceof Error ? assetsResult.reason.message : String(assetsResult.reason)}`);
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
      apiLogger.error(`Failed to fetch DeFi data: ${defiPositionsResult.reason instanceof Error ? defiPositionsResult.reason.message : String(defiPositionsResult.reason)}`);
    }

    // Handle NFT count
    if (nftCountResult.status === "fulfilled") {
      response.nftTotalCount = nftCountResult.value;
      apiLogger.info(`[Portfolio Batch API] NFT count fetched: ${nftCountResult.value}`);
    } else {
      apiLogger.error(`Failed to fetch NFT count: ${nftCountResult.reason instanceof Error ? nftCountResult.reason.message : String(nftCountResult.reason)}`);
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
      apiLogger.error(`Failed to fetch NFTs: ${nftResult.reason instanceof Error ? nftResult.reason.message : String(nftResult.reason)}`);
    }

    // Handle NFT collection stats
    if (nftStatsResult.status === "fulfilled") {
      response.nftCollectionStats = nftStatsResult.value;
      apiLogger.info(`[Portfolio Batch API] NFT collection stats fetched: ${nftStatsResult.value?.totalCollections || 0} collections`);
    } else {
      apiLogger.error(`Failed to fetch NFT collection stats: ${nftStatsResult.reason instanceof Error ? nftStatsResult.reason.message : String(nftStatsResult.reason)}`);
    }

    // Handle transactions
    if (transactionsResult.status === "fulfilled") {
      const transactionData = transactionsResult.value;
      response.transactions = transactionData.data || [];
      response.hasMoreTransactions = transactionData.hasMore || false;
      apiLogger.info(`[Portfolio Batch API] Transactions fetched: ${response.transactions?.length || 0} (hasMore: ${response.hasMoreTransactions})`);
    } else {
      apiLogger.error(`Failed to fetch transactions: ${transactionsResult.reason instanceof Error ? transactionsResult.reason.message : String(transactionsResult.reason)}`);
    }

    apiLogger.info({
      assets: response.assets?.length || 0,
      defiPositions: response.defiPositions?.length || 0,
      nfts: response.nfts?.length || 0,
      nftTotalCount: response.nftTotalCount,
      transactions: response.transactions?.length || 0,
      hasMoreTransactions: response.hasMoreTransactions,
    }, `[Portfolio Batch API] Response summary`);

    // Set cache headers
    const headers = new Headers();
    headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600",
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
