"use client";

import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";

import { getProtocolLogo } from "@/app/portfolio/_components/shared/PortfolioMetrics";
import { NFTSummaryView } from "@/app/portfolio/_components/shared/SummaryViews";
import { WalletSummary } from "@/app/portfolio/_components/shared/WalletSummary";
import {
  AssetsTable,
  DeFiPositionsTable,
} from "@/app/portfolio/_components/tables/PortfolioTables";
import { YieldTable } from "@/app/portfolio/_components/tables/YieldTable";
import { usePortfolio } from "@/app/portfolio/_hooks";
import {
  usePortfolioContext,
  useSelection,
  useFilters,
} from "@/app/portfolio/_providers";
import { Button } from "@/components/ui/button";

export function MobileLayout() {
  const {
    address,
    assets,
    nfts,
    allNFTs,
    defiPositions,
    isLoading,
    nftsLoading,
    defiLoading,
    hasMoreNFTs,
    isLoadingMore,
    loadMoreNFTs,
    totalNFTCount,
    history,
    averageHistory,
    currentPrice,
    previousPrice,
  } = usePortfolioContext();

  const {
    selectedAsset,
    selectedNFT,
    selectedDeFiPosition,
    setSelectedAsset,
    setSelectedNFT,
    setSelectedDeFiPosition,
  } = useSelection();

  const {
    hideFilteredAssets,
    setHideFilteredAssets,
    filterAssets,
    defiSortBy,
    defiSortOrder,
    setDeFiSort,
  } = useFilters();

  const [aptPrice, setAptPrice] = useState<number | null>(null);

  // Fetch APT price
  React.useEffect(() => {
    const fetchAptPrice = async () => {
      try {
        const response = await fetch(
          "/api/prices/current?tokens=0x1::aptos_coin::AptosCoin",
        );
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            setAptPrice(data.data[0].price_usd);
          }
        }
      } catch {
        // Silent fail
      }
    };

    fetchAptPrice();
    const interval = setInterval(fetchAptPrice, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const visibleAssets = filterAssets(assets);

  // Group DeFi positions
  const groupedDeFiPositions = React.useMemo(() => {
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
          position.totalValueUSD ||
          position.totalValue ||
          position.tvl_usd ||
          0;
        const protocolType = position.protocolType || position.protocol_type;
        if (protocolType) {
          acc[protocol].protocolTypes.add(protocolType);
        }
        return acc;
      },
      {} as Record<string, unknown>,
    );

    return Object.values(grouped);
  }, [defiPositions]);

  // Use portfolio hook for metrics
  const {
    portfolioMetrics,
    pieChartData,
    pieChartColors,
    handleAssetSelect,
    handleDeFiPositionSelect,
    handleDeFiSort,
  } = usePortfolio((nfts || undefined, {
    portfolioAssets: visibleAssets || undefined,
    defiPositions: defiPositions || undefined,
    groupedDeFiPositions: groupedDeFiPositions || undefined,
    history: history || undefined,
    averageHistory: averageHistory || undefined,
    currentPrice: currentPrice || undefined,
    previousPrice: previousPrice || undefined,
  });

  return (
    <div className="lg:hidden space-y-6">
      {/* Portfolio Chart */}
      <WalletSummary
        walletAddress={address || ""}
        assets={visibleAssets}
        totalValue={portfolioMetrics?.totalPortfolioValue || 0}
        isLoading={isLoading}
        selectedAsset={selectedAsset}
        onAssetSelect={(asset) => {
          handleAssetSelect(asset);
          setSelectedAsset(asset);
        }}
        pieChartData={pieChartData}
        pieChartColors={pieChartColors}
        nfts={nfts}
        totalNFTCount={totalNFTCount}
        aptPrice={aptPrice || undefined}
      />

      {/* Tokens Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">
            Tokens ({visibleAssets?.length || 0})
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHideFilteredAssets(!hideFilteredAssets)}
            className="h-8 w-8 p-0 hover:bg-muted"
            title={
              hideFilteredAssets
                ? "Show all assets (including CELL tokens)"
                : "Hide low-value and CELL tokens"
            }
          >
            {hideFilteredAssets ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        <AssetsTable
          visibleAssets={visibleAssets}
          selectedItem={selectedAsset}
          showOnlyVerified={false}
          portfolioAssets={assets}
          onItemSelect={(asset) => {
            handleAssetSelect(asset);
            setSelectedAsset(asset);
          }}
        />
      </div>

      {/* NFTs Section */}
      {(totalNFTCount !== null && totalNFTCount > 0) ||
      (nfts && nfts.length > 0) ? (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            NFTs ({totalNFTCount !== null ? totalNFTCount : (nfts?.length ?? 0)}
            )
          </h3>
          <NFTSummaryView
            nfts={allNFTs || nfts}
            currentPageNFTs={nfts?.length || 0}
            onCollectionClick={() => {}}
            includeGrid={true}
            filteredNFTs={nfts || undefined}
            nftsLoading={nftsLoading}
            hasMoreNFTs={hasMoreNFTs}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMoreNFTs}
            selectedNFT={selectedNFT}
            onNFTSelect={setSelectedNFT}
          />
        </div>
      ) : null}

      {/* DeFi Positions Section */}
      {groupedDeFiPositions && groupedDeFiPositions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            DeFi Positions ({groupedDeFiPositions.length})
          </h3>
          <DeFiPositionsTable
            groupedDeFiPositions={groupedDeFiPositions}
            defiPositionsLoading={defiLoading}
            selectedItem={selectedDeFiPosition}
            defiSortBy={defiSortBy}
            defiSortOrder={defiSortOrder}
            getProtocolLogo={getProtocolLogo}
            onItemSelect={(position) => {
              handleDeFiPositionSelect(position);
              setSelectedDeFiPosition(position);
            }}
            onSortChange={(sortBy: string, order: "asc" | "desc") => {
              const by = sortBy as "value" | "protocol" | "type";
              handleDeFiSort(by, order);
              setDeFiSort(by, order);
            }}
          />
        </div>
      )}

      {/* Yield Opportunities Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Yield Opportunities</h3>
        <YieldTable walletAddress={address || ""} />
      </div>
    </div>
  );
}
