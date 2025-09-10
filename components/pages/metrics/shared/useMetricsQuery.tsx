"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { logger } from "@/lib/utils/core/logger";

interface UseMetricsQueryOptions {
  queryKey: string[];
  endpoint: string;
  refetchInterval?: number;
  retry?: number;
  enabled?: boolean;
}

export const useMetricsQuery = <T = any>({
  queryKey,
  endpoint,
  refetchInterval = 300000, // 5 minutes default
  retry = 3,
  enabled = true,
}: UseMetricsQueryOptions): UseQueryResult<T> => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch from ${endpoint}`);
      }
      return await response.json();
    },
    refetchInterval,
    retry,
    enabled,
  });
};

interface UseMultipleMetricsQueriesOptions {
  queries: UseMetricsQueryOptions[];
}

export const useMultipleMetricsQueries = ({ queries }: UseMultipleMetricsQueriesOptions) => {
  const results = queries.map((queryOptions) => useMetricsQuery(queryOptions));

  const isLoading = results.some((result) => result.isLoading);
  const isError = results.some((result) => result.isError);
  const data = results.reduce(
    (acc, result, index) => {
      acc[queries[index].queryKey[0]] = result.data;
      return acc;
    },
    {} as Record<string, any>
  );

  return {
    isLoading,
    isError,
    data,
    results,
  };
};

interface UseMetricsRefreshOptions {
  queries?: UseMetricsQueryOptions[];
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const useMetricsRefresh = ({
  queries = [],
  onSuccess,
  onError,
}: UseMetricsRefreshOptions = {}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async (customQueries?: UseMetricsQueryOptions[]) => {
    const queriesToRefresh = customQueries || queries;
    setIsRefreshing(true);

    try {
      await Promise.all(
        queriesToRefresh.map(async (query) => {
          const response = await fetch(query.endpoint);
          if (!response.ok) {
            throw new Error(`Failed to refresh ${query.endpoint}`);
          }
          return response.json();
        })
      );
      onSuccess?.();
    } catch (error) {
      logger.error("Error refreshing metrics:", error);
      onError?.(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    handleRefresh,
  };
};
