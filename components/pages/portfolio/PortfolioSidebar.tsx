"use client";

import { X, Eye, EyeOff } from "lucide-react";
import {
  Activity,
  Coins,
  ImageIcon,
  Layers,
  PieChart,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AssetsTable, DeFiPositionsTable } from "./PortfolioTables";
import { MinimalNFTGrid } from "./MinimalNFTGrid";
import { WalletSummary } from "./WalletSummary";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";
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
  "#1f2937", // Gray-800
  "#374151", // Gray-700
  "#4b5563", // Gray-600
  "#6b7280", // Gray-500
  "#9ca3af", // Gray-400
  "#d1d5db", // Gray-300
];

const CustomTooltip = React.memo(({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 z-[9999] text-sm space-y-1">
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

CustomTooltip.displayName = "CustomTooltip";

export function PortfolioSidebar({
  sidebarView,
  setSidebarView,
  visibleAssets,
  selectedAsset,
  handleAssetSelect,
  assets,
  nfts,
  dataLoading,
  nftsLoading = false,
  defiLoading = false,
  hasMoreNFTs = false,
  isLoadingMore = false,
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
  totalValue = 0,
  walletAddress,
  hideFilteredAssets = true,
  setHideFilteredAssets,
  pieChartData,
  pieChartColors,
  totalNFTCount,
  nftCollectionStats,
}: PortfolioSidebarProps) {
  const [nftSearchQuery, setNftSearchQuery] = useState("");

  // Calculate portfolio metrics excluding filtered tokens when eye is closed
  const portfolioMetrics = useMemo(() => {
    const assetsToCalculate = visibleAssets || [];

    const tokenValue =
      assetsToCalculate.reduce((sum, asset) => sum + (asset.value || 0), 0) ||
      0;
    const nftValue = 0; // NFTs don't have value in current implementation
    const defiValue =
      groupedDeFiPositions?.reduce(
        (sum, pos) => sum + (pos.totalValue || 0),
        0,
      ) || 0;

    return {
      tokenValue,
      nftValue,
      defiValue,
      totalAssets: assetsToCalculate.length,
      nftCount: nfts?.length || 0,
      defiCount: groupedDeFiPositions?.length || 0,
    };
  }, [visibleAssets, nfts, groupedDeFiPositions]);

  // Calculate chart data
  const { categoryData, assetData } = useMemo(() => {
    const categories: CategoryData[] = [
      { name: "Tokens", value: portfolioMetrics.tokenValue, color: "#1f2937" },
      { name: "NFTs", value: portfolioMetrics.nftValue, color: "#4b5563" },
      { name: "DeFi", value: portfolioMetrics.defiValue, color: "#9ca3af" },
    ].filter((cat) => cat.value > 0);

    const assetItems: AssetData[] = [];

    // Add top tokens from filtered assets
    if (visibleAssets && visibleAssets.length > 0) {
      const topTokens = visibleAssets
        .filter((asset) => (asset.value || 0) > 0.1)
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .slice(0, 6);

      topTokens.forEach((asset, index) => {
        assetItems.push({
          name: asset.metadata?.symbol || "Unknown",
          value: asset.value || 0,
          color: CHART_COLORS[index % CHART_COLORS.length],
        });
      });
    }

    return { categoryData: categories, assetData: assetItems };
  }, [visibleAssets, portfolioMetrics]);

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
    <div className="lg:col-span-2 space-y-6">
      {/* Tabbed Content */}
      <Tabs
        value={sidebarView}
        onValueChange={(v) => setSidebarView(v as any)}
        className="h-full"
      >
        <div className="flex items-center justify-between mt-3">
          <div className="flex justify-between items-end w-full border-b border-neutral-200 dark:border-neutral-800">
            <TabsList className="flex justify-start gap-8 rounded-none bg-transparent p-0 h-auto border-none">
              <TabsTrigger
                value="assets"
                className="rounded-none px-0 pb-3 pt-3 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground border-b-2 border-transparent text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
              >
                Tokens ({visibleAssets?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="nfts"
                className="rounded-none px-0 pb-3 pt-3 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground border-b-2 border-transparent text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
              >
                NFTs {totalNFTCount !== null ? `(${totalNFTCount})` : ""}
              </TabsTrigger>
              <TabsTrigger
                value="defi"
                className="rounded-none px-0 pb-3 pt-3 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground border-b-2 border-transparent text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
              >
                DeFi ({groupedDeFiPositions?.length || 0})
              </TabsTrigger>
            </TabsList>

            {sidebarView === "assets" && (
              <div className="flex items-center pb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setHideFilteredAssets &&
                    setHideFilteredAssets(!hideFilteredAssets)
                  }
                  className="h-8 w-8 p-0 hover:bg-muted"
                  title={
                    hideFilteredAssets
                      ? "Show filtered assets"
                      : "Hide filtered assets"
                  }
                >
                  {hideFilteredAssets ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <TabsContent value="assets" className="mt-3 p-0">
          <div className="space-y-4">
            <AssetsTable
              visibleAssets={visibleAssets}
              selectedItem={selectedAsset}
              showOnlyVerified={false}
              portfolioAssets={assets || []}
              onItemSelect={handleAssetSelect}
            />
          </div>
        </TabsContent>

        <TabsContent value="nfts" className="mt-3 p-0 space-y-4">
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
                <MinimalNFTGrid
                  nfts={filteredNFTs || nfts || []}
                  nftsLoading={nftsLoading}
                  hasMoreNFTs={hasMoreNFTs}
                  isLoadingMore={isLoadingMore}
                  onLoadMore={loadMoreNFTs}
                  selectedNFT={selectedNFT}
                  onNFTSelect={(nft) => {
                    setSelectedNFT(nft);
                  }}
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
              onNFTSelect={(nft) => {
                setSelectedNFT(nft);
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="defi" className="mt-3 p-0">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
