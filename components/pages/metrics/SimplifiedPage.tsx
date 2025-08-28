"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Database, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { logger } from "@/lib/utils/core/logger";

interface MetricSnapshot {
  date: string;
  value: string;
  source: string;
  category: string;
  metric: string;
}

const SimplifiedMetricsPage: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch database summary
  const {
    data: summaryData,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["metrics-summary"],
    queryFn: async () => {
      const response = await fetch("/api/metrics/snapshots/summary");
      if (!response.ok) throw new Error("Failed to fetch summary");
      return await response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch latest snapshots from database
  const {
    data: snapshotsData,
    isLoading: snapshotsLoading,
    refetch: refetchSnapshots,
  } = useQuery({
    queryKey: ["latest-snapshots"],
    queryFn: async () => {
      const response = await fetch(
        "/api/metrics/snapshots/timeseries?limit=100",
      );
      if (!response.ok) throw new Error("Failed to fetch snapshots");
      return await response.json();
    },
    refetchInterval: 60000,
  });

  // Generate new snapshot
  const handleGenerateSnapshot = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/metrics/snapshots/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initializeSchema: true }),
      });

      const result = await response.json();

      if (result.success) {
        logger.info("Snapshot generated successfully", result);
        // Refetch data after generation
        await Promise.all([refetchSummary(), refetchSnapshots()]);
      } else {
        logger.error("Failed to generate snapshot", result);
      }
    } catch (error) {
      logger.error("Error generating snapshot:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const isLoading = summaryLoading || snapshotsLoading;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Metrics Snapshots</h1>
            <p className="text-muted-foreground">
              Simplified metrics tracking with daily snapshots
            </p>
          </div>
          <Button
            onClick={handleGenerateSnapshot}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
            />
            {isGenerating ? "Generating..." : "Generate Snapshot"}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Database Status
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge
                  variant={
                    summaryData?.databaseHealth?.status === "healthy"
                      ? "default"
                      : "secondary"
                  }
                >
                  {summaryData?.databaseHealth?.status || "loading"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {summaryData?.summary?.totalSnapshots || 0} total snapshots
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Metrics
              </CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryData?.summary?.totalMetrics || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                tracked across ecosystem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Update</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryData?.databaseHealth?.lastUpdate
                  ? new Date(
                      summaryData.databaseHealth.lastUpdate,
                    ).toLocaleDateString()
                  : "Never"}
              </div>
              <p className="text-xs text-muted-foreground">
                {summaryData?.databaseHealth?.totalDatesTracked || 0} dates
                tracked
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Latest Snapshots Table */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Snapshots</CardTitle>
            <CardDescription>
              Current metrics from database snapshots
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-60 flex-1" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead>Latest Value</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshotsData?.metrics?.map((metricData: any) => {
                    const latestSnapshot =
                      metricData.snapshots?.[metricData.snapshots.length - 1];
                    return (
                      <TableRow
                        key={`${metricData.category}-${metricData.metric}`}
                      >
                        <TableCell className="font-medium">
                          {metricData.category}
                        </TableCell>
                        <TableCell>{metricData.metric}</TableCell>
                        <TableCell className="font-mono">
                          {latestSnapshot?.formatted_value || "No data"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{metricData.source}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {latestSnapshot?.date
                            ? new Date(latestSnapshot.date).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {!isLoading &&
              (!snapshotsData?.metrics ||
                snapshotsData.metrics.length === 0) && (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No snapshots available
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Generate your first snapshot to start tracking metrics
                  </p>
                  <Button
                    onClick={handleGenerateSnapshot}
                    disabled={isGenerating}
                  >
                    Generate First Snapshot
                  </Button>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Recent Snapshots Preview */}
        {summaryData?.recentSnapshots?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Preview of recently captured metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summaryData.recentSnapshots.map(
                  (snapshot: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {snapshot.category}
                        </Badge>
                        <span className="font-medium">{snapshot.metric}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-mono">{snapshot.value}</span>
                        <span>•</span>
                        <span>
                          {new Date(snapshot.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
};

export default SimplifiedMetricsPage;
