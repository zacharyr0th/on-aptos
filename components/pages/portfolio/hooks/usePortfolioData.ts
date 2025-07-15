import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';
import { NFT } from '../types';

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

interface DeFiPosition {
  protocol: string;
  protocol_type?: string;
  protocolType?: string; // Support camelCase from API
  position_type?: string;
  position: any;
  tvl_usd?: number;
  totalValue?: number; // Support camelCase from API
  tokens?: any[];
  protocolLabel?: string;
  address?: string;
}

interface UsePortfolioDataResult {
  assets: FungibleAsset[] | null;
  nfts: NFT[] | null;
  defiPositions: DeFiPosition[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePortfolioData(
  walletAddress: string | undefined,
  showOnlyVerified: boolean = true
): UsePortfolioDataResult {
  const [assets, setAssets] = useState<FungibleAsset[] | null>(null);
  const [nfts, setNfts] = useState<NFT[] | null>(null);
  const [defiPositions, setDefiPositions] = useState<DeFiPosition[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) {
        setAssets(null);
        setNfts(null);
        setDefiPositions(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch all data in parallel
        const [assetsResponse, nftsResponse, defiResponse] = await Promise.all([
          // Fetch assets
          fetch(
            `/api/portfolio/assets?${new URLSearchParams({
              walletAddress: walletAddress,
              showOnlyVerified: showOnlyVerified.toString(),
            })}`
          ),
          // Fetch NFTs
          fetch(
            `/api/portfolio/nfts?${new URLSearchParams({
              walletAddress: walletAddress,
            })}`
          ),
          // Fetch DeFi positions
          fetch(
            `/api/portfolio/defi?${new URLSearchParams({
              walletAddress: walletAddress,
            })}`
          ),
        ]);

        // Check if all responses are ok
        if (!assetsResponse.ok || !nftsResponse.ok || !defiResponse.ok) {
          const errors = [];
          if (!assetsResponse.ok) errors.push(`Assets: ${assetsResponse.status}`);
          if (!nftsResponse.ok) errors.push(`NFTs: ${nftsResponse.status}`);
          if (!defiResponse.ok) errors.push(`DeFi: ${defiResponse.status}`);
          throw new Error(`Failed to fetch portfolio data: ${errors.join(', ')}`);
        }

        // Parse all responses
        const [assetsData, nftsData, defiData] = await Promise.all([
          assetsResponse.json(),
          nftsResponse.json(),
          defiResponse.json(),
        ]);

        // Update state with fetched data - handle both old and new response formats
        setAssets(assetsData.data?.assets || assetsData.assets || []);
        setNfts(nftsData.data?.nfts || nftsData.nfts || []);
        setDefiPositions(defiData.data || defiData.positions || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Failed to fetch portfolio data:', {
          error: errorMessage,
          walletAddress,
        });
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [walletAddress, showOnlyVerified]);

  const refetch = useCallback(async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Same fetch logic but wrapped in useCallback for manual refetch
      const [assetsResponse, nftsResponse, defiResponse] = await Promise.all([
        fetch(
          `/api/portfolio/assets?${new URLSearchParams({
            walletAddress: walletAddress,
            showOnlyVerified: showOnlyVerified.toString(),
          })}`
        ),
        fetch(
          `/api/portfolio/nfts?${new URLSearchParams({
            walletAddress: walletAddress,
          })}`
        ),
        fetch(
          `/api/portfolio/defi?${new URLSearchParams({
            walletAddress: walletAddress,
          })}`
        ),
      ]);

      if (!assetsResponse.ok || !nftsResponse.ok || !defiResponse.ok) {
        const errors = [];
        if (!assetsResponse.ok) errors.push(`Assets: ${assetsResponse.status}`);
        if (!nftsResponse.ok) errors.push(`NFTs: ${nftsResponse.status}`);
        if (!defiResponse.ok) errors.push(`DeFi: ${defiResponse.status}`);
        throw new Error(`Failed to fetch portfolio data: ${errors.join(', ')}`);
      }

      const [assetsData, nftsData, defiData] = await Promise.all([
        assetsResponse.json(),
        nftsResponse.json(),
        defiResponse.json(),
      ]);

      setAssets(assetsData.data?.assets || assetsData.assets || []);
      setNfts(nftsData.data?.nfts || nftsData.nfts || []);
      setDefiPositions(defiData.data?.positions || defiData.positions || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to fetch portfolio data:', {
        error: errorMessage,
        walletAddress,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, showOnlyVerified]);

  return {
    assets,
    nfts,
    defiPositions,
    isLoading,
    error,
    refetch,
  };
}
