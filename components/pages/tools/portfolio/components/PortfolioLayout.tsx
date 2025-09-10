import React from "react";
import { cn } from "@/lib/utils";
import { PortfolioMainContent } from "../PortfolioMainContent";
import { SimplifiedAssetsTable, SimplifiedDeFiTable } from "../SimplifiedPortfolioTables";
import { NFTSummaryView } from "../SummaryViews";
import { getProtocolLogo } from "../shared/PortfolioMetrics";
import { TransactionHistoryTable } from "../TransactionHistoryTable";
import { WalletSummary } from "../WalletSummary";
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
      <div className="hidden lg:grid grid-cols-12 gap-2 h-full">
        {/* Sidebar - 3 columns (25%) */}
        <div className="col-span-3 h-full overflow-hidden">
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

        {/* Main Content - 6 columns (50%) */}
        <div className="col-span-6 h-full overflow-hidden">
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

        {/* Price List - 3 columns (25%) */}
        <div className="col-span-3 h-full overflow-hidden">
          <PriceList className="h-full" />
        </div>
      </div>

      {/* Mobile Layout - Following BTC/Stables Pattern */}
      <div className="lg:hidden h-full flex flex-col overflow-hidden">
        {/* Mobile: Show portfolio value at top like BTC/Stables */}
        <div className="flex-none px-4 py-4">
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm text-muted-foreground">Portfolio Value</h2>
            </div>
            <p className="text-xl font-bold font-mono">
              {portfolioMetrics?.totalPortfolioValue
                ? `$${portfolioMetrics.totalPortfolioValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "$0.00"}
            </p>
          </div>
        </div>

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-6">
            {/* Wallet Summary Section */}
            <div className="space-y-4">
              <WalletSummary
                walletAddress={normalizedAddress}
                assets={visibleAssets}
                totalValue={portfolioMetrics?.totalPortfolioValue || 0}
                isLoading={dataLoading}
                selectedAsset={selectedAsset}
                onAssetSelect={(asset) => onItemSelect(asset ? "asset" : null, asset)}
                nfts={nfts}
                totalNFTCount={totalNFTCount}
                nftCollectionStats={nftCollectionStats}
              />
            </div>

            {/* NFTs Section - Only show if user has NFTs */}
            {((nfts && nfts.length > 0) || (totalNFTCount && totalNFTCount > 0)) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  NFTs ({totalNFTCount || nfts?.length || 0})
                </h3>
                <NFTSummaryView
                  nfts={nfts}
                  totalNFTCount={totalNFTCount}
                  nftCollectionStats={nftCollectionStats}
                  accountNames={accountNames}
                  isLoading={nftsLoading}
                  onNFTSelect={(nft) => onItemSelect(nft ? "nft" : null, nft)}
                  selectedNFT={selectedNFT}
                  hasMoreNFTs={hasMoreNFTs}
                  isLoadingMore={isLoadingMore}
                  loadMoreNFTs={loadMoreNFTs}
                />
              </div>
            )}

            {/* DeFi Section - Only show if user has DeFi positions */}
            {groupedDeFiPositions && groupedDeFiPositions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">DeFi ({groupedDeFiPositions.length})</h3>
                <SimplifiedDeFiTable
                  groupedDeFiPositions={groupedDeFiPositions}
                  selectedPosition={selectedDeFiPosition}
                  onPositionSelect={(pos: any) => onItemSelect(pos ? "defi" : null, pos)}
                  isLoading={defiLoading}
                  getProtocolLogo={getProtocolLogo}
                />
              </div>
            )}

            {/* Transactions Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
              <TransactionHistoryTable
                transactions={transactions}
                isLoading={transactionsLoading}
                walletAddress={normalizedAddress}
                hasMoreTransactions={hasMoreTransactions}
                loadMoreTransactions={loadMoreTransactions}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
