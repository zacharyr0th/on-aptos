import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';
import { DeFiPosition } from '@/lib/trpc/domains/blockchain/portfolio/defi-balance-service';

interface UsePortfolioDeFiResult {
  data: DeFiPosition[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePortfolioDeFi(
  walletAddress: string | undefined
): UsePortfolioDeFiResult {
  const [data, setData] = useState<DeFiPosition[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeFiPositions = useCallback(async () => {
    if (!walletAddress) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        address: walletAddress,
      });

      const response = await fetch(`/api/portfolio/defi?${params}`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch DeFi positions: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch DeFi positions');
      }
    } catch (err) {
      logger.error('[usePortfolioDeFi] Error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch DeFi positions'
      );
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchDeFiPositions();
  }, [fetchDeFiPositions]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDeFiPositions,
  };
}
