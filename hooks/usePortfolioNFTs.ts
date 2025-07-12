import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

interface NFT {
  token_data_id: string;
  token_name: string;
  collection_name: string;
  token_uri: string;
  description?: string;
  property_version_v1: number;
  amount: number;
  cdn_image_uri?: string;
  cdn_animation_uri?: string;
  collection_description?: string;
  creator_address?: string;
  collection_uri?: string;
  last_transaction_version?: number;
  last_transaction_timestamp?: string;
}

interface UsePortfolioNFTsResult {
  data: NFT[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePortfolioNFTs(
  walletAddress: string | undefined,
  limit: number = 30,
  offset: number = 0
): UsePortfolioNFTsResult {
  const [data, setData] = useState<NFT[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = useCallback(async () => {
    if (!walletAddress) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        address: walletAddress,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`/api/portfolio/nfts?${params}`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch NFTs: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch NFTs');
      }
    } catch (err) {
      logger.error('[usePortfolioNFTs] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, limit, offset]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchNFTs,
  };
}
