'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AssetsTable, DeFiPositionsTable } from './PortfolioTables';
import { EnhancedNFTGrid } from './EnhancedNFTGrid';

interface PortfolioSidebarProps {
  sidebarView: 'assets' | 'nfts' | 'defi';
  setSidebarView: (view: 'assets' | 'nfts' | 'defi') => void;
  visibleAssets: any[];
  selectedAsset: any;
  handleAssetSelect: (asset: any) => void;
  assets: any[];
  nfts: any[];
  dataLoading: boolean;
  selectedNFT: any;
  setSelectedNFT: (nft: any) => void;
  groupedDeFiPositions: any[];
  selectedDeFiPosition: any;
  defiSortBy: any;
  defiSortOrder: any;
  getProtocolLogo: (protocol: string) => string;
  handleDeFiPositionSelect: (position: any) => void;
  handleDeFiSort: (sortBy: any, sortOrder: any) => void;
}

export function PortfolioSidebar({
  sidebarView,
  setSidebarView,
  visibleAssets,
  selectedAsset,
  handleAssetSelect,
  assets,
  nfts,
  dataLoading,
  selectedNFT,
  setSelectedNFT,
  groupedDeFiPositions,
  selectedDeFiPosition,
  defiSortBy,
  defiSortOrder,
  getProtocolLogo,
  handleDeFiPositionSelect,
  handleDeFiSort,
}: PortfolioSidebarProps) {
  return (
    <div className="lg:col-span-2 space-y-6">
      {/* View Selector */}
      <div className="flex items-center gap-4 text-lg">
        <button
          onClick={() => setSidebarView('assets')}
          className={cn(
            'font-medium transition-colors',
            sidebarView === 'assets'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Tokens
        </button>
        <button
          onClick={() => setSidebarView('nfts')}
          className={cn(
            'font-medium transition-colors',
            sidebarView === 'nfts'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          NFTs
        </button>
        <button
          onClick={() => setSidebarView('defi')}
          className={cn(
            'font-medium transition-colors',
            sidebarView === 'defi'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          DeFi
        </button>
      </div>

      {/* Content based on sidebar view */}
      {sidebarView === 'assets' && (
        <AssetsTable
          visibleAssets={visibleAssets}
          selectedItem={selectedAsset}
          showOnlyVerified={false}
          portfolioAssets={assets || []}
          onItemSelect={handleAssetSelect}
        />
      )}

      {sidebarView === 'nfts' && (
        <EnhancedNFTGrid
          nfts={nfts}
          nftsLoading={dataLoading}
          selectedNFT={selectedNFT}
          onNFTSelect={nft => {
            setSelectedNFT(nft);
          }}
        />
      )}

      {sidebarView === 'defi' && (
        <DeFiPositionsTable
          groupedDeFiPositions={groupedDeFiPositions}
          defiPositionsLoading={dataLoading}
          selectedItem={selectedDeFiPosition}
          defiSortBy={defiSortBy}
          defiSortOrder={defiSortOrder}
          getProtocolLogo={getProtocolLogo}
          onItemSelect={handleDeFiPositionSelect}
          onSortChange={handleDeFiSort}
        />
      )}
    </div>
  );
}