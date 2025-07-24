/**
 * Hook for fetching and managing DeFi metrics from DeFi Llama
 */

import { useState, useEffect, useCallback } from 'react';
import {
  defiLlamaService,
  type AptosDefiMetrics,
} from '@/lib/services/defi-llama';

interface UseDefiMetricsReturn {
  metrics: AptosDefiMetrics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasData: boolean;
}

export function useDefiMetrics(): UseDefiMetricsReturn {
  const [metrics, setMetrics] = useState<AptosDefiMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await defiLlamaService.getAptosDefiMetrics();
      setMetrics(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch DeFi metrics';
      console.error('DeFi metrics error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
    hasData: !!metrics && !error,
  };
}
