'use client';

import { X, Eye, EyeOff } from 'lucide-react';
import {
  DollarSign,
  Activity,
  Coins,
  ImageIcon,
  Layers,
  PieChart,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AssetsTable, DeFiPositionsTable } from './PortfolioTables';
import { MinimalNFTGrid } from './MinimalNFTGrid';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';


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
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface AssetData {
  name: string;
  value: number;
  color: string;
}

const CHART_COLORS = [
  '#1f2937', // Gray-800
  '#374151', // Gray-700
  '#4b5563', // Gray-600
  '#6b7280', // Gray-500
  '#9ca3af', // Gray-400
  '#d1d5db', // Gray-300
];

const CustomTooltip = React.memo(({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 z-10 text-sm space-y-1">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <p className="font-semibold text-popover-foreground">{data.name}</p>
      </div>
      <p className="text-muted-foreground">
        Value: {formatCurrency(data.value)}
      </p>
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

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
  accountNames,
  groupedDeFiPositions,
  selectedDeFiPosition,
  defiSortBy,
  defiSortOrder,
  getProtocolLogo,
  handleDeFiPositionSelect,
  handleDeFiSort,
  totalValue = 0,
  walletAddress,
}: PortfolioSidebarProps) {
  const [nftSearchQuery, setNftSearchQuery] = useState('');
  const [hideFilteredAssets, setHideFilteredAssets] = useState(true);

  // Hardcoded addresses to filter out when eye is closed
  const FILTERED_ADDRESSES = useMemo(() => [
    '0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12', // CELL token
    // Add more addresses here as needed
  ], []);
  // Filter assets based on eye toggle state
  const filteredVisibleAssets = useMemo(() => {
    // When eye is open (hideFilteredAssets = false), show ALL assets
    if (!hideFilteredAssets) return assets;

    // When eye is closed (hideFilteredAssets = true), apply filters
    return visibleAssets.filter(asset => {
      // Always include APT regardless of value
      if (asset.asset_type === '0x1::aptos_coin::AptosCoin') return true;

      // Filter out hardcoded addresses and MKLP tokens
      if (FILTERED_ADDRESSES.includes(asset.asset_type)) return false;
      if (
        asset.asset_type.includes('::house_lp::MKLP') ||
        asset.asset_type.includes('::mklp::MKLP')
      )
        return false;

      // Filter out assets under $0.1
      return (asset.value || 0) >= 0.1;
    });
  }, [assets, visibleAssets, hideFilteredAssets, FILTERED_ADDRESSES]);

  // Calculate portfolio metrics excluding filtered tokens when eye is closed
  const portfolioMetrics = useMemo(() => {
    const assetsToCalculate = filteredVisibleAssets || [];

    const tokenValue =
      assetsToCalculate.reduce((sum, asset) => sum + (asset.value || 0), 0) ||
      0;
    const nftValue = 0; // NFTs don't have value in current implementation
    const defiValue =
      groupedDeFiPositions?.reduce(
        (sum, pos) => sum + (pos.totalValue || 0),
        0
      ) || 0;

    return {
      tokenValue,
      nftValue,
      defiValue,
      totalAssets: assetsToCalculate.length,
      nftCount: nfts?.length || 0,
      defiCount: groupedDeFiPositions?.length || 0,
    };
  }, [filteredVisibleAssets, nfts, groupedDeFiPositions]);

  // Calculate chart data
  const { categoryData, assetData } = useMemo(() => {
    const categories: CategoryData[] = [
      { name: 'Tokens', value: portfolioMetrics.tokenValue, color: '#1f2937' },
      { name: 'NFTs', value: portfolioMetrics.nftValue, color: '#4b5563' },
      { name: 'DeFi', value: portfolioMetrics.defiValue, color: '#9ca3af' },
    ].filter(cat => cat.value > 0);

    const assetItems: AssetData[] = [];

    // Add top tokens from filtered assets
    if (filteredVisibleAssets && filteredVisibleAssets.length > 0) {
      const topTokens = filteredVisibleAssets
        .filter(asset => (asset.value || 0) > 0.1)
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .slice(0, 6);

      topTokens.forEach((asset, index) => {
        assetItems.push({
          name: asset.metadata?.symbol || 'Unknown',
          value: asset.value || 0,
          color: CHART_COLORS[index % CHART_COLORS.length],
        });
      });
    }

    return { categoryData: categories, assetData: assetItems };
  }, [filteredVisibleAssets, portfolioMetrics]);

  // Filter NFTs based on search query
  const filteredNFTs = useMemo(() => {
    if (!nftSearchQuery || !nfts) return nfts;

    const query = nftSearchQuery.toLowerCase();
    return nfts.filter(
      nft =>
        nft.token_name?.toLowerCase().includes(query) ||
        nft.collection_name?.toLowerCase().includes(query) ||
        nft.description?.toLowerCase().includes(query)
    );
  }, [nfts, nftSearchQuery]);

  // Show ALL DeFi positions - no filtering
  const filteredDeFiPositions = groupedDeFiPositions;
  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Tabbed Content */}
      <Tabs
        value={sidebarView}
        onValueChange={v => setSidebarView(v as any)}
        className="h-full"
      >
        <div className="flex items-center justify-between">
          <TabsList className="flex justify-start gap-16 rounded-none bg-transparent p-0 h-auto border-b border-neutral-200 dark:border-neutral-800">
            <TabsTrigger
              value="assets"
              className="rounded-none px-0 pb-3 pt-0 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground border-b-2 border-transparent text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
            >
              Tokens
            </TabsTrigger>
            <TabsTrigger
              value="nfts"
              className="rounded-none px-0 pb-3 pt-0 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground border-b-2 border-transparent text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
            >
              NFTs
            </TabsTrigger>
            <TabsTrigger
              value="defi"
              className="rounded-none px-0 pb-3 pt-0 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground border-b-2 border-transparent text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
            >
              DeFi
            </TabsTrigger>
          </TabsList>

          {sidebarView === 'assets' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHideFilteredAssets(!hideFilteredAssets)}
              className="h-8 w-8 p-0 hover:bg-muted"
              title={
                hideFilteredAssets
                  ? 'Show filtered assets'
                  : 'Hide filtered assets'
              }
            >
              {hideFilteredAssets ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        <TabsContent value="assets" className="mt-8 p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <AssetsTable
              visibleAssets={filteredVisibleAssets}
              selectedItem={selectedAsset}
              showOnlyVerified={false}
              portfolioAssets={assets || []}
              onItemSelect={handleAssetSelect}
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="nfts" className="mt-8 p-0 space-y-8">
          <div className="relative group">
            <Input
              type="text"
              placeholder="Search NFTs by name or collection..."
              value={nftSearchQuery}
              onChange={e => setNftSearchQuery(e.target.value)}
              className="pr-3 h-10 bg-background/50 backdrop-blur-sm border-muted-foreground/20 hover:border-muted-foreground/40 focus:bg-background transition-all duration-200"
            />
            {nftSearchQuery && (
              <button
                onClick={() => setNftSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {nftSearchQuery && (
            <p className="text-xs text-muted-foreground">
              {filteredNFTs?.length || 0}{' '}
              {filteredNFTs?.length === 1 ? 'result' : 'results'} found
            </p>
          )}
          <ScrollArea className="h-[calc(100vh-380px)]">
            <div data-nft-grid>
              <MinimalNFTGrid
                nfts={filteredNFTs}
                nftsLoading={dataLoading}
                selectedNFT={selectedNFT}
                onNFTSelect={nft => {
                  setSelectedNFT(nft);
                }}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="defi" className="mt-8 p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <DeFiPositionsTable
              groupedDeFiPositions={filteredDeFiPositions}
              defiPositionsLoading={dataLoading}
              selectedItem={selectedDeFiPosition}
              defiSortBy={defiSortBy}
              defiSortOrder={defiSortOrder}
              getProtocolLogo={getProtocolLogo}
              onItemSelect={handleDeFiPositionSelect}
              onSortChange={handleDeFiSort}
            />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
