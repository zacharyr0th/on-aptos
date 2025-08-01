import { useState, useEffect } from "react";

import {
  enhancedFetch,
  isRateLimited,
  getRetryDelay,
} from "@/lib/utils/fetch-utils";
import { logger } from "@/lib/utils/logger";

import { NFT } from "../types";

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
  nftsLoading: boolean;
  defiLoading: boolean;
  hasMoreNFTs: boolean;
  isLoadingMore: boolean;
  loadMoreNFTs: () => Promise<void>;
  error: string | null;
  refetch: () => void;
  totalNFTCount: number | null;
  allNFTs: NFT[] | null;
  nftCollectionStats: {
    collections: Array<{ name: string; count: number }>;
    totalCollections: number;
  } | null;
}

export function usePortfolioData(
  walletAddress: string | undefined,
  showOnlyVerified: boolean = true,
): UsePortfolioDataResult {
  const [assets, setAssets] = useState<FungibleAsset[] | null>(null);
  const [nfts, setNfts] = useState<NFT[] | null>(null);
  const [defiPositions, setDefiPositions] = useState<DeFiPosition[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [nftsLoading, setNftsLoading] = useState(false);
  const [defiLoading, setDefiLoading] = useState(false);
  const [hasMoreNFTs, setHasMoreNFTs] = useState(false);
  const [nftPage, setNftPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalNFTCount, setTotalNFTCount] = useState<number | null>(null);
  const [allNFTs, setAllNFTs] = useState<NFT[] | null>(null);
  const [nftCollectionStats, setNftCollectionStats] = useState<{
    collections: Array<{ name: string; count: number }>;
    totalCollections: number;
  } | null>(null);
  const [useBatchApi, setUseBatchApi] = useState(true); // Feature flag for batch API

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) {
        logger.debug("No wallet address provided");
        setAssets(null);
        setNfts(null);
        setDefiPositions(null);
        setHasMoreNFTs(false);
        setNftPage(1);
        setTotalNFTCount(null);
        setAllNFTs(null);
        return;
      }

      logger.info("Fetching data for wallet", { walletAddress });
      setIsLoading(true);
      setError(null);

      try {
        logger.debug("Starting portfolio fetch", {
          walletAddress,
          useBatchApi,
        });

        if (useBatchApi) {
          // Use new batch API endpoint
          const batchUrl = `/api/portfolio/batch?${new URLSearchParams({
            walletAddress: walletAddress,
            nftLimit: "50",
            includeAllNFTs: "false",
          })}`;

          const response = await enhancedFetch(batchUrl, {
            retries: 3,
            retryDelay: 2000,
          });

          if (!response.ok) {
            if (isRateLimited(response)) {
              const retryDelay = getRetryDelay(response);
              throw new Error(
                `Batch API rate limited - retry in ${retryDelay}s`,
              );
            } else {
              throw new Error(
                `Failed to load portfolio data: ${response.status}`,
              );
            }
          }

          // Clone the response before reading to avoid "body already read" errors
          const batchData = await response.clone().json();
          const data = batchData.data;

          // Set all data at once
          setAssets(data.assets || []);
          setDefiPositions(data.defiPositions || []);
          setNfts(data.nfts || []);
          setTotalNFTCount(data.nftTotalCount || 0);
          setHasMoreNFTs(data.hasMoreNFTs || false);
          setNftCollectionStats(data.nftCollectionStats || null);

          // For metrics, use loaded NFTs if total count is <= 50
          if (data.nftTotalCount && data.nftTotalCount <= 50) {
            setAllNFTs(data.nfts || []);
          } else {
            // Only load all NFTs if really needed for metrics
            setAllNFTs(data.nfts || []); // Use initial batch for now
          }

          logger.debug("Batch data loaded:", {
            assets: data.assets?.length || 0,
            defi: data.defiPositions?.length || 0,
            nfts: data.nfts?.length || 0,
            totalNFTs: data.nftTotalCount,
          });
        } else {
          // Fallback to original implementation if batch API fails
          // ... (keeping original code as fallback)
          logger.warn("Using fallback individual API calls");

          // Import NFT service
          const { NFTService } = await import(
            "@/lib/services/portfolio/services/nft-service"
          );

          // Build full URLs for API calls
          const assetsUrl = `/api/portfolio/assets?${new URLSearchParams({
            walletAddress: walletAddress,
            showOnlyVerified: showOnlyVerified.toString(),
          })}`;
          const defiUrl = `/api/portfolio/defi?${new URLSearchParams({
            walletAddress: walletAddress,
          })}`;

          // Fetch assets first (highest priority for immediate UI display)
          const assetsResponse = await enhancedFetch(assetsUrl, {
            retries: 3,
            retryDelay: 2000,
          });

          // Parse and set assets immediately
          let assetsData = null;
          if (assetsResponse.ok) {
            try {
              assetsData = await assetsResponse.json();
              const finalAssets =
                assetsData?.data?.assets || assetsData?.assets || [];
              setAssets(finalAssets);
              logger.debug("Assets loaded immediately:", {
                count: finalAssets.length,
              });
            } catch (error) {
              logger.error("Assets parsing error:", error);
            }
          }

          // Set loading to false after assets are displayed
          setIsLoading(false);

          // Load DeFi positions
          setDefiLoading(true);
          try {
            await new Promise((resolve) => setTimeout(resolve, 200));
            const defiResponse = await enhancedFetch(defiUrl, {
              retries: 3,
              retryDelay: 2000,
            });

            if (defiResponse.ok) {
              const defiData = await defiResponse.json();
              const finalDefi =
                defiData?.data?.positions || defiData?.positions || [];
              setDefiPositions(finalDefi);
              logger.debug("DeFi positions loaded:", {
                count: finalDefi.length,
              });
            }
          } catch (error) {
            logger.error("DeFi fetch failed:", error);
          } finally {
            setDefiLoading(false);
          }

          // Load NFTs
          setNftsLoading(true);
          try {
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Get total NFT count first
            const totalCount = await NFTService.getTotalNFTCount(walletAddress);
            setTotalNFTCount(totalCount);

            // Load first batch of 50 NFTs
            const initialNFTs = await NFTService.getWalletNFTs(
              walletAddress,
              1,
              50,
            );
            setNfts(initialNFTs.data);
            setHasMoreNFTs(initialNFTs.hasMore);
            setNftPage(1);

            // Only use initial batch for metrics to avoid redundant loading
            setAllNFTs(initialNFTs.data);

            logger.debug("NFTs loaded:", {
              count: initialNFTs.data.length,
              hasMore: initialNFTs.hasMore,
              totalCount,
            });
          } catch (nftError: any) {
            logger.error("Failed to fetch NFTs:", nftError);
          } finally {
            setNftsLoading(false);
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        logger.error("Failed to fetch portfolio data", err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [walletAddress, showOnlyVerified]);

  const loadMoreNFTs = async () => {
    if (!walletAddress || isLoadingMore || !hasMoreNFTs) return;

    setIsLoadingMore(true);
    try {
      const { NFTService } = await import(
        "@/lib/services/portfolio/services/nft-service"
      );

      const nextPage = nftPage + 1;
      const moreNFTs = await NFTService.getWalletNFTs(
        walletAddress,
        nextPage,
        50,
      );

      setNfts((prevNfts) => [...(prevNfts || []), ...moreNFTs.data]);
      setHasMoreNFTs(moreNFTs.hasMore);
      setNftPage(nextPage);

      logger.debug("More NFTs loaded:", {
        page: nextPage,
        count: moreNFTs.data.length,
        hasMore: moreNFTs.hasMore,
        total: (nfts?.length || 0) + moreNFTs.data.length,
      });
    } catch (error) {
      logger.error("Failed to load more NFTs:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const refetch = async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    setNftsLoading(true);
    setDefiLoading(true);
    setError(null);
    setNftPage(1); // Reset pagination

    try {
      if (useBatchApi) {
        // Use batch API for refetch
        const batchUrl = `/api/portfolio/batch?${new URLSearchParams({
          walletAddress: walletAddress,
          nftLimit: "50",
          includeAllNFTs: "false",
        })}`;

        const response = await enhancedFetch(batchUrl, {
          retries: 3,
          retryDelay: 2000,
        });

        if (!response.ok) {
          if (isRateLimited(response)) {
            const retryDelay = getRetryDelay(response);
            throw new Error(`Batch API rate limited - retry in ${retryDelay}s`);
          } else {
            throw new Error(
              `Failed to refetch portfolio data: ${response.status}`,
            );
          }
        }

        // Clone the response before reading to avoid "body already read" errors
        const batchData = await response.clone().json();
        const data = batchData.data;

        // Update all data
        setAssets(data.assets || []);
        setDefiPositions(data.defiPositions || []);
        setNfts(data.nfts || []);
        setTotalNFTCount(data.nftTotalCount || 0);
        setHasMoreNFTs(data.hasMoreNFTs || false);

        // For metrics, use loaded NFTs
        setAllNFTs(data.nfts || []);

        logger.debug("Batch data refetched:", {
          assets: data.assets?.length || 0,
          defi: data.defiPositions?.length || 0,
          nfts: data.nfts?.length || 0,
          totalNFTs: data.nftTotalCount,
        });
      } else {
        // Fallback to original refetch logic
        const { NFTService } = await import(
          "@/lib/services/portfolio/services/nft-service"
        );

        const assetsUrl = `/api/portfolio/assets?${new URLSearchParams({
          walletAddress: walletAddress,
          showOnlyVerified: showOnlyVerified.toString(),
        })}`;
        const defiUrl = `/api/portfolio/defi?${new URLSearchParams({
          walletAddress: walletAddress,
        })}`;

        const [assetsResponse, defiResponse] = await Promise.all([
          enhancedFetch(assetsUrl, { retries: 3, retryDelay: 2000 }),
          enhancedFetch(defiUrl, { retries: 3, retryDelay: 2000 }),
        ]);

        if (!assetsResponse.ok || !defiResponse.ok) {
          const errors = [];
          if (!assetsResponse.ok)
            errors.push(`Assets: ${assetsResponse.status}`);
          if (!defiResponse.ok) errors.push(`DeFi: ${defiResponse.status}`);
          throw new Error(`Failed to refetch: ${errors.join(", ")}`);
        }

        const [assetsData, defiData] = await Promise.all([
          assetsResponse.json(),
          defiResponse.json(),
        ]);

        setAssets(assetsData?.data?.assets || []);
        setDefiPositions(defiData?.data?.positions || []);

        // Load NFTs separately
        try {
          const nftResult = await NFTService.getWalletNFTs(
            walletAddress,
            1,
            50,
          );
          setNfts(nftResult.data);
          setHasMoreNFTs(nftResult.hasMore);
          setAllNFTs(nftResult.data);

          const totalCount = await NFTService.getTotalNFTCount(walletAddress);
          setTotalNFTCount(totalCount);
        } catch (nftError) {
          logger.error("Failed to refetch NFTs:", nftError);
          setNfts([]);
          setAllNFTs([]);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.error("Failed to refetch portfolio data:", {
        error: errorMessage,
        walletAddress,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setNftsLoading(false);
      setDefiLoading(false);
    }
  };

  return {
    assets,
    nfts,
    defiPositions,
    isLoading,
    nftsLoading,
    defiLoading,
    hasMoreNFTs,
    isLoadingMore,
    loadMoreNFTs,
    error,
    refetch,
    totalNFTCount,
    allNFTs,
    nftCollectionStats,
  };
}
