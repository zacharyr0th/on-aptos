"use client";

import { Activity, Clock, DollarSign, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMetricsData } from "@/hooks/useMetricsData";
import { useKeyMetrics } from "@/hooks/useKeyMetrics";

// Helper function to safely format numbers
const safeToFixed = (value: any, decimals: number = 0): string => {
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  return !isNaN(num) && isFinite(num) ? num.toFixed(decimals) : "0";
};

const formatLargeNumber = (value: number): string => {
  if (value >= 1e9) return `${safeToFixed(value / 1e9, 1)}B`;
  if (value >= 1e6) return `${safeToFixed(value / 1e6, 1)}M`;
  if (value >= 1e3) return `${safeToFixed(value / 1e3, 1)}K`;
  return safeToFixed(value, 0);
};

export default function KeyMetricCards() {
  const { metrics: duneMetrics, loading: duneLoading, error: duneError } = useMetricsData();
  const { metrics: indexerMetrics, loading: indexerLoading, error: indexerError } = useKeyMetrics();

  const loading = duneLoading || indexerLoading;
  const error = duneError || indexerError;

  if (error && !duneMetrics && !indexerMetrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Error Loading</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">—</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded w-20"></div>
            ) : (
              // Use only Indexer data - Dune data is inaccurate
              formatLargeNumber(indexerMetrics?.allTimeTransactions || 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {indexerMetrics?.allTimeTransactions
              ? "Total transactions from Aptos Indexer"
              : "Transaction data loading..."}
          </p>
          {!loading && indexerMetrics?.allTimeTransactions && (
            <Badge variant="secondary" className="mt-1">
              Indexer Data
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Average Gas Fee */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Gas Fee</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded w-16"></div>
            ) : // Use Dune data for gas price since it's working (0.002 APT)
            duneMetrics?.averageGasPrice ? (
              `${safeToFixed(duneMetrics.averageGasPrice, 6)} APT`
            ) : (
              "-"
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {duneMetrics?.averageGasPrice
              ? "Average gas cost from Dune query"
              : "Gas fee data not available"}
          </p>
          {!loading && duneMetrics?.averageGasPrice && (
            <Badge
              variant={(duneMetrics.averageGasPrice as number) < 0.001 ? "default" : "secondary"}
              className="mt-1"
            >
              {(duneMetrics.averageGasPrice as number) < 0.001 ? "Low Cost" : "Normal"}
            </Badge>
          )}
          {!loading && !duneMetrics?.averageGasPrice && (
            <Badge variant="outline" className="mt-1">
              No Data
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Block Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Block Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded w-12"></div>
            ) : // Use Key Metrics data for block time if available
            indexerMetrics?.avgBlockTimeSeconds ? (
              `${safeToFixed(indexerMetrics.avgBlockTimeSeconds, 1)}s`
            ) : (
              "-"
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {indexerMetrics?.avgBlockTimeSeconds
              ? "Average time between blocks"
              : "Block time data not available"}
          </p>
          {!loading && indexerMetrics?.avgBlockTimeSeconds && (
            <Badge
              variant={(indexerMetrics?.avgBlockTimeSeconds || 0) <= 5 ? "default" : "secondary"}
              className="mt-1"
            >
              {(indexerMetrics?.avgBlockTimeSeconds || 0) <= 5 ? "Fast" : "Normal"}
            </Badge>
          )}
          {!loading && !indexerMetrics?.avgBlockTimeSeconds && (
            <Badge variant="outline" className="mt-1">
              No Data Available
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Network Reliability */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Network Reliability</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded w-16"></div>
            ) : duneMetrics?.networkUptime === "-" ? (
              "-"
            ) : (
              `${safeToFixed(duneMetrics?.networkUptime || 0, 1)}%`
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {duneMetrics?.networkUptime === "-"
              ? "Reliability data not available"
              : "Transaction success rate"}
          </p>
          {!loading && duneMetrics?.networkUptime && duneMetrics.networkUptime !== "-" && (
            <Badge
              variant={
                parseFloat(duneMetrics.networkUptime as string) >= 99
                  ? "default"
                  : parseFloat(duneMetrics.networkUptime as string) >= 95
                    ? "secondary"
                    : "destructive"
              }
              className="mt-1"
            >
              {parseFloat(duneMetrics.networkUptime as string) >= 99
                ? "Excellent"
                : parseFloat(duneMetrics.networkUptime as string) >= 95
                  ? "Good"
                  : "Issues"}
            </Badge>
          )}
          {!loading && duneMetrics?.networkUptime === "-" && (
            <Badge variant="outline" className="mt-1">
              No Data
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
