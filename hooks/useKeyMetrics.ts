import { useEffect, useState } from "react";
import { logger } from "@/lib/utils/core/logger";

interface KeyMetrics {
  allTimeTransactions: number;
  avgGasFeeAPT: number;
  avgBlockTimeSeconds: number;
  networkReliability: number | string; // Can be "-" if not available
  avgFinalityTime: number;
}

export function useKeyMetrics() {
  const [metrics, setMetrics] = useState<KeyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeyMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/metrics/key-metrics", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: KeyMetrics = await response.json();
        setMetrics(data);
        
        logger.info("Successfully fetched key metrics", data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("Error fetching key metrics:", errorMessage);
        setError(errorMessage);

        // Set fallback values
        setMetrics({
          allTimeTransactions: 0,
          avgGasFeeAPT: 0,
          avgBlockTimeSeconds: 4.0,
          networkReliability: "-", // Not available from API
          avgFinalityTime: 4.0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchKeyMetrics();

    // Refresh every 5 minutes
    const interval = setInterval(fetchKeyMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    loading,
    error,
  };
}