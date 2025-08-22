import { useState, useEffect, useCallback, useRef } from "react";

import {
  transactionManager,
  Transaction,
} from "@/lib/services/portfolio/transaction-manager";

interface UseVirtualizedTransactionsProps {
  walletAddress: string | undefined;
  windowSize?: number;
  bufferSize?: number;
  enabled?: boolean;
}

interface UseVirtualizedTransactionsReturn {
  // Core data
  transactions: Transaction[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;

  // Virtualization
  loadedWindows: Set<number>;
  getTransactionAtIndex: (index: number) => Transaction | null;
  loadWindowForIndex: (index: number) => Promise<void>;

  // Interaction
  getTransactionDetails: (version: string) => Promise<Transaction | null>;
  refresh: () => Promise<void>;

  // Utilities
  searchTransactions: (query: string) => Transaction[];
  getCacheStats: () => Record<string, unknown>;

  // Observer helpers
  observeElement: (element: HTMLElement, index: number) => void;
  unobserveElement: (element: HTMLElement) => void;
}

/**
 * Advanced virtualized transaction loading hook
 *
 * Features:
 * - Window-based lazy loading (only loads visible + buffer zones)
 * - Request deduplication and intelligent prefetching
 * - On-demand transaction detail loading
 * - Efficient search across loaded transactions
 * - Intersection observer support for infinite scroll
 */
export function useVirtualizedTransactions({
  walletAddress,
  windowSize = 50,
  bufferSize = 2,
  enabled = true,
}: UseVirtualizedTransactionsProps): UseVirtualizedTransactionsReturn {
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedWindows, setLoadedWindows] = useState<Set<number>>(new Set());
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadingWindows = useRef<Set<number>>(new Set());
  const intersectionObserver = useRef<IntersectionObserver | null>(null);

  /**
   * Calculate which window an index belongs to
   */
  const getWindowIndex = useCallback(
    (index: number): number => {
      return Math.floor(index / windowSize);
    },
    [windowSize],
  );

  /**
   * Load a specific window of transactions
   */
  const loadWindow = useCallback(
    async (windowIndex: number, force = false): Promise<void> => {
      if (!walletAddress || !enabled) return;

      // Prevent duplicate loading
      if (loadingWindows.current.has(windowIndex) && !force) {
        return;
      }

      // Check if already loaded
      if (loadedWindows.has(windowIndex) && !force) {
        return;
      }

      loadingWindows.current.add(windowIndex);
      setIsLoading(true);

      try {
        logger.debug(
          `Loading transaction window ${windowIndex} for ${walletAddress}`,
        );

        const result = await transactionManager.getTransactionWindow(
          walletAddress,
          windowIndex,
          force,
        );

        // Update total count from first successful response
        if (result.totalCount > 0) {
          setTotalCount(result.totalCount);
        }

        // Update loaded windows
        setLoadedWindows((prev) => new Set([...prev, windowIndex]));

        // Update transactions array
        setTransactions((prevTransactions) => {
          const updatedTransactions = [...prevTransactions];
          const startIndex = windowIndex * windowSize;

          // Insert/update transactions at correct positions
          result.transactions.forEach((tx, i) => {
            updatedTransactions[startIndex + i] = tx;
          });

          return updatedTransactions;
        });

        setError(null);
        logger.debug(
          `Successfully loaded window ${windowIndex} with ${result.transactions.length} transactions`,
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load transactions";
        logger.error(`Failed to load window ${windowIndex}:`, err);
        setError(errorMessage);
      } finally {
        loadingWindows.current.delete(windowIndex);
        setIsLoading(false);
      }
    },
    [walletAddress, enabled, windowSize, loadedWindows],
  );

  /**
   * Load window for a specific transaction index
   */
  const loadWindowForIndex = useCallback(
    async (index: number): Promise<void> => {
      const windowIndex = getWindowIndex(index);
      await loadWindow(windowIndex);
    },
    [getWindowIndex, loadWindow],
  );

  /**
   * Get transaction at specific index (may be undefined if not loaded)
   */
  const getTransactionAtIndex = useCallback(
    (index: number): Transaction | null => {
      return transactions[index] || null;
    },
    [transactions],
  );

  /**
   * Load transaction details on demand
   */
  const getTransactionDetails = useCallback(
    async (version: string): Promise<Transaction | null> => {
      if (!walletAddress) return null;

      try {
        return await transactionManager.getTransactionDetails(
          walletAddress,
          version,
        );
      } catch (error) {
        logger.error(
          `Failed to load details for transaction ${version}:`,
          error,
        );
        return null;
      }
    },
    [walletAddress],
  );

  /**
   * Search through loaded transactions
   */
  const searchTransactions = useCallback(
    (query: string): Transaction[] => {
      if (!query.trim() || !walletAddress) return [];

      const loadedTransactions =
        transactionManager.getLoadedTransactions(walletAddress);
      const searchTerm = query.toLowerCase();

      return loadedTransactions.filter((tx) => {
        return (
          tx.transaction_version.includes(searchTerm) ||
          (tx.type || "").toLowerCase().includes(searchTerm) ||
          (tx.function || "").toLowerCase().includes(searchTerm) ||
          (tx.sender || "").toLowerCase().includes(searchTerm) ||
          (tx.asset_type || "").toLowerCase().includes(searchTerm) ||
          ((tx as string).asset_symbol || "").toLowerCase().includes(searchTerm)
        );
      });
    },
    [walletAddress],
  );

  /**
   * Refresh all data
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (!walletAddress) return;

    // Clear cache and state
    transactionManager.clearWalletCache(walletAddress);
    setLoadedWindows(new Set());
    setTransactions([]);
    setTotalCount(0);
    setError(null);

    // Reload first window
    await loadWindow(0, true);
  }, [walletAddress, loadWindow]);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return transactionManager.getCacheStats();
  }, []);

  /**
   * Set up intersection observer for infinite scroll
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    intersectionObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(
              entry.target.getAttribute("data-index") || "0",
            );
            const windowIndex = getWindowIndex(index);

            // Load current window and buffer windows
            for (let i = windowIndex; i <= windowIndex + bufferSize; i++) {
              loadWindow(i);
            }
          }
        });
      },
      {
        rootMargin: "200px", // Start loading 200px before element is visible
        threshold: 0.1,
      },
    );

    return () => {
      if (intersectionObserver.current) {
        intersectionObserver.current.disconnect();
      }
    };
  }, [getWindowIndex, loadWindow, bufferSize]);

  /**
   * Initial load when wallet address changes
   */
  useEffect(() => {
    if (walletAddress && enabled) {
      // Reset state
      setLoadedWindows(new Set());
      setTransactions([]);
      setTotalCount(0);
      setError(null);

      // Load first window immediately
      loadWindow(0);
    }
  }, [walletAddress, enabled, loadWindow]);

  /**
   * Observer registration helper
   */
  const observeElement = useCallback((element: HTMLElement, index: number) => {
    if (intersectionObserver.current && element) {
      element.setAttribute("data-index", index.toString());
      intersectionObserver.current.observe(element);
    }
  }, []);

  /**
   * Observer unregistration helper
   */
  const unobserveElement = useCallback((element: HTMLElement) => {
    if (intersectionObserver.current && element) {
      intersectionObserver.current.unobserve(element);
    }
  }, []);

  return {
    // Core data
    transactions,
    totalCount,
    isLoading,
    error,

    // Virtualization
    loadedWindows,
    getTransactionAtIndex,
    loadWindowForIndex,

    // Interaction
    getTransactionDetails,
    refresh,

    // Utilities
    searchTransactions,
    getCacheStats,

    // Observer helpers (for component use)
    observeElement,
    unobserveElement,
  };
}
