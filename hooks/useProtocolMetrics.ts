import { useEffect, useState } from "react";
import { defiLlamaService } from "@/lib/services/defi-llama";
import type { DefiProtocol, DataProvider } from "@/components/pages/defi/data";
import { serviceLogger } from "@/lib/utils/logger";

type EnrichedProtocol = DefiProtocol;

export function useProtocolMetrics(protocols: DefiProtocol[]): {
  enrichedProtocols: EnrichedProtocol[];
  loading: boolean;
  error: Error | null;
} {
  const [enrichedProtocols, setEnrichedProtocols] =
    useState<EnrichedProtocol[]>(protocols);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        setError(null);

        // Process protocols in batches to avoid overwhelming the API
        const batchSize = 5;
        const enrichedResults: EnrichedProtocol[] = [];

        for (let i = 0; i < protocols.length; i += batchSize) {
          const batch = protocols.slice(i, i + batchSize);

          const batchPromises = batch.map(async (protocol) => {
            try {
              const metrics = await defiLlamaService.getProtocolMetrics(
                protocol.title,
              );

              if (!metrics) {
                return protocol;
              }

              return {
                ...protocol,
                volume: metrics.volume
                  ? {
                      ...protocol.volume,
                      daily: metrics.volume.daily,
                      change24h: metrics.volume.change24h,
                      lastUpdated: new Date().toISOString(),
                      source: { provider: "DefiLlama" as const },
                    }
                  : protocol.volume,
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
              };
            } catch (err) {
              serviceLogger.debug(
                `Failed to fetch metrics for ${protocol.title}`,
                err,
              );
              return protocol;
            }
          });

          const batchResults = await Promise.all(batchPromises);
          enrichedResults.push(...batchResults);

          // Add a small delay between batches to be respectful to the API
          if (i + batchSize < protocols.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        setEnrichedProtocols(enrichedResults);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to fetch protocol metrics"),
        );
        serviceLogger.error("Error fetching protocol metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    if (protocols.length > 0) {
      fetchMetrics();
    }
  }, [protocols]);

  return { enrichedProtocols, loading, error };
}
