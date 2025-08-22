import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortfolioSidebar } from "../PortfolioSidebar";
import { PortfolioMainContent } from "../PortfolioMainContent";
import { WalletSummary } from "../WalletSummary";
import { AssetsTable, DeFiPositionsTable } from "../PortfolioTables";
import { NFTSummaryView } from "../SummaryViews";
import { YieldTable } from "../YieldTable";
import { getProtocolLogo } from "../shared/PortfolioMetrics";
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
  isLoadingMore: boolean;
  loadMoreNFTs: () => void;
  totalNFTCount: number | null;
  nftCollectionStats: any;
  allNFTs: any[];
  defiPositions: any[];
  transactions: any;
  accountNames: any;
  aptPrice: number | null;
  selectedItem: any;
  activeTab: 'portfolio' | 'transactions' | 'yield';
  sidebarView: 'assets' | 'nfts' | 'defi';
  hideFilteredAssets: boolean;
  defiSortBy: 'protocol' | 'value' | 'type';
  defiSortOrder: 'asc' | 'desc';
  onItemSelect: (type: 'asset' | 'nft' | 'defi' | null, data: any) => void;
  onTabChange: (tab: string) => void;
  onSidebarViewChange: (view: 'assets' | 'nfts' | 'defi') => void;
  onToggleFilteredAssets: () => void;
  onDeFiSort: (sortBy: 'protocol' | 'value' | 'type', sortOrder: 'asc' | 'desc') => void;
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
  isLoadingMore,
  loadMoreNFTs,
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
  const selectedAsset = selectedItem?.type === 'asset' ? selectedItem.data : null;
  const selectedNFT = selectedItem?.type === 'nft' ? selectedItem.data : null;
  const selectedDeFiPosition = selectedItem?.type === 'defi' ? selectedItem.data : null;

  return (
    <>
      {/* Desktop Layout - Optimized Grid */}
      <div className="hidden lg:grid grid-cols-10 gap-2">
        {/* Sidebar - 3 columns (30%) */}
        <div className="col-span-3 min-h-0">
          <PortfolioSidebar
            sidebarView={sidebarView}
            setSidebarView={onSidebarViewChange}
            visibleAssets={visibleAssets}
            selectedAsset={selectedAsset}
            handleAssetSelect={(asset) => onItemSelect(asset ? 'asset' : null, asset)}
            assets={assets}
            nfts={nfts}
            dataLoading={dataLoading}
            nftsLoading={nftsLoading}
            defiLoading={defiLoading}
            hasMoreNFTs={hasMoreNFTs}
            isLoadingMore={isLoadingMore}
            loadMoreNFTs={loadMoreNFTs}
            selectedNFT={selectedNFT}
            setSelectedNFT={(nft) => onItemSelect(nft ? 'nft' : null, nft)}
            accountNames={accountNames}
            groupedDeFiPositions={groupedDeFiPositions}
            selectedDeFiPosition={selectedDeFiPosition}
            defiSortBy={defiSortBy}
            defiSortOrder={defiSortOrder}
            getProtocolLogo={getProtocolLogo}
            handleDeFiPositionSelect={(pos) => onItemSelect(pos ? 'defi' : null, pos)}
            handleDeFiSort={(sortBy, sortOrder) => onDeFiSort(sortBy as 'protocol' | 'value' | 'type', sortOrder as 'asc' | 'desc')}
            totalValue={portfolioMetrics?.totalPortfolioValue || 0}
            walletAddress={normalizedAddress}
            hideFilteredAssets={hideFilteredAssets}
            setHideFilteredAssets={onToggleFilteredAssets}
            pieChartData={pieChartData}
            pieChartColors={pieChartColors}
            totalNFTCount={totalNFTCount}
            nftCollectionStats={nftCollectionStats}
          />
        </div>

        {/* Main Content - 5 columns (50%) */}
        <div className="col-span-5 min-h-0">
          <PortfolioMainContent
            activeTab={activeTab}
            setActiveTab={onTabChange}
            selectedAsset={selectedAsset}
            handleAssetSelect={(asset) => onItemSelect(asset ? 'asset' : null, asset)}
            selectedDeFiPosition={selectedDeFiPosition}
            handleDeFiPositionSelect={(pos) => onItemSelect(pos ? 'defi' : null, pos)}
            selectedNFT={selectedNFT}
            setSelectedNFT={(nft) => onItemSelect(nft ? 'nft' : null, nft)}
            sidebarView={sidebarView}
            setSidebarView={onSidebarViewChange}
            nfts={nfts}
            currentNFTs={nfts}
            normalizedAddress={normalizedAddress}
            assets={visibleAssets}
            groupedDeFiPositions={groupedDeFiPositions}
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
          />
        </div>

        {/* Price List - 2 columns (20%) */}
        <div className="col-span-2 min-h-0">
          <PriceList />
        </div>
      </div>

      {/* Mobile Layout - Streamlined */}
      <div className="lg:hidden space-y-3">
        <WalletSummary
          walletAddress={normalizedAddress}
          assets={visibleAssets}
          totalValue={portfolioMetrics?.totalPortfolioValue || 0}
          isLoading={dataLoading}
          selectedAsset={selectedAsset}
          onAssetSelect={(asset) => onItemSelect(asset ? 'asset' : null, asset)}
          pieChartData={pieChartData}
          pieChartColors={pieChartColors}
          nfts={nfts}
          totalNFTCount={totalNFTCount}
          aptPrice={aptPrice || undefined}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">
              Tokens ({visibleAssets?.length || 0})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFilteredAssets}
              className="text-xs"
            >
              {hideFilteredAssets ? (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Show All
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hide Small
                </>
              )}
            </Button>
          </div>
          <AssetsTable
            visibleAssets={visibleAssets}
            selectedItem={selectedAsset}
            showOnlyVerified={false}
            portfolioAssets={visibleAssets}
            onItemSelect={(asset: any) => onItemSelect(asset ? 'asset' : null, asset)}
          />
        </div>

        {groupedDeFiPositions && groupedDeFiPositions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">
              DeFi Positions ({groupedDeFiPositions.length})
            </h3>
            <DeFiPositionsTable
              positions={groupedDeFiPositions}
              selectedPosition={selectedDeFiPosition}
              onPositionSelect={(pos: any) => onItemSelect(pos ? 'defi' : null, pos)}
              isLoading={defiLoading}
              sortBy={defiSortBy}
              sortOrder={defiSortOrder}
              onSort={(sortBy: any, sortOrder: any) => onDeFiSort(sortBy as 'protocol' | 'value' | 'type', sortOrder as 'asc' | 'desc')}
              getProtocolLogo={getProtocolLogo}
              className="defi-table-container"
            />
          </div>
        )}

        {((nfts && nfts.length > 0) || (totalNFTCount && totalNFTCount > 0)) && (
          <div>
            <h3 className="text-lg font-semibold mb-2">
              NFTs ({totalNFTCount !== null ? totalNFTCount : nfts?.length || 0})
            </h3>
            <NFTSummaryView
              nfts={nfts}
              totalNFTCount={totalNFTCount}
              nftCollectionStats={nftCollectionStats}
              accountNames={accountNames}
              isLoading={nftsLoading}
              onNFTSelect={(nft) => onItemSelect(nft ? 'nft' : null, nft)}
              selectedNFT={selectedNFT}
              hasMoreNFTs={hasMoreNFTs}
              isLoadingMore={isLoadingMore}
              loadMoreNFTs={loadMoreNFTs}
            />
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2">Yield Opportunities</h3>
          <YieldTable walletAddress={normalizedAddress} />
        </div>

        <PriceList className="mt-3" />
      </div>
    </>
  );
}