"use client";

import { X } from "lucide-react";
import React, { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

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

// Removed - using shared utilities now

export function PortfolioSidebar({
  sidebarView,
  setSidebarView,
  visibleAssets,
  selectedAsset,
  handleAssetSelect,
  assets,
  nfts,
  dataLoading: _dataLoading,
  nftsLoading = false,
  defiLoading = false,
  hasMoreNFTs = false,
  isLoadingMore = false,
  loadMoreNFTs,
  selectedNFT,
  setSelectedNFT,
  accountNames: _accountNames,
  groupedDeFiPositions,
  selectedDeFiPosition,
  defiSortBy,
  defiSortOrder,
  getProtocolLogo,
  handleDeFiPositionSelect,
  handleDeFiSort,
  totalValue: _totalValue = 0,
  walletAddress: _walletAddress,
  hideFilteredAssets = true,
  setHideFilteredAssets,
  pieChartData: _pieChartData,
  pieChartColors: _pieChartColors,
  totalNFTCount,
  nftCollectionStats,
}: PortfolioSidebarProps) {
  const [nftSearchQuery, setNftSearchQuery] = useState("");

  // Removed chart data - no longer needed in sidebar

  // Filter NFTs based on search query
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
    <div className="lg:col-span-2 space-y-4 mt-4">
      {/* Use unified responsive tabs */}
      <PortfolioTabs
        tokensCount={visibleAssets?.length || 0}
        nftsCount={
          totalNFTCount != null
            ? totalNFTCount
            : (nfts?.length || 0) > 0
              ? `${nfts?.length || 0}+`
              : 0
        }
        defiCount={groupedDeFiPositions?.length || 0}
        activeTab={sidebarView}
        onTabChange={(tab) => setSidebarView(tab as any)}
        eyeToggle={
          setHideFilteredAssets
            ? {
                show: !hideFilteredAssets,
                onToggle: () => setHideFilteredAssets(!hideFilteredAssets),
                showTitle: "Show all assets (including CELL tokens)",
                hideTitle: "Hide low-value and CELL tokens",
              }
            : undefined
        }
        tokensContent={
          <div className="space-y-3">
            <AssetsTable
              visibleAssets={visibleAssets}
              selectedItem={selectedAsset}
              showOnlyVerified={false}
              portfolioAssets={assets || []}
              onItemSelect={handleAssetSelect}
            />
          </div>
        }
        nftsContent={
          <div className="space-y-3">
            <div className="relative group">
              <Input
                type="text"
                placeholder="Search NFTs by name or collection..."
                value={nftSearchQuery}
                onChange={(e) => setNftSearchQuery(e.target.value)}
                className="pr-3 h-10 bg-background/50 backdrop-blur-sm border-muted-foreground/20 hover:border-muted-foreground/40 focus:bg-background transition-all duration-200"
              />
              {nftSearchQuery && (
                <button
                  onClick={() => setNftSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {nftSearchQuery && (
              <p className="text-xs text-muted-foreground">
                {filteredNFTs?.length || 0}{" "}
                {filteredNFTs?.length === 1 ? "result" : "results"} found
              </p>
            )}

            {/* NFT Content - Desktop vs Mobile layout */}
            <div className="hidden lg:block">
              {/* Desktop: Just the grid in ScrollArea */}
              <ScrollArea className="h-[calc(100vh-380px)]">
                <div data-nft-grid className="nft-grid-container">
                  <UnifiedNFTGrid
                    nfts={filteredNFTs || nfts || []}
                    nftsLoading={nftsLoading}
                    selectedNFT={selectedNFT}
                    onNFTSelect={(nft) => setSelectedNFT(nft)}
                    variant="minimal"
                    columns={3}
                    hasMoreNFTs={hasMoreNFTs}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={loadMoreNFTs}
                    showMetadata={false}
                  />
                </div>
              </ScrollArea>
            </div>

            {/* Mobile: NFT Summary View with everything */}
            <div className="lg:hidden">
              <NFTSummaryView
                nfts={nfts || []}
                currentPageNFTs={nfts?.length || 0}
                totalNFTCount={totalNFTCount}
                nftCollectionStats={nftCollectionStats}
                onCollectionClick={() => {}}
                includeGrid={true}
                filteredNFTs={filteredNFTs}
                nftsLoading={nftsLoading}
                hasMoreNFTs={hasMoreNFTs}
                isLoadingMore={isLoadingMore}
                onLoadMore={loadMoreNFTs}
                selectedNFT={selectedNFT}
                onNFTSelect={(nft) => setSelectedNFT(nft)}
              />
            </div>
          </div>
        }
        defiContent={
          <ScrollArea className="h-[calc(100vh-280px)]">
            <DeFiPositionsTable
              groupedDeFiPositions={groupedDeFiPositions}
              defiPositionsLoading={defiLoading}
              selectedItem={selectedDeFiPosition}
              defiSortBy={defiSortBy}
              defiSortOrder={defiSortOrder}
              getProtocolLogo={getProtocolLogo}
              onItemSelect={handleDeFiPositionSelect}
              onSortChange={handleDeFiSort}
            />
          </ScrollArea>
        }
      />
    </div>
  );
}
