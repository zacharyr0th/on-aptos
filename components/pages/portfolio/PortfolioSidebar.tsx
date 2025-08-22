"use client";

import { X } from "lucide-react";
import React, { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";

// Import shared utilities
import { AssetsTable, DeFiPositionsTable } from "./PortfolioTables";
import { PortfolioTabs } from "./shared/ResponsiveTabs";
import { UnifiedNFTGrid } from "./shared/UnifiedNFTGrid";
import { NFTSummaryView } from "./SummaryViews";

interface PortfolioSidebarProps {
  sidebarView: "assets" | "nfts" | "defi";
  setSidebarView: (view: "assets" | "nfts" | "defi") => void;
  visibleAssets: any[];
  selectedAsset: any;
  handleAssetSelect: (asset: any) => void;
  assets: any[];
  nfts: any[];
  dataLoading: boolean;
  nftsLoading?: boolean;
  defiLoading?: boolean;
  hasMoreNFTs?: boolean;
  isLoadingMore?: boolean;
  loadMoreNFTs?: () => void;
  selectedNFT: any;
  setSelectedNFT: (nft: any) => void;
  accountNames?: string[] | null;
  groupedDeFiPositions: any[];
  selectedDeFiPosition: any;
  defiSortBy: any;
  defiSortOrder: any;
  getProtocolLogo: (protocol: string) => string;
  handleDeFiPositionSelect: (position: any) => void;
  handleDeFiSort: (sortBy: any, sortOrder: any) => void;
  totalValue?: number;
  walletAddress?: string;
  hideFilteredAssets?: boolean;
  setHideFilteredAssets?: (value: boolean) => void;
  pieChartData?: any;
  pieChartColors?: any;
  totalNFTCount?: number | null;
  nftCollectionStats?: {
    collections: Array<{ name: string; count: number }>;
    totalCollections: number;
  } | null;
}

export const PortfolioSidebar: React.FC<PortfolioSidebarProps> = ({
  sidebarView,
  setSidebarView,
  visibleAssets,
  selectedAsset,
  handleAssetSelect,
  assets,
  nfts,
  dataLoading,
  nftsLoading,
  defiLoading,
  hasMoreNFTs,
  isLoadingMore,
  loadMoreNFTs,
  selectedNFT,
  setSelectedNFT,
  accountNames,
  groupedDeFiPositions,
  selectedDeFiPosition,
  defiSortBy,
  defiSortOrder,
  getProtocolLogo,
  handleDeFiPositionSelect,
  handleDeFiSort,
  totalValue,
  walletAddress,
  hideFilteredAssets,
  setHideFilteredAssets,
  pieChartData,
  pieChartColors,
  totalNFTCount,
  nftCollectionStats,
}) => {
  const [nftSearchQuery, setNftSearchQuery] = useState("");

  const filteredNFTs = useMemo(() => {
    if (!nftSearchQuery || !nfts) return nfts;

    const query = nftSearchQuery.toLowerCase();
    return nfts.filter(
      (nft) =>
        nft.token_name?.toLowerCase().includes(query) ||
        nft.collection_name?.toLowerCase().includes(query) ||
        nft.description?.toLowerCase().includes(query),
    );
  }, [nfts, nftSearchQuery]);

  return (
    <div className="flex flex-col">
      {/* Tabs - Fixed height */}
      <div className="flex-shrink-0 mb-3">
        <PortfolioTabs
          tokensCount={visibleAssets?.length || 0}
          nftsCount={
            totalNFTCount !== null && totalNFTCount !== undefined
              ? totalNFTCount
              : nfts?.length || 0
          }
          defiCount={groupedDeFiPositions?.length || 0}
          activeTab={sidebarView}
          onTabChange={(tab) => setSidebarView(tab as "assets" | "nfts" | "defi")}
          tokensContent={<></>}
          nftsContent={<></>}
          defiContent={<></>}
          eyeToggle={
            setHideFilteredAssets
              ? {
                  show: !hideFilteredAssets,
                  onToggle: () => setHideFilteredAssets(!hideFilteredAssets),
                }
              : undefined
          }
        />
      </div>

      {/* Content */}
      <div>
        {sidebarView === "assets" && (
          <AssetsTable
            assets={visibleAssets}
            selectedAsset={selectedAsset}
            onAssetSelect={handleAssetSelect}
            isLoading={dataLoading}
            accountNames={accountNames}
            hideFilteredAssets={hideFilteredAssets}
            setHideFilteredAssets={setHideFilteredAssets}
          />
        )}

        {sidebarView === "nfts" && (
          <div className="flex flex-col">
            {/* Search - Fixed */}
            <div className="flex-shrink-0 mb-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search NFTs..."
                  value={nftSearchQuery}
                  onChange={(e) => setNftSearchQuery(e.target.value)}
                  className="pl-3 pr-8 text-sm"
                />
                {nftSearchQuery && (
                  <button
                    onClick={() => setNftSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* NFT Grid - Flexible */}
            <div className="flex-1 min-h-0">
              <UnifiedNFTGrid
                nfts={filteredNFTs}
                totalNFTCount={totalNFTCount}
                selectedNFT={selectedNFT}
                onNFTSelect={setSelectedNFT}
                isLoading={nftsLoading}
                hasMoreNFTs={hasMoreNFTs}
                isLoadingMore={isLoadingMore}
                loadMoreNFTs={loadMoreNFTs}
                accountNames={accountNames}
                nftCollectionStats={nftCollectionStats}
              />
            </div>
          </div>
        )}

        {sidebarView === "defi" && (
          <DeFiPositionsTable
            positions={groupedDeFiPositions}
            selectedPosition={selectedDeFiPosition}
            onPositionSelect={handleDeFiPositionSelect}
            isLoading={defiLoading}
            sortBy={defiSortBy}
            sortOrder={defiSortOrder}
            onSort={handleDeFiSort}
            getProtocolLogo={getProtocolLogo}
            className="defi-table-container"
          />
        )}
      </div>
    </div>
  );
};