import { useCallback, useEffect, useMemo, useState } from "react";
import type { PortfolioHistoryPoint } from "@/lib/services/portfolio/types";
import { logger } from "@/lib/utils/core/logger";

interface OptimizedPortfolioData {
  date: string;
  aptBalance: number;
  aptPrice: number | null;
  totalValue: number;
  dataSource?: string | null;
}

interface UsePortfolioHistoryOptions {
  days?: number;
  fields?: string[];
  enableDataDecimation?: boolean;
  refetchInterval?: number;
  timeframe?: "1h" | "12h" | "24h" | "7d" | "30d" | "90d" | "1y" | "all";
}

interface UsePortfolioHistoryResult {
  data: PortfolioHistoryPoint[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  decimatedData?: PortfolioHistoryPoint[] | null;
  currentPrice?: number | null;
  previousPrice?: number | null;
  averageHistory?: PortfolioHistoryPoint[] | null;
  accountNames?: string[] | null;
}

// Helper function to convert timeframe to days
function timeframeToDays(timeframe?: string): number {
  switch (timeframe) {
    case "1h":
      return 1 / 24;
    case "12h":
      return 0.5;
    case "24h":
      return 1;
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "1y":
      return 365;
    case "all":
      return 999999;
    default:
      return 7;
  }
}

export function usePortfolioHistory(
  walletAddress: string | undefined | null,
  options: UsePortfolioHistoryOptions = {}
): UsePortfolioHistoryResult {
  const {
    days = 7,
    fields = ["date", "aptBalance", "aptPrice", "totalValue"],
    enableDataDecimation = true,
    refetchInterval = 0,
    timeframe,
  } = options;

  // Convert timeframe to days if provided
  const effectiveDays = timeframe ? timeframeToDays(timeframe) : days;

  // Memoize fields to prevent recreation
  const fieldsString = useMemo(() => fields.join(","), [fields]);

  const [data, setData] = useState<OptimizedPortfolioData[] | null>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountNames, setAccountNames] = useState<string[] | null>(null);

  // We're using the portfolio history endpoint directly

  // Fetch ANS names
  const fetchAccountNames = useCallback(async () => {
    if (!walletAddress) {
      setAccountNames(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/wallet/ans/names?address=${encodeURIComponent(walletAddress)}`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setAccountNames(result.data);
        }
      }
    } catch (error) {
      logger.error(
        `Failed to fetch ANS names: ${error instanceof Error ? error.message : String(error)}`
      );
      // Don't set error state as this is not critical
    }
  }, [walletAddress]);

  const fetchPortfolioHistory = useCallback(async () => {
    if (!walletAddress) {
      setData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use different endpoints based on timeframe for better data granularity
      let response;
      let result;

      if (timeframe && ["1h", "12h", "24h", "7d", "30d", "90d", "1y", "all"].includes(timeframe)) {
        // Use the performance endpoint for predefined timeframes
        const queryParams = new URLSearchParams({
          address: walletAddress,
          timeframe: timeframe,
        });
        response = await fetch(`/api/data/analytics/portfolio-performance?${queryParams}`);
        result = await response.json();

        // Transform the data to match the expected format
        if (result.success && result.data && result.data.length > 0) {
          const transformedData = result.data.map((item: any) => ({
            date: item.timestamp.includes("T") ? item.timestamp.split("T")[0] : item.timestamp,
            aptBalance: item.balance,
            aptPrice: item.price,
            totalValue: item.value,
            dataSource: "performance_api",
          }));
          setData(transformedData);
          return;
        } else {
          logger.warn("[usePortfolioHistory] Performance API returned no data", { timeframe });
          // Fall through to use the history endpoint
        }
      }

      // If we get here, either not a standard timeframe or performance API returned no data
      // Fall back to the original history endpoint
      const queryParams = new URLSearchParams({
        address: walletAddress,
        days: effectiveDays.toString(),
        fields: fieldsString,
      });
      response = await fetch(`/api/portfolio/history?${queryParams}`);
      result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to fetch portfolio history: ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch portfolio history");
      }

      setData(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      // Only log as debug since portfolio history is optional
      logger.debug({
        error: errorMessage,
        walletAddress,
        days: effectiveDays,
      });
      // Don't set error state for optional feature
      setError(null);
      // Return empty data instead of null
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, effectiveDays, fieldsString, timeframe]);

  // We're using the portfolio history endpoint instead of analytics data directly

  // Data transformation for API compatibility
  const transformedData = useMemo<PortfolioHistoryPoint[] | null>(() => {
    if (!data || data.length === 0) return [];

    return data.map((item) => ({
      date: item.date,
      totalValue: item.totalValue,
      assets: [
        {
          assetType: "0x1::aptos_coin::AptosCoin",
          symbol: "APT",
          balance: item.aptBalance,
          price: item.aptPrice || 0,
          value: item.totalValue,
        },
      ],
      rateLimited: item.dataSource === "balance-only" || !item.aptPrice,
    }));
  }, [data]);

  // Data decimation for chart optimization
  const decimatedData = useMemo(() => {
    if (!transformedData || !enableDataDecimation) {
      return transformedData;
    }

    const dataLength = transformedData.length;
    if (dataLength <= 30) {
      return transformedData;
    }

    // Adaptive decimation based on data size
    let targetPoints = 30;
    if (dataLength > 100) targetPoints = 50;
    if (dataLength > 365) targetPoints = 100;

    const factor = Math.ceil(dataLength / targetPoints);
    return transformedData.filter((_, index) => index % factor === 0);
  }, [transformedData, enableDataDecimation]);

  // Computed values for backward compatibility with V2
  const currentPrice = useMemo(() => {
    if (!data || data.length === 0) return null;
    return data[data.length - 1].aptPrice;
  }, [data]);

  const previousPrice = useMemo(() => {
    if (!data || data.length < 2) return null;
    return data[data.length - 2].aptPrice;
  }, [data]);

  const averageHistory = useMemo(() => {
    return transformedData;
  }, [transformedData]);

  // Auto-refresh functionality
  useEffect(() => {
    // Always use the portfolio history endpoint instead of analytics data
    fetchPortfolioHistory();
    fetchAccountNames();

    if (refetchInterval > 0) {
      const interval = setInterval(() => {
        fetchPortfolioHistory();
        fetchAccountNames();
      }, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPortfolioHistory, fetchAccountNames, refetchInterval]);

  return {
    data: transformedData,
    isLoading: isLoading,
    error: error,
    refetch: fetchPortfolioHistory,
    decimatedData,
    // Additional properties for V2 compatibility
    currentPrice,
    previousPrice,
    averageHistory,
    accountNames, // Now fetched from the ANS endpoint
  };
}

// Helper hook for chart-specific optimizations
export function usePortfolioChartData(
  walletAddress: string | undefined,
  options: UsePortfolioHistoryOptions = {}
) {
  const result = usePortfolioHistory(walletAddress, {
    ...options,
    enableDataDecimation: true,
  });

  // Additional chart-specific processing
  const chartData = useMemo(() => {
    const data = result.decimatedData || result.data;
    if (!data) return null;

    return data.map((point) => ({
      date: point.date,
      value: point.totalValue,
      // Additional chart-specific fields
      timestamp: new Date(point.date).getTime(),
      formattedDate: new Date(point.date).toLocaleDateString(),
    }));
  }, [result.decimatedData, result.data]);

  return {
    ...result,
    chartData,
  };
}
