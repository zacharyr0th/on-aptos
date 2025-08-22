"use client";

import React from "react";

import { getProtocolLogo } from "@/app/portfolio/_components/shared/PortfolioMetrics";
import { usePortfolio } from "@/app/portfolio/_hooks";
import {
  useSelection,
  usePortfolioContext,
  useFilters,
} from "@/app/portfolio/_providers";

import { PortfolioMainContent } from "./MainContent";
import { PortfolioSidebar } from "./Sidebar";

export function DesktopLayout() {
  const {
    address,
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
    totalNFTCount,
    nftCollectionStats,
    history,
    averageHistory,
    currentPrice,
    previousPrice,
    accountNames,
  } = usePortfolioContext();

  const {
    selectedAsset,
    selectedNFT,
    selectedDeFiPosition,
    activeTab,
    sidebarView,
    setSelectedAsset,
    setSelectedNFT,
    setSelectedDeFiPosition,
    setActiveTab,
    setSidebarView,
  } = useSelection();

  const {
    hideFilteredAssets,
    setHideFilteredAssets,
    filterAssets,
    defiSortBy,
    defiSortOrder,
    setDeFiSort,
  } = useFilters();

  const visibleAssets = filterAssets(assets);

  // Group DeFi positions
  const groupedDeFiPositions = React.useMemo(() => {
    if (!defiPositions || !Array.isArray(defiPositions)) return [];

    const grouped = defiPositions.reduce(
      (acc: Record<string, unknown>, position) => {
        const protocol = position.protocol as string;
        if (!acc[protocol]) {
          acc[protocol] = {
            protocol,
            positions: [],
            totalValue: 0,
            protocolTypes: new Set(),
          };
        }
        (acc[protocol] as Record<string, unknown>).positions = [
          ...((acc[protocol] as Record<string, unknown>)
            .positions as unknown[]),
          position,
        ];
        const currentValue = (acc[protocol] as Record<string, unknown>)
          .totalValue as number;
        const positionValue = ((position.totalValueUSD ||)
          position.totalValue ||
          position.tvl_usd ||
          0) as number;
        (acc[protocol] as Record<string, unknown>).totalValue =
          currentValue + positionValue;
        const protocolType = position.protocolType || position.protocol_type;
        if (protocolType && typeof protocolType === "string") {
          (
            (acc[protocol] as Record<string, unknown>)
              .protocolTypes as Set<string>
          ).add(protocolType);
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
      >,
    );

    return Object.values(grouped);
  }, [defiPositions]);

  // Use portfolio hook for additional state
  const {
    shuffledNFTs,
    portfolioMetrics,
    pieChartData,
    pieChartColors,
    handleAssetSelect,
    handleDeFiPositionSelect,
    handleDeFiSort,
  } = usePortfolio(
    (nfts as unknown as import("@/lib/types/consolidated").NFT[]) || undefined,
    {
      portfolioAssets: visibleAssets || undefined,
      defiPositions: defiPositions || undefined,
      groupedDeFiPositions:
        (groupedDeFiPositions as unknown as Record<string, unknown>[]) ||
        undefined,
      history: (history as unknown as Record<string, unknown>[]) || undefined,
      averageHistory:
        (averageHistory as unknown as Record<string, unknown>[]) || undefined,
      currentPrice: (currentPrice as unknown as number) || undefined,
      previousPrice: (previousPrice as unknown as number) || undefined,
    },
  );

  return (
    <div className="hidden lg:grid grid-cols-1 lg:grid-cols-5 gap-6">
      <PortfolioSidebar
        sidebarView={sidebarView}
        setSidebarView={setSidebarView}
        visibleAssets={visibleAssets}
        selectedAsset={selectedAsset}
        handleAssetSelect={(asset) => {
          handleAssetSelect(asset);
          setSelectedAsset(asset);
        }}
        assets={assets}
        nfts={nfts}
        dataLoading={isLoading}
        nftsLoading={nftsLoading}
        defiLoading={defiLoading}
        hasMoreNFTs={hasMoreNFTs}
        isLoadingMore={isLoadingMore}
        loadMoreNFTs={loadMoreNFTs}
        selectedNFT={selectedNFT}
        setSelectedNFT={setSelectedNFT}
        accountNames={accountNames}
        groupedDeFiPositions={
          groupedDeFiPositions as unknown as Record<string, unknown>[]
        }
        selectedDeFiPosition={selectedDeFiPosition}
        defiSortBy={defiSortBy}
        defiSortOrder={defiSortOrder}
        getProtocolLogo={getProtocolLogo}
        handleDeFiPositionSelect={(position) => {
          handleDeFiPositionSelect(position);
          setSelectedDeFiPosition(position);
        }}
        handleDeFiSort={(sortBy: unknown, sortOrder: unknown) => {
          const by = sortBy as "value" | "protocol" | "type";
          const order = sortOrder as "asc" | "desc";
          handleDeFiSort(by, order);
          setDeFiSort(by, order);
        }}
        totalValue={portfolioMetrics?.totalPortfolioValue || 0}
        walletAddress={address}
        hideFilteredAssets={hideFilteredAssets}
        setHideFilteredAssets={setHideFilteredAssets}
        pieChartData={pieChartData}
        pieChartColors={pieChartColors}
        totalNFTCount={totalNFTCount}
        nftCollectionStats={
          nftCollectionStats as unknown as
            | {
                collections: { name: string; count: number }[];
                totalCollections: number;
              }
            | null
            | undefined
        }
      />

      <PortfolioMainContent
        activeTab={activeTab}
        setActiveTab={(tab: string) =>
          setActiveTab(tab as "portfolio" | "transactions" | "yield")
        }
        selectedAsset={selectedAsset}
        handleAssetSelect={(asset) => {
          handleAssetSelect(asset);
          setSelectedAsset(asset);
        }}
        selectedDeFiPosition={selectedDeFiPosition}
        handleDeFiPositionSelect={(position) => {
          handleDeFiPositionSelect(position);
          setSelectedDeFiPosition(position);
        }}
        selectedNFT={selectedNFT}
        setSelectedNFT={setSelectedNFT}
        sidebarView={sidebarView}
        setSidebarView={setSidebarView}
        nfts={nfts}
        currentNFTs={
          (shuffledNFTs as unknown as Record<string, unknown>[]) || []
        }
        normalizedAddress={address || ""}
        assets={visibleAssets}
        groupedDeFiPositions={
          groupedDeFiPositions as unknown as Record<string, unknown>[]
        }
        portfolioMetrics={portfolioMetrics}
        dataLoading={isLoading}
        pieChartData={pieChartData}
        pieChartColors={pieChartColors}
        accountNames={accountNames}
        setHoveredCollection={() => {}}
        setProtocolDetailsOpen={() => {}}
        totalNFTCount={totalNFTCount}
        nftCollectionStats={
          nftCollectionStats as unknown as
            | {
                collections: { name: string; count: number }[];
                totalCollections: number;
              }
            | null
            | undefined
        }
        defiPositions={defiPositions}
        transactions={transactions}
        transactionsLoading={transactionsLoading}
      />
    </div>
  );
}
