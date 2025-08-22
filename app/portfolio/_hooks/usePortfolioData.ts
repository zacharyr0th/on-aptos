import { useState, useEffect, useCallback } from "react";

import type {
  NFT,
  FungibleAsset,
  DeFiPosition,
  Transaction,
} from "@/lib/types/consolidated";
import {
  enhancedFetch,
  isRateLimited,
  getRetryDelay,
} from "@/lib/utils/api/fetch-utils";

// Transaction type imported from consolidated types

interface UsePortfolioDataResult {
  assets: FungibleAsset[] | null;
  nfts: NFT[] | null;
  defiPositions: DeFiPosition[] | null;
  transactions: Transaction[] | null;
  isLoading: boolean;
  nftsLoading: boolean;
  defiLoading: boolean;
  transactionsLoading: boolean;
  hasMoreNFTs: boolean;
  hasMoreTransactions: boolean;
  isLoadingMore: boolean;
  loadMoreNFTs: () => Promise<void>;
  error: string | null;
  refetch: () => void;
  totalNFTCount: number | null;
  totalTransactionCount: number | null;
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
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nftsLoading, setNftsLoading] = useState(false);
  const [defiLoading, setDefiLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [hasMoreNFTs, setHasMoreNFTs] = useState(false);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(false);
  const [nftPage, setNftPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalNFTCount, setTotalNFTCount] = useState<number | null>(null);
  const [totalTransactionCount, setTotalTransactionCount] = useState<
    number | null
  >(null);
  const [allNFTs, setAllNFTs] = useState<NFT[] | null>(null);
  const [nftCollectionStats, setNftCollectionStats] = useState<{
    collections: Array<{ name: string; count: number }>;
    totalCollections: number;
  } | null>(null);
  // Always use batch API (individual endpoints removed)

  // DISABLED: Background transaction loading completely removed
  // const loadRemainingTransactions = async (_startOffset: number) => {
  //   // Do nothing - background loading disabled to prevent overload
  //   logger.debug(`Background transaction loading disabled for performance`);
  //   return;
  // };

  // DISABLED: Only load first small batch of transactions to prevent overloading
  const loadTransactions = useCallback(async () => {
    if (!walletAddress || transactionsLoading) return;

    setTransactionsLoading(true);
    try {
      logger.debug(`Loading minimal transactions for wallet: ${walletAddress}`);

      // Load first 500 transactions for comprehensive initial view
      const response = await enhancedFetch(
        `/api/portfolio/transactions?address=${walletAddress}&limit=500&offset=0`,
        {
          retries: 2,
          retryDelay: 1000,
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const result = await response.json();
      const transactions = result.data || [];

      // Set ONLY the first batch - no background loading
      setTransactions(transactions);
      logger.info(
        `Loaded ${transactions.length} transactions (500 max initial load) for wallet ${walletAddress}`,
      );
    } catch (error) {
      logger.error(
        `Failed to load transactions: ${error instanceof Error ? error.message : String(error)}`,
      );
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, [walletAddress, transactionsLoading]);

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) {
        logger.debug("No wallet address provided");
        setAssets(null);
        setNfts(null);
        setDefiPositions(null);
        setTransactions(null);
        setHasMoreNFTs(false);
        setNftPage(1);
        setTotalNFTCount(null);
        setAllNFTs(null);
        return;
      }

      logger.info({
        walletAddress,
      });
      setIsLoading(true);
      setTransactionsLoading(true); // Start loading transactions immediately
      setError(null);

      try {
        logger.debug({
          walletAddress,
        });

        // Use batch API endpoint (only option)
        const batchUrl = `/api/portfolio/batch?${new URLSearchParams({
          walletAddress: walletAddress,
          nftLimit: "5000",
          includeAllNFTs: "true",
        })}`;

        const response = await enhancedFetch((batchUrl, {
          retries: 3,
          retryDelay: 2000,
        });

        if (!response.ok) {
          if (isRateLimited(response)) {
            const retryDelay = getRetryDelay(response);
            throw new Error(`Batch API rate limited - retry in ${retryDelay}s`);
          } else {
            throw new Error(
              `Failed to load portfolio data: ${response.status}`,
            );
          }
        }

        // Parse the response data
        const batchData = await response.json();
        const data = batchData.data;

        // Set all data at once
        setAssets(data.assets || []);
        setDefiPositions(data.defiPositions || []);
        setNfts(data.nfts || []);
        setTotalNFTCount(data.nftTotalCount || 0);
        setHasMoreNFTs(data.hasMoreNFTs || false);
        setNftCollectionStats(data.nftCollectionStats || null);

        // Set transactions from batch API - NO background loading
        if (data.transactions) {
          setTransactions(data.transactions);
          setHasMoreTransactions(data.hasMoreTransactions || false);
          setTotalTransactionCount(data.transactionTotalCount || 0);
          setTransactionsLoading(false);
          logger.info(
            `Loaded ${data.transactions.length} of ${data.transactionTotalCount || "unknown"} transactions from batch API for wallet ${walletAddress}`,
          );
        } else {
          logger.warn(
            `No transactions in batch API response for wallet ${walletAddress}`,
          );
          // Fallback to loading transactions separately
          loadTransactions();
        }

        // Set all NFTs for the treemap visualization (up to 5000)
        setAllNFTs(data.nfts || []);

        logger.info({
          message: "Portfolio data loaded",
          assets: data.assets?.length || 0,
          defi: data.defiPositions?.length || 0,
          nftsLoaded: data.nfts?.length || 0,
          nftTotalCount: data.nftTotalCount || 0,
          totalNFTs: data.nftTotalCount,
          transactions: data.transactions?.length || 0,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        logger.error(
          `Failed to fetch portfolio data: ${err instanceof Error ? err.message : String(err)}`,
        );
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [walletAddress, showOnlyVerified, loadTransactions]);

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

      logger.debug({
        page: nextPage,
        count: moreNFTs.data.length,
        hasMore: moreNFTs.hasMore,
        total: (nfts?.length || 0) + moreNFTs.data.length,
      });
    } catch (error) {
      logger.error(
        `Failed to load more NFTs: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  const refetch = async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    setNftsLoading(true);
    setDefiLoading(true);
    setTransactionsLoading(true);
    setError(null);
    setNftPage(1); // Reset pagination

    try {
      // Use batch API for refetch (only option)
      const batchUrl = `/api/portfolio/batch?${new URLSearchParams({
        walletAddress: walletAddress,
        nftLimit: "50",
        includeAllNFTs: "false",
      })}`;

      const response = await enhancedFetch((batchUrl, {
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

      // Parse the response data
      const batchData = await response.json();
      const data = batchData.data;

      // Update all data
      setAssets(data.assets || []);
      setDefiPositions(data.defiPositions || []);
      setNfts(data.nfts || []);
      setTotalNFTCount(data.nftTotalCount || 0);
      setHasMoreNFTs(data.hasMoreNFTs || false);

      // For metrics, use loaded NFTs
      setAllNFTs(data.nfts || []);

      // Set transactions from batch API or reload separately - NO background loading
      if (data.transactions) {
        setTransactions(data.transactions);
        setHasMoreTransactions(data.hasMoreTransactions || false);
        setTotalTransactionCount(data.transactionTotalCount || 0);
        logger.info(
          `Reloaded ${data.transactions.length} of ${data.transactionTotalCount || "unknown"} transactions from batch API for wallet ${walletAddress}`,
        );
      } else {
        // Fallback to loading transactions separately
        loadTransactions();
      }

      logger.debug({
        assets: data.assets?.length || 0,
        defi: data.defiPositions?.length || 0,
        nfts: data.nfts?.length || 0,
        totalNFTs: data.nftTotalCount,
        transactions: data.transactions?.length || 0,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.error({
        error: errorMessage,
        walletAddress,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setNftsLoading(false);
      setDefiLoading(false);
      // Note: transactionsLoading is set to false in the loadTransactions function
    }
  };

  return {
    assets,
    nfts,
    defiPositions,
    transactions,
    isLoading,
    nftsLoading,
    defiLoading,
    transactionsLoading,
    hasMoreNFTs,
    hasMoreTransactions,
    isLoadingMore,
    loadMoreNFTs,
    error,
    refetch,
    totalNFTCount,
    totalTransactionCount,
    allNFTs,
    nftCollectionStats,
  };
}
