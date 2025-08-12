/**
 * Hook for fetching and managing DeFi metrics from DeFi Llama
 */

import { useState, useEffect, useCallback } from "react";
import {
  defiLlamaService,
  type AptosDefiMetrics,
} from "@/lib/services/external/defi-llama";
import { serviceLogger } from "@/lib/utils/core/logger";

interface UseDefiMetricsReturn {
  metrics: AptosDefiMetrics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasData: boolean;
  isOffline: boolean;
  isEmpty: boolean;
}

export function useDefiMetrics(): UseDefiMetricsReturn {
  const [metrics, setMetrics] = useState<AptosDefiMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsOffline(false);

      const data = await defiLlamaService.getAptosDefiMetrics();

      if (data) {
        setMetrics(data);
        serviceLogger.debug("Successfully fetched DeFi metrics");
      } else {
        // Service returned null but didn't throw - likely API unavailable
        setError("DeFi data is temporarily unavailable");
        setIsOffline(true);
        serviceLogger.warn(
          "DeFi metrics service returned null - API likely unavailable",
        );
      }
    } catch (err) {
      let errorMessage = "Failed to fetch DeFi metrics";
      let offline = false;

      if (err instanceof TypeError && err.message === "Failed to fetch") {
        errorMessage = "Unable to connect to DeFi data provider";
        offline = true;
      } else if (err instanceof Error && err.name === "TimeoutError") {
        errorMessage = "Request timed out - please try again";
        offline = true;
      } else if (err instanceof Error) {
        errorMessage = `DeFi data error: ${err.message}`;
      }

      setError(errorMessage);
      setIsOffline(offline);
      serviceLogger.warn("DeFi metrics fetch failed:", { error: err, offline });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const hasData = !!metrics && !error;
  const isEmpty = !isLoading && !metrics && !error;

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
    hasData,
    isOffline,
    isEmpty,
  };
}
