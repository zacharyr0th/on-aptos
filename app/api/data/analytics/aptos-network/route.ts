import { withApiEnhancements } from "@/lib/utils/api/server-api";
import { apiLogger } from "@/lib/utils/core/logger";

// Aptos Indexer GraphQL endpoint
const MAINNET_ENDPOINT = "https://api.mainnet.aptoslabs.com/v1/graphql";
const APTOS_BUILD_SECRET = process.env.APTOS_BUILD_SECRET;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Enhanced GraphQL query function with authentication
 */
async function queryIndexer<T>(
  query: string,
  variables?: any,
): Promise<T | null> {
  try {
    const response = await fetch(MAINNET_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(APTOS_BUILD_SECRET && {
          Authorization: `Bearer ${APTOS_BUILD_SECRET}`,
        }),
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      apiLogger.error("GraphQL HTTP error:", {
        status: response.status,
        body: errorText,
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors) {
      apiLogger.warn("GraphQL errors (continuing anyway):", result.errors);
      // Don't throw error, just return null and continue
      return null;
    }

    return result.data || null;
  } catch (error) {
    apiLogger.error("Indexer query failed:", error);
    return null;
  }
}

/**
 * Get comprehensive network performance and transaction metrics
 */
async function getNetworkPerformanceMetrics() {
  const query = `
    query NetworkPerformance {
      # Recent block metadata for performance calculation
      block_metadata_transactions(
        limit: 200
        order_by: {version: desc}
      ) {
        version
        block_height
        timestamp
        epoch
        round
        proposer
      }
      
      # Recent user transactions for activity analysis
      user_transactions(
        limit: 1000
        order_by: {version: desc}
        where: {timestamp: {_gt: "2025-08-20T00:00:00"}}
      ) {
        version
        sender
        timestamp
        sequence_number
        max_gas_amount
      }
      
      # Account transactions for wallet activity
      account_transactions(
        limit: 500
        order_by: {version: desc}
        where: {transaction_version: {_gt: "3292000000"}}
      ) {
        account_address
        transaction_version
      }
    }
  `;

  return queryIndexer(query);
}

/**
 * Get comprehensive token and asset metrics
 */
async function getAssetMetrics() {
  const query = `
    query AssetMetrics {
      # Current fungible asset balances for active wallet analysis
      current_fungible_asset_balances(
        limit: 2000
        where: {amount: {_gt: "0"}}
        order_by: {amount: desc}
      ) {
        owner_address
        asset_type
        amount
        last_transaction_version
      }
      
      # Fungible asset activities for trading volume
      fungible_asset_activities(
        limit: 1000
        order_by: {transaction_version: desc}
        where: {
          transaction_timestamp: {_gt: "2025-08-20T00:00:00"}
          type: {_in: ["0x1::coin::WithdrawEvent", "0x1::coin::DepositEvent"]}
        }
      ) {
        asset_type
        owner_address
        type
        amount
        transaction_version
        transaction_timestamp
      }
      
      # Token metadata for ecosystem analysis
      fungible_asset_metadata(
        limit: 1000
        where: {supply_aggregator_table_handle: {_is_null: false}}
      ) {
        asset_type
        name
        symbol
        decimals
        supply_aggregator_table_handle
      }
    }
  `;

  return queryIndexer(query);
}

/**
 * Get comprehensive NFT and collection metrics
 */
async function getNFTMetrics() {
  const query = `
    query NFTMetrics {
      # Current NFT ownerships
      current_token_ownerships_v2(
        limit: 1000
        where: {amount: {_gt: 0}}
        order_by: {last_transaction_version: desc}
      ) {
        token_data_id
        owner_address
        amount
        last_transaction_version
        property_version_v1
      }
      
      # Recent NFT activities
      token_activities_v2(
        limit: 500
        order_by: {transaction_version: desc}
        where: {
          transaction_timestamp: {_gt: "2025-08-20T00:00:00"}
        }
      ) {
        token_data_id
        from_address
        to_address
        type
        token_amount
        transaction_version
        transaction_timestamp
      }
      
      # Collections data
      current_collections_v2(
        limit: 200
        where: {current_supply: {_gt: 0}}
        order_by: {current_supply: desc}
      ) {
        collection_id
        collection_name
        creator_address
        description
        uri
        current_supply
        max_supply
        total_minted_v2
      }
    }
  `;

  return queryIndexer(query);
}

/**
 * Calculate comprehensive network metrics
 */
function calculateNetworkMetrics(networkData: any) {
  if (!networkData?.block_metadata_transactions) return null;

  const blocks = networkData.block_metadata_transactions;
  const userTxs = networkData.user_transactions || [];
  const accountTxs = networkData.account_transactions || [];

  // Block performance calculation
  const blockTimes: number[] = [];
  const epochs = new Set();
  const proposers = new Set();

  for (let i = 0; i < blocks.length - 1; i++) {
    const current = new Date(blocks[i].timestamp).getTime();
    const previous = new Date(blocks[i + 1].timestamp).getTime();
    const blockTime = (current - previous) / 1000;

    if (blockTime > 0 && blockTime < 30) {
      blockTimes.push(blockTime);
    }

    if (blocks[i].epoch) epochs.add(blocks[i].epoch);
    if (blocks[i].proposer) proposers.add(blocks[i].proposer);
  }

  // Transaction activity analysis
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const recent24hTxs = userTxs.filter(
    (tx: any) => new Date(tx.timestamp).getTime() > oneDayAgo,
  );

  const recent7dTxs = userTxs.filter(
    (tx: any) => new Date(tx.timestamp).getTime() > oneWeekAgo,
  );

  // Unique active addresses
  const activeAddresses24h = new Set(recent24hTxs.map((tx: any) => tx.sender));
  const activeAddresses7d = new Set(recent7dTxs.map((tx: any) => tx.sender));

  // Calculate averages
  const avgBlockTime =
    blockTimes.length > 0
      ? blockTimes.reduce((sum, time) => sum + time, 0) / blockTimes.length
      : 0;

  const medianBlockTime =
    blockTimes.length > 0
      ? blockTimes.sort((a, b) => a - b)[Math.floor(blockTimes.length / 2)]
      : 0;

  return {
    // Block metrics
    latestBlockHeight: blocks[0]?.block_height || 0,
    latestVersion: blocks[0]?.version || 0,
    currentEpoch: blocks[0]?.epoch || 0,

    // Performance metrics
    averageBlockTime: parseFloat(avgBlockTime.toFixed(4)),
    medianBlockTime: parseFloat(medianBlockTime.toFixed(4)),
    currentTPS:
      avgBlockTime > 0 ? parseFloat((1 / avgBlockTime).toFixed(2)) : 0,
    uniqueProposers: proposers.size,
    epochsObserved: epochs.size,

    // Activity metrics
    totalTransactionsSampled: userTxs.length,
    transactions24h: recent24hTxs.length,
    transactions7d: recent7dTxs.length,
    activeAddresses24h: activeAddresses24h.size,
    activeAddresses7d: activeAddresses7d.size,

    // Engagement metrics
    avgTxsPerUser24h:
      activeAddresses24h.size > 0
        ? parseFloat((recent24hTxs.length / activeAddresses24h.size).toFixed(2))
        : 0,

    uniqueAccountTransactions: new Set(
      accountTxs.map((tx: any) => tx.account_address),
    ).size,

    // Timing analysis
    blockTimeStats: {
      min: Math.min(...blockTimes),
      max: Math.max(...blockTimes),
      p95:
        blockTimes.sort((a, b) => a - b)[
          Math.floor(blockTimes.length * 0.95)
        ] || 0,
      samples: blockTimes.length,
    },
  };
}

/**
 * Calculate asset ecosystem metrics
 */
function calculateAssetMetrics(assetData: any) {
  if (!assetData?.current_fungible_asset_balances) return null;

  const balances = assetData.current_fungible_asset_balances;
  const activities = assetData.fungible_asset_activities || [];
  const metadata = assetData.fungible_asset_metadata || [];

  // Unique assets and holders
  const uniqueAssets = new Set(balances.map((b: any) => b.asset_type));
  const uniqueHolders = new Set(balances.map((b: any) => b.owner_address));

  // Activity analysis
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const recent24hActivities = activities.filter(
    (activity: any) =>
      new Date(activity.transaction_timestamp).getTime() > oneDayAgo,
  );

  const activeAssets24h = new Set(
    recent24hActivities.map((a: any) => a.asset_type),
  );
  const activeUsers24h = new Set(
    recent24hActivities.map((a: any) => a.owner_address),
  );

  // Asset distribution analysis
  const assetHolderCounts = balances.reduce(
    (acc: Record<string, number>, balance: any) => {
      acc[balance.asset_type] = (acc[balance.asset_type] || 0) + 1;
      return acc;
    },
    {},
  );

  const topAssetsByHolders = Object.entries(assetHolderCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10);

  return {
    totalUniqueAssets: uniqueAssets.size,
    totalUniqueHolders: uniqueHolders.size,
    totalBalanceEntries: balances.length,

    // Activity metrics
    activities24h: recent24hActivities.length,
    activeAssets24h: activeAssets24h.size,
    activeUsers24h: activeUsers24h.size,

    // Asset metrics
    registeredTokens: metadata.length,
    averageHoldersPerAsset:
      uniqueAssets.size > 0
        ? parseFloat((uniqueHolders.size / uniqueAssets.size).toFixed(2))
        : 0,

    // Top assets by adoption
    topAssetsByHolders: topAssetsByHolders.map(([assetType, holders]) => ({
      assetType,
      holders,
      metadata: metadata.find((m: any) => m.asset_type === assetType),
    })),
  };
}

/**
 * Calculate NFT ecosystem metrics
 */
function calculateNFTMetrics(nftData: any) {
  if (!nftData?.current_token_ownerships_v2) return null;

  const ownerships = nftData.current_token_ownerships_v2;
  const activities = nftData.token_activities_v2 || [];
  const collections = nftData.current_collections_v2 || [];

  // Basic metrics
  const totalNFTs = ownerships.reduce(
    (sum: number, ownership: any) => sum + parseInt(ownership.amount || 0),
    0,
  );

  const uniqueOwners = new Set(ownerships.map((o: any) => o.owner_address));
  const uniqueTokens = new Set(ownerships.map((o: any) => o.token_data_id));

  // Collection analysis
  const totalCollections = collections.length;
  const totalSupply = collections.reduce(
    (sum: number, collection: any) =>
      sum + parseInt(collection.current_supply || 0),
    0,
  );

  const totalMaxSupply = collections.reduce(
    (sum: number, collection: any) =>
      sum + parseInt(collection.max_supply || 0),
    0,
  );

  // Activity analysis
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const recent24hActivities = activities.filter(
    (activity: any) =>
      new Date(activity.transaction_timestamp).getTime() > oneDayAgo,
  );

  return {
    totalNFTsOwned: totalNFTs,
    uniqueNFTOwners: uniqueOwners.size,
    uniqueTokens: uniqueTokens.size,

    // Collection metrics
    totalCollections,
    totalSupply,
    totalMaxSupply,
    averageSupplyPerCollection:
      totalCollections > 0
        ? parseFloat((totalSupply / totalCollections).toFixed(2))
        : 0,

    // Activity metrics
    nftActivities24h: recent24hActivities.length,

    // Top collections
    topCollections: collections
      .sort(
        (a: any, b: any) =>
          parseInt(b.current_supply || 0) - parseInt(a.current_supply || 0),
      )
      .slice(0, 10)
      .map((collection: any) => ({
        name: collection.collection_name,
        creator: collection.creator_address,
        supply: parseInt(collection.current_supply || 0),
        maxSupply: parseInt(collection.max_supply || 0),
        totalMinted: parseInt(collection.total_minted_v2 || 0),
      })),
  };
}

export async function GET() {
  return withApiEnhancements(
    async () => {
      apiLogger.info("Fetching comprehensive Aptos network analytics");

      try {
        // Fetch all data concurrently
        const [networkData, assetData, nftData] = await Promise.allSettled([
          getNetworkPerformanceMetrics(),
          getAssetMetrics(),
          getNFTMetrics(),
        ]);

        // Process results
        const networkMetrics =
          networkData.status === "fulfilled" && networkData.value
            ? calculateNetworkMetrics(networkData.value)
            : null;

        const assetMetrics =
          assetData.status === "fulfilled" && assetData.value
            ? calculateAssetMetrics(assetData.value)
            : null;

        const nftMetrics =
          nftData.status === "fulfilled" && nftData.value
            ? calculateNFTMetrics(nftData.value)
            : null;

        const response = {
          network: networkMetrics,
          assets: assetMetrics,
          nfts: nftMetrics,

          // Status information
          dataStatus: {
            network: networkData.status,
            assets: assetData.status,
            nfts: nftData.status,
          },

          timestamp: new Date().toISOString(),
          source: "Aptos Indexer GraphQL API",
        };

        apiLogger.info("Successfully processed network analytics", {
          networkAvailable: !!networkMetrics,
          assetsAvailable: !!assetMetrics,
          nftsAvailable: !!nftMetrics,
        });

        return response;
      } catch (error) {
        apiLogger.error("Error in network analytics API:", error);
        throw new Error(
          `Network analytics failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    {
      customHeaders: {
        "Cache-Control": "public, max-age=180, stale-while-revalidate=360",
        "X-Content-Type": "application/json",
        "X-Service": "aptos-network-analytics",
      },
    },
  );
}
