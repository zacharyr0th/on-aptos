"use client";

import { GeistMono } from "geist/font/mono";
import type React from "react";
import { useState } from "react";

import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMetricsData } from "@/hooks/useMetricsData";
import { formatCompactNumber } from "@/lib/utils";

// Helper function to format numbers without currency symbol
function formatCompactMetric(value: number): string {
  if (value === 0) return "0";

  const formatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return formatter.format(value);
}

export default function MetricsPage(): React.ReactElement {
  const [refreshing, setRefreshing] = useState(false);

  const { metrics, loading: metricsLoading, tableData, error, refresh } = useMetricsData();

  const handleRefresh = async () => {
    setRefreshing(true);
    refresh();
    // Keep refreshing state for visual feedback
    setTimeout(() => setRefreshing(false), 2000);
  };

  return (
    <ErrorBoundary>
      <div className={`min-h-screen flex flex-col relative ${GeistMono.className}`}>
        <div className="fixed top-0 left-0 right-0 h-1 z-30">
          {refreshing && <div className="h-full bg-muted animate-pulse"></div>}
        </div>

        <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 flex-1 relative">
          {/* Header with refresh button */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Metrics on Aptos</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Real blockchain data from {error ? "Dune Analytics" : "13 live Dune queries"} • No
                mock data
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing || metricsLoading}
              variant="outline"
              size="sm"
            >
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>

          {/* Stats Cards Section - Enhanced with comprehensive data */}
          <div className="mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6">
              <StatCard
                title="Total Transactions"
                value={
                  metrics?.totalTransactions ? formatCompactMetric(metrics.totalTransactions) : "—"
                }
                change={
                  metrics?.totalTransactionsChange
                    ? { value: metrics.totalTransactionsChange, period: "1d" }
                    : undefined
                }
                tooltip="Total number of transactions across all monitored protocols"
                isLoading={metricsLoading}
                showError={!!error}
              />

              <StatCard
                title="Active Users (24h)"
                value={metrics?.totalAccounts ? formatCompactMetric(metrics.totalAccounts) : "—"}
                change={
                  metrics?.totalAccountsChange
                    ? { value: metrics.totalAccountsChange, period: "1d" }
                    : undefined
                }
                tooltip="Number of unique active users in the last 24 hours across monitored protocols"
                isLoading={metricsLoading}
                showError={!!error}
              />

              <StatCard
                title="Daily Active Addresses"
                value={
                  metrics?.dailyActiveAddresses
                    ? formatCompactMetric(metrics.dailyActiveAddresses)
                    : "—"
                }
                change={undefined}
                tooltip="Daily active addresses from DEX comparison data"
                isLoading={metricsLoading}
                showError={!!error}
              />

              <StatCard
                title="Daily Gas Fees"
                value={
                  metrics?.dailyGasFeesUSD
                    ? `$${formatCompactMetric(metrics.dailyGasFeesUSD)}`
                    : "—"
                }
                change={undefined}
                tooltip="Total daily gas fees in USD from network activity"
                isLoading={metricsLoading}
                showError={!!error}
              />
            </div>

            {/* Second Row - NEW Advanced Performance Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6">
              <StatCard
                title="Total Signatures"
                value={
                  metrics?.totalSignatures ? formatCompactMetric(metrics.totalSignatures) : "—"
                }
                change={undefined} // Need historical data for real changes
                tooltip="Total network signatures from user behavior analytics"
                isLoading={metricsLoading}
                showError={!!error}
              />

              <StatCard
                title="Max TPS (15 blocks)"
                value={metrics?.maxTPS ? `${metrics.maxTPS}` : "—"}
                change={undefined}
                tooltip="Maximum transactions per second over 15 block window"
                isLoading={metricsLoading}
                showError={!!error}
              />

              <StatCard
                title="Protocol Transactions"
                value={
                  metrics?.totalProtocolTransactions
                    ? formatCompactMetric(metrics.totalProtocolTransactions)
                    : "—"
                }
                change={undefined}
                tooltip="Total transactions across tracked protocol addresses"
                isLoading={metricsLoading}
                showError={!!error}
              />

              <StatCard
                title="Transaction Success Rate"
                value={metrics?.networkUptime ? `${metrics.networkUptime}%` : "—"}
                change={undefined}
                tooltip="Percentage of successful transactions"
                isLoading={metricsLoading}
                showError={!!error}
              />
            </div>
          </div>

          {/* Table Section - Enhanced with real data */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Detailed Metrics</h2>
              <div className="text-sm text-muted-foreground">
                {tableData?.length || 0} real-time metrics organized by category • Click rows to
                view Dune queries
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                <p className="text-destructive text-sm">
                  Error loading data: {error}. Some data may be cached or unavailable.
                </p>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Metric</TableHead>
                  <TableHead className="font-semibold">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricsLoading && tableData?.length === 0
                  ? // Loading skeleton
                    Array.from({ length: 10 }).map((_, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  : tableData?.map((row, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          if (row.queryUrl) {
                            window.open(row.queryUrl, "_blank", "noopener,noreferrer");
                          }
                        }}
                        title={
                          row.queryUrl
                            ? `Click to view Dune query ${row.queryId}`
                            : "No query available"
                        }
                      >
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            {row.category}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {row.name}
                            {row.queryUrl && (
                              <svg
                                className="w-4 h-4 text-muted-foreground opacity-50"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-lg font-semibold">
                          {row.value}
                        </TableCell>
                      </TableRow>
                    )) || []}
              </TableBody>
            </Table>

            {!metricsLoading && (!tableData || tableData.length === 0) && !error && (
              <div className="text-center py-8 text-muted-foreground">
                No metrics data available at the moment. Try refreshing the page.
              </div>
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
