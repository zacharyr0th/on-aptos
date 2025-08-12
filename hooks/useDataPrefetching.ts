import { useEffect, useRef } from "react";
import { errorLogger } from "@/lib/utils/core/logger";

type PageType = "defi" | "btc" | "lst" | "rwas" | "stables";

interface PrefetchConfig {
  enabled?: boolean;
  symbols?: string[];
  onError?: (error: Error) => void;
}

/**
 * Hook to prefetch market data for better UX
 * Only prefetches if data is not already cached
 */
export function useDataPrefetch(pageOrConfig?: PageType | PrefetchConfig) {
  const config: PrefetchConfig =
    typeof pageOrConfig === "string"
      ? getPageConfig(pageOrConfig)
      : pageOrConfig || {};
  const { enabled = true, symbols = ["btc", "susde"], onError } = config;

  // TODO: Implement trpc client setup and use trpc.useUtils() here
  // const utils = trpc.useUtils();
  const hasPrefetched = useRef(false);
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || hasPrefetched.current) return;

    // Create new abort controller for this effect
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    const prefetchData = async () => {
      try {
        // TODO: Implement prefetching once trpc client is set up
        // Check if we already have data before prefetching
        // const prefetchPromises = symbols.map(async symbol => {
        //   const existingData =
        //     utils.domains.marketData.prices.getCMCPrice.getData({ symbol });

        //   // Only prefetch if we don't have data or it's stale
        //   if (!existingData || isDataStale(existingData)) {
        //     if (signal.aborted) return;

        //     await utils.domains.marketData.prices.getCMCPrice.prefetch(
        //       { symbol },
        //       {
        //         staleTime: 5 * 60 * 1000, // 5 minutes
        //       }
        //     );
        //   }
        // });

        // await Promise.all(prefetchPromises);
        hasPrefetched.current = true;
      } catch (error) {
        if (signal.aborted) return; // Ignore errors from cancelled requests

        errorLogger.error("Prefetch error:", error);
        onError?.(error as Error);
      }
    };

    // Delay prefetch slightly to prioritize initial render
    const timeoutId = setTimeout(() => {
      if (!abortController.current?.signal.aborted) {
        prefetchData();
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      abortController.current?.abort();
      hasPrefetched.current = false;
    };
  }, [enabled, symbols.join(","), onError]);

  // Reset prefetch flag when symbols change
  useEffect(() => {
    hasPrefetched.current = false;
  }, [symbols.join(",")]);
}

// Helper to check if data is stale (older than 5 minutes)
function isDataStale(data: any): boolean {
  if (!data?.updated) return true;

  const updatedTime = new Date(data.updated).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  return now - updatedTime > fiveMinutes;
}

// Get config based on page type
function getPageConfig(page: PageType): PrefetchConfig {
  switch (page) {
    case "btc":
      return { symbols: ["btc"] };
    case "stables":
      return { symbols: ["susde"] };
    case "defi":
    case "lst":
    case "rwas":
      return { symbols: [] }; // No specific symbols to prefetch
    default:
      return { symbols: ["btc", "susde"] };
  }
}
