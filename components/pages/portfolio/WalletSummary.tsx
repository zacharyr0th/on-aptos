import {
  Wallet,
  Layers,
  Loader2,
  PieChart as PieChartIcon,
} from "lucide-react";
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Treemap,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatTokenAmount } from "@/lib/utils/format/format";
import { logger } from "@/lib/utils/core/logger";

import {
  PieChart,
  calculateAssetAllocation,
  CHART_COLORS,
} from "./shared/ChartUtils";
import { TokenImage } from "./shared/SmartImage";
import { LoadingSkeleton, NFTTreemapSkeleton } from "./shared/LoadingSkeletons";
import { usePortfolioMetrics } from "./shared/PortfolioMetrics";
import type { FungibleAsset, DeFiPosition } from "./shared/PortfolioMetrics";

interface WalletSummaryProps {
  walletAddress: string | undefined;
  assets?: FungibleAsset[];
  defiPositions?: DeFiPosition[];
  totalValue?: number;
  className?: string;
  isLoading?: boolean;
  selectedNFT?: any;
  selectedDeFiPosition?: any;
  selectedAsset?: FungibleAsset | null;
  onAssetSelect?: (asset: FungibleAsset | null) => void;
  pieChartData?: Array<{
    symbol: string;
    value: number;
    percentage: number;
  }>;
  pieChartColors?: string[];
  nfts?: any[];
  nftTotalValue?: number;
  filteredAssetsCount?: number;
  totalNFTCount?: number | null;
  aptPrice?: number;
  nftCollectionStats?: {
    collections: Array<{ name: string; count: number }>;
    totalCollections: number;
  } | null;
  nftsLoading?: boolean;
}

export const WalletSummary: React.FC<WalletSummaryProps> = ({
  walletAddress,
  assets = [],
  defiPositions = [],
  totalValue = 0,
  className,
  isLoading = false,
  selectedAsset,
  onAssetSelect,
  nfts = [],
  nftTotalValue = 0,
  totalNFTCount,
  nftCollectionStats,
  nftsLoading = false,
}) => {
  // Calculate collection stats from loaded NFTs if API data is not available
  const fallbackCollectionStats = useMemo(() => {
    if (!nfts || nfts.length === 0) return null;
    
    const collectionMap: Record<string, number> = {};
    nfts.forEach(nft => {
      const collectionName = nft.collection_name || 'Unknown Collection';
      collectionMap[collectionName] = (collectionMap[collectionName] || 0) + 1;
    });
    
    const collections = Object.entries(collectionMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    return {
      collections,
      totalCollections: collections.length,
    };
  }, [nfts]);
  
  // Use API data if available, otherwise use fallback
  const effectiveCollectionStats = nftCollectionStats && nftCollectionStats.collections.length > 0 
    ? nftCollectionStats 
    : fallbackCollectionStats;

  // Determine if we should show treemap skeleton
  const shouldShowTreemapSkeleton = nftsLoading || (
    // Show skeleton if we don't have any NFT data yet and we're not in the "no NFTs" state
    !effectiveCollectionStats && totalNFTCount !== 0
  );

  // Debug logging with verification
  React.useEffect(() => {
    if (effectiveCollectionStats) {
      const calculatedTotal = effectiveCollectionStats.collections.reduce(
        (sum: number, collection: any) => sum + collection.count, 
        0
      );
      const expectedTotal = totalNFTCount || nfts.length;
      
      logger.debug('[WalletSummary Debug]', {
        nftCollectionStats: !!nftCollectionStats,
        fallbackCollectionStats: !!fallbackCollectionStats,
        effectiveCollectionStats: !!effectiveCollectionStats,
        nftsLength: nfts.length,
        totalNFTCount,
        usingAPI: nftCollectionStats && nftCollectionStats.collections.length > 0,
        calculatedTotal,
        expectedTotal,
        mathMatches: calculatedTotal === expectedTotal,
        collections: effectiveCollectionStats.collections.length,
        topCollections: effectiveCollectionStats.collections.slice(0, 5).map(c => `${c.name}: ${c.count}`)
      });

      if (calculatedTotal !== expectedTotal) {
        logger.warn('[WalletSummary] Collection count mismatch!', {
          calculated: calculatedTotal,
          expected: expectedTotal,
          difference: calculatedTotal - expectedTotal
        });
      } else {
        logger.info('[WalletSummary] ✅ Collection counts verified - treemap shows accurate data for all NFTs');
      }
    }
  }, [nftCollectionStats, fallbackCollectionStats, effectiveCollectionStats, nfts.length, totalNFTCount]);

  // Use shared portfolio metrics calculation
  const portfolioMetrics = usePortfolioMetrics(
    assets,
    defiPositions,
    nfts,
    nftTotalValue,
  );

  // Calculate totals once and reuse
  const { calculatedTotalValue } = useMemo(() => {
    const tokenTotal = assets.reduce(
      (sum, asset) => sum + (asset.value || 0),
      0,
    );
    const defiTotal = (defiPositions || []).reduce(
      (sum, pos) => sum + (pos.totalValueUSD || 0),
      0,
    );
    return {
      calculatedTotalValue: tokenTotal + defiTotal + nftTotalValue,
    };
  }, [assets, defiPositions, nftTotalValue]);

  // Use shared asset allocation calculation
  const allAssetsData = useMemo(
    () =>
      calculateAssetAllocation(
        assets,
        defiPositions,
        calculatedTotalValue,
        CHART_COLORS,
      ),
    [assets, defiPositions, calculatedTotalValue],
  );

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton variant="wallet-summary" className={className} />;
  }

  // No wallet connected state
  if (!walletAddress) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <CardTitle className="text-base sm:text-lg">
              Wallet Summary
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Connect your wallet to view summary
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Minimal Stats - Hidden on mobile */}
      <div className="hidden sm:grid grid-cols-3 gap-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
            Tokens
          </p>
          <p className="text-xl font-normal">{portfolioMetrics.totalAssets}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
            NFTs
          </p>
          <div className="text-xl font-normal">
            {totalNFTCount !== null ? (
              totalNFTCount
            ) : portfolioMetrics.nftCount > 0 ? (
              `${portfolioMetrics.nftCount}+`
            ) : (
              <Loader2 className="h-5 w-5 animate-spin inline-block text-muted-foreground" />
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
            <span className="hidden sm:inline">DeFi Positions</span>
            <span className="sm:hidden">DeFi</span>
          </p>
          <p className="text-xl font-light">{portfolioMetrics.defiCount}</p>
        </div>
      </div>

      {/* Divider - Hidden on mobile */}
      <div className="hidden sm:block border-b border-neutral-200 dark:border-neutral-800"></div>

      {/* Portfolio Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation Chart or Token Details */}
        <div className="space-y-3 overflow-visible">
          <div className="h-72 relative overflow-visible">
            {selectedAsset ? (
              /* Token Details View */
              <div className="bg-card border rounded-lg p-6 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-12 h-12 bg-neutral-50 dark:bg-neutral-950 rounded-lg overflow-hidden flex-shrink-0">
                    <TokenImage
                      src={(selectedAsset.metadata as any)?.icon_uri}
                      alt={selectedAsset.metadata?.symbol || "Token"}
                      assetType={selectedAsset.asset_type}
                      metadata={selectedAsset.metadata}
                      fill
                      className="object-contain"
                      sizes="48px"
                      priority
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {selectedAsset.metadata?.symbol || "Unknown"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedAsset.metadata?.name || "Unknown Asset"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Balance
                      </p>
                      <p className="text-base font-medium mt-1 font-mono">
                        {formatTokenAmount(selectedAsset.balance || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Value
                      </p>
                      <p className="text-base font-medium mt-1 font-mono">
                        {formatCurrency(selectedAsset.value || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Price
                      </p>
                      <p className="text-base font-medium mt-1 font-mono">
                        {formatCurrency(selectedAsset.price || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Portfolio %
                      </p>
                      <p className="text-base font-medium mt-1 font-mono">
                        {calculatedTotalValue > 0
                          ? (
                              ((selectedAsset.value || 0) /
                                calculatedTotalValue) *
                              100
                            ).toFixed(1)
                          : "0"}
                        %
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onAssetSelect && onAssetSelect(null)}
                  className="text-sm text-primary hover:underline mt-4"
                >
                  ← Back to portfolio overview
                </button>
              </div>
            ) : allAssetsData.length > 0 ? (
              <PieChart
                data={allAssetsData}
                centerContent={
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl lg:text-2xl font-bold">
                      {formatCurrency(totalValue)}
                    </div>
                  </div>
                }
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <PieChartIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No assets with value data
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Assets will appear here once price data is available
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Allocation Legend */}
        <div className="flex flex-col justify-center items-center h-full">
          {/* Enhanced Legend */}
          <div className="space-y-2 w-full max-w-[200px] lg:max-w-none">
            {/* Show top 3 assets + Others */}
            {allAssetsData.length > 0 ? (
              <div className="space-y-1.5">
                <div className="space-y-1.5">
                  {/* Show top 3 assets */}
                  {allAssetsData.slice(0, 3).map((asset, index) => (
                    <div
                      key={`${asset.symbol}-${index}`}
                      className="flex items-center gap-2 lg:gap-3 py-1 lg:py-2"
                    >
                      <div
                        className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: asset.color }}
                      />
                      <div className="flex-1 min-w-0 lg:block">
                        <div className="flex items-center gap-1.5 lg:gap-2">
                          <div className="text-sm font-medium">
                            {asset.symbol}
                          </div>
                          {asset.category === "DeFi" && (
                            <span className="text-xs bg-secondary text-secondary-foreground px-1 py-0.5 rounded hidden lg:inline">
                              DeFi
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground hidden lg:block">
                          {formatCurrency(asset.value)}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground w-12 text-right">
                        {asset.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))}

                  {/* Show Others if more than 3 assets and percentage >= 0.01% */}
                  {allAssetsData.length > 3 &&
                    (() => {
                      const othersValue = allAssetsData
                        .slice(3)
                        .reduce((sum, asset) => sum + asset.value, 0);
                      const othersPercentage = allAssetsData
                        .slice(3)
                        .reduce((sum, asset) => sum + asset.percentage, 0);

                      // Only show if percentage is 0.01% or greater
                      if (othersPercentage < 0.01) return null;

                      return (
                        <div className="flex items-center gap-2 lg:gap-3 py-1 lg:py-2">
                          <div
                            className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: "#9ca3af" }}
                          />
                          <div className="flex-1 min-w-0 lg:block">
                            <div className="text-sm font-medium">Others</div>
                            <div className="text-xs text-muted-foreground hidden lg:block">
                              {formatCurrency(othersValue)}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground w-12 text-right">
                            {othersPercentage.toFixed(1)}%
                          </div>
                        </div>
                      );
                    })()}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No holdings to display
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b-2 border-border/50"></div>

      {/* NFT Collection Treemap */}
      {shouldShowTreemapSkeleton ? (
        <NFTTreemapSkeleton />
      ) : effectiveCollectionStats && effectiveCollectionStats.collections.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-baseline gap-2 mb-4">
            <h3 className="text-lg font-medium">NFT Collection Distribution</h3>
            <span className="text-sm text-muted-foreground">
              {totalNFTCount || nfts.length} NFTs across {effectiveCollectionStats.totalCollections} collections
            </span>
          </div>
          
          <div className="h-52 sm:h-64 w-full bg-neutral-50 dark:bg-neutral-900/50 rounded-lg overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <Treemap
                data={effectiveCollectionStats.collections.map((collection, index) => {
                  const monetPastels = [
                    "hsl(210, 38%, 76%)",
                    "hsl(260, 33%, 79%)",
                    "hsl(340, 28%, 81%)",
                    "hsl(150, 28%, 77%)",
                    "hsl(30, 33%, 79%)",
                    "hsl(190, 31%, 78%)",
                    "hsl(50, 28%, 80%)",
                    "hsl(280, 28%, 80%)",
                    "hsl(110, 23%, 78%)",
                    "hsl(20, 28%, 80%)",
                  ];
                  return {
                    name: collection.name || "Unnamed Collection",
                    size: collection.count,
                    percentage: ((collection.count / (totalNFTCount || nfts.length)) * 100),
                    fill: monetPastels[index % monetPastels.length],
                  };
                })}
                dataKey="size"
                nameKey="name"
                aspectRatio={4 / 3}
                stroke="none"
                content={<CustomTreemapContent />}
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
        </div>
      ) : null}
    </div>
  );
};

// Custom shape renderer for Treemap
const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, index, name, value, root } = props;
  const fillColor = root?.children?.[index]?.fill || props.fill || "#8884d8";
  const minWidth = 40;
  const minHeight = 25;
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

  const maxNameLength = Math.floor(width / 6);
  const nameFontSize = Math.max(7, Math.min(12, width / 8));
  const valueFontSize = Math.max(6, Math.min(10, width / 10));
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
      <text
        x={x + width / 2}
        y={canShowBothLines ? y + height / 2 - 4 : y + height / 2}
        textAnchor="middle"
        fill="#1a1a1a"
        style={{
          fontSize: `${nameFontSize}px`,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontWeight: 600,
        }}
      >
        {displayName}
      </text>
      {canShowBothLines && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 8}
          textAnchor="middle"
          fill="rgba(26,26,26,0.7)"
          style={{
            fontSize: `${valueFontSize}px`,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', monospace",
          }}
        >
          {value}
        </text>
      )}
    </g>
  );
};
