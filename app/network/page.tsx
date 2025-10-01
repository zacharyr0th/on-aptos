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

export default function NetworkPage() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      if (refresh) setRefreshing(true);
      
      const response = await fetch("/api/metrics/comprehensive");
      const data = await response.json();
      
      const metricsData = [
        { metric: "Total Transactions", value: formatNumber(data.metrics?.totalTransactions), queryUrl: "https://dune.com/queries/5699127" },
        { metric: "Daily Active Addresses", value: formatNumber(data.metrics?.dailyActiveAddresses), queryUrl: "https://dune.com/queries/3431742" },
        { metric: "Daily Transactions", value: formatNumber(data.metrics?.dailyTransactions), queryUrl: "https://dune.com/queries/3431742" },
        { metric: "Daily Gas Fees", value: data.metrics?.dailyGasFeesUSD ? `$${formatNumber(data.metrics.dailyGasFeesUSD)}` : "—", queryUrl: "https://dune.com/queries/4045225" },
        { metric: "Total Signatures", value: formatNumber(data.metrics?.totalSignatures), queryUrl: "https://dune.com/queries/5699668" },
        { metric: "Max TPS", value: data.metrics?.maxTPS ? `${data.metrics.maxTPS}` : "—", queryUrl: "https://dune.com/queries/4045024" },
        { metric: "Success Rate", value: data.metrics?.networkUptime ? `${Number(data.metrics.networkUptime).toFixed(1)}%` : "—", queryUrl: "https://dune.com/queries/5699127" },
        { metric: "Total Swap Events", value: formatNumber(data.metrics?.totalSwapEvents), queryUrl: "https://dune.com/queries/5699630" },
        { metric: "Unique Traders", value: formatNumber(data.metrics?.uniqueSwappers), queryUrl: "https://dune.com/queries/5699630" },
        { metric: "All-Time Transactions", value: formatNumber(data.metrics?.allTimeTransactionCount || data.metrics?.totalTransactions), queryUrl: "https://dune.com/queries/5699671" }
      ];
      
      setMetrics(metricsData.filter(m => m.value !== "—"));
    } catch (err) {
      console.error("Failed to load data:", err);
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

  return (
    <div className="min-h-screen textured-bg">
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Network Analytics</h1>
              <p className="text-sm text-muted-foreground">Live Aptos network metrics with Dune Analytics</p>
            </div>
            <Button onClick={() => fetchData(true)} disabled={refreshing} size="sm" variant="ghost" className="h-8 px-3">
              <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

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
                  <TableCell className="font-mono">{metric.value}</TableCell>
                  <TableCell>
                    <a href={metric.queryUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm">
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