import { useCallback, useMemo } from "react";

import { usePortfolio } from "./usePortfolio";
import { usePortfolioData } from "./usePortfolioData";
import { usePortfolioHistory } from "./usePortfolioHistory";

interface UseSimplifiedPortfolioProps {
  walletAddress: string | undefined;
  hideFilteredAssets: boolean;
  selectedTimeframe: "1h" | "12h" | "24h" | "7d" | "30d" | "90d" | "1y" | "all";
}

export function useSimplifiedPortfolio({
  walletAddress,
  hideFilteredAssets,
  selectedTimeframe,
}: UseSimplifiedPortfolioProps) {
  // Fetch portfolio data
  const {
    assets,
    nfts,
    defiPositions,
    transactions,
    isLoading: dataLoading,
    nftsLoading,
    defiLoading,
    transactionsLoading,
    hasMoreNFTs,
    hasMoreTransactions,
    isLoadingMore,
    loadMoreNFTs,
    loadMoreTransactions,
    error: dataError,
    totalNFTCount,
    allNFTs,
    nftCollectionStats,
  } = usePortfolioData(walletAddress, false);

  // Fetch portfolio history
  const {
    data: history,
    isLoading: historyLoading,
    currentPrice,
    previousPrice,
    averageHistory,
    accountNames,
  } = usePortfolioHistory(walletAddress, { timeframe: selectedTimeframe });

  // Filter and process assets
  const visibleAssets = useMemo(() => {
    if (!assets) return [];

    if (!hideFilteredAssets) return assets;

    return assets.filter((asset) => {
      // Always include APT
      if (asset.asset_type === "0x1::aptos_coin::AptosCoin") return true;

      // Filter out CELL tokens
      const isCellToken =
        asset.asset_type === "0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12" ||
        asset.metadata?.symbol === "CELL";
      if (isCellToken) return false;

      // Filter out assets under $0.01
      return (asset.value || 0) >= 0.01;
    });
  }, [assets, hideFilteredAssets]);

  // Group DeFi positions with memoization
  const groupedDeFiPositions = useMemo(() => {
    if (!defiPositions || !Array.isArray(defiPositions)) return [];

    const grouped = defiPositions.reduce(
      (acc, position) => {
        const protocol = position.protocol;
        if (!acc[protocol]) {
          acc[protocol] = {
            protocol,
            positions: [],
            totalValue: 0,
            protocolTypes: new Set(),
          };
        }
        acc[protocol].positions.push(position);
        acc[protocol].totalValue +=
          position.totalValueUSD || position.totalValue || position.tvl_usd || 0;
        const protocolType = position.protocolType || position.protocol_type;
        if (protocolType) {
          acc[protocol].protocolTypes.add(protocolType);
        }
        return acc;
      },
      {} as Record<
        string,
        {
          protocol: string;
          positions: typeof defiPositions;
          totalValue: number;
          protocolTypes: Set<string>;
        }
      >
    );

    return Object.values(grouped);
  }, [defiPositions]);

  // Use simplified portfolio hook for derived state
  const { portfolioMetrics, pieChartData, pieChartColors } = usePortfolio(nfts || undefined, {
    portfolioAssets: visibleAssets || undefined,
    defiPositions: defiPositions || undefined,
    groupedDeFiPositions: groupedDeFiPositions || undefined,
    history: history || undefined,
    averageHistory: averageHistory || undefined,
    currentPrice: currentPrice || undefined,
    previousPrice: previousPrice || undefined,
  });

  // Show skeleton until ALL data is loaded
  const isLoading =
    dataLoading || historyLoading || nftsLoading || defiLoading || transactionsLoading;

  return {
    // Data
    assets,
    visibleAssets,
    nfts: nfts || [],
    defiPositions: defiPositions || [],
    groupedDeFiPositions,
    transactions,

    // Metrics
    portfolioMetrics,
    pieChartData,
    pieChartColors,
    totalNFTCount,
    allNFTs: allNFTs || [],
    nftCollectionStats,

    // History
    history,
    currentPrice,
    previousPrice,
    averageHistory,
    accountNames,

    // Loading states
    isLoading,
    dataLoading,
    nftsLoading,
    defiLoading,
    transactionsLoading,
    historyLoading,

    // NFT pagination
    hasMoreNFTs,
    hasMoreTransactions,
    isLoadingMore,
    loadMoreNFTs,
    loadMoreTransactions,

    // Error
    error: dataError,
  };
}
