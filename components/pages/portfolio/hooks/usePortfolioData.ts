import { useState, useEffect } from 'react';

import {
  enhancedFetch,
  isRateLimited,
  getRetryDelay,
} from '@/lib/utils/fetch-utils';
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
  totalValue?: number; // Support legacy field names
  totalValueUSD?: number; // New field from updated API
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
        logger.debug('No wallet address provided');
        setAssets(null);
        setNfts(null);
        setDefiPositions(null);
        return;
      }

      logger.info('Fetching data for wallet', { walletAddress });
      setIsLoading(true);
      setError(null);

      try {
        // Import NFT service
        const { NFTService } = await import(
          '@/lib/services/portfolio/services/nft-service'
        );

        logger.debug('Starting parallel fetch', { walletAddress });

        // Build full URLs for API calls
        const assetsUrl = `/api/portfolio/assets?${new URLSearchParams({
          walletAddress: walletAddress,
          showOnlyVerified: showOnlyVerified.toString(),
        })}`;
        const defiUrl = `/api/portfolio/defi?${new URLSearchParams({
          walletAddress: walletAddress,
        })}`;

        logger.debug('Fetching from URLs', {
          assetsUrl,
          defiUrl,
          walletAddress,
        });

        // Fetch data with staggered requests to avoid rate limiting
        const assetsResponse = await enhancedFetch(assetsUrl, {
          retries: 3,
          retryDelay: 2000,
        });

        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

        const defiResponse = await enhancedFetch(defiUrl, {
          retries: 3,
          retryDelay: 2000,
        });

        // Fetch NFTs in parallel since it uses a different service
        let nftsData = [];
        try {
          nftsData = await NFTService.getAllWalletNFTs(walletAddress);
        } catch (nftError) {
          logger.error('Failed to fetch NFTs:', nftError);
          // Continue without NFTs if rate limited
        }

        logger.debug('API responses received', {
          assetsStatus: assetsResponse.status,
          nftsCount: nftsData?.length || 0,
          defiStatus: defiResponse.status,
        });

        // Parse API responses with error handling
        let assetsData, defiData;
        const errors = [];

        // Handle assets response
        try {
          if (!assetsResponse.ok) {
            if (isRateLimited(assetsResponse)) {
              const retryDelay = getRetryDelay(assetsResponse);
              errors.push(`Assets rate limited - retry in ${retryDelay}s`);
            } else {
              const errorText = await assetsResponse.text();
              errors.push(`Assets: ${assetsResponse.status} - ${errorText}`);
            }
          } else {
            assetsData = await assetsResponse.json();
          }
        } catch (error) {
          errors.push(`Assets parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Handle defi response
        try {
          if (!defiResponse.ok) {
            if (isRateLimited(defiResponse)) {
              const retryDelay = getRetryDelay(defiResponse);
              errors.push(`DeFi rate limited - retry in ${retryDelay}s`);
            } else {
              const errorText = await defiResponse.text();
              errors.push(`DeFi: ${defiResponse.status} - ${errorText}`);
            }
          } else {
            defiData = await defiResponse.json();
          }
        } catch (error) {
          errors.push(`DeFi parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // If there were errors, throw them
        if (errors.length > 0) {
          throw new Error(`Failed to fetch portfolio data: ${errors.join(', ')}`);
        }

        logger.debug('Parsed data', {
          assetsData: assetsData,
          nftsData: nftsData,
          defiData: defiData,
        });

        // Update state with fetched data - handle both old and new response formats
        const finalAssets = assetsData.data?.assets || assetsData.assets || [];
        const finalNfts = nftsData || [];
        const finalDefi = defiData.data?.positions || defiData.positions || [];

        logger.debug('Final processed data', {
          assetsCount: finalAssets.length,
          nftsCount: finalNfts.length,
          defiCount: finalDefi.length,
          firstAsset: finalAssets[0],
          firstNft: finalNfts[0],
          assetsData: assetsData,
          defiData: defiData,
        });

        setAssets(finalAssets);
        setNfts(finalNfts); // NFTs come directly from service
        setDefiPositions(finalDefi);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        logger.error('Failed to fetch portfolio data', {
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

  const refetch = async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      // Import NFT service
      const { NFTService } = await import(
        '@/lib/services/portfolio/services/nft-service'
      );

      // Same fetch logic but with staggered requests for refetch
      const assetsUrl = `/api/portfolio/assets?${new URLSearchParams({
        walletAddress: walletAddress,
        showOnlyVerified: showOnlyVerified.toString(),
      })}`;
      const defiUrl = `/api/portfolio/defi?${new URLSearchParams({
        walletAddress: walletAddress,
      })}`;

      const assetsResponse = await enhancedFetch(assetsUrl, {
        retries: 3,
        retryDelay: 2000,
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const defiResponse = await enhancedFetch(defiUrl, {
        retries: 3,
        retryDelay: 2000,
      });

      let nftsData = [];
      try {
        nftsData = await NFTService.getAllWalletNFTs(walletAddress);
      } catch (nftError) {
        logger.error('Failed to fetch NFTs:', nftError);
        // Continue without NFTs if rate limited
      }

      if (!assetsResponse.ok || !defiResponse.ok) {
        const errors = [];

        if (!assetsResponse.ok) {
          if (isRateLimited(assetsResponse)) {
            const retryDelay = getRetryDelay(assetsResponse);
            errors.push(`Assets rate limited - retry in ${retryDelay}s`);
          } else {
            errors.push(`Assets: ${assetsResponse.status}`);
          }
        }

        if (!defiResponse.ok) {
          if (isRateLimited(defiResponse)) {
            const retryDelay = getRetryDelay(defiResponse);
            errors.push(`DeFi rate limited - retry in ${retryDelay}s`);
          } else {
            errors.push(`DeFi: ${defiResponse.status}`);
          }
        }

        throw new Error(`Failed to fetch portfolio data: ${errors.join(', ')}`);
      }

      const [assetsData, defiData] = await Promise.all([
        assetsResponse.json(),
        defiResponse.json(),
      ]);

      setAssets(assetsData.data?.assets || assetsData.assets || []);
      setNfts(nftsData || []); // NFTs come directly from service

      // Handle new DeFi API response format
      const positions = defiData.data?.positions || defiData.positions || [];
      setDefiPositions(positions);
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

  return {
    assets,
    nfts,
    defiPositions,
    isLoading,
    error,
    refetch,
  };
}
