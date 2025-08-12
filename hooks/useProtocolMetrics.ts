import { useEffect, useState, useRef, useMemo } from "react";
import { defiLlamaService } from "@/lib/services/external/defi-llama";
import type { DefiProtocol, DataProvider } from "@/components/pages/defi/data";
import { serviceLogger } from "@/lib/utils/core/logger";

type EnrichedProtocol = DefiProtocol;

// Global cache for protocol metrics to prevent duplicate requests
const protocolMetricsCache = new Map<string, Promise<any>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useProtocolMetrics(protocols: DefiProtocol[]): {
  enrichedProtocols: EnrichedProtocol[];
  loading: boolean;
  error: Error | null;
} {
  const [enrichedProtocols, setEnrichedProtocols] =
    useState<EnrichedProtocol[]>(protocols);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize protocols to prevent unnecessary re-renders
  const protocolsKey = useMemo(
    () => protocols.map((p) => p.title).join(","),
    [protocols],
  );

  useEffect(() => {
    async function fetchMetrics() {
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        setLoading(true);
        setError(null);

        // Use larger batch size but with exponential backoff for failed requests
        const batchSize = 10;
        const enrichedResults: EnrichedProtocol[] = [];

        for (let i = 0; i < protocols.length; i += batchSize) {
          if (signal.aborted) return;

          const batch = protocols.slice(i, i + batchSize);

          const batchPromises = batch.map(async (protocol) => {
            const cacheKey = `${protocol.title}-${Date.now() - (Date.now() % CACHE_DURATION)}`;

            // Check if we already have a pending request for this protocol
            if (!protocolMetricsCache.has(cacheKey)) {
              protocolMetricsCache.set(
                cacheKey,
                defiLlamaService.getProtocolMetrics(protocol.title),
              );

              // Clean up cache after duration
              setTimeout(() => {
                protocolMetricsCache.delete(cacheKey);
              }, CACHE_DURATION);
            }

            try {
              const metrics = await protocolMetricsCache.get(cacheKey);

              if (signal.aborted) return protocol;

              if (!metrics) {
                return protocol;
              }

              return {
                ...protocol,
                // Update TVL if available from DeFiLlama - keep as numbers for proper formatting
                tvl: metrics.tvl
                  ? {
                      ...protocol.tvl,
                      current: metrics.tvl.current?.toString() || protocol.tvl.current,
                      change7d: metrics.tvl.change7d?.toFixed(2),
                      defiLlama: metrics.tvl.current?.toString(),
                      lastUpdated: new Date().toISOString(),
                      source: { provider: "DefiLlama" as const },
                    }
                  : protocol.tvl,
                // Update volume data
                volume: metrics.volume || metrics.optionsVolume
                  ? {
                      ...protocol.volume,
                      daily: metrics.volume?.daily || protocol.volume?.daily,
                      change24h: metrics.volume?.change24h || protocol.volume?.change24h,
                      options: metrics.optionsVolume?.daily,
                      optionsChange24h: metrics.optionsVolume?.change24h,
                      lastUpdated: new Date().toISOString(),
                      source: { provider: "DefiLlama" as const },
                    }
                  : protocol.volume,
                // Update financials
                financials: metrics.fees
                  ? {
                      ...protocol.financials,
                      fees: {
                        daily: metrics.fees.daily,
                        change24h: metrics.fees.change24h,
                      },
                      revenue: metrics.fees.revenue
                        ? {
                            daily: metrics.fees.revenue,
                          }
                        : undefined,
                      lastUpdated: new Date().toISOString(),
                      source: { provider: "DefiLlama" as const },
                    }
                  : protocol.financials,
                // Update yields if available
                yields: metrics.yields && metrics.yields.length > 0
                  ? {
                      ...protocol.yields,
                      pools: metrics.yields.map((pool: any) => ({
                        poolId: pool.pool,
                        symbol: pool.symbol,
                        apy: pool.apy,
                        apyBase: pool.apyBase,
                        apyReward: pool.apyReward,
                        tvlUsd: pool.tvlUsd,
                        underlyingTokens: pool.underlyingTokens,
                        rewardTokens: pool.rewardTokens,
                        ilRisk: pool.ilRisk === "yes",
                      })),
                      max: metrics.yields.reduce((max: number, pool: any) => 
                        Math.max(max, pool.apy || 0), 0).toFixed(2),
                      average: (metrics.yields.reduce((sum: number, pool: any) => 
                        sum + (pool.apy || 0), 0) / metrics.yields.length).toFixed(2),
                      lastUpdated: new Date().toISOString(),
                      source: { provider: "DefiLlama" as const },
                    }
                  : protocol.yields,
                // Update token data if available - keep as numbers/strings for formatting
                token: metrics.tokenPrice || metrics.mcap || metrics.fdv || metrics.staking
                  ? {
                      ...protocol.token,
                      price: metrics.tokenPrice?.toFixed(4) || protocol.token?.price,
                      marketCap: metrics.mcap?.toString() || protocol.token?.marketCap,
                      fdv: metrics.fdv?.toString() || protocol.token?.fdv,
                      supply: {
                        ...protocol.token?.supply,
                        staked: metrics.staking?.toString(),
                      },
                      lastUpdated: new Date().toISOString(),
                      source: { provider: "DefiLlama" as const },
                    }
                  : protocol.token,
                // Add lending/borrowing metrics
                lending: metrics.borrowRates || metrics.supplyRates
                  ? {
                      borrowRates: metrics.borrowRates,
                      supplyRates: metrics.supplyRates,
                      totalBorrowed: metrics.borrowRates?.reduce((sum: number, r: any) => sum + r.totalBorrowUsd, 0).toString(),
                      totalSupplied: metrics.supplyRates?.reduce((sum: number, r: any) => sum + r.totalSupplyUsd, 0).toString(),
                    }
                  : protocol.lending,
              };
            } catch (err) {
              serviceLogger.debug(
                `Failed to fetch metrics for ${protocol.title}`,
                err,
              );
              return protocol;
            }
          });

          const batchResults = await Promise.allSettled(batchPromises);
          const resolvedResults = batchResults
            .filter(
              (result): result is PromiseFulfilledResult<EnrichedProtocol> =>
                result.status === "fulfilled",
            )
            .map((result) => result.value);

          enrichedResults.push(...resolvedResults);

          // Exponential backoff: longer delays for later batches
          if (i + batchSize < protocols.length && !signal.aborted) {
            const delay = Math.min(
              200 * Math.pow(1.5, Math.floor(i / batchSize)),
              2000,
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        if (!signal.aborted) {
          setEnrichedProtocols(enrichedResults);
        }
      } catch (err) {
        if (!signal.aborted) {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to fetch protocol metrics"),
          );
          serviceLogger.error("Error fetching protocol metrics:", err);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (protocols.length > 0) {
      fetchMetrics();
    } else {
      setLoading(false);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [protocolsKey]);

  return { enrichedProtocols, loading, error };
}
