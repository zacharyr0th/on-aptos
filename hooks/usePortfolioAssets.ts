import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

interface FungibleAsset {
  asset_type: string;
  amount: string;
  metadata?: {
    name: string;
    symbol: string;
    decimals: number;
    icon_uri?: string;
  };
  price?: number;
  value?: number;
  balance?: number;
  isVerified?: boolean;
  protocolInfo?: {
    protocol: string;
    protocolLabel: string;
    protocolType: string;
    isPhantomAsset: boolean;
  };
}

interface UsePortfolioAssetsResult {
  data: FungibleAsset[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePortfolioAssets(
  walletAddress: string | undefined,
  showOnlyVerified: boolean = true
): UsePortfolioAssetsResult {
  const [data, setData] = useState<FungibleAsset[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!walletAddress) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        address: walletAddress,
        showOnlyVerified: showOnlyVerified.toString(),
      });

      const response = await fetch(`/api/portfolio/assets?${params}`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch assets');
      }
    } catch (err) {
      logger.error('[usePortfolioAssets] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, showOnlyVerified]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchAssets,
  };
}
