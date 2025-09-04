import { useState, useEffect, useCallback } from "react";

import type { Transaction } from "@/lib/types/consolidated";
import { enhancedFetch } from "@/lib/utils/api/fetch-utils";
import { logger } from "@/lib/utils/core/logger";

interface UseTransactionsOptions {
  initialLimit?: number;
  batchSize?: number;
  loadInBackground?: boolean;
}

interface UseTransactionsResult {
  transactions: Transaction[] | null;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for loading wallet transactions with progressive loading
 * Extracted from usePortfolioData to reduce complexity and enable reuse
 */
export function useTransactions(
  walletAddress: string | undefined,
  options: UseTransactionsOptions = {},
): UseTransactionsResult {
  const {
    initialLimit = 100,
    batchSize = 100,
    loadInBackground = true,
  } = options;

  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const loadTransactionBatch = useCallback(
    async (
      startOffset: number,
      limit: number,
    ): Promise<{
      data: Transaction[];
      hasMore: boolean;
    }> => {
      const response = await enhancedFetch(
        `/api/portfolio/transactions?address=${walletAddress}&limit=${limit}&offset=${startOffset}`,
        {
          retries: 3,
          retryDelay: 2000,
          timeout: 30000,
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch transactions: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();
      return {
        data: result.data || [],
        hasMore: result.hasMore || result.data?.length === limit,
      };
    },
    [walletAddress],
  );

  const loadInitialTransactions = useCallback(async () => {
    if (!walletAddress) {
      setTransactions(null);
      setHasMore(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.debug("Loading initial transactions for wallet:", walletAddress);

      // Load first batch immediately
      const firstBatch = await loadTransactionBatch(0, initialLimit);
      setTransactions(firstBatch.data);
      setOffset(initialLimit);
      setHasMore(firstBatch.hasMore);

      logger.info(
        `Loaded ${firstBatch.data.length} initial transactions for wallet ${walletAddress}`,
      );

      // Load remaining transactions in background if enabled and there are more
      if (loadInBackground && firstBatch.hasMore) {
        loadRemainingTransactions(initialLimit, firstBatch.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.error(`Failed to load transactions: ${errorMessage}`);
      setError(errorMessage);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, initialLimit, loadInBackground, loadTransactionBatch]);

  const loadRemainingTransactions = useCallback(
    async (startOffset: number, existingTransactions: Transaction[]) => {
      const allTransactions = [...existingTransactions];
      let currentOffset = startOffset;
      let hasMoreData = true;

      // Small delay to not interfere with UI
      await new Promise((resolve) => setTimeout(resolve, 500));

      while (hasMoreData) {
        try {
          const batch = await loadTransactionBatch(currentOffset, batchSize);

          if (batch.data.length === 0) {
            hasMoreData = false;
            break;
          }

          // Filter out duplicates
          const existingVersions = new Set(
            allTransactions.map((tx) => tx.transaction_version),
          );
          const uniqueTransactions = batch.data.filter(
            (tx) => !existingVersions.has(tx.transaction_version),
          );

          if (uniqueTransactions.length > 0) {
            allTransactions.push(...uniqueTransactions);
            setTransactions([...allTransactions]);
          }

          currentOffset += batchSize;
          hasMoreData = batch.hasMore;

          logger.debug(
            `Background loaded ${uniqueTransactions.length} transactions (total: ${allTransactions.length})`,
          );

          // Small delay between batches
          if (hasMoreData) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        } catch (err) {
          logger.warn(
            `Background transaction loading stopped at offset ${currentOffset}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          break;
        }
      }

      setHasMore(false);
      logger.info(
        `Completed loading all ${allTransactions.length} transactions`,
      );
    },
    [batchSize, loadTransactionBatch],
  );

  const loadMore = useCallback(async () => {
    if (!walletAddress || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const batch = await loadTransactionBatch(offset, batchSize);

      const existingVersions = new Set(
        (transactions || []).map((tx) => tx.transaction_version),
      );
      const uniqueTransactions = batch.data.filter(
        (tx) => !existingVersions.has(tx.transaction_version),
      );

      setTransactions((prev) => [...(prev || []), ...uniqueTransactions]);
      setOffset((prev) => prev + batchSize);
      setHasMore(batch.hasMore);
    } catch (err) {
      logger.error(
        `Failed to load more transactions: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    walletAddress,
    isLoading,
    hasMore,
    offset,
    batchSize,
    transactions,
    loadTransactionBatch,
  ]);

  const refetch = useCallback(async () => {
    setOffset(0);
    await loadInitialTransactions();
  }, [loadInitialTransactions]);

  useEffect(() => {
    loadInitialTransactions();
  }, [walletAddress]);

  return {
    transactions,
    isLoading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
