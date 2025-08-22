"use client";

import React from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// NFT Grid Skeleton
interface NFTGridSkeletonProps {
  count?: number;
  columns?: number;
  className?: string;
}

export const NFTGridSkeleton: React.FC<NFTGridSkeletonProps> = ({
  count = 9,
  columns = 3,
  className = "",
}) => {
  const gridClass = `grid gap-4 ${
    columns === 2
      ? "grid-cols-2"
      : columns === 3
        ? "grid-cols-2 sm:grid-cols-3"
        : `grid-cols-${columns}`
  }`;

  return (
    <div className={`${gridClass} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
};

// Simple NFT Grid Skeleton (no text)
export const SimpleNFTGridSkeleton: React.FC<NFTGridSkeletonProps> = ({
  count = 9,
  columns = 3,
  className = "",
}) => {
  const gridClass = `grid gap-4 ${
    columns === 2
      ? "grid-cols-2"
      : columns === 3
        ? "grid-cols-2 sm:grid-cols-3"
        : `grid-cols-${columns}`
  }`;

  return (
    <div className={`${gridClass} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-square bg-neutral-100 dark:bg-neutral-900 animate-pulse rounded-lg"
        />
      ))}
    </div>
  );
};

// Asset Table Skeleton
interface AssetTableSkeletonProps {
  rows?: number;
  className?: string;
}

export const AssetTableSkeleton: React.FC<AssetTableSkeletonProps> = ({
  rows = 5,
  className = "",
}) => (
  <>
    {/* Mobile Card Layout */}
    <div className={`block md:hidden space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-32" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Desktop Table Layout */}
    <div className={`hidden md:block ${className}`}>
      <div className="border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 p-3 border-b bg-muted/50">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-4 gap-4 p-3 border-b last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  </>
);

// Wallet Summary Skeleton
export const WalletSummarySkeleton: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <Card className={className}>
    <CardHeader>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-6 w-32" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      {/* Chart */}
      <Skeleton className="h-64" />
      {/* Legend */}
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
    </CardContent>
  </Card>
);

// Portfolio Stats Skeleton
interface PortfolioStatsSkeletonProps {
  count?: number;
  columns?: number;
  className?: string;
}

export const PortfolioStatsSkeleton: React.FC<PortfolioStatsSkeletonProps> = ({
  count = 3,
  columns = 3,
  className = "",
}) => {
  const gridClass = `grid gap-4 ${
    columns === 2
      ? "grid-cols-2"
      : columns === 3
        ? "grid-cols-3"
        : columns === 4
          ? "grid-cols-2 lg:grid-cols-4"
          : `grid-cols-${columns}`
  }`;

  return (
    <div className={`${gridClass} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  );
};

// Chart Skeleton
export const ChartSkeleton: React.FC<{
  className?: string;
  height?: string;
}> = ({ className = "", height = "h-64" }) => (
  <div className={`${height} ${className}`}>
    <Skeleton className="w-full h-full rounded-lg" />
  </div>
);

// DeFi Summary Skeleton
export const DeFiSummarySkeleton: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div className={`space-y-6 ${className}`}>
    {/* Header */}
    <Skeleton className="h-6 w-48" />

    {/* Stats Grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 border border-border/30 rounded-lg">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 border-r border-border/30 last:border-r-0">
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>

    {/* Protocol logos */}
    <div className="flex items-center gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-10 rounded-lg" />
      ))}
    </div>
  </div>
);

// Transaction Table Skeleton - Enhanced version
export const TransactionTableSkeleton: React.FC<{
  rows?: number;
  className?: string;
}> = ({ rows = 10, className = "" }) => (
  <div className={`space-y-4 ${className}`}>
    {/* Filters */}
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <Skeleton className="h-10 w-full lg:w-[200px]" />
        <Skeleton className="h-10 w-full lg:w-64" />
      </div>

      {/* Category filters */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>

    <div className="border-b border-border"></div>

    {/* Table */}
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-8" />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-5 gap-4 p-4 border-b last:border-b-0"
        >
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>

    {/* Pagination */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <div className="flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8" />
        ))}
      </div>
    </div>
  </div>
);

// Yield Table Skeleton
export const YieldTableSkeleton: React.FC<{
  rows?: number;
  className?: string;
}> = ({ rows = 10, className = "" }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Filters */}
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
        <Skeleton className="h-10 w-full sm:flex-1" />
        <Skeleton className="h-10 w-full sm:flex-1" />
        <Skeleton className="h-10 w-full sm:flex-1" />
      </div>

      <div className="flex flex-col sm:grid sm:grid-cols-9 gap-2 sm:gap-4 w-full">
        <Skeleton className="h-10 w-full sm:col-span-2" />
        <div className="grid grid-cols-4 sm:contents gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>

    <div className="border-b border-border"></div>

    {/* Table */}
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 gap-4 p-4 border-b bg-muted/50">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-7 gap-4 p-4 border-b last:border-b-0"
        >
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
          <div className="flex justify-end">
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>

    {/* Pagination */}
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between pt-4 mt-4 border-t border-border">
      <Skeleton className="h-4 w-48" />
      <div className="flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8" />
        ))}
        <Skeleton className="h-4 w-24 mx-2" />
      </div>
    </div>
  </div>
);

// Yield Opportunities Skeleton
export const YieldOpportunitiesSkeleton: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div className={`space-y-6 ${className}`}>
    {/* Header Stats Card */}
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-4 w-24 mx-auto mb-2" />
              <Skeleton className="h-8 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Asset Cards */}
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <div>
                  <Skeleton className="h-6 w-16 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  </div>
);

// NFT Treemap Skeleton
export const NFTTreemapSkeleton: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div className={`space-y-4 ${className}`}>
    {/* Header with title and stats */}
    <div className="flex items-baseline gap-2 mb-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>
    
    {/* Treemap container */}
    <div className="h-52 sm:h-64 w-full bg-neutral-50 dark:bg-neutral-900/50 rounded-lg overflow-hidden p-4">
      {/* Simulated treemap rectangles */}
      <div className="h-full w-full flex gap-1">
        {/* Large rectangle */}
        <div className="flex flex-col gap-1 flex-1">
          <Skeleton className="h-3/5 w-full rounded-sm" />
          <div className="flex gap-1 h-2/5">
            <Skeleton className="h-full flex-1 rounded-sm" />
            <Skeleton className="h-full flex-1 rounded-sm" />
          </div>
        </div>
        
        {/* Medium rectangles */}
        <div className="flex flex-col gap-1 w-1/3">
          <Skeleton className="h-2/5 w-full rounded-sm" />
          <div className="flex gap-1 h-1/5">
            <Skeleton className="h-full flex-1 rounded-sm" />
            <Skeleton className="h-full flex-1 rounded-sm" />
          </div>
          <Skeleton className="h-2/5 w-full rounded-sm" />
        </div>
        
        {/* Small rectangles */}
        <div className="flex flex-col gap-1 w-1/5">
          <Skeleton className="h-1/4 w-full rounded-sm" />
          <Skeleton className="h-1/6 w-full rounded-sm" />
          <Skeleton className="h-1/4 w-full rounded-sm" />
          <Skeleton className="h-1/6 w-full rounded-sm" />
          <Skeleton className="h-1/6 w-full rounded-sm" />
        </div>
      </div>
    </div>
  </div>
);

// Generic Loading Component with different variants
interface LoadingSkeletonProps {
  variant:
    | "nft-grid"
    | "asset-table"
    | "wallet-summary"
    | "chart"
    | "stats"
    | "defi-summary"
    | "transactions"
    | "yield-table"
    | "yield-opportunities"
    | "nft-treemap";
  className?: string;
  [key: string]: any; // For variant-specific props
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant,
  className,
  ...props
}) => {
  switch (variant) {
    case "nft-grid":
      return <NFTGridSkeleton className={className} {...props} />;
    case "asset-table":
      return <AssetTableSkeleton className={className} {...props} />;
    case "wallet-summary":
      return <WalletSummarySkeleton className={className} {...props} />;
    case "chart":
      return <ChartSkeleton className={className} {...props} />;
    case "stats":
      return <PortfolioStatsSkeleton className={className} {...props} />;
    case "defi-summary":
      return <DeFiSummarySkeleton className={className} {...props} />;
    case "transactions":
      return <TransactionTableSkeleton className={className} {...props} />;
    case "yield-table":
      return <YieldTableSkeleton className={className} {...props} />;
    case "yield-opportunities":
      return <YieldOpportunitiesSkeleton className={className} {...props} />;
    case "nft-treemap":
      return <NFTTreemapSkeleton className={className} {...props} />;
    default:
      return <Skeleton className={className} />;
  }
};
