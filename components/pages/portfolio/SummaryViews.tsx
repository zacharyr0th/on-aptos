"use client";

import { TrendingUp, DollarSign, Building2, PieChart } from "lucide-react";
import Image from "next/image";
import React from "react";
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Treemap,
} from "recharts";

import { formatCurrency } from "@/lib/utils/format/format";
import { sanitizeNFTMetadata, sanitizeImageUrl } from "@/lib/utils/core/security";

import { MinimalNFTGrid } from "./MinimalNFTGrid";
import { NFT } from "./types";
import { cleanProtocolName } from "./shared/PortfolioMetrics";

// Custom tooltip component for the pie charts
const CustomTooltip = React.memo(({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border/50 rounded-md shadow-md p-2 z-[9999] text-xs space-y-0.5">
      <div className="flex items-center gap-1.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <p className="font-medium text-popover-foreground">
          {data.fullName || data.name}
        </p>
      </div>
      {/* Show value for DeFi protocols, count for NFT collections */}
      {data.value !== undefined &&
      typeof data.value === "number" &&
      data.value > 100 ? (
        <p className="text-muted-foreground/80 text-[10px]">
          Value: {formatCurrency(data.value)}
        </p>
      ) : (
        <p className="text-muted-foreground/80 text-[10px]">
          Count: {data.value} {data.value === 1 ? "item" : "items"}
        </p>
      )}
      <p className="text-muted-foreground/80 text-[10px]">
        Allocation: {data.percentage.toFixed(1)}%
      </p>
    </div>
  );
});

CustomTooltip.displayName = "CustomTooltip";

// Custom shape renderer for Treemap to use our colors
const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, index, name, value, root } = props;

  // Get the fill color from the data
  const fillColor = root?.children?.[index]?.fill || props.fill || "#8884d8";

  // More aggressive mobile-friendly thresholds
  const minWidth = 40;
  const minHeight = 25;

  // Show text only if rectangle is large enough to avoid overlapping
  const canShowText = width >= minWidth && height >= minHeight;
  const canShowBothLines = width >= 60 && height >= 40;

  if (!canShowText) {
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fillColor,
          stroke: "rgba(255,255,255,0.2)",
          strokeWidth: 0.5,
        }}
      />
    );
  }

  // Calculate font sizes based on available space
  const maxNameLength = Math.floor(width / 6); // Rough estimate of characters that fit
  const nameFontSize = Math.max(7, Math.min(12, width / 8));
  const valueFontSize = Math.max(6, Math.min(10, width / 10));

  // Smart text truncation
  let displayName = name;
  if (name.length > maxNameLength) {
    displayName = name.substring(0, Math.max(3, maxNameLength - 3)) + "...";
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fillColor,
          stroke: "rgba(255,255,255,0.2)",
          strokeWidth: 0.5,
        }}
      />

      {/* Collection name */}
      <text
        x={x + width / 2}
        y={canShowBothLines ? y + height / 2 - 4 : y + height / 2}
        textAnchor="middle"
        fill="#1a1a1a"
        style={{
          fontSize: `${nameFontSize}px`,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontWeight: 600,
        }}
      >
        {displayName}
      </text>

      {/* Value - only show if there's enough space */}
      {canShowBothLines && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 8}
          textAnchor="middle"
          fill="rgba(26,26,26,0.7)"
          style={{
            fontSize: `${valueFontSize}px`,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', monospace",
          }}
        >
          {value}
        </text>
      )}
    </g>
  );
};

interface DeFiSummaryViewProps {
  groupedDeFiPositions: any[];
  totalDefiValue: number;
  getProtocolLogo: (protocol: string) => string;
  onProtocolClick: (position: any) => void;
}

interface NFTSummaryViewProps {
  nfts: NFT[];
  currentPageNFTs: number;
  totalNFTCount?: number | null;
  nftCollectionStats?: {
    collections: Array<{ name: string; count: number }>;
    totalCollections: number;
  } | null;
  onCollectionClick?: (collection: string) => void;
  includeGrid?: boolean;
  filteredNFTs?: NFT[];
  nftsLoading?: boolean;
  hasMoreNFTs?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  selectedNFT?: NFT | null;
  onNFTSelect?: (nft: NFT | null) => void;
}

export const DeFiSummaryView: React.FC<DeFiSummaryViewProps> = ({
  groupedDeFiPositions,
  totalDefiValue,
  getProtocolLogo,
  onProtocolClick,
}) => {
  // Calculate additional metrics
  const totalPositions = (groupedDeFiPositions || []).reduce(
    (sum, pos) => sum + (pos.positions?.length || 1),
    0,
  );

  const averagePositionValue =
    groupedDeFiPositions && groupedDeFiPositions.length > 0
      ? totalDefiValue / groupedDeFiPositions.length
      : 0;

  // Don't render anything if there are no DeFi positions
  if (!groupedDeFiPositions || groupedDeFiPositions.length === 0) {
    return null;
  }

  return (
    <div>
      {/* DeFi Portfolio Overview */}
      <div>
        <h2 className="text-base font-medium tracking-tight mb-3">
          DeFi Portfolio Overview
        </h2>
        <div>
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-border/30">
            <div className="p-2 sm:p-3 border-r border-border/30">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3 text-muted-foreground/70" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                    Total Value
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-mono font-semibold tracking-tight">
                  {formatCurrency(totalDefiValue)}
                </p>
              </div>
            </div>

            <div className="p-2 sm:p-3 border-r border-border/30 lg:border-r">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-muted-foreground/70" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                    Protocols
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-mono font-semibold tracking-tight">
                  {(groupedDeFiPositions || []).length}
                </p>
              </div>
            </div>

            <div className="p-2 sm:p-3 border-r border-border/30">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <PieChart className="h-3 w-3 text-muted-foreground/70" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                    Positions
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-mono font-semibold tracking-tight">
                  {totalPositions}
                </p>
              </div>
            </div>

            <div className="p-2 sm:p-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-muted-foreground/70" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                    Avg. Position
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-mono font-semibold tracking-tight">
                  {formatCurrency(averagePositionValue)}
                </p>
              </div>
            </div>
          </div>

          {/* Protocol Logos */}
          {groupedDeFiPositions && groupedDeFiPositions.length > 0 && (
            <div className="p-3">
              <div className="flex flex-col">
                <h4 className="text-[10px] font-medium text-muted-foreground/70 mb-2 uppercase tracking-wider">
                  Protocols
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {(groupedDeFiPositions || [])
                      .sort((a, b) => b.totalValue - a.totalValue)
                      .map((position, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 rounded-lg bg-background/50 border border-border/30 flex items-center justify-center overflow-hidden hover:border-border/60 transition-colors cursor-pointer"
                          onClick={() => onProtocolClick(position)}
                          title={cleanProtocolName(position.protocol)}
                        >
                          <Image
                            src={getProtocolLogo(position.protocol)}
                            alt={`${position.protocol} logo`}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.src = "/placeholder.jpg";
                            }}
                          />
                        </div>
                      ))}
                  </div>

                  {/* Explore DeFi Button */}
                  <a
                    href="/defi"
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors ml-4"
                  >
                    Explore Aptos DeFi
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Empty state for no positions */}
          {(!groupedDeFiPositions || groupedDeFiPositions.length === 0) && (
            <div className=" rounded-xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No DeFi Positions Found
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Start exploring DeFi protocols on Aptos to see your positions
                tracked here automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const NFTSummaryView: React.FC<NFTSummaryViewProps> = ({
  nfts,
  currentPageNFTs: _currentPageNFTs,
  totalNFTCount,
  nftCollectionStats,
  onCollectionClick,
  includeGrid = false,
  filteredNFTs,
  nftsLoading = false,
  hasMoreNFTs = false,
  isLoadingMore = false,
  onLoadMore,
  selectedNFT,
  onNFTSelect,
}) => {
  const [showMetrics, setShowMetrics] = React.useState(false);

  // Use totalNFTCount if available, otherwise fall back to loaded NFTs length
  const actualNFTCount = totalNFTCount ?? nfts.length;

  // Use collection stats from API if available, otherwise calculate from loaded NFTs
  const collections = React.useMemo((): [string, number][] => {
    if (nftCollectionStats && nftCollectionStats.collections.length > 0) {
      // Use pre-calculated collection stats from API
      return nftCollectionStats.collections.map(
        ({ name, count }) => [name, count] as [string, number],
      );
    } else {
      // Fallback to calculating from loaded NFTs
      const collectionMap = nfts.reduce((acc: Record<string, number>, nft) => {
        acc[nft.collection_name] = (acc[nft.collection_name] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(collectionMap).sort(([, a], [, b]) => b - a) as [
        string,
        number,
      ][];
    }
  }, [nfts, nftCollectionStats]);

  // Prepare data for Treemap
  const treemapData = React.useMemo(() => {
    // Monet-inspired soft, muted pastels - slightly darker for better visibility
    const monetPastels = [
      "hsl(210, 38%, 76%)", // Soft sky blue
      "hsl(260, 33%, 79%)", // Lavender mist
      "hsl(340, 28%, 81%)", // Blush pink
      "hsl(150, 28%, 77%)", // Sage green
      "hsl(30, 33%, 79%)", // Warm beige
      "hsl(190, 31%, 78%)", // Seafoam
      "hsl(50, 28%, 80%)", // Soft butter
      "hsl(280, 28%, 80%)", // Lilac
      "hsl(110, 23%, 78%)", // Celadon
      "hsl(20, 28%, 80%)", // Peachy nude
    ];
    return collections.map(([name, count], index) => ({
      name: name || "Unnamed Collection",
      size: count as number,
      percentage: ((count as number) / actualNFTCount) * 100,
      fill: monetPastels[index % monetPastels.length],
    }));
  }, [collections, actualNFTCount]);

  const totalCollections =
    nftCollectionStats?.totalCollections ??
    new Set(nfts.map((nft) => nft.collection_name)).size;

  if (nfts.length === 0 || collections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No digital assets
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Minimal Stats */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            <span className="hidden sm:inline">Total Assets</span>
            <span className="sm:hidden">Total</span>
          </p>
          <p className="text-xl font-light">{actualNFTCount}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            <span className="hidden sm:inline">Collections</span>
            <span className="sm:hidden">Collections</span>
          </p>
          <p className="text-xl font-light">{totalCollections}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            <span className="hidden sm:inline">Top Collection</span>
            <span className="sm:hidden">Top</span>
          </p>
          <p className="text-xl font-light">
            {String(collections[0]?.[1] || 0)}
          </p>
        </div>
      </div>

      {/* Collections Treemap or NFT Details */}
      {selectedNFT ? (
        <div className="rounded-lg overflow-hidden">
          {/* NFT Image - Full width */}
          <div className="relative w-full aspect-square bg-neutral-100 dark:bg-neutral-900">
            <Image
              src={sanitizeImageUrl(
                selectedNFT.cdn_image_uri || selectedNFT.token_uri,
                "/placeholder.jpg",
              )}
              alt={sanitizeNFTMetadata(selectedNFT).token_name || "NFT"}
              fill
              className="object-contain"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.src = "/placeholder.jpg";
              }}
            />
          </div>

          {/* NFT Details Below */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-lg">
                {sanitizeNFTMetadata(selectedNFT).token_name || "Unnamed NFT"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {sanitizeNFTMetadata(selectedNFT).collection_name ||
                  "Unknown Collection"}
              </p>
            </div>

            {selectedNFT.amount > 1 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{selectedNFT.amount}</span>
              </div>
            )}

            {selectedNFT.description && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Description:</p>
                <p className="line-clamp-3">
                  {sanitizeNFTMetadata(selectedNFT).description}
                </p>
              </div>
            )}

            <button
              onClick={() => onNFTSelect && onNFTSelect(null)}
              className="text-sm text-primary hover:underline"
            >
              ← Back to collections
            </button>
          </div>
        </div>
      ) : (
        <div className="h-52 sm:h-64 w-full bg-neutral-50 dark:bg-neutral-900/50 rounded-lg overflow-hidden">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <Treemap
              data={treemapData}
              dataKey="size"
              nameKey="name"
              aspectRatio={4 / 3}
              stroke="none"
              content={<CustomTreemapContent />}
              onClick={(data: any) => {
                if (onCollectionClick && data && data.name) {
                  // Find the original collection name from the treemap data
                  const originalName = collections.find(
                    ([name]: [string, number]) =>
                      (name || "Unnamed Collection") === data.name,
                  )?.[0];
                  if (originalName !== undefined) {
                    onCollectionClick(String(originalName));
                  }
                }
              }}
            >
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 sm:p-3 z-50">
                        <p className="font-medium text-xs sm:text-sm">
                          {data.name}
                        </p>
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                          {data.size} NFTs ({data.percentage.toFixed(1)}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      )}

      {/* NFT Grid - only on mobile */}
      {includeGrid && (
        <div className="h-[400px] overflow-y-auto">
          <MinimalNFTGrid
            nfts={filteredNFTs || nfts}
            nftsLoading={nftsLoading}
            hasMoreNFTs={hasMoreNFTs}
            isLoadingMore={isLoadingMore}
            onLoadMore={onLoadMore}
            selectedNFT={selectedNFT || null}
            onNFTSelect={onNFTSelect || (() => {})}
          />
        </div>
      )}

      {/* Collector Metrics - Desktop: Always open with header, Mobile: Toggle */}
      <div className="space-y-4">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <h3 className="text-lg font-medium mb-4">Collector Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
            <div className="rounded-lg p-3 sm:p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Concentration
                </p>
                <p className="text-lg sm:text-xl font-semibold">
                  {(
                    (collections
                      .slice(0, 3)
                      .reduce(
                        (sum: number, [_, count]: [string, number]) =>
                          sum + count,
                        0,
                      ) /
                      actualNFTCount) *
                    100
                  ).toFixed(0)}
                  %
                </p>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                In top 3 collections
              </p>
            </div>
            <div className="rounded-lg p-3 sm:p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Toe Dipper
                </p>
                <p className="text-lg sm:text-xl font-semibold">
                  {
                    collections.filter(
                      ([_, count]: [string, number]) => count === 1,
                    ).length
                  }
                </p>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                1 per collection
              </p>
            </div>
            <div className="rounded-lg p-3 sm:p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Largest Collection
                </p>
                <p className="text-lg sm:text-xl font-semibold">
                  {Math.round(
                    ((collections[0]?.[1] || 0) / actualNFTCount) * 100,
                  )}
                  %
                </p>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Of total NFTs
              </p>
            </div>
            <div className="rounded-lg p-3 sm:p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Fan Status
                </p>
                <p className="text-lg sm:text-xl font-semibold">
                  {
                    collections.filter(
                      ([_, count]: [string, number]) => count >= 5,
                    ).length
                  }
                </p>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                5 per collection
              </p>
            </div>
            <div className="rounded-lg p-3 sm:p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Avg Holding
                </p>
                <p className="text-lg sm:text-xl font-semibold">
                  {Math.round(actualNFTCount / totalCollections)} NFTs
                </p>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Per collection
              </p>
            </div>
            <div className="rounded-lg p-3 sm:p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Stan Status
                </p>
                <p className="text-lg sm:text-xl font-semibold">
                  {
                    collections.filter(
                      ([_, count]: [string, number]) => count >= 10,
                    ).length
                  }
                </p>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                10 per collection
              </p>
            </div>
          </div>
          {/* Desktop divider */}
          <div className="border-b border-neutral-200 dark:border-neutral-800 mt-6"></div>
        </div>

        {/* Mobile Toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium">Collector Metrics</span>
            <svg
              className={`w-5 h-5 transition-transform ${showMetrics ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Mobile Metrics Grid */}
          {showMetrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="rounded-lg p-3 sm:p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    Concentration
                  </p>
                  <p className="text-lg sm:text-xl font-semibold">
                    {(
                      (collections
                        .slice(0, 3)
                        .reduce(
                          (sum: number, [_, count]: [string, number]) =>
                            sum + count,
                          0,
                        ) /
                        actualNFTCount) *
                      100
                    ).toFixed(0)}
                    %
                  </p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  In top 3 collections
                </p>
              </div>
              <div className="rounded-lg p-3 sm:p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    Toe Dipper
                  </p>
                  <p className="text-lg sm:text-xl font-semibold">
                    {
                      collections.filter(
                        ([_, count]: [string, number]) => count === 1,
                      ).length
                    }
                  </p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  1 per collection
                </p>
              </div>
              <div className="rounded-lg p-3 sm:p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    Largest Collection
                  </p>
                  <p className="text-lg sm:text-xl font-semibold">
                    {Math.round(
                      ((collections[0]?.[1] || 0) / actualNFTCount) * 100,
                    )}
                    %
                  </p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Of total NFTs
                </p>
              </div>
              <div className="rounded-lg p-3 sm:p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    Fan Status
                  </p>
                  <p className="text-lg sm:text-xl font-semibold">
                    {
                      collections.filter(
                        ([_, count]: [string, number]) => count >= 5,
                      ).length
                    }
                  </p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  5 per collection
                </p>
              </div>
              <div className="rounded-lg p-3 sm:p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    Avg Holding
                  </p>
                  <p className="text-lg sm:text-xl font-semibold">
                    {Math.round(actualNFTCount / totalCollections)} NFTs
                  </p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Per collection
                </p>
              </div>
              <div className="rounded-lg p-3 sm:p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    Stan Status
                  </p>
                  <p className="text-lg sm:text-xl font-semibold">
                    {
                      collections.filter(
                        ([_, count]: [string, number]) => count >= 10,
                      ).length
                    }
                  </p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  10 per collection
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
