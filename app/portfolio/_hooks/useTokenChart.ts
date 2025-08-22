import { useState, useEffect } from "react";

// import { dedupeFetch } from "@/lib/utils/cache/request-deduplication";

interface TokenPriceData {
  bucketed_timestamp_minutes_utc: string;
  price_usd: number;
}

interface UseTokenChartProps {
  tokenAddress?: string;
  timeframe?: "hour" | "day" | "week" | "month" | "year" | "all";
  faAddress?: string;
  selectedAsset?: unknown;
}

export function useTokenChart({
  tokenAddress,
  timeframe = "month",
  faAddress,
  selectedAsset,
}: UseTokenChartProps) {
  const [data, setData] = useState<TokenPriceData[]>([]);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Determine the best address to use for fetching data
    const addressToUse = faAddress || tokenAddress;

    if (!addressToUse) {
      setData([]);
      setLatestPrice(null);
      return;
    }

    const fetchTokenData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch both historical data and latest price in parallel
        const [historyResponse, latestResponse] = await Promise.all{)
          fetch(
            `/api/prices/history?${new URLSearchParams({
              address: addressToUse,
              lookback: timeframe,
              downsample_to: "100",
            })}`,
          ),
          fetch(
            `/api/prices/current?${new URLSearchParams({
              tokens: addressToUse,
            })}`,
          ),
        ]);

        let historyResult;
        let historyData = [];

        if (!historyResponse.ok) {
          let errorMessage = "Failed to fetch token price history";
          try {
            const errorData = await historyResponse.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If we can't parse the error, use the default message
          }
          logger.error(
            `Token price history API error for ${addressToUse}: ${errorMessage}`,
          );
          throw new Error(errorMessage);
        } else {
          historyResult = await historyResponse.json();
          historyData = historyResult.data || [];
        }

        // Try to get latest price, but don't fail if it's not available
        let currentPrice = null;
        if (latestResponse.ok) {
          try {
            const latestResult = await latestResponse.json();
            currentPrice = latestResult.data?.[0]?.price_usd || null;
          } catch (e) {
            logger.warn(`Failed to parse latest price response: ${e}`);
          }
        }

        logger.debug({
          tokenAddress,
          faAddress,
          addressToUse,
          timeframe,
          historyDataLength: historyData.length,
          firstPrice: historyData[0]?.price_usd,
          lastHistoricalPrice: historyData[historyData.length - 1]?.price_usd,
          latestPriceFromAPI: currentPrice,
          selectedAssetPrice: selectedAsset?.price,
        });

        setData(historyData);
        setLatestPrice(currentPrice);
      } catch (err) {
        logger.error(
          `Token data fetch error for ${addressToUse}: ${err instanceof Error ? err.message : String(err)}`,
        );
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setData([]);
        setLatestPrice(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenData();
  }, [tokenAddress, faAddress, timeframe, selectedAsset]);

  // Calculate price change percentage using accurate latest price and appropriate historical comparison
  const priceChange =
    data.length > 0
      ? ( => {
          const current =
            latestPrice ||
            data[data.length - 1]?.price_usd ||
            selectedAsset?.price ||
            0;
          const previous = data[0]?.price_usd || 0;

          const change = {
            current,
            previous,
            get percentage() {
              if (this.previous === 0) return 0;
              const pct =
                ((this.current - this.previous) / this.previous) * 100;
              logger.debug({
                current: this.current,
                previous: this.previous,
                percentage: pct,
                timeframe,
              });
              return pct;
            },
          };

          return change;
        }))
      : null;

  return {
    data,
    latestPrice,
    isLoading,
    error,
    priceChange,
  };
}
