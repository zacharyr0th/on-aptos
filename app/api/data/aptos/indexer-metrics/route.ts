import {
  getAptosBenchmarkData,
  getNetworkPerformanceContext,
} from "@/lib/services/aptos-benchmark-data";
import {
  getComprehensiveEcosystemMetrics,
  calculateNetworkPerformance,
  calculateGasStatistics,
} from "@/lib/services/aptos-indexer-service";
import { withApiEnhancements } from "@/lib/utils/api/server-api";
import { ApiError } from "@/lib/utils/core/errors";
import { logger } from "@/lib/utils/core/logger";

export async function GET() {
  return withApiEnhancements(
    async () => {
      try {
        logger.info("Fetching comprehensive indexer metrics");

        const rawMetrics = await getComprehensiveEcosystemMetrics();

        if (!rawMetrics) {
          throw new ApiError(
            "Failed to fetch indexer metrics",
            500,
            "IndexerMetrics",
          );
        }

        // Get benchmark data and live performance metrics
        const benchmarkData = getAptosBenchmarkData();
        const networkPerformance = calculateNetworkPerformance(
          (rawMetrics as any)?.networkActivity,
        );
        const performanceContext =
          getNetworkPerformanceContext(networkPerformance);

        const processedMetrics = {
          // Network Performance - Comprehensive
          network: {
            // Calculate total transactions from user transaction data
            totalTransactions:
              (rawMetrics as any)?.networkActivity?.user_transactions?.length ||
              0,
            totalBlocks:
              (rawMetrics as any)?.networkActivity?.block_metadata_transactions
                ?.length || 0,
            maxVersion: Math.max(
              ...(
                (rawMetrics as any)?.networkActivity?.user_transactions || []
              ).map((tx: any) => tx.version || 0),
              0,
            ),
            minVersion: Math.min(
              ...(
                (rawMetrics as any)?.networkActivity?.user_transactions || []
              ).map((tx: any) => tx.version || 0),
              0,
            ),
            blockPerformance: networkPerformance,
            gasStatistics: null, // Not available in current schema
            processorStatus:
              (rawMetrics as any)?.networkActivity?.processor_status || [],
            currentEpoch: networkPerformance?.currentEpoch || null,
            latestBlockHeight: networkPerformance?.latestBlockHeight || null,
            latestVersion: networkPerformance?.latestVersion || null,
          },

          // Staking Ecosystem - Only include if data exists
          staking: (rawMetrics as any)?.staking
            ? {
                totalPools:
                  (rawMetrics as any)?.staking
                    ?.current_delegated_staking_pool_balances?.length || 0,
                totalStakedCoins:
                  (
                    rawMetrics as any
                  )?.staking?.current_delegated_staking_pool_balances?.reduce(
                    (sum: number, pool: any) =>
                      sum + (parseInt(pool.total_coins) || 0),
                    0,
                  ) || 0,
                totalShares:
                  (
                    rawMetrics as any
                  )?.staking?.current_delegated_staking_pool_balances?.reduce(
                    (sum: number, pool: any) =>
                      sum + (parseInt(pool.total_shares) || 0),
                    0,
                  ) || 0,
                averageCommission:
                  (
                    rawMetrics as any
                  )?.staking?.current_delegated_staking_pool_balances?.reduce(
                    (sum: number, pool: any) =>
                      sum +
                      (parseFloat(pool.operator_commission_percentage) || 0),
                    0,
                  ) /
                  ((rawMetrics as any)?.staking
                    ?.current_delegated_staking_pool_balances?.length || 1),
                recentStakingActivities:
                  (rawMetrics as any)?.staking?.delegated_staking_activities
                    ?.length || 0,
                recentStakingVolume:
                  (
                    rawMetrics as any
                  )?.staking?.delegated_staking_activities?.reduce(
                    (sum: number, activity: any) =>
                      sum + (parseInt(activity.amount) || 0),
                    0,
                  ) || 0,
                totalDelegators:
                  (rawMetrics as any)?.staking
                    ?.current_delegator_balances_aggregate?.aggregate?.count ||
                  0,
                totalDelegatorShares:
                  (rawMetrics as any)?.staking
                    ?.current_delegator_balances_aggregate?.aggregate?.sum
                    ?.shares || 0,
                topPools:
                  (
                    rawMetrics as any
                  )?.staking?.current_delegated_staking_pool_balances?.slice(
                    0,
                    10,
                  ) || [],
              }
            : null,

          // Account & Wallet Activity - Only include if data exists
          accounts: (rawMetrics as any)?.wallets
            ? {
                activeAccounts: new Set(
                  (
                    rawMetrics as any
                  )?.wallets?.current_fungible_asset_balances?.map(
                    (balance: any) => balance.owner_address,
                  ) || [],
                ).size,
                totalAssetBalances:
                  (rawMetrics as any)?.wallets
                    ?.current_fungible_asset_balances_aggregate?.aggregate
                    ?.count || 0,
                sampleBalances:
                  (
                    rawMetrics as any
                  )?.wallets?.current_fungible_asset_balances?.slice(0, 20) ||
                  [],
              }
            : null,

          // Token Ecosystem - Only include if data exists
          tokens: (rawMetrics as any)?.tokens
            ? {
                totalFungibleAssets:
                  (rawMetrics as any)?.tokens?.fungible_asset_metadata_aggregate
                    ?.aggregate?.count || 0,
                recentFAActivities:
                  (rawMetrics as any)?.tokens?.fungible_asset_activities
                    ?.length || 0,
                sampleTokens:
                  (rawMetrics as any)?.tokens?.fungible_asset_metadata?.slice(
                    0,
                    50,
                  ) || [],
                recentActivities:
                  (rawMetrics as any)?.tokens?.fungible_asset_activities?.slice(
                    0,
                    100,
                  ) || [],
              }
            : null,

          // NFT Ecosystem - Only include if data exists
          nfts: (rawMetrics as any)?.nfts
            ? {
                totalCollections:
                  (rawMetrics as any)?.nfts?.current_collections_v2_aggregate
                    ?.aggregate?.count || 0,
                totalSupply:
                  (rawMetrics as any)?.nfts?.current_collections_v2_aggregate
                    ?.aggregate?.sum?.current_supply || 0,
                totalMaxSupply:
                  (rawMetrics as any)?.nfts?.current_collections_v2_aggregate
                    ?.aggregate?.sum?.max_supply || 0,
                totalMinted:
                  (rawMetrics as any)?.nfts?.current_collections_v2_aggregate
                    ?.aggregate?.sum?.total_minted_v2 || 0,
                totalNFTsOwned:
                  (rawMetrics as any)?.nfts
                    ?.current_token_ownerships_v2_aggregate?.aggregate?.count ||
                  0,
                recentNFTActivities:
                  (rawMetrics as any)?.nfts?.token_activities_v2_aggregate
                    ?.aggregate?.count || 0,
                recentNFTVolume:
                  (rawMetrics as any)?.nfts?.token_activities_v2_aggregate
                    ?.aggregate?.sum?.token_amount || 0,
                topCollections:
                  (rawMetrics as any)?.nfts?.current_collections_v2?.slice(
                    0,
                    20,
                  ) || [],
                recentActivities:
                  (rawMetrics as any)?.nfts?.token_activities_v2?.slice(
                    0,
                    100,
                  ) || [],
                currentOwnerships:
                  (rawMetrics as any)?.nfts?.current_token_ownerships_v2?.slice(
                    0,
                    100,
                  ) || [],
              }
            : null,

          // Domain Names - Only include if data exists
          domains: (rawMetrics as any)?.domains
            ? {
                totalDomains:
                  (rawMetrics as any)?.domains?.current_aptos_names_aggregate
                    ?.aggregate?.count || 0,
                sampleDomains:
                  (rawMetrics as any)?.domains?.current_aptos_names?.slice(
                    0,
                    50,
                  ) || [],
                ansLookups:
                  (rawMetrics as any)?.domains?.current_ans_lookup_v2?.slice(
                    0,
                    50,
                  ) || [],
              }
            : null,

          // Comprehensive Benchmark Data (2025)
          benchmark: {
            networkStats: benchmarkData.networkStats,
            performanceRecords: benchmarkData.performanceRecords,
            technicalSpecs: benchmarkData.technicalSpecs,
            defiEcosystem: benchmarkData.defiEcosystem,
            stablecoinMarket: benchmarkData.stablecoinMarket,
            gaming: benchmarkData.gaming,
            nftProjects: benchmarkData.nftProjects,
            partnerships: benchmarkData.partnerships,
            tokenEconomics: benchmarkData.tokenEconomics,
            recentUpgrades: benchmarkData.recentUpgrades,
            futureTechnology: benchmarkData.futureTechnology,
            transactionCosts: benchmarkData.transactionCosts,
            ecosystem: benchmarkData.ecosystem,
          },

          // Performance Context (Live vs Benchmarks)
          performanceContext,

          // Metadata
          lastUpdated: (rawMetrics as any)?.timestamp,
          dataSource: "Aptos Indexer GraphQL API + 2025 Comprehensive Analysis",
        };

        logger.info("Successfully processed indexer metrics", {
          totalTransactions: processedMetrics.network.totalTransactions,
          totalPools: processedMetrics.staking?.totalPools || "N/A",
          activeAccounts: processedMetrics.accounts?.activeAccounts || "N/A",
        });

        return processedMetrics;
      } catch (error) {
        logger.error("Error in indexer metrics API:", error);

        if (error instanceof ApiError) {
          throw error;
        }

        throw new ApiError(
          `Indexer metrics fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          500,
          "IndexerMetrics",
        );
      }
    },
    {
      customHeaders: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600", // 5 minute cache
        "X-Content-Type": "application/json",
        "X-Service": "aptos-indexer-metrics",
      },
    },
  );
}
