'use client';

import {
  TrendingUp,
  Shield,
  Activity,
  ExternalLink,
  Grid3X3,
  ImageIcon,
  DollarSign,
  Building2,
  PieChart,
  Package,
  Archive,
} from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Treemap,
} from 'recharts';

import { defiProtocols } from '@/components/pages/defi/data';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format';

import { NFT } from './types';
import { cleanProtocolName } from './utils';

const CHART_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#f43f5e',
  '#6366f1',
  '#84cc16',
  '#f97316',
];

// Custom tooltip component for the pie charts
const CustomTooltip = React.memo(({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border/50 rounded-md shadow-md p-2 z-10 text-xs space-y-0.5">
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
      typeof data.value === 'number' &&
      data.value > 100 ? (
        <p className="text-muted-foreground/80 text-[10px]">
          Value: {formatCurrency(data.value)}
        </p>
      ) : (
        <p className="text-muted-foreground/80 text-[10px]">
          Count: {data.value} {data.value === 1 ? 'item' : 'items'}
        </p>
      )}
      <p className="text-muted-foreground/80 text-[10px]">
        Allocation: {data.percentage.toFixed(1)}%
      </p>
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

interface DeFiSummaryViewProps {
  groupedDeFiPositions: any[];
  totalDefiValue: number;
  getProtocolLogo: (protocol: string) => string;
  onProtocolClick: (position: any) => void;
}

interface NFTSummaryViewProps {
  nfts: NFT[];
  currentPageNFTs: number;
  onCollectionClick?: (collection: string) => void;
}

const getProtocolDetails = (protocolName: string) => {
  return defiProtocols.find(
    protocol =>
      protocol.title.toLowerCase() === protocolName.toLowerCase() ||
      protocol.title.toLowerCase().includes(protocolName.toLowerCase()) ||
      protocolName.toLowerCase().includes(protocol.title.toLowerCase())
  );
};

export const DeFiSummaryView: React.FC<DeFiSummaryViewProps> = ({
  groupedDeFiPositions,
  totalDefiValue,
  getProtocolLogo,
  onProtocolClick,
}) => {
  // Calculate additional metrics
  const totalPositions = (groupedDeFiPositions || []).reduce(
    (sum, pos) => sum + (pos.positions?.length || 1),
    0
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
        <h2 className="text-base font-medium tracking-tight mb-4">
          DeFi Portfolio Overview
        </h2>
        <div>
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-border/30">
            <div className="p-3 sm:p-4 border-r border-border/30">
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

            <div className="p-3 sm:p-4 border-r border-border/30 lg:border-r">
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

            <div className="p-3 sm:p-4 border-r border-border/30">
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

            <div className="p-3 sm:p-4">
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
            <div className="p-3 sm:p-4">
              <div className="flex flex-col">
                <h4 className="text-[10px] font-medium text-muted-foreground/70 mb-3 uppercase tracking-wider">
                  Protocols
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-3">
                    {(groupedDeFiPositions || [])
                      .sort((a, b) => b.totalValue - a.totalValue)
                      .map((position, index) => (
                        <div
                          key={index}
                          className="w-10 h-10 rounded-lg bg-background/50 border border-border/30 flex items-center justify-center overflow-hidden hover:border-border/60 transition-colors cursor-pointer"
                          onClick={() => onProtocolClick(position)}
                          title={cleanProtocolName(position.protocol)}
                        >
                          <Image
                            src={getProtocolLogo(position.protocol)}
                            alt={`${position.protocol} logo`}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            onError={e => {
                              const img = e.target as HTMLImageElement;
                              img.src = '/placeholder.jpg';
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
                    <Building2 className="h-3.5 w-3.5" />
                    Explore Aptos DeFi
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Empty state for no positions */}
          {(!groupedDeFiPositions || groupedDeFiPositions.length === 0) && (
            <div className="bg-card border rounded-xl p-8 text-center">
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
  currentPageNFTs,
  onCollectionClick,
}) => {
  const collections = React.useMemo(() => {
    const collectionMap = nfts.reduce((acc: any, nft) => {
      acc[nft.collection_name] = (acc[nft.collection_name] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(collectionMap).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    );
  }, [nfts]);

  // Prepare data for Treemap
  const treemapData = React.useMemo(() => {
    // Use a limited color palette instead of full rainbow
    const baseHues = [200, 210, 220, 230, 240]; // Blues
    return collections.map(([name, count], index) => ({
      name: name || 'Unnamed Collection',
      size: count as number,
      percentage: ((count as number) / nfts.length) * 100,
      fill: `hsl(${baseHues[index % baseHues.length]}, 45%, ${55 + (index % 3) * 10}%)`,
    }));
  }, [collections, nfts.length]);

  const totalCollections = new Set(nfts.map(nft => nft.collection_name)).size;

  if (nfts.length === 0) {
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
    <div className="space-y-6">
      {/* Minimal Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            Total Assets
          </p>
          <p className="text-xl font-light">{nfts.length}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            Collections
          </p>
          <p className="text-xl font-light">{totalCollections}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            Top Collection
          </p>
          <p className="text-xl font-light">
            {String(collections[0]?.[1] || 0)}
          </p>
        </div>
      </div>

      {/* Collections Treemap */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#fff"
            onClick={(data: any) => {
              if (onCollectionClick && data && data.name) {
                // Find the original collection name from the treemap data
                const originalName = collections.find(
                  ([name]) => (name || 'Unnamed Collection') === data.name
                )?.[0];
                if (originalName !== undefined) {
                  onCollectionClick(originalName);
                }
              }
            }}
          >
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-3">
                      <p className="font-medium text-sm">{data.name}</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
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

      {/* Collection Insights - 2x3 Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              Concentration
            </p>
            <p className="text-lg font-semibold">
              {(
                (collections
                  .slice(0, 3)
                  .reduce((sum, [_, count]) => sum + (count as number), 0) /
                  nfts.length) *
                100
              ).toFixed(0)}
              %
            </p>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            In top 3 collections
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              Toe Dipper
            </p>
            <p className="text-lg font-semibold">
              {
                collections.filter(([_, count]) => (count as number) === 1)
                  .length
              }
            </p>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            1 per collection
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              Largest Collection
            </p>
            <p className="text-lg font-semibold">
              {Math.round(
                (((collections[0]?.[1] as number) || 0) / nfts.length) * 100
              )}
              %
            </p>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Of total NFTs
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              Fan Status
            </p>
            <p className="text-lg font-semibold">
              {
                collections.filter(([_, count]) => (count as number) >= 5)
                  .length
              }
            </p>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            5 per collection
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              Avg Holding
            </p>
            <p className="text-lg font-semibold">
              {Math.round(nfts.length / totalCollections)} NFTs
            </p>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Per collection
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              Stan Status
            </p>
            <p className="text-lg font-semibold">
              {
                collections.filter(([_, count]) => (count as number) >= 10)
                  .length
              }
            </p>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            10 per collection
          </p>
        </div>
      </div>
    </div>
  );
};
