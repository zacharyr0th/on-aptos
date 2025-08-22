import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";


// Portfolio data query
export function usePortfolioData(
  walletAddress: string | undefined,
  options = {},
) {
  return useQuery({
    queryKey: ["portfolio", walletAddress],
    queryFn: async () => {
      if (!walletAddress) throw new Error("Wallet address required");

      const response = await fetch(
        `/api/portfolio/batch?${new URLSearchParams({
          walletAddress,
          nftLimit: "5000",
          includeAllNFTs: "true",
        })}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch portfolio: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!walletAddress,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

// Current prices query
export function useCurrentPrices(
  tokens?: string[],
  source: "panora" | "cmc" | "all" = "panora",
) {
  return useQuery({
    queryKey: ["prices", "current", tokens, source],
    queryFn: async () => {
      const params = new URLSearchParams({ source });
      if (tokens && tokens.length > 0) {
        params.set("tokens", tokens.join(","));
      }

      const response = await fetch(`/api/prices/current?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 1, // 1 minute for prices
    gcTime: 1000 * 60 * 5,
  });
}

// Price history query
export function usePriceHistory(
  tokenAddress: string | undefined,
  lookback: string = "day",
  downsampleTo: number = 48,
) {
  return useQuery({
    queryKey: ["prices", "history", tokenAddress, lookback, downsampleTo],
    queryFn: async () => {
      if (!tokenAddress) throw new Error("Token address required");

      const params = new URLSearchParams({
        address: tokenAddress,
        lookback,
        downsample_to: downsampleTo.toString(),
      });

      const response = await fetch(`/api/prices/history?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch price history: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!tokenAddress,
    staleTime: 1000 * 60 * 5, // 5 minutes for historical data
    gcTime: 1000 * 60 * 15,
  });
}

// Token data query (APT/BTC/Stables/RWA)
export function useTokenData(
  category: "btc" | "stables" | "rwa" | "tokens",
  params?: Record<string, string>,
) {
  return useQuery({
    queryKey: ["tokens", category, params],
    queryFn: async () => {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`/api/aptos/${category}?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${category} data: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,
  });
}

// ANS name query
export function useANSName(address: string | undefined) {
  return useQuery({
    queryKey: ["ans", "name", address],
    queryFn: async () => {
      if (!address) throw new Error("Address required");

      const response = await fetch(`/api/portfolio/ans?address=${address}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ANS name: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!address,
    staleTime: 1000 * 60 * 10, // 10 minutes (names don't change often)
    gcTime: 1000 * 60 * 30,
  });
}

// Transaction details query
export function useTransactionDetails(
  walletAddress: string | undefined,
  version: string | undefined,
) {
  return useQuery({
    queryKey: ["transaction", "details", walletAddress, version],
    queryFn: async () => {
      if (!walletAddress || !version)
        throw new Error("Wallet address and version required");

      const response = await fetch(
        `/api/portfolio/transactions/details?address=${walletAddress}&version=${version}`,
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch transaction details: ${response.status}`,
        );
      }

      return response.json();
    },
    enabled: !!(walletAddress && version),
    staleTime: 1000 * 60 * 30, // 30 minutes (transactions are immutable)
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

// GitHub stats query
export function useGitHubStats() {
  return useQuery({
    queryKey: ["github", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/github/stats");
      if (!response.ok) {
        throw new Error(`Failed to fetch GitHub stats: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60,
  });
}

// Balance history query
export function useBalanceHistory(
  walletAddress: string | undefined,
  params?: Record<string, string>,
) {
  return useQuery({
    queryKey: ["analytics", "balance-history", walletAddress, params],
    queryFn: async () => {
      if (!walletAddress) throw new Error("Wallet address required");

      const queryParams = new URLSearchParams({ walletAddress, ...params });
      const response = await fetch(
        `/api/analytics/balance-history?${queryParams}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch balance history: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!walletAddress,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });
}

// Error reporting mutation
export function useErrorReporting() {
  return useMutation({
    mutationFn: async (error: Record<string, unknown>) => {
      const response = await fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(error),
      });

      if (!response.ok) {
        throw new Error("Failed to report error");
      }

      return response.json();
    },
    onError: (error) => {
      apiLogger.error(`Failed to report error: ${error}`);
    },
  });
}

// Performance metrics mutation
export function usePerformanceReporting() {
  return useMutation({
    mutationFn: async (metrics: Record<string, unknown>) => {
      const response = await fetch("/api/analytics/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics),
      });

      if (!response.ok) {
        throw new Error("Failed to report performance metrics");
      }

      return response.json();
    },
    onError: (error) => {
      apiLogger.error(`Failed to report performance metrics: ${error}`);
    },
  });
}
