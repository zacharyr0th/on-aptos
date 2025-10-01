import React from "react";
import { cn } from "@/lib/utils";
import { PortfolioMainContent } from "../PortfolioMainContent";
import { NewSidebar } from "./NewSidebar";

import { PriceList } from "./PriceList";

interface PortfolioLayoutProps {
  normalizedAddress: string;
  visibleAssets: any[];
  assets: any[];
  nfts: any[];
  groupedDeFiPositions: any[];
  portfolioMetrics: any;
  pieChartData: any;
  pieChartColors: any;
  dataLoading: boolean;
  nftsLoading: boolean;
  defiLoading: boolean;
  transactionsLoading: boolean;
  hasMoreNFTs: boolean;
  hasMoreTransactions: boolean;
  isLoadingMore: boolean;
  loadMoreNFTs: () => void;
  loadMoreTransactions?: () => void;
  totalNFTCount: number | null;
  nftCollectionStats: any;
  allNFTs: any[];
  defiPositions: any[];
  transactions: any;
  accountNames: any;
  aptPrice: number | null;
  selectedItem: any;
  activeTab: "portfolio" | "transactions" | "yield";
  sidebarView: "assets" | "nfts";
  hideFilteredAssets: boolean;
  defiSortBy: "protocol" | "value" | "type";
  defiSortOrder: "asc" | "desc";
  onItemSelect: (type: "asset" | "nft" | "defi" | null, data: any) => void;
  onTabChange: (tab: "portfolio" | "transactions" | "yield") => void;
  onSidebarViewChange: (view: "assets" | "nfts") => void;
  onToggleFilteredAssets: () => void;
  onDeFiSort: (sortBy: "protocol" | "value" | "type", sortOrder: "asc" | "desc") => void;
}

export function PortfolioLayout({
  normalizedAddress,
  visibleAssets,
  assets,
  nfts,
  groupedDeFiPositions,
  portfolioMetrics,
  pieChartData,
  pieChartColors,
  dataLoading,
  nftsLoading,
  defiLoading,
  transactionsLoading,
  hasMoreNFTs,
  hasMoreTransactions,
  isLoadingMore,
  loadMoreNFTs,
  loadMoreTransactions,
  totalNFTCount,
  nftCollectionStats,
  allNFTs,
  defiPositions,
  transactions,
  accountNames,
  aptPrice,
  selectedItem,
  activeTab,
  sidebarView,
  hideFilteredAssets,
  defiSortBy,
  defiSortOrder,
  onItemSelect,
  onTabChange,
  onSidebarViewChange,
  onToggleFilteredAssets,
  onDeFiSort,
}: PortfolioLayoutProps) {
  const selectedAsset = selectedItem?.type === "asset" ? selectedItem.data : null;
  const selectedNFT = selectedItem?.type === "nft" ? selectedItem.data : null;
  const selectedDeFiPosition = selectedItem?.type === "defi" ? selectedItem.data : null;

  return (
    <div className="h-full flex flex-col">
      {/* Desktop Layout - Optimized Grid */}
      <div className="hidden lg:grid grid-cols-12 gap-6 h-full p-6">
        {/* Sidebar - 3 columns (25%) */}
        <div className="col-span-3 h-full overflow-hidden">
          <div className="bg-card border rounded-lg shadow-sm h-full">
            <NewSidebar
              assets={visibleAssets}
              nfts={nfts}
              defiPositions={groupedDeFiPositions}
              assetsLoading={dataLoading}
              nftsLoading={nftsLoading}
              defiLoading={defiLoading}
              selectedAsset={selectedAsset}
              selectedNFT={selectedNFT}
              selectedDeFi={selectedDeFiPosition}
              onAssetSelect={(asset) => onItemSelect(asset ? "asset" : null, asset)}
              onNFTSelect={(nft) => onItemSelect(nft ? "nft" : null, nft)}
              onDeFiSelect={(defi) => onItemSelect(defi ? "defi" : null, defi)}
              totalValue={portfolioMetrics?.totalPortfolioValue || 0}
              totalNFTCount={totalNFTCount}
            />
          </div>
        </div>

        {/* Main Content - 6 columns (50%) */}
        <div className="col-span-6 h-full overflow-hidden">
          <div className="bg-card border rounded-lg shadow-sm h-full">
          <PortfolioMainContent
            activeTab={activeTab}
            setActiveTab={onTabChange as any}
            selectedAsset={selectedAsset}
            handleAssetSelect={(asset) => onItemSelect(asset ? "asset" : null, asset)}
            selectedNFT={selectedNFT}
            setSelectedNFT={(nft) => onItemSelect(nft ? "nft" : null, nft)}
            sidebarView={sidebarView}
            setSidebarView={onSidebarViewChange}
            nfts={nfts}
            currentNFTs={nfts}
            normalizedAddress={normalizedAddress}
            assets={visibleAssets}
            portfolioMetrics={portfolioMetrics}
            dataLoading={dataLoading}
            pieChartData={pieChartData}
            pieChartColors={pieChartColors}
            accountNames={accountNames}
            setHoveredCollection={() => {}}
            setProtocolDetailsOpen={() => {}}
            totalNFTCount={totalNFTCount}
            nftCollectionStats={nftCollectionStats}
            defiPositions={defiPositions}
            transactions={transactions}
            transactionsLoading={transactionsLoading}
            hasMoreTransactions={hasMoreTransactions}
            loadMoreTransactions={loadMoreTransactions}
          />
          </div>
        </div>

        {/* Price List - 3 columns (25%) */}
        <div className="col-span-3 h-full overflow-hidden">
          <div className="bg-card border rounded-lg shadow-sm h-full">
            <PriceList className="h-full" />
          </div>
        </div>
      </div>

      {/* Mobile Layout - Simplified */}
      <div className="lg:hidden h-full flex flex-col overflow-hidden">
        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-card border rounded-lg shadow-sm p-4">
            <div className="space-y-4">
            {/* Portfolio Value */}
            <div>
              <p className="text-2xl font-bold">
                {portfolioMetrics?.totalPortfolioValue
                  ? `$${portfolioMetrics.totalPortfolioValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "$0.00"}
              </p>
            </div>

            {/* Assets List */}
            {visibleAssets && visibleAssets.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Tokens</h3>
                <div className="space-y-1">
                  {visibleAssets.map((asset, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedAsset === asset && "bg-muted"
                      )}
                      onClick={() => onItemSelect("asset", asset)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                          {asset.metadata?.symbol?.[0] || "?"}
                        </div>
                        <span className="text-sm font-medium">
                          {asset.metadata?.symbol || "Unknown"}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        $
                        {(asset.value || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NFTs Grid */}
            {nfts && nfts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  NFTs ({totalNFTCount || nfts.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {nfts.slice(0, 6).map((nft, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                      onClick={() => onItemSelect("nft", nft)}
                    >
                      {nft.cdn_image_uri && (
                        <img
                          src={nft.cdn_image_uri}
                          alt={nft.token_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
                {totalNFTCount && totalNFTCount > 6 && (
                  <p className="text-xs text-muted-foreground mt-2">+{totalNFTCount - 6} more</p>
                )}
              </div>
            )}

            {/* DeFi Positions */}
            {groupedDeFiPositions && groupedDeFiPositions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">DeFi</h3>
                <div className="space-y-1">
                  {groupedDeFiPositions.map((position, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedDeFiPosition === position && "bg-muted"
                      )}
                      onClick={() => onItemSelect("defi", position)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                          {position.protocol?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="text-sm font-medium">
                          {position.protocol || "Unknown"}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        $
                        {(position.totalValue || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
