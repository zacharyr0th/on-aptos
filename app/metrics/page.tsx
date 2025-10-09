"use client";

import { GeistMono } from "geist/font/mono";
import { RefreshCw, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { logger } from "@/lib/utils/core/logger";
import { formatCompactNumber } from "@/lib/utils/formatters";

// Dune Query IDs mapping (from the API)
const DUNE_QUERY_IDS = {
  PROTOCOL_ACTIVITY: 5699127,
  USER_ANALYTICS: 4045225,
  DEX_COMPARISON: 3431742,
  STAKING_ANALYTICS: 5091227,
  DEX_METRICS: 3442811,
  USER_BEHAVIOR: 4045138,
  TRANSACTION_ANALYSIS: 4045024,
  NETWORK_STATS: 3468810,
  PROTOCOL_METRICS: 3468830,
  TOKEN_BALANCES: 5699610,
  DEX_TRADING_VOLUME: 5699630,
  ACTIVITY_PATTERNS: 5699668,
  NETWORK_OVERVIEW: 5699670,
  ALL_TIME_TRANSACTIONS: 5699671,
  BLOCK_TIMES: 5699672,
};

// Helper to get Dune query URL
const getDuneQueryUrl = (queryId: number) => `https://dune.com/queries/${queryId}`;

interface ThemeData {
  name: string;
  icon: string;
  metrics: Record<string, any>;
  rawData: Record<string, any[]>;
}

interface DashboardData {
  summary: {
    lastUpdated: string;
    themesLoaded: number;
    totalQueriesExecuted: number;
    successfulQueries: number;
    failedQueries: number;
    avgExecutionTime: number;
    dataFreshness: string;
  };
  themes: Record<string, ThemeData>;
  queryStatus: Record<string, any>;
  availableThemes: Array<{
    id: string;
    name: string;
    icon: string;
    queryCount: number;
  }>;
}

// Theme configuration removed - no longer needed with new design

// Collect all metrics into a single array with query URLs
function collectMetrics(data: DashboardData): Array<{
  metric: string;
  value: string;
  status?: "success" | "warning" | "error";
  queryUrl?: string;
}> {
  const metrics: Array<{
    metric: string;
    value: string;
    status?: "success" | "warning" | "error";
    queryUrl?: string;
  }> = [];

  // Network Health metrics
  if (data.themes.NETWORK_HEALTH) {
    if (data.themes.NETWORK_HEALTH.metrics.totalTransactions) {
      metrics.push({
        metric: "Total Transactions",
        value: formatCompactNumber(data.themes.NETWORK_HEALTH.metrics.totalTransactions),
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.PROTOCOL_ACTIVITY),
      });
    }
    if (data.themes.NETWORK_HEALTH.metrics.uniqueUsers) {
      metrics.push({
        metric: "Unique Users",
        value: formatCompactNumber(data.themes.NETWORK_HEALTH.metrics.uniqueUsers),
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.PROTOCOL_ACTIVITY),
      });
    }
    if (data.themes.NETWORK_HEALTH.metrics.successRate) {
      metrics.push({
        metric: "Success Rate",
        value: `${Number(data.themes.NETWORK_HEALTH.metrics.successRate).toFixed(1)}%`,
        status: Number(data.themes.NETWORK_HEALTH.metrics.successRate) > 90 ? "success" : "warning",
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.PROTOCOL_ACTIVITY),
      });
    }
    if (data.themes.NETWORK_HEALTH.metrics.maxTPS) {
      metrics.push({
        metric: "Max TPS",
        value: `${data.themes.NETWORK_HEALTH.metrics.maxTPS}`,
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.TRANSACTION_ANALYSIS),
      });
    }
    if (data.themes.NETWORK_HEALTH.metrics.avgGasPrice) {
      metrics.push({
        metric: "Avg Gas Price",
        value: `${Number(data.themes.NETWORK_HEALTH.metrics.avgGasPrice).toFixed(6)} APT`,
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.PROTOCOL_ACTIVITY),
      });
    }
    if (data.themes.NETWORK_HEALTH.metrics.avgBlockTime) {
      metrics.push({
        metric: "Block Time",
        value: `${Number(data.themes.NETWORK_HEALTH.metrics.avgBlockTime).toFixed(2)}s`,
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.BLOCK_TIMES),
      });
    }
    if (data.themes.NETWORK_HEALTH.metrics.avgFinalityTime) {
      metrics.push({
        metric: "Finality Time",
        value: `${Number(data.themes.NETWORK_HEALTH.metrics.avgFinalityTime).toFixed(2)}s`,
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.BLOCK_TIMES),
      });
    }
    if (data.themes.NETWORK_HEALTH.metrics.networkReliability) {
      metrics.push({
        metric: "Network Reliability",
        value: `${Number(data.themes.NETWORK_HEALTH.metrics.networkReliability).toFixed(1)}%`,
        status:
          Number(data.themes.NETWORK_HEALTH.metrics.networkReliability) > 95
            ? "success"
            : "warning",
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.BLOCK_TIMES),
      });
    }
  }

  // User Activity metrics
  if (data.themes.USER_ACTIVITY) {
    if (data.themes.USER_ACTIVITY.metrics.dailyActiveAddresses) {
      metrics.push({
        metric: "Daily Active Addresses",
        value: formatCompactNumber(data.themes.USER_ACTIVITY.metrics.dailyActiveAddresses),
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.DEX_COMPARISON),
      });
    }
    if (data.themes.USER_ACTIVITY.metrics.dailyTransactions) {
      metrics.push({
        metric: "Daily Transactions",
        value: formatCompactNumber(data.themes.USER_ACTIVITY.metrics.dailyTransactions),
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.DEX_COMPARISON),
      });
    }
    if (data.themes.USER_ACTIVITY.metrics.dailyGasFeesUSD) {
      metrics.push({
        metric: "Daily Gas Fees",
        value: `$${formatCompactNumber(data.themes.USER_ACTIVITY.metrics.dailyGasFeesUSD)}`,
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.USER_ANALYTICS),
      });
    }
    if (data.themes.USER_ACTIVITY.metrics.dailyGasFeesAPT) {
      metrics.push({
        metric: "Daily Gas (APT)",
        value: `${formatCompactNumber(data.themes.USER_ACTIVITY.metrics.dailyGasFeesAPT)} APT`,
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.USER_ANALYTICS),
      });
    }
    if (data.themes.USER_ACTIVITY.metrics.totalSignatures) {
      metrics.push({
        metric: "Total Signatures",
        value: formatCompactNumber(data.themes.USER_ACTIVITY.metrics.totalSignatures),
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.USER_BEHAVIOR),
      });
    }
    if (data.themes.USER_ACTIVITY.metrics.peakHourlyActivity) {
      metrics.push({
        metric: "Peak Hourly Activity",
        value: formatCompactNumber(data.themes.USER_ACTIVITY.metrics.peakHourlyActivity),
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.ACTIVITY_PATTERNS),
      });
    }
  }

  // DeFi Ecosystem metrics
  if (data.themes.DEFI_ECOSYSTEM) {
    if (data.themes.DEFI_ECOSYSTEM.metrics.totalSwapEvents) {
      metrics.push({
        metric: "Total Swap Events",
        value: formatCompactNumber(data.themes.DEFI_ECOSYSTEM.metrics.totalSwapEvents),
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.DEX_TRADING_VOLUME),
      });
    }
    if (data.themes.DEFI_ECOSYSTEM.metrics.uniqueTraders) {
      metrics.push({
        metric: "Unique Traders",
        value: formatCompactNumber(data.themes.DEFI_ECOSYSTEM.metrics.uniqueTraders),
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.DEX_TRADING_VOLUME),
      });
    }
    if (data.themes.DEFI_ECOSYSTEM.metrics.totalTokenHolders) {
      metrics.push({
        metric: "Token Holders",
        value: formatCompactNumber(data.themes.DEFI_ECOSYSTEM.metrics.totalTokenHolders),
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.TOKEN_BALANCES),
      });
    }
    if (data.themes.DEFI_ECOSYSTEM.metrics.transactionCount) {
      metrics.push({
        metric: "DeFi Transactions",
        value: formatCompactNumber(data.themes.DEFI_ECOSYSTEM.metrics.transactionCount),
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.DEX_METRICS),
      });
    }
    if (data.themes.DEFI_ECOSYSTEM.metrics.avgGasPerTx) {
      metrics.push({
        metric: "Avg Gas per Tx",
        value: `${Number(data.themes.DEFI_ECOSYSTEM.metrics.avgGasPerTx).toFixed(6)} APT`,
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.DEX_METRICS),
      });
    }
  }

  // Protocol Analytics metrics
  if (data.themes.PROTOCOL_ANALYTICS) {
    if (data.themes.PROTOCOL_ANALYTICS.metrics.allTimeTransactions) {
      metrics.push({
        metric: "All-Time Transactions",
        value: formatCompactNumber(data.themes.PROTOCOL_ANALYTICS.metrics.allTimeTransactions),
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.ALL_TIME_TRANSACTIONS),
      });
    }
    if (data.themes.PROTOCOL_ANALYTICS.metrics.networkAgeDays) {
      metrics.push({
        metric: "Network Age",
        value: `${data.themes.PROTOCOL_ANALYTICS.metrics.networkAgeDays} days`,
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.ALL_TIME_TRANSACTIONS),
      });
    }
    // Active Protocols metric removed
    if (data.themes.PROTOCOL_ANALYTICS.metrics.topProtocols?.[0]?.transactions) {
      metrics.push({
        metric: "Top Protocol Volume",
        value: formatCompactNumber(
          data.themes.PROTOCOL_ANALYTICS.metrics.topProtocols[0].transactions
        ),
        queryUrl: getDuneQueryUrl(DUNE_QUERY_IDS.PROTOCOL_METRICS),
      });
    }
  }

  return metrics;
}

export default function MetricsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDashboardData = async (refresh = false) => {
    try {
      setError(null);
      if (refresh) setRefreshing(true);

      // Use the existing comprehensive API that's working
      const response = await fetch(`/api/metrics/comprehensive`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Check if it's a configuration error
        if (errorData.configurationRequired) {
          throw new Error(
            "Dune Analytics API key not configured. Please add DUNE_API_KEY_TOKEN to your environment variables. See PRODUCTION_SETUP.md for details."
          );
        }

        throw new Error(`Failed to fetch data: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();

      // Transform the data to match our dashboard structure
      const transformedData = {
        summary: {
          lastUpdated: new Date().toISOString(),
          themesLoaded: result.themes ? Object.keys(result.themes).length : 0,
          totalQueriesExecuted: result.queriesUsed?.length || 0,
          successfulQueries: result.queriesUsed?.length || 0,
          failedQueries: 0,
          avgExecutionTime: 0, // Real execution time not available from this API
          dataFreshness: result.dataSource === "dune_analytics_comprehensive" ? "live" : "cached",
        },
        themes: {
          NETWORK_HEALTH: {
            name: "Network Health & Performance",
            icon: "🏥",
            metrics: {
              totalTransactions: result.metrics?.totalTransactions
                ? Number(result.metrics.totalTransactions)
                : null,
              uniqueUsers: result.metrics?.totalAccounts
                ? Number(result.metrics.totalAccounts)
                : null,
              successRate: result.metrics?.networkUptime
                ? Number(result.metrics.networkUptime)
                : null,
              avgGasPrice: result.metrics?.averageGasPrice
                ? Number(result.metrics.averageGasPrice)
                : null,
              maxTPS: result.metrics?.maxTPS ? Number(result.metrics.maxTPS) : null,
              avgBlockTime: result.metrics?.avgBlockTime
                ? Number(result.metrics.avgBlockTime)
                : null,
              avgFinalityTime: result.metrics?.avgFinalityTime
                ? Number(result.metrics.avgFinalityTime)
                : null,
              networkReliability: result.metrics?.networkReliabilityScore
                ? Number(result.metrics.networkReliabilityScore)
                : result.metrics?.networkUptime
                  ? Number(result.metrics.networkUptime)
                  : null,
            },
            rawData: {},
          },
          USER_ACTIVITY: {
            name: "User Activity & Engagement",
            icon: "👥",
            metrics: {
              dailyActiveAddresses: result.metrics?.dailyActiveAddresses
                ? Number(result.metrics.dailyActiveAddresses)
                : null,
              dailyTransactions: result.metrics?.dailyTransactions
                ? Number(result.metrics.dailyTransactions)
                : null,
              dailyGasFeesUSD: result.metrics?.dailyGasFeesUSD
                ? Number(result.metrics.dailyGasFeesUSD)
                : null,
              dailyGasFeesAPT: result.metrics?.dailyGasFeesAPT
                ? Number(result.metrics.dailyGasFeesAPT)
                : null,
              totalSignatures: result.metrics?.totalSignatures
                ? Number(result.metrics.totalSignatures)
                : null,
              peakHourlyActivity: result.metrics?.peakHourlyTransactions
                ? Number(result.metrics.peakHourlyTransactions)
                : null,
              activityPatterns: result.metrics?.activityPatterns || [],
            },
            rawData: {},
          },
          DEFI_ECOSYSTEM: {
            name: "DeFi & Trading",
            icon: "💰",
            metrics: {
              totalSwapEvents: result.metrics?.totalSwapEvents
                ? Number(result.metrics.totalSwapEvents)
                : null,
              uniqueTraders: result.metrics?.uniqueSwappers
                ? Number(result.metrics.uniqueSwappers)
                : null,
              totalTokenHolders: result.metrics?.totalTokenHolders
                ? Number(result.metrics.totalTokenHolders)
                : null,
              transactionCount: result.metrics?.recentTransactionCount
                ? Number(result.metrics.recentTransactionCount)
                : null,
              totalGasFeesAPT: result.metrics?.recentGasFeesAPT
                ? Number(result.metrics.recentGasFeesAPT)
                : null,
              avgGasPerTx: result.metrics?.avgGasFeePerTx
                ? Number(result.metrics.avgGasFeePerTx)
                : null,
              topTokenHoldings: result.metrics?.topTokenHoldings || [],
            },
            rawData: {},
          },
          PROTOCOL_ANALYTICS: {
            name: "Protocol Performance",
            icon: "🏗️",
            metrics: {
              allTimeTransactions: result.metrics?.allTimeTransactionCount
                ? Number(result.metrics.allTimeTransactionCount)
                : result.metrics?.totalTransactions
                  ? Number(result.metrics.totalTransactions)
                  : null,
              networkAgeDays: result.metrics?.networkLifetimeDays
                ? Number(result.metrics.networkLifetimeDays)
                : null,
              protocolCount: result.metrics?.totalProtocols
                ? Number(result.metrics.totalProtocols)
                : null,
              topProtocols: result.metrics?.protocolBreakdown || [],
            },
            rawData: {},
          },
        },
        queryStatus: {},
        availableThemes: [
          { id: "network_health", name: "Network Health & Performance", icon: "🏥", queryCount: 4 },
          { id: "user_activity", name: "User Activity & Engagement", icon: "👥", queryCount: 4 },
          { id: "defi_ecosystem", name: "DeFi & Trading", icon: "💰", queryCount: 4 },
          { id: "protocol_analytics", name: "Protocol Performance", icon: "🏗️", queryCount: 3 },
        ],
      };

      setData(transformedData);
      logger.info("Dashboard data loaded", {
        source: result.dataSource,
        tableRows: result.tableData?.length,
      });
    } catch (err) {
      logger.error("Failed to fetch dashboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchDashboardData(false), 300000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    fetchDashboardData(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ background: "var(--bg)" }}>
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="max-w-2xl w-full p-6 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--grid)" }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--danger)" }}>Error Loading Dashboard</h2>
          <p className="mb-4" style={{ color: "var(--muted-text)" }}>{error}</p>
          <Button onClick={() => fetchDashboardData()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const metrics = collectMetrics(data);

  return (
    <ErrorBoundary>
      <div className={`min-h-screen ${GeistMono.className}`} style={{ background: "var(--bg)", color: "var(--text)" }}>
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6">
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 14,
                    background: "var(--surface)",
                    border: "1px solid var(--grid)",
                    borderRadius: 16,
                    boxShadow: "0 1px 2px rgba(0,0,0,.06)"
                  }}
                >
                  <div style={{ color: "var(--muted-text)", fontSize: "0.8rem" }}>{m.metric}</div>
                  <div
                    style={{
                      fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                      fontSize: "1.6rem",
                      marginTop: 6,
                      color: m.status === "success" ? "var(--accent)" : m.status === "warning" ? "var(--warn)" : m.status === "error" ? "var(--danger)" : "var(--text)"
                    }}
                  >
                    {m.value}
                  </div>
                  {m.queryUrl && (
                    <a
                      href={m.queryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.85rem" }}
                    >
                      View Query →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
