import { useEffect, useState } from "react";
import type { ComprehensiveMetricsResponse, MetricsData, TableData } from "@/lib/types/metrics";
import { logger } from "@/lib/utils/core/logger";

export function useMetricsData() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [tableData, setTableData] = useState<TableData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          // Add cache busting for development
          ...(process.env.NODE_ENV === "development" && {
            cache: "no-cache",
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ComprehensiveMetricsResponse = await response.json();

        logger.info("Successfully fetched metrics data", {
          queriesUsed: data.queriesUsed?.length || 0,
          tableRows: data.tableData?.length || 0,
          dataSource: data.dataSource,
        });

        setMetrics(data.metrics);
        setTableData(data.tableData || []);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("Error fetching metrics data:", {
          error: errorMessage,
          errorType: error instanceof Error ? error.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined,
        });
        setError(errorMessage);

        // Don't set to null - keep previous data if available
        if (!metrics) {
          setMetrics({});
        }
        if (!tableData) {
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
  }, []);

  return {
    metrics,
    tableData,
    loading,
    error,
    refresh: () => {
      setLoading(true);
      // Trigger re-fetch by changing state
      setMetrics(null);
      setTableData(null);
    },
  };
}
