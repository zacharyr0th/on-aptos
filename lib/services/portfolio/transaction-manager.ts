import { SimpleCache } from "@/lib/utils/simple-cache";

export interface Transaction {
  transaction_version: string;
  transaction_timestamp: string;
  type: string;
  amount: string;
  asset_type: string;
  success: boolean;
  function?: string;
  gas_fee?: string;
  gas_unit_price?: string;
  max_gas_amount?: string;
  sender?: string;
  block_height?: string;
  epoch?: string;
  lazy?: boolean;
}

export interface TransactionPage {
  transactions: Transaction[];
  totalCount: number;
  hasMore: boolean;
  nextOffset: number;
  cached: boolean;
}

export interface TransactionWindow {
  startOffset: number;
  endOffset: number;
  status: "loading" | "loaded" | "error";
  data: Transaction[];
  timestamp: number;
}

/**
 * Advanced Transaction Manager with:
 * - Request deduplication and coalescing
 * - Intelligent windowed caching
 * - Background prefetching
 * - Virtualized loading support
 */
export class TransactionManager {
  private static instance: TransactionManager;
  private cache = new SimpleCache<Transaction[]>(300000); // 5 min cache
  private detailsCache = new SimpleCache<Transaction>(300000); // 5 min cache
  private windows = new Map<string, Map<number, TransactionWindow>>();
  private pendingRequests = new Map<string, Promise<TransactionPage>>();
  private totalCounts = new Map<string, number>();

  // Configuration
  private readonly WINDOW_SIZE = 50; // Transactions per window
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly DETAILS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly PREFETCH_DISTANCE = 2; // Windows to prefetch ahead
  private readonly MAX_CONCURRENT_REQUESTS = 3;

  private constructor() {}

  static getInstance(): TransactionManager {
    if (!TransactionManager.instance) {
      TransactionManager.instance = new TransactionManager();
    }
    return TransactionManager.instance;
  }

  /**
   * Get transaction window with deduplication and caching
   */
  async getTransactionWindow(
    walletAddress: string,
    windowIndex: number,
    forceRefresh = false,
  ): Promise<TransactionPage> {
    const windowKey = `${walletAddress}:${windowIndex}`;

    // Check if request is already pending
    if (this.pendingRequests.has(windowKey)) {
      logger.debug(
        `Request deduplication: reusing pending request for ${windowKey}`,
      );
      return this.pendingRequests.get(windowKey)!;
    }

    // Check cache first
    if (!forceRefresh) {
      const cached = this.getCachedWindow(walletAddress, windowIndex);
      if (cached) {
        logger.debug(`Cache hit for window ${windowIndex} of ${walletAddress}`);
        this.triggerPrefetch(walletAddress, windowIndex);
        return {
          transactions: cached.data,
          totalCount: this.totalCounts.get(walletAddress) || 0,
          hasMore: this.hasMoreWindows(walletAddress, windowIndex),
          nextOffset: (windowIndex + 1) * this.WINDOW_SIZE,
          cached: true,
        };
      }
    }

    // Create and cache the request promise
    const requestPromise = this.fetchWindow(walletAddress, windowIndex);
    this.pendingRequests.set(windowKey, requestPromise);

    try {
      const result = await requestPromise;
      this.triggerPrefetch(walletAddress, windowIndex);
      return result;
    } finally {
      this.pendingRequests.delete(windowKey);
    }
  }

  /**
   * Get transaction details with on-demand loading
   */
  async getTransactionDetails(
    walletAddress: string,
    transactionVersion: string,
  ): Promise<Transaction | null> {
    const cacheKey = `${walletAddress}:${transactionVersion}`;

    // Check details cache
    const cached = this.detailsCache.get(cacheKey);
    if (cached) {
      logger.debug(`Transaction details cache hit for ${transactionVersion}`);
      return cached;
    }

    try {
      const response = await fetch(
        `/api/portfolio/transactions/details?address=${walletAddress}&version=${transactionVersion}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch transaction details: ${response.status}`,
        );
      }

      const data = await response.json();
      const transaction = data.data;

      if (transaction) {
        this.detailsCache.set(cacheKey, transaction, this.DETAILS_CACHE_TTL);
      }

      return transaction;
    } catch (error) {
      logger.error(
        `Failed to fetch transaction details for ${transactionVersion}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Prefetch adjacent windows in background
   */
  private async triggerPrefetch(walletAddress: string, currentWindow: number) {
    const prefetchPromises: Promise<void>[] = [];

    // Prefetch next windows
    for (let i = 1; i <= this.PREFETCH_DISTANCE; i++) {
      const nextWindow = currentWindow + i;
      if (
        !this.getCachedWindow(walletAddress, nextWindow) &&
        this.hasMoreWindows(walletAddress, nextWindow)
      ) {
        prefetchPromises.push(
          this.getTransactionWindow(walletAddress, nextWindow)
            .then(() =>
              logger.debug(
                `Prefetched window ${nextWindow} for ${walletAddress}`,
              ),
            )
            .catch(() =>
              logger.debug(`Failed to prefetch window ${nextWindow}`),
            ),
        );
      }
    }

    // Limit concurrent prefetch requests
    if (prefetchPromises.length > 0) {
      Promise.allSettled(
        prefetchPromises.slice(0, this.MAX_CONCURRENT_REQUESTS),
      );
    }
  }

  /**
   * Fetch single window from API
   */
  private async fetchWindow(
    walletAddress: string,
    windowIndex: number,
  ): Promise<TransactionPage> {
    const offset = windowIndex * this.WINDOW_SIZE;

    logger.debug(
      `Fetching window ${windowIndex} (offset ${offset}) for ${walletAddress}`,
    );

    try {
      const response = await fetch(
        `/api/portfolio/transactions?address=${walletAddress}&limit=${this.WINDOW_SIZE}&offset=${offset}&lazy=${windowIndex > 0}`,
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      // Update total count cache
      if (data.totalCount !== undefined) {
        this.totalCounts.set(walletAddress, data.totalCount);
      }

      // Cache the window
      this.cacheWindow(walletAddress, windowIndex, data.data || []);

      return {
        transactions: data.data || [],
        totalCount: data.totalCount || 0,
        hasMore: data.hasMore || false,
        nextOffset: data.nextOffset || offset + this.WINDOW_SIZE,
        cached: false,
      };
    } catch (error) {
      logger.error(
        `Failed to fetch window ${windowIndex} for ${walletAddress}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Cache window data
   */
  private cacheWindow(
    walletAddress: string,
    windowIndex: number,
    transactions: Transaction[],
  ) {
    if (!this.windows.has(walletAddress)) {
      this.windows.set(walletAddress, new Map());
    }

    const userWindows = this.windows.get(walletAddress)!;
    userWindows.set((windowIndex, {
      startOffset: windowIndex * this.WINDOW_SIZE,
      endOffset: windowIndex * this.WINDOW_SIZE + transactions.length,
      status: "loaded",
      data: transactions,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached window if available and not expired
   */
  private getCachedWindow(
    walletAddress: string,
    windowIndex: number,
  ): TransactionWindow | null {
    const userWindows = this.windows.get(walletAddress);
    if (!userWindows) return null;

    const window = userWindows.get(windowIndex);
    if (!window) return null;

    // Check if cache is expired
    if (Date.now() - window.timestamp > this.CACHE_TTL) {
      userWindows.delete(windowIndex);
      return null;
    }

    return window;
  }

  /**
   * Check if more windows are available
   */
  private hasMoreWindows(walletAddress: string, windowIndex: number): boolean {
    const totalCount = this.totalCounts.get(walletAddress);
    if (!totalCount) return true; // Unknown, assume more exist

    const startOffset = windowIndex * this.WINDOW_SIZE;
    return startOffset < totalCount;
  }

  /**
   * Get all loaded transactions for a wallet (for analysis/search)
   */
  getLoadedTransactions(walletAddress: string): Transaction[] {
    const userWindows = this.windows.get(walletAddress);
    if (!userWindows) return [];

    const allTransactions: Transaction[] = [];
    const sortedWindows = Array.from(userWindows.entries()).sort(
      ([a], [b]) => a - b,
    );

    for (const [ window] of sortedWindows) {
      if (window.status === "loaded") {
        allTransactions.push(...window.data);
      }
    }

    return allTransactions;
  }

  /**
   * Clear cache for a wallet (useful for refresh)
   */
  clearWalletCache(walletAddress: string) {
    this.windows.delete(walletAddress);
    this.totalCounts.delete(walletAddress);

    // Clear related detail caches
    // SimpleCache doesn't expose keys(), so we'll clear the entire cache
    this.detailsCache.clear();

    logger.debug(`Cleared transaction cache for ${walletAddress}`);
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [wallet, windows] of this.windows.entries()) {
      stats[wallet] = {
        windowCount: windows.size,
        totalTransactions: this.getLoadedTransactions(wallet).length,
        totalCount: this.totalCounts.get(wallet) || 0,
        loadedWindows: Array.from(windows.keys()).sort((a, b) => a - b),
      };
    }

    return {
      wallets: stats,
      pendingRequests: this.pendingRequests.size,
      // SimpleCache doesn't expose size
      detailsCacheSize: "N/A",
    };
  }
}

// Export singleton instance
export const transactionManager = TransactionManager.getInstance();
