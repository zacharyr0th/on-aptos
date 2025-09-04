import { useState, useEffect } from "react";

import type { FungibleAsset, NFT, Transaction } from "@/lib/types/consolidated";
import type { DeFiPosition } from "@/lib/types/defi";
import {
  enhancedFetch,
  isRateLimited,
  getRetryDelay,
} from "@/lib/utils/api/fetch-utils";
import { logger } from "@/lib/utils/core/logger";

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
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nftsLoading, setNftsLoading] = useState(false);
  const [defiLoading, setDefiLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
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
  const [useBatchApi] = useState(true); // Feature flag for batch API

  // Load ALL transactions in background (ignore offset, just load everything)
  const loadRemainingTransactions = async (startOffset: number) => {
    if (!walletAddress || transactionsLoading) return;

    setTransactionsLoading(true);
    try {
      // Small delay to not interfere with main UI updates
      await new Promise((resolve) => setTimeout(resolve, 300));

      logger.debug(
        `Starting background loading of remaining transactions from offset ${startOffset} for wallet:`,
        walletAddress,
      );

      // Load ALL transactions from offset 0, ignoring what we already have
      const allTransactions: Transaction[] = [];
      let offset = 0; // ALWAYS start from 0
      const batchSize = 100;
      let hasMore = true;

      // Load remaining transactions in batches of 100
      while (hasMore) {
        let response: Response;
        try {
          response = await enhancedFetch(
            `/api/portfolio/transactions?address=${walletAddress}&limit=${batchSize}&offset=${offset}`,
            {
              retries: 3,
              retryDelay: 2000,
              timeout: 30000, // 30 second timeout
            },
          );
        } catch (fetchError) {
          // Network or timeout error - log but don't throw, just stop loading
          logger.warn(
            `Network error loading transactions at offset ${offset}: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}. Stopping background load.`,
          );
          break; // Exit the loop but keep existing transactions
        }

        if (!response.ok) {
          // Server returned an error - log but don't throw
          logger.warn(
            `Server error loading transactions at offset ${offset}: ${response.status} ${response.statusText}. Stopping background load.`,
          );
          break; // Exit the loop but keep existing transactions
        }

        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          logger.warn(
            `Failed to parse transaction response at offset ${offset}: ${parseError instanceof Error ? parseError.message : String(parseError)}. Stopping background load.`,
          );
          break; // Exit the loop but keep existing transactions
        }
        const batchTransactions = result.data || [];

        if (batchTransactions.length === 0) {
          // No more transactions
          hasMore = false;
        } else {
          // Prevent duplicates by checking transaction versions
          const existingVersions = new Set(
            allTransactions.map((tx) => tx.transaction_version),
          );
          const uniqueTransactions = batchTransactions.filter(
            (tx: Transaction) => !existingVersions.has(tx.transaction_version),
          );

          if (uniqueTransactions.length === 0) {
            // All transactions in this batch were duplicates
            logger.warn(
              `All ${batchTransactions.length} transactions at offset ${offset} were duplicates. This might be normal if transactions overlap. Continuing...`,
            );
            // Don't stop! Just increment offset and continue
            offset += batchSize;
          } else {
            allTransactions.push(...uniqueTransactions);
            offset += batchSize;
          }

          // Update UI with current transactions for progressive loading
          setTransactions([...allTransactions]);

          logger.debug(
            `Loaded batch: ${uniqueTransactions.length} unique transactions from ${batchTransactions.length} fetched (total: ${allTransactions.length}) for wallet ${walletAddress}`,
          );

          // If we got fewer than the batch size, we've reached the end
          if (batchTransactions.length < batchSize) {
            hasMore = false;
          }

          // Small delay between batches to avoid overwhelming the API
          if (hasMore) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }
      }

      // Just set all transactions - we loaded everything from offset 0
      setTransactions(allTransactions);

      logger.info(
        `Completed loading all ${allTransactions.length} transactions for wallet ${walletAddress}`,
      );
    } catch (error) {
      // This catch block handles any unexpected errors
      logger.warn(
        `Background transaction loading stopped: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Don't set error state for background loading - UI continues to work with partial data
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Load transactions in background - fetch first batch immediately, then rest in background
  const loadTransactions = async () => {
    if (!walletAddress || transactionsLoading) return;

    setTransactionsLoading(true);
    try {
      logger.debug("Starting transaction loading for wallet:", walletAddress);

      // Load first batch of 100 transactions immediately (no delay)
      const firstResponse = await enhancedFetch(
        `/api/portfolio/transactions?address=${walletAddress}&limit=100&offset=0`,
        {
          retries: 3,
          retryDelay: 2000,
        },
      );

      if (!firstResponse.ok) {
        throw new Error(
          `Failed to fetch first batch of transactions: ${firstResponse.status}`,
        );
      }

      const firstResult = await firstResponse.json();
      const firstBatch = firstResult.data || [];

      // Set first batch immediately for instant display
      setTransactions([...firstBatch]);
      logger.info(
        `Loaded first ${firstBatch.length} transactions immediately for wallet ${walletAddress}`,
      );

      // If we got fewer than 100, we have all transactions
      if (firstBatch.length < 100) {
        logger.info(
          `All ${firstBatch.length} transactions loaded for wallet ${walletAddress}`,
        );
        return;
      }

      // Continue loading rest in background with small delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const allTransactions: Transaction[] = [...firstBatch];
      let offset = 100;
      const batchSize = 100;
      let hasMore = true;

      // Load remaining transactions in batches of 100
      while (hasMore) {
        let response: Response;
        try {
          response = await enhancedFetch(
            `/api/portfolio/transactions?address=${walletAddress}&limit=${batchSize}&offset=${offset}`,
            {
              retries: 3,
              retryDelay: 2000,
              timeout: 30000, // 30 second timeout
            },
          );
        } catch (fetchError) {
          // Network or timeout error - log but don't throw, just stop loading
          logger.warn(
            `Network error loading transactions at offset ${offset}: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}. Stopping background load.`,
          );
          break; // Exit the loop but keep existing transactions
        }

        if (!response.ok) {
          // Server returned an error - log but don't throw
          logger.warn(
            `Server error loading transactions at offset ${offset}: ${response.status} ${response.statusText}. Stopping background load.`,
          );
          break; // Exit the loop but keep existing transactions
        }

        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          logger.warn(
            `Failed to parse transaction response at offset ${offset}: ${parseError instanceof Error ? parseError.message : String(parseError)}. Stopping background load.`,
          );
          break; // Exit the loop but keep existing transactions
        }
        const batchTransactions = result.data || [];

        if (batchTransactions.length === 0) {
          // No more transactions
          hasMore = false;
        } else {
          // Prevent duplicates by checking transaction versions
          const existingVersions = new Set(
            allTransactions.map((tx) => tx.transaction_version),
          );
          const uniqueTransactions = batchTransactions.filter(
            (tx: Transaction) => !existingVersions.has(tx.transaction_version),
          );

          if (uniqueTransactions.length === 0) {
            // All transactions in this batch were duplicates
            logger.warn(
              `All ${batchTransactions.length} transactions at offset ${offset} were duplicates. This might be normal if transactions overlap. Continuing...`,
            );
            // Don't stop! Just increment offset and continue
            offset += batchSize;
          } else {
            allTransactions.push(...uniqueTransactions);
            offset += batchSize;
          }

          // Update UI with current transactions for progressive loading
          setTransactions([...allTransactions]);

          logger.debug(
            `Loaded batch: ${uniqueTransactions.length} unique transactions from ${batchTransactions.length} fetched (total: ${allTransactions.length}) for wallet ${walletAddress}`,
          );

          // If we got fewer than the batch size, we've reached the end
          if (batchTransactions.length < batchSize) {
            hasMore = false;
          }

          // Small delay between batches to avoid overwhelming the API
          if (hasMore) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }
      }

      logger.info(
        `Completed loading ${allTransactions.length} transactions in background for wallet ${walletAddress}`,
      );
    } catch (error) {
      // This catch block handles any unexpected errors
      logger.warn(
        `Background transaction loading stopped: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Don't set error state for background loading - UI continues to work with partial data
      // Keep existing transactions if any were loaded
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) {
        logger.debug("[usePortfolioData] No wallet address provided");
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

      logger.debug(
        "[usePortfolioData] Fetching portfolio data for wallet:",
        walletAddress,
      );
      logger.info(`Fetching portfolio data for wallet: ${walletAddress}`);
      setIsLoading(true);
      setTransactionsLoading(true); // Start loading transactions immediately
      setError(null);

      try {
        logger.debug(
          `Using batch API: ${useBatchApi} for wallet: ${walletAddress}`,
        );

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
            // Check for rate limiting first (only reads headers)
            const isRateLimitError = isRateLimited(response);
            if (isRateLimitError) {
              const retryDelay = getRetryDelay(response);
              throw new Error(
                `Batch API rate limited - retry in ${retryDelay}s`,
              );
            }
            
            // For other errors, create a simple error without reading the response body
            throw new Error(
              `Failed to load portfolio data: ${response.status} ${response.statusText}`,
            );
          }

          // Parse the response data - only reached if response.ok is true
          const batchData = await response.json();
          const data = batchData.data;

          // Set all data at once
          logger.debug("[usePortfolioData] Batch API response:", {
            assets: data.assets?.length || 0,
            defiPositions: data.defiPositions?.length || 0,
            nfts: data.nfts?.length || 0,
            nftTotalCount: data.nftTotalCount,
            transactions: data.transactions?.length || 0,
          });
          setAssets(data.assets || []);
          setDefiPositions(data.defiPositions || []);
          setNfts(data.nfts || []);
          setTotalNFTCount(data.nftTotalCount || 0);
          setHasMoreNFTs(data.hasMoreNFTs || false);
          setNftCollectionStats(data.nftCollectionStats || null);

          // Always try to load all NFTs for accurate collection stats if total > 50
          logger.debug("[usePortfolioData] Collection stats check:", {
            hasCollectionStats: !!data.nftCollectionStats,
            totalCount: data.nftTotalCount,
            nftCount: data.nfts?.length,
            willTriggerFallback: data.nftTotalCount && data.nftTotalCount > 50,
          });

          // If we have more than 50 NFTs total, always load all NFTs for accurate collection stats
          if (data.nftTotalCount && data.nftTotalCount > 50) {
            logger.warn(
              `Loading all ${data.nftTotalCount} NFTs for accurate collection calculation`,
            );
            logger.debug(
              "[usePortfolioData] Triggering background load of all NFTs for collection stats",
            );

            // Load all NFTs in the background for collection stats
            setTimeout(async () => {
              try {
                const { NFTService } = await import(
                  "@/lib/services/portfolio/services/nft-service"
                );
                const allNFTs =
                  await NFTService.getAllWalletNFTs(walletAddress);

                // Calculate collection stats from all NFTs
                const collectionMap: Record<string, number> = {};
                allNFTs.forEach((nft) => {
                  const collectionName =
                    nft.collection_name || "Unknown Collection";
                  collectionMap[collectionName] =
                    (collectionMap[collectionName] || 0) + 1;
                });

                const collections = Object.entries(collectionMap)
                  .map(([name, count]) => ({ name, count }))
                  .sort((a, b) => b.count - a.count);

                const calculatedStats = {
                  collections,
                  totalCollections: collections.length,
                };

                setNftCollectionStats(calculatedStats);
                logger.info(
                  `Successfully calculated collection stats from ${allNFTs.length} NFTs: ${collections.length} collections`,
                );
              } catch (error) {
                logger.error(
                  "Failed to load all NFTs for collection stats:",
                  error,
                );
              }
            }, 1000);
          }

          // Set transactions immediately from batch API
          logger.info(
            `BATCH API RESPONSE - transactions: ${data.transactions ? data.transactions.length : "null"}, hasMoreTransactions: ${data.hasMoreTransactions}`,
          );

          if (data.transactions && data.transactions.length > 0) {
            setTransactions(data.transactions);
            setTransactionsLoading(false); // Mark as loaded
            logger.info(
              `✅ INSTANT LOAD: ${data.transactions.length} transactions loaded immediately from batch API for wallet ${walletAddress}`,
            );

            // If there might be more transactions, load them in background
            if (data.hasMoreTransactions) {
              logger.info(
                `📋 BACKGROUND LOAD: Starting to load remaining transactions after ${data.transactions.length}`,
              );
              setTransactionsLoading(true);
              loadRemainingTransactions(data.transactions.length);
            } else {
              logger.info(
                `✅ ALL LOADED: All ${data.transactions.length} transactions loaded from batch API`,
              );
            }
          } else {
            // Fallback to loading transactions separately
            logger.warn(
              `⚠️ FALLBACK: No transactions in batch API, falling back to separate loading`,
            );
            loadTransactions();
          }

          // For metrics, use loaded NFTs if total count is <= 50
          if (data.nftTotalCount && data.nftTotalCount <= 50) {
            setAllNFTs(data.nfts || []);
          } else {
            // Only load all NFTs if really needed for metrics
            setAllNFTs(data.nfts || []); // Use initial batch for now
          }

          logger.debug(
            `Batch API response - assets: ${data.assets?.length || 0}, defi: ${data.defiPositions?.length || 0}, nfts: ${data.nfts?.length || 0}, totalNFTs: ${data.nftTotalCount}, transactions: ${data.transactions?.length || 0}`,
          );
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
              logger.debug(`Assets loaded: ${finalAssets.length}`);
            } catch (error) {
              logger.error(
                `Assets parsing error: ${error instanceof Error ? error.message : String(error)}`,
              );
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
              logger.debug(`DeFi positions loaded: ${finalDefi.length}`);
            }
          } catch (error) {
            logger.error(
              `DeFi fetch failed: ${error instanceof Error ? error.message : String(error)}`,
            );
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

            logger.debug(
              `NFTs loaded - count: ${initialNFTs.data.length}, hasMore: ${initialNFTs.hasMore}, totalCount: ${totalCount}`,
            );
          } catch (nftError: any) {
            logger.error(
              `Failed to fetch NFTs: ${nftError instanceof Error ? nftError.message : String(nftError)}`,
            );
          } finally {
            setNftsLoading(false);
          }

          // Load transactions separately for fallback path
          setTransactionsLoading(true);
          try {
            const txResponse = await enhancedFetch(
              `/api/portfolio/transactions?address=${walletAddress}&limit=100&offset=0`,
              {
                retries: 3,
                retryDelay: 2000,
              },
            );

            if (txResponse.ok) {
              const txResult = await txResponse.json();
              setTransactions(txResult.data || []);

              // Load remaining if needed
              if (txResult.hasMore) {
                loadRemainingTransactions(100);
              }
            }
          } catch (error) {
            logger.error(
              `Failed to fetch transactions: ${error instanceof Error ? error.message : String(error)}`,
            );
            setTransactions([]);
          } finally {
            setTransactionsLoading(false);
          }
        }
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

      logger.debug(
        `Loaded more NFTs - page: ${nextPage}, count: ${moreNFTs.data.length}, hasMore: ${moreNFTs.hasMore}, total: ${(nfts?.length || 0) + moreNFTs.data.length}`,
      );
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
          // Check for rate limiting first (only reads headers)
          const isRateLimitError = isRateLimited(response);
          if (isRateLimitError) {
            const retryDelay = getRetryDelay(response);
            throw new Error(`Batch API rate limited - retry in ${retryDelay}s`);
          }
          
          // For other errors, create a simple error without reading the response body
          throw new Error(
            `Failed to refetch portfolio data: ${response.status} ${response.statusText}`,
          );
        }

        // Parse the response data - only reached if response.ok is true
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

        // Set transactions from batch API or reload separately
        if (data.transactions) {
          setTransactions(data.transactions);
          logger.info(
            `Reloaded ${data.transactions.length} transactions from batch API for wallet ${walletAddress}`,
          );

          // If there might be more transactions, load them in background
          if (data.hasMoreTransactions) {
            setTransactionsLoading(true);
            loadRemainingTransactions(data.transactions.length);
          }
        } else {
          // Fallback to loading transactions separately
          loadTransactions();
        }

        logger.debug(
          `Refetch response - assets: ${data.assets?.length || 0}, defi: ${data.defiPositions?.length || 0}, nfts: ${data.nfts?.length || 0}, totalNFTs: ${data.nftTotalCount}, transactions: ${data.transactions?.length || 0}`,
        );
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
          logger.error(
            `Failed to refetch NFTs: ${nftError instanceof Error ? nftError.message : String(nftError)}`,
          );
          setNfts([]);
          setAllNFTs([]);
        }

        // Reload transactions separately for fallback path
        try {
          const txResponse = await enhancedFetch(
            `/api/portfolio/transactions?address=${walletAddress}&limit=100&offset=0`,
            {
              retries: 3,
              retryDelay: 2000,
            },
          );

          if (txResponse.ok) {
            const txResult = await txResponse.json();
            setTransactions(txResult.data || []);

            // Load remaining if needed
            if (txResult.hasMore) {
              setTransactionsLoading(true);
              loadRemainingTransactions(100);
            }
          }
        } catch (error) {
          logger.error(
            `Failed to refetch transactions: ${error instanceof Error ? error.message : String(error)}`,
          );
          setTransactions([]);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.error(
        `Refetch error for wallet ${walletAddress}: ${errorMessage}`,
      );
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
    isLoadingMore,
    loadMoreNFTs,
    error,
    refetch,
    totalNFTCount,
    allNFTs,
    nftCollectionStats,
  };
}
