"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Dune Query URLs
const getDuneQueryUrl = (queryId: number) => `https://dune.com/queries/${queryId}`;

const QUERY_IDS = {
  PROTOCOL_ACTIVITY: 5699127,
  USER_ANALYTICS: 4045225,
  DEX_COMPARISON: 3431742,
  TRANSACTION_ANALYSIS: 4045024,
  NETWORK_STATS: 3468810,
  PROTOCOL_METRICS: 3468830,
  TOKEN_BALANCES: 5699610,
  DEX_TRADING_VOLUME: 5699630,
  ACTIVITY_PATTERNS: 5699668,
  ALL_TIME_TRANSACTIONS: 5699671,
  BLOCK_TIMES: 5699672,
};

interface Metric {
  metric: string;
  value: string;
  status?: "success" | "warning" | "error";
  queryUrl: string;
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatNumber = (value: any): string => {
    const num = Number(value);
    if (!num || isNaN(num)) return "—";
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const fetchData = async (refresh = false) => {
    try {
      setError(null);
      if (refresh) setRefreshing(true);
      
      const response = await fetch("/api/metrics/comprehensive");
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      
      const metricsData: Metric[] = [
        {
          metric: "Total Transactions",
          value: formatNumber(data.metrics?.totalTransactions),
          queryUrl: getDuneQueryUrl(QUERY_IDS.PROTOCOL_ACTIVITY)
        },
        {
          metric: "Daily Active Addresses",
          value: formatNumber(data.metrics?.dailyActiveAddresses),
          queryUrl: getDuneQueryUrl(QUERY_IDS.DEX_COMPARISON)
        },
        {
          metric: "Daily Transactions",
          value: formatNumber(data.metrics?.dailyTransactions),
          queryUrl: getDuneQueryUrl(QUERY_IDS.DEX_COMPARISON)
        },
        {
          metric: "Daily Gas Fees",
          value: data.metrics?.dailyGasFeesUSD ? `$${formatNumber(data.metrics.dailyGasFeesUSD)}` : "—",
          queryUrl: getDuneQueryUrl(QUERY_IDS.USER_ANALYTICS)
        },
        {
          metric: "Total Signatures",
          value: formatNumber(data.metrics?.totalSignatures),
          queryUrl: getDuneQueryUrl(QUERY_IDS.ACTIVITY_PATTERNS)
        },
        {
          metric: "Max TPS",
          value: data.metrics?.maxTPS ? `${data.metrics.maxTPS}` : "—",
          queryUrl: getDuneQueryUrl(QUERY_IDS.TRANSACTION_ANALYSIS)
        },
        {
          metric: "Success Rate",
          value: data.metrics?.networkUptime ? `${Number(data.metrics.networkUptime).toFixed(1)}%` : "—",
          status: data.metrics?.networkUptime > 90 ? "success" : "warning",
          queryUrl: getDuneQueryUrl(QUERY_IDS.PROTOCOL_ACTIVITY)
        },
        {
          metric: "Total Swap Events",
          value: formatNumber(data.metrics?.totalSwapEvents),
          queryUrl: getDuneQueryUrl(QUERY_IDS.DEX_TRADING_VOLUME)
        },
        {
          metric: "Unique Traders",
          value: formatNumber(data.metrics?.uniqueSwappers),
          queryUrl: getDuneQueryUrl(QUERY_IDS.DEX_TRADING_VOLUME)
        },
        {
          metric: "All-Time Transactions",
          value: formatNumber(data.metrics?.allTimeTransactionCount || data.metrics?.totalTransactions),
          queryUrl: getDuneQueryUrl(QUERY_IDS.ALL_TIME_TRANSACTIONS)
        }
      ];
      
      setMetrics(metricsData.filter(m => m.value !== "—"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen textured-bg p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen textured-bg p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchData()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen textured-bg">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Network Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Live Aptos network metrics with Dune Analytics integration
              </p>
            </div>
            <Button 
              onClick={() => fetchData(true)}
              disabled={refreshing}
              size="sm"
              variant="ghost"
              className="h-8 px-3"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6">
        <div className="max-w-6xl mx-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Metric</TableHead>
                <TableHead className="w-1/3">Value</TableHead>
                <TableHead className="w-1/3">Dune Query</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((metric, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{metric.metric}</TableCell>
                  <TableCell className={`font-mono ${
                    metric.status === "success" ? "text-green-600" : 
                    metric.status === "warning" ? "text-yellow-600" : 
                    metric.status === "error" ? "text-red-600" : ""
                  }`}>
                    {metric.value}
                  </TableCell>
                  <TableCell>
                    <a 
                      href={metric.queryUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      View Query
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}