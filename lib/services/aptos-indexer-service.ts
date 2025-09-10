import { logger } from "@/lib/utils/core/logger";

// Aptos Indexer GraphQL endpoints
const MAINNET_ENDPOINT = "https://api.mainnet.aptoslabs.com/v1/graphql";
const APTOS_BUILD_SECRET = process.env.APTOS_BUILD_SECRET;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Base GraphQL query function with authentication
 */
async function queryIndexer<T>(query: string, variables?: any): Promise<T | null> {
  try {
    logger.info("Making GraphQL query to Aptos indexer", {
      hasSecret: !!APTOS_BUILD_SECRET,
    });

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

    logger.info("GraphQL response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("GraphQL HTTP error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors) {
      logger.error("GraphQL errors:", result.errors);
      throw new Error(`GraphQL error: ${result.errors[0]?.message}`);
    }

    logger.info("GraphQL query successful", { hasData: !!result.data });
    return result.data || null;
  } catch (error) {
    logger.error("Indexer query failed:", error);
    return null;
  }
}

/**
 * Simple test query to verify connection
 */
export async function testIndexerConnection() {
  const query = `
    query TestConnection {
      processor_status(limit: 1) {
        processor
        last_success_version
      }
    }
  `;

  return queryIndexer(query);
}

/**
 * Network Activity Metrics - Using working tables
 */
export async function getNetworkActivityMetrics() {
  const query = `
    query NetworkActivity {
      # Get recent block metadata for network performance  
      block_metadata_transactions(
        limit: 100
        order_by: {version: desc}
      ) {
        version
        block_height
        timestamp
        epoch
        round
        proposer
      }
      
      # Get processor status
      processor_status {
        processor
        last_success_version
        last_transaction_timestamp
        last_updated
      }
      
      # Get recent user transactions for basic metrics
      user_transactions(
        limit: 50
        order_by: {version: desc}
      ) {
        version
        sender
        timestamp
      }
    }
  `;

  return queryIndexer(query);
}

/**
 * Comprehensive Staking and Validator Metrics
 */
export async function getStakingMetrics() {
  const query = `
    query StakingMetrics {
      # Get staking pool information
      current_delegated_staking_pool_balances(
        limit: 100
        order_by: {total_coins: desc}
      ) {
        pool_address
        total_coins
        total_shares
        operator_commission_percentage
        last_transaction_version
      }
      
      # Get recent staking activities
      delegated_staking_activities(
        limit: 200
        order_by: {transaction_version: desc}
      ) {
        pool_address
        delegator_address
        event_type
        amount
        transaction_version
      }
      
      # Get delegator balances summary
      current_delegator_balances_aggregate {
        aggregate {
          count
          sum {
            shares
            parent_table_handle
          }
        }
      }
    }
  `;

  return queryIndexer(query);
}

/**
 * Account and Wallet Metrics
 */
export async function getWalletMetrics() {
  const query = `
    query WalletMetrics {
      # Get sample of fungible asset balances for active accounts
      current_fungible_asset_balances(
        limit: 500
        where: {amount: {_gt: "0"}}
      ) {
        owner_address
        asset_type
        amount
      }
      
      # Count total fungible asset balance entries
      current_fungible_asset_balances_aggregate(
        where: {amount: {_gt: "0"}}
      ) {
        aggregate {
          count
        }
      }
    }
  `;

  return queryIndexer(query);
}

/**
 * Comprehensive Token and Asset Metrics
 */
export async function getTokenMetrics() {
  const query = `
    query TokenMetrics {
      # Get fungible asset metadata
      fungible_asset_metadata(
        limit: 200
      ) {
        asset_type
        name
        symbol
        decimals
      }
      
      # Count total fungible assets
      fungible_asset_metadata_aggregate {
        aggregate {
          count
        }
      }
      
      # Get recent fungible asset activities
      fungible_asset_activities(
        limit: 300
        order_by: {transaction_version: desc}
      ) {
        asset_type
        owner_address
        type
        amount
        transaction_version
      }
    }
  `;

  return queryIndexer(query);
}

/**
 * Comprehensive NFT Ecosystem Metrics
 */
export async function getNFTMetrics() {
  const query = `
    query NFTMetrics {
      # Get current collections
      current_collections_v2(
        limit: 200
        order_by: {current_supply: desc}
        where: {current_supply: {_gt: 0}}
      ) {
        collection_id
        collection_name
        creator_address
        description
        uri
        current_supply
        max_supply
        total_minted_v2
        last_transaction_version
      }
      
      # Count total collections
      current_collections_v2_aggregate(
        where: {current_supply: {_gt: 0}}
      ) {
        aggregate {
          count
          sum {
            current_supply
            max_supply
            total_minted_v2
          }
        }
      }
      
      # Get current token ownerships
      current_token_ownerships_v2(
        limit: 1000
        where: {amount: {_gt: 0}}
        order_by: {last_transaction_version: desc}
      ) {
        token_data_id
        owner_address
        amount
        last_transaction_version
      }
      
      # Count total NFT ownerships
      current_token_ownerships_v2_aggregate(
        where: {amount: {_gt: 0}}
      ) {
        aggregate {
          count
        }
      }
      
      # Get recent token activities
      token_activities_v2(
        limit: 500
        order_by: {transaction_version: desc}
        where: {
          timestamp: {_gt: "2024-08-20T00:00:00"}
        }
      ) {
        token_data_id
        from_address
        to_address
        type
        token_amount
        transaction_version
        timestamp
      }
      
      # Aggregate recent activities
      token_activities_v2_aggregate(
        where: {
          timestamp: {_gt: "2024-08-20T00:00:00"}
        }
      ) {
        aggregate {
          count
          sum {
            token_amount
          }
        }
      }
    }
  `;

  return queryIndexer(query);
}

/**
 * Domain Name System Metrics
 */
export async function getDomainMetrics() {
  const query = `
    query DomainMetrics {
      # Get current Aptos names
      current_aptos_names(
        limit: 500
        order_by: {last_transaction_version: desc}
      ) {
        domain
        subdomain
        registered_address
        expiration_timestamp
        last_transaction_version
      }
      
      # Count total domains
      current_aptos_names_aggregate {
        aggregate {
          count
        }
      }
      
      # Get ANS lookup information
      current_ans_lookup_v2(
        limit: 200
        order_by: {last_transaction_version: desc}
      ) {
        domain
        subdomain
        token_name
        registered_address
        last_transaction_version
      }
    }
  `;

  return queryIndexer(query);
}

/**
 * Gas and Fee Metrics
 */
export async function getGasMetrics() {
  // Gas data not available in current indexer schema
  logger.warn("Gas metrics not available - gas fields not accessible in current schema");
  return null;
}

/**
 * Comprehensive ecosystem metrics aggregator
 */
export async function getComprehensiveEcosystemMetrics() {
  try {
    logger.info("Fetching comprehensive ecosystem metrics from Aptos indexer");

    const [networkActivity, stakingData, walletData, tokenData, nftData, domainData, gasData] =
      await Promise.allSettled([
        getNetworkActivityMetrics(),
        getStakingMetrics(),
        getWalletMetrics(),
        getTokenMetrics(),
        getNFTMetrics(),
        getDomainMetrics(),
        getGasMetrics(),
      ]);

    return {
      networkActivity: networkActivity.status === "fulfilled" ? networkActivity.value : null,
      staking: stakingData.status === "fulfilled" ? stakingData.value : null,
      wallets: walletData.status === "fulfilled" ? walletData.value : null,
      tokens: tokenData.status === "fulfilled" ? tokenData.value : null,
      nfts: nftData.status === "fulfilled" ? nftData.value : null,
      domains: domainData.status === "fulfilled" ? domainData.value : null,
      gas: gasData.status === "fulfilled" ? gasData.value : null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Failed to fetch comprehensive ecosystem metrics:", error);
    throw error;
  }
}

/**
 * Calculate comprehensive network performance metrics from block data
 */
export function calculateNetworkPerformance(networkData: any) {
  const blocks = networkData?.block_metadata_transactions || [];

  if (!blocks || blocks.length < 2) return null;

  const sortedBlocks = blocks.sort((a: any, b: any) => b.block_height - a.block_height);
  const blockTimes: number[] = [];
  const epochs = new Set();
  const proposers = new Set();

  for (let i = 0; i < sortedBlocks.length - 1; i++) {
    const current = new Date(sortedBlocks[i].timestamp).getTime();
    const previous = new Date(sortedBlocks[i + 1].timestamp).getTime();
    const blockTime = (current - previous) / 1000; // Convert to seconds

    // Track epochs and proposers
    if (sortedBlocks[i].epoch) epochs.add(sortedBlocks[i].epoch);
    if (sortedBlocks[i].proposer) proposers.add(sortedBlocks[i].proposer);

    if (blockTime > 0 && blockTime < 30) {
      // Filter outliers
      blockTimes.push(blockTime);
    }
  }

  if (blockTimes.length === 0) return null;

  // Calculate precise statistics
  const sortedTimes = [...blockTimes].sort((a, b) => a - b);
  const avgBlockTime = blockTimes.reduce((sum, time) => sum + time, 0) / blockTimes.length;
  const medianBlockTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
  const p95BlockTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
  const minBlockTime = Math.min(...blockTimes);
  const maxBlockTime = Math.max(...blockTimes);

  // Calculate variance and standard deviation
  const variance =
    blockTimes.reduce((sum, time) => sum + (time - avgBlockTime) ** 2, 0) / blockTimes.length;
  const stdDev = Math.sqrt(variance);

  // Calculate finality time (approximate - usually 2-3 block confirmations on Aptos)
  const estimatedFinalityTime = avgBlockTime * 3;

  return {
    averageBlockTime: parseFloat(avgBlockTime.toFixed(4)),
    medianBlockTime: parseFloat(medianBlockTime.toFixed(4)),
    p95BlockTime: parseFloat(p95BlockTime.toFixed(4)),
    minBlockTime: parseFloat(minBlockTime.toFixed(4)),
    maxBlockTime: parseFloat(maxBlockTime.toFixed(4)),
    standardDeviation: parseFloat(stdDev.toFixed(4)),
    estimatedFinalityTime: parseFloat(estimatedFinalityTime.toFixed(4)),
    currentTPS: parseFloat((1 / avgBlockTime).toFixed(2)),
    theoreticalTPS: parseFloat((1 / minBlockTime).toFixed(2)),
    sampleSize: blockTimes.length,
    epochsObserved: epochs.size,
    uniqueProposers: proposers.size,
    latestVersion: sortedBlocks[0]?.version || null,
    latestBlockHeight: sortedBlocks[0]?.block_height || null,
    currentEpoch: sortedBlocks[0]?.epoch || null,
  };
}

/**
 * Calculate gas fee statistics from user transactions and aggregate data
 */
export function calculateGasStatistics(gasData: any) {
  const transactions = gasData?.user_transactions || [];
  const aggregateData = gasData?.user_transactions_aggregate?.aggregate;

  if (!transactions || transactions.length === 0) return null;

  // Calculate gas fees from individual transactions
  const gasFees = transactions
    .filter((tx: any) => tx.gas_used && tx.gas_unit_price)
    .map((tx: any) => (parseInt(tx.gas_used) * parseInt(tx.gas_unit_price)) / 100000000); // Convert to APT

  if (gasFees.length === 0) return null;

  const sortedFees = gasFees.sort((a: number, b: number) => a - b);
  const avgGasFee = gasFees.reduce((sum: number, fee: number) => sum + fee, 0) / gasFees.length;
  const medianGasFee = sortedFees[Math.floor(sortedFees.length / 2)];
  const p95GasFee = sortedFees[Math.floor(sortedFees.length * 0.95)];
  const minGasFee = Math.min(...gasFees);
  const maxGasFee = Math.max(...gasFees);

  // Use aggregate data for larger sample statistics
  const result = {
    averageGasFeeAPT: parseFloat(avgGasFee.toFixed(8)),
    medianGasFeeAPT: parseFloat(medianGasFee.toFixed(8)),
    p95GasFeeAPT: parseFloat(p95GasFee.toFixed(8)),
    minGasFeeAPT: parseFloat(minGasFee.toFixed(8)),
    maxGasFeeAPT: parseFloat(maxGasFee.toFixed(8)),
    totalTransactionsSampled: gasFees.length,
    // Use aggregate data for broader statistics if available
    ...(aggregateData && {
      totalTransactionsInPeriod: aggregateData.count || 0,
      averageGasUsed: aggregateData.avg?.gas_used || null,
      averageGasPrice: aggregateData.avg?.gas_unit_price || null,
      totalGasUsed: aggregateData.sum?.gas_used || null,
      maxGasUsed: aggregateData.max?.gas_used || null,
      minGasUsed: aggregateData.min?.gas_used || null,
    }),
  };

  return result;
}
