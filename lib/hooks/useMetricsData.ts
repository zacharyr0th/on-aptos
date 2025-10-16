import { useEffect, useState } from "react";
import type { ComprehensiveMetricsResponse, MetricsData, TableData } from "@/lib/types/metrics";
import { logger } from "@/lib/utils/core/logger";

export function useMetricsData() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [tableData, setTableData] = useState<TableData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        logger.info("Fetching comprehensive metrics data from Dune APIs");

        const response = await fetch("/api/metrics/comprehensive", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store", // Force fresh data
        });

        console.log("Response status:", response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API request failed - status:", response.status);
          console.error("API request failed - statusText:", response.statusText);
          console.error("API request failed - errorText:", errorText.substring(0, 500));
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText.substring(0, 200)}`);
        }

        const data: ComprehensiveMetricsResponse = await response.json();

        console.log("Successfully fetched metrics data", {
          hasMetrics: !!data.metrics,
          hasTableData: !!data.tableData,
          tableRows: data.tableData?.length || 0,
          metricsKeys: data.metrics ? Object.keys(data.metrics).length : 0,
        });

        logger.info("Successfully fetched metrics data", {
          queriesUsed: data.queriesUsed?.length || 0,
          tableRows: data.tableData?.length || 0,
          dataSource: data.dataSource,
        });

        setMetrics(data.metrics);
        setTableData(data.tableData || []);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error fetching metrics data:", error);
        logger.error("Error fetching metrics data:", error);
        setError(errorMessage);

        // Don't clear data - keep previous data if available
        // Only set empty data if we have no data at all
        if (metrics === null) {
          setMetrics({});
        }
        if (tableData === null) {
          setTableData([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Set up auto-refresh every 5 minutes for live data
    const interval = setInterval(fetchMetrics, 300000);

    return () => clearInterval(interval);
  }, [refreshTrigger]);

  return {
    metrics,
    tableData,
    loading,
    error,
    refresh: () => {
      setRefreshTrigger(prev => prev + 1);
    },
  };
}
