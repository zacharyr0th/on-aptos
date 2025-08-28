"use client";

import {
  Wallet,
  Layers,
  Loader2,
  PieChart as PieChartIcon,
} from "lucide-react";
import React, { Suspense, lazy, useMemo, useCallback } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";

import {
  calculateAssetAllocation,
  CHART_COLORS_LIGHT,
  CHART_COLORS_DARK,
} from "./shared/ChartUtils";
import { LoadingSkeleton, NFTTreemapSkeleton } from "./shared/LoadingSkeletons";
import type { FungibleAsset, DeFiPosition } from "./shared/PortfolioMetrics";
import {
  LegendItem,
  TokenDetails,
  NFTTreemap,
} from "./shared/WalletSummaryComponents";

// Lazy load heavy chart component
const PieChart = lazy(() =>
  import("./shared/ChartUtils").then((m) => ({ default: m.PieChart })),
);

interface WalletSummaryProps {
  walletAddress?: string;
  assets?: FungibleAsset[];
  defiPositions?: DeFiPosition[];
  totalValue?: number;
  className?: string;
  isLoading?: boolean;
  selectedAsset?: FungibleAsset | null;
  onAssetSelect?: (asset: FungibleAsset | null) => void;
  nfts?: any[];
  nftTotalValue?: number;
  totalNFTCount?: number | null;
  nftCollectionStats?: {
    collections: Array<{ name: string; count: number }>;
    totalCollections: number;
  } | null;
  nftsLoading?: boolean;
}

// Optimized dark mode hook with SSR safety
const useDarkMode = () => {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const checkDark = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
};

// Stats component
const StatsGrid = React.memo(({ tokens, nfts, defi, nftCount }: any) => (
  <div className="hidden sm:grid grid-cols-3 gap-8">
    <StatItem label="Tokens" value={tokens} />
    <StatItem
      label="NFTs"
      value={
        nftCount !== null ? (
          nftCount
        ) : nfts > 0 ? (
          `${nfts}+`
        ) : (
          <Loader2 className="h-5 w-5 animate-spin inline-block text-muted-foreground" />
        )
      }
    />
    <StatItem label="DeFi Positions" value={defi} />
  </div>
));

StatsGrid.displayName = "StatsGrid";

const StatItem = ({ label, value }: any) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
      {label}
    </p>
    <p className="text-xl font-normal">{value}</p>
  </div>
);

// Empty states
const EmptyChart = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <PieChartIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">No assets with value data</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Assets will appear here once price data is available
      </p>
    </div>
  </div>
);

const EmptyLegend = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">No holdings to display</p>
    </div>
  </div>
);

const NoWallet = ({ className }: { className?: string }) => (
  <Card className={className}>
    <CardHeader>
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4" />
        <CardTitle className="text-base sm:text-lg">Wallet Summary</CardTitle>
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
  const isDarkMode = useDarkMode();
  const chartColors = isDarkMode ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;

  // Optimized calculations with single pass
  const {
    portfolioMetrics,
    calculatedTotalValue,
    allAssetsData,
    legendData,
    nftStats,
  } = useMemo(() => {
    // Portfolio metrics
    const metrics = {
      totalAssets: assets.length,
      nftCount: nfts.length,
      defiCount: defiPositions.length,
    };

    // Total value calculation
    const total =
      assets.reduce((sum, a) => sum + (a.value || 0), 0) +
      defiPositions.reduce((sum, p) => sum + (p.totalValueUSD || 0), 0) +
      nftTotalValue;

    // Asset allocation
    const assetData = calculateAssetAllocation(
      assets,
      defiPositions,
      total,
      chartColors,
    );

    // Legend data optimization
    const legend = {
      items: assetData.slice(0, 3),
      others: null as { value: number; percentage: number } | null,
    };

    if (assetData.length > 3) {
      const othersSlice = assetData.slice(3);
      const othersValue = othersSlice.reduce((sum, a) => sum + a.value, 0);
      const othersPercentage = othersSlice.reduce(
        (sum, a) => sum + a.percentage,
        0,
      );
      if (othersPercentage >= 0.01) {
        legend.others = { value: othersValue, percentage: othersPercentage };
      }
    }

    // NFT stats
    const nftData = nftCollectionStats?.collections.length
      ? nftCollectionStats
      : nfts.length
        ? (() => {
            const map = {} as Record<string, number>;
            nfts.forEach(
              (n) =>
                (map[n.collection_name || "Unknown"] =
                  (map[n.collection_name || "Unknown"] || 0) + 1),
            );
            const collections = Object.entries(map)
              .map(([name, count]) => ({ name, count }))
              .sort((a, b) => b.count - a.count);
            return { collections, totalCollections: collections.length };
          })()
        : null;

    return {
      portfolioMetrics: metrics,
      calculatedTotalValue: total,
      allAssetsData: assetData,
      legendData: legend,
      nftStats: nftData,
    };
  }, [
    assets,
    defiPositions,
    nftTotalValue,
    chartColors,
    nfts,
    nftCollectionStats,
  ]);

  const handleAssetBack = useCallback(
    () => onAssetSelect?.(null),
    [onAssetSelect],
  );

  // Early returns
  if (isLoading)
    return <LoadingSkeleton variant="wallet-summary" className={className} />;
  if (!walletAddress) return <NoWallet className={className} />;

  const nftCount = totalNFTCount ?? nfts.length;
  const showTreemap = !nftsLoading && nftStats?.collections.length;

  return (
    <div className="space-y-4 pt-4">
      <StatsGrid
        tokens={portfolioMetrics.totalAssets}
        nfts={portfolioMetrics.nftCount}
        defi={portfolioMetrics.defiCount}
        nftCount={totalNFTCount}
      />

      <div className="hidden sm:block border-b border-neutral-200 dark:border-neutral-800" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-2 lg:px-8">
        {/* Chart Section */}
        <div className="space-y-3 overflow-visible lg:pr-4">
          <div className="h-72 relative overflow-visible">
            {selectedAsset ? (
              <TokenDetails
                asset={selectedAsset}
                totalValue={calculatedTotalValue}
                onBack={handleAssetBack}
              />
            ) : allAssetsData.length > 0 ? (
              <Suspense
                fallback={
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                }
              >
                <PieChart
                  data={allAssetsData}
                  innerRadius="55%"
                  outerRadius="92%"
                  centerContent={
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl lg:text-2xl font-bold">
                        {formatCurrency(totalValue)}
                      </div>
                    </div>
                  }
                />
              </Suspense>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        {/* Legend Section */}
        <div className="flex flex-col justify-center items-center h-full lg:pl-4">
          <div className="space-y-0.5 w-full max-w-[160px] lg:max-w-[200px]">
            {allAssetsData.length > 0 ? (
              <div className="space-y-0.5">
                {legendData.items.map((asset, i) => (
                  <LegendItem
                    key={`${asset.symbol}-${i}`}
                    color={asset.color}
                    symbol={asset.symbol || ""}
                    value={asset.value}
                    percentage={asset.percentage}
                  />
                ))}
                {legendData.others && (
                  <LegendItem
                    color="#9ca3af"
                    symbol="Others"
                    value={legendData.others.value}
                    percentage={legendData.others.percentage}
                  />
                )}
              </div>
            ) : (
              <EmptyLegend />
            )}
          </div>
        </div>
      </div>

      <div className="border-b-2 border-border/50" />

      {nftsLoading ? (
        <NFTTreemapSkeleton />
      ) : showTreemap ? (
        <NFTTreemap
          stats={nftStats!}
          totalCount={nftCount}
          isDarkMode={isDarkMode}
        />
      ) : null}
    </div>
  );
};
