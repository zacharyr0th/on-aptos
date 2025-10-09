import { NextResponse } from "next/server";
import { duneService } from "@/lib/services/dune";
import { apiLogger } from "@/lib/utils/core/logger";

// Dune Query Registry with themes
const DUNE_THEMES = {
  NETWORK_HEALTH: {
    name: "Network Health & Performance",
    icon: "🏥",
    queries: {
      PROTOCOL_ACTIVITY: { id: 5699127, name: "Protocol Activity", priority: 1 },
      TRANSACTION_ANALYSIS: { id: 4045024, name: "Transaction Performance", priority: 1 },
      BLOCK_TIMES: { id: 5699672, name: "Block Times & Finality", priority: 2 },
      NETWORK_OVERVIEW: { id: 5699670, name: "Network Overview", priority: 2 },
    },
  },
  USER_ACTIVITY: {
    name: "User Activity & Engagement",
    icon: "👥",
    queries: {
      USER_ANALYTICS: { id: 4045225, name: "User Gas Analytics", priority: 1 },
      USER_BEHAVIOR: { id: 4045138, name: "User Behavior", priority: 1 },
      DEX_COMPARISON: { id: 3431742, name: "Daily Active Users", priority: 1 },
      ACTIVITY_PATTERNS: { id: 5699668, name: "Hourly Activity Patterns", priority: 2 },
    },
  },
  DEFI_ECOSYSTEM: {
    name: "DeFi & Trading",
    icon: "💰",
    queries: {
      DEX_METRICS: { id: 3442811, name: "DEX Metrics", priority: 1 },
      DEX_TRADING_VOLUME: { id: 5699630, name: "Trading Volume", priority: 1 },
      TOKEN_BALANCES: { id: 5699610, name: "Token Distribution", priority: 2 },
      STAKING_ANALYTICS: { id: 5091227, name: "Staking Analytics", priority: 3 },
    },
  },
  PROTOCOL_ANALYTICS: {
    name: "Protocol Performance",
    icon: "🏗️",
    queries: {
      NETWORK_STATS: { id: 3468810, name: "Protocol Stats", priority: 1 },
      PROTOCOL_METRICS: { id: 3468830, name: "Protocol Metrics", priority: 1 },
      ALL_TIME_TRANSACTIONS: { id: 5699671, name: "Historical Transactions", priority: 2 },
    },
  },
};

// Query execution configuration
const EXECUTION_CONFIG = {
  maxAge: 300, // 5 minutes in seconds
  forceRefresh: false, // Set to true to always refresh
  parallel: true, // Execute queries in parallel
  timeout: 60000, // 60 second timeout per query
};

export async function GET(request: Request) {
  try {
    // Check if API key is configured first
    const duneApiKey = process.env.DUNE_API_KEY_TOKEN;
    if (!duneApiKey) {
      apiLogger.warn("DUNE_API_KEY_TOKEN not configured - returning configuration error");
      return NextResponse.json(
        {
          error: "Configuration Error",
          message: "DUNE_API_KEY_TOKEN environment variable is not configured",
          configurationRequired: true,
          instructions: "Please add DUNE_API_KEY_TOKEN to your environment variables",
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const theme = searchParams.get("theme") || "all";
    const refresh = searchParams.get("refresh") === "true";

    apiLogger.info("Fetching comprehensive metrics v2", { theme, refresh });

    // Determine which themes to fetch
    const themesToFetch = theme === "all" ? Object.keys(DUNE_THEMES) : [theme.toUpperCase()];

    // Collect all queries to execute
    const queriesToExecute: Array<{
      theme: string;
      queryKey: string;
      queryInfo: any;
    }> = [];

    for (const themeName of themesToFetch) {
      const themeConfig = DUNE_THEMES[themeName as keyof typeof DUNE_THEMES];
      if (!themeConfig) continue;

      for (const [queryKey, queryInfo] of Object.entries(themeConfig.queries)) {
        queriesToExecute.push({ theme: themeName, queryKey, queryInfo });
      }
    }

    // Execute queries with smart refresh
    const queryResults = await Promise.allSettled(
      queriesToExecute.map(async ({ theme, queryKey, queryInfo }) => {
        try {
          const startTime = Date.now();

          // Use smart results to get fresh or cached data based on age
          const results = refresh
            ? await duneService.refresh(queryInfo.id)
            : await duneService.getSmartResults(queryInfo.id, EXECUTION_CONFIG.maxAge);

          const executionTime = Date.now() - startTime;

          return {
            theme,
            queryKey,
            queryInfo,
            results,
            executionTime,
            status: "success",
          };
        } catch (error) {
          apiLogger.error(`Failed to fetch query ${queryInfo.id}:`, error);
          return {
            theme,
            queryKey,
            queryInfo,
            results: [],
            error: error instanceof Error ? error.message : "Unknown error",
            status: "error",
          };
        }
      })
    );

    // Process results by theme
    const themeData: Record<string, any> = {};
    const queryStatus: Record<string, any> = {};

    for (const result of queryResults) {
      if (result.status === "fulfilled") {
        const { theme, queryKey, queryInfo, results, executionTime, status } = result.value;

        if (!themeData[theme]) {
          themeData[theme] = {
            name: DUNE_THEMES[theme as keyof typeof DUNE_THEMES].name,
            icon: DUNE_THEMES[theme as keyof typeof DUNE_THEMES].icon,
            metrics: {},
            rawData: {},
          };
        }

        themeData[theme].rawData[queryKey] = results;
        queryStatus[`${theme}_${queryKey}`] = {
          id: queryInfo.id,
          name: queryInfo.name,
          status,
          executionTime,
          resultCount: results.length,
        };
      }
    }

    // Process theme-specific metrics
    for (const [themeName, data] of Object.entries(themeData)) {
      if (themeName === "NETWORK_HEALTH") {
        const protocolData = data.rawData.PROTOCOL_ACTIVITY?.[0] || {};
        const transactionData = data.rawData.TRANSACTION_ANALYSIS?.[0] || {};
        const blockData = data.rawData.BLOCK_TIMES?.[0] || {};

        data.metrics = {
          totalTransactions: parseInt(protocolData.total_transactions || 0),
          uniqueUsers: parseInt(protocolData.unique_senders || 0),
          successRate: parseFloat(protocolData.success_rate || 0),
          avgGasPrice: parseFloat(protocolData.avg_gas_cost || 0),
          maxTPS: parseInt(transactionData.max_tps_15_blocks || 0),
          avgBlockTime: parseFloat(blockData.avg_block_time_seconds || 0),
          avgFinalityTime: parseFloat(blockData.avg_finality_time_seconds || 0),
          networkReliability: parseFloat(blockData.network_reliability_pct || 0),
        };
      }

      if (themeName === "USER_ACTIVITY") {
        const userAnalytics = data.rawData.USER_ANALYTICS?.[0] || {};
        const userBehavior = data.rawData.USER_BEHAVIOR?.[0] || {};
        const dexComparison = data.rawData.DEX_COMPARISON?.[0] || {};
        const activityPatterns = data.rawData.ACTIVITY_PATTERNS || [];

        data.metrics = {
          dailyActiveAddresses: parseInt(dexComparison.daily_active_addresses || 0),
          dailyTransactions: parseInt(dexComparison.daily_transactions || 0),
          dailyGasFeesUSD: parseFloat(userAnalytics.gas_fee_usd || 0),
          dailyGasFeesAPT: parseFloat(userAnalytics.gas_fee_apt || 0),
          totalSignatures: parseInt(userBehavior.n_sig || 0),
          peakHourlyActivity: Math.max(...activityPatterns.map((p: any) => p.transactions || 0)),
          activityPatterns: activityPatterns.slice(0, 24),
        };
      }

      if (themeName === "DEFI_ECOSYSTEM") {
        const dexMetrics = data.rawData.DEX_METRICS?.[0] || {};
        const tradingVolume = data.rawData.DEX_TRADING_VOLUME || [];
        const tokenBalances = data.rawData.TOKEN_BALANCES || [];

        data.metrics = {
          transactionCount: parseInt(dexMetrics.transaction_count || 0),
          totalGasFeesAPT: parseFloat(dexMetrics.sum_gas_fees_apt || 0),
          avgGasPerTx: parseFloat(dexMetrics.avg_gas_fee_per_transaction_octa || 0),
          totalSwapEvents: tradingVolume.length,
          uniqueTraders: new Set(tradingVolume.map((t: any) => t.sender || t.user)).size,
          totalTokenHolders: tokenBalances.length,
          topTokenHoldings: tokenBalances.slice(0, 10),
        };
      }

      if (themeName === "PROTOCOL_ANALYTICS") {
        const networkStats = data.rawData.NETWORK_STATS || [];
        const protocolMetrics = data.rawData.PROTOCOL_METRICS || [];
        const allTimeData = data.rawData.ALL_TIME_TRANSACTIONS?.[0] || {};

        data.metrics = {
          allTimeTransactions: parseInt(allTimeData.total_all_time_transactions || 0),
          networkAgeDays: parseInt(allTimeData.network_age_days || 0),
          topProtocols: networkStats.slice(0, 5).map((p: any) => ({
            address: p.entry_function_module_address,
            transactions: parseInt(p.count_transactions || 0),
            gasTotal: parseFloat(p.sum_gas_octa || 0) / 1e8,
            senders: parseInt(p.count_sender_addresses || 0),
          })),
          protocolCount: networkStats.length,
        };
      }
    }

    // Generate summary metrics
    const summary = {
      lastUpdated: new Date().toISOString(),
      themesLoaded: Object.keys(themeData).length,
      totalQueriesExecuted: queriesToExecute.length,
      successfulQueries: Object.values(queryStatus).filter((q: any) => q.status === "success")
        .length,
      failedQueries: Object.values(queryStatus).filter((q: any) => q.status === "error").length,
      avgExecutionTime:
        Object.values(queryStatus).reduce(
          (sum: number, q: any) => sum + (q.executionTime || 0),
          0
        ) / Object.keys(queryStatus).length,
      dataFreshness: refresh ? "fresh" : "smart-cached",
    };

    return NextResponse.json(
      {
        summary,
        themes: themeData,
        queryStatus,
        config: EXECUTION_CONFIG,
        availableThemes: Object.keys(DUNE_THEMES).map((key) => ({
          id: key.toLowerCase(),
          name: DUNE_THEMES[key as keyof typeof DUNE_THEMES].name,
          icon: DUNE_THEMES[key as keyof typeof DUNE_THEMES].icon,
          queryCount: Object.keys(DUNE_THEMES[key as keyof typeof DUNE_THEMES].queries).length,
        })),
      },
      {
        headers: {
          "Cache-Control": refresh ? "no-cache" : "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    apiLogger.error("Error in comprehensive metrics v2:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch metrics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST endpoint to trigger refresh of specific queries
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { queryIds, theme } = body;

    apiLogger.info("Triggering manual refresh", { queryIds, theme });

    const refreshPromises = [];

    if (queryIds && Array.isArray(queryIds)) {
      // Refresh specific queries
      for (const queryId of queryIds) {
        refreshPromises.push(duneService.refresh(queryId));
      }
    } else if (theme) {
      // Refresh all queries in a theme
      const themeConfig = DUNE_THEMES[theme.toUpperCase() as keyof typeof DUNE_THEMES];
      if (themeConfig) {
        for (const queryInfo of Object.values(themeConfig.queries)) {
          refreshPromises.push(duneService.refresh(queryInfo.id));
        }
      }
    }

    const results = await Promise.allSettled(refreshPromises);
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      message: "Refresh triggered",
      successful,
      failed,
      total: refreshPromises.length,
    });
  } catch (error) {
    apiLogger.error("Error triggering refresh:", error);
    return NextResponse.json(
      {
        error: "Failed to trigger refresh",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
