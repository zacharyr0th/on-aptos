import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Treemap,
} from "recharts";

import { formatCurrency, formatTokenAmount } from "@/lib/utils/format";

import type { FungibleAsset } from "./PortfolioMetrics";
import { TokenImage } from "./SmartImage";

// Optimized Legend Item with minimal re-renders
export const LegendItem = React.memo(
  ({
    color,
    symbol,
    value,
    percentage,
    showValue = true,
  }: {
    color: string;
    symbol: string;
    value?: number;
    percentage: number;
    showValue?: boolean;
  }) => (
    <div className="flex items-center gap-1 py-0.5">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="text-sm font-medium min-w-[40px]">{symbol}</div>
      {showValue && value !== undefined && (
        <div className="text-xs text-muted-foreground hidden lg:block ml-auto mr-2">
          {formatCurrency(value)}
        </div>
      )}
      <div className="text-sm text-muted-foreground text-right">
        {percentage.toFixed(1)}%
      </div>
    </div>
  ),
  (prev, next) =>
    prev.color === next.color &&
    prev.symbol === next.symbol &&
    prev.percentage === next.percentage &&
    prev.value === next.value,
);

LegendItem.displayName = "LegendItem";

// Optimized Token Details
export const TokenDetails = React.memo(
  ({
    asset,
    totalValue,
    onBack,
  }: {
    asset: FungibleAsset;
    totalValue: number;
    onBack: () => void;
  }) => {
    const stats = useMemo(
      () => ({
        balance: formatTokenAmount(
          Number(asset.balance) || 0,
          String(asset.metadata?.decimals || 8),
          {
            showSymbol: true,
            useCompact: true,
          },
        ),
        value: formatCurrency(asset.value || 0),
        price: formatCurrency(asset.price || 0),
        percentage:
          totalValue > 0
            ? (((asset.value || 0) / totalValue) * 100).toFixed(1)
            : "0",
      }),
      [asset, totalValue],
    );

    return (
      <div className="bg-card border rounded-lg p-6 h-full flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-12 h-12 bg-neutral-50 dark:bg-neutral-950 rounded-lg overflow-hidden flex-shrink-0">
            <TokenImage
              src={(asset.metadata as any)?.icon_uri}
              alt={asset.metadata?.symbol || "Token"}
              assetType={asset.asset_type}
              metadata={asset.metadata}
              fill
              className="object-contain"
              sizes="48px"
              priority
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {asset.metadata?.symbol || "Unknown"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {asset.metadata?.name || "Unknown Asset"}
            </p>
          </div>
        </div>

        <div className="space-y-3 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <StatItem label="Balance" value={stats.balance} />
            <StatItem label="Value" value={stats.value} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatItem label="Price" value={stats.price} />
            <StatItem label="Portfolio %" value={`${stats.percentage}%`} />
          </div>
        </div>

        <button
          onClick={onBack}
          className="text-sm text-primary hover:underline mt-4"
        >
          ← Back to portfolio overview
        </button>
      </div>
    );
  },
  (prev, next) =>
    prev.asset.asset_type === next.asset.asset_type &&
    prev.asset.value === next.asset.value &&
    prev.totalValue === next.totalValue,
);

TokenDetails.displayName = "TokenDetails";

// Small stat component
const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground uppercase tracking-wider">
      {label}
    </p>
    <p className="text-base font-medium mt-1 font-mono">{value}</p>
  </div>
);

// Treemap colors constants
const TREEMAP_COLORS = {
  dark: [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#3b82f6",
    "#a855f7",
    "#14b8a6",
    "#f97316",
    "#84cc16",
    "#ef4444",
    "#22d3ee",
    "#a78bfa",
    "#f472b6",
  ],
  light: [
    "#a5b4fc",
    "#c4b5fd",
    "#f9a8d4",
    "#67e8f9",
    "#6ee7b7",
    "#fcd34d",
    "#93c5fd",
    "#d8b4fe",
    "#5eead4",
    "#fdba74",
    "#bef264",
    "#fca5a5",
    "#a2f0ea",
    "#ddd6fe",
    "#fbcfe8",
  ],
};

// Optimized NFT Treemap
export const NFTTreemap = React.memo(
  ({
    stats,
    totalCount,
    isDarkMode,
  }: {
    stats: {
      collections: Array<{ name: string; count: number }>;
      totalCollections: number;
    };
    totalCount: number;
    isDarkMode: boolean;
  }) => {
    const treemapData = useMemo(() => {
      const colors = isDarkMode ? TREEMAP_COLORS.dark : TREEMAP_COLORS.light;
      return stats.collections.map((collection, index) => ({
        name: collection.name || "Unnamed Collection",
        size: collection.count,
        percentage: (collection.count / totalCount) * 100,
        fill: colors[index % colors.length],
      }));
    }, [stats.collections, totalCount, isDarkMode]);

    return (
      <div className="space-y-4">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-lg font-medium">NFT Treemap</h3>
          <span className="text-sm text-muted-foreground text-right">
            {totalCount} NFTs across {stats.totalCollections} collections
          </span>
        </div>

        <div className="h-52 sm:h-64 w-full bg-neutral-50 dark:bg-neutral-900/50 rounded-lg overflow-hidden">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <Treemap
              data={treemapData}
              dataKey="size"
              nameKey="name"
              aspectRatio={4 / 3}
              stroke="none"
              content={<TreemapContent />}
            >
              <RechartsTooltip content={<TreemapTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.totalCount === next.totalCount &&
    prev.isDarkMode === next.isDarkMode &&
    prev.stats.totalCollections === next.stats.totalCollections &&
    prev.stats.collections.length === next.stats.collections.length,
);

NFTTreemap.displayName = "NFTTreemap";

// Optimized Treemap Tooltip
const TreemapTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 sm:p-3 z-50">
      <p className="font-medium text-xs sm:text-sm">{data.name}</p>
      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
        {data.size} NFTs ({data.percentage.toFixed(1)}%)
      </p>
    </div>
  );
};

// Optimized Treemap Content Renderer
const TreemapContent = React.memo((props: any) => {
  const { x, y, width, height, index, name, value, root } = props;
  const fillColor = root?.children?.[index]?.fill || props.fill || "#8884d8";

  // Early return for small rectangles
  if (width < 40 || height < 25) {
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fillColor,
          stroke: "rgba(255,255,255,0.15)",
          strokeWidth: 1,
          opacity: 0.95,
        }}
      />
    );
  }

  const canShowBothLines = width >= 60 && height >= 40;
  const nameFontSize = Math.max(7, Math.min(12, width / 8));
  const displayName =
    name.length > Math.floor(width / 6)
      ? name.substring(0, Math.max(3, Math.floor(width / 6) - 3)) + "..."
      : name;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fillColor,
          stroke: "rgba(255,255,255,0.15)",
          strokeWidth: 1,
          opacity: 0.95,
        }}
      />
      <text
        x={x + width / 2}
        y={canShowBothLines ? y + height / 2 - 4 : y + height / 2}
        textAnchor="middle"
        fill="white"
        style={{
          fontSize: `${nameFontSize}px`,
          fontFamily: "system-ui",
          fontWeight: 600,
          filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))",
        }}
      >
        {displayName}
      </text>
      {canShowBothLines && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 8}
          textAnchor="middle"
          fill="rgba(255,255,255,0.9)"
          style={{
            fontSize: `${Math.max(6, Math.min(10, width / 10))}px`,
            fontFamily: "system-ui",
            filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))",
          }}
        >
          {value}
        </text>
      )}
    </g>
  );
});

TreemapContent.displayName = "TreemapContent";
