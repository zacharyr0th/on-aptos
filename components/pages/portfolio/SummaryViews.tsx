'use client';

import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import { defiProtocols } from '@/components/pages/defi/data';
import { cleanProtocolName } from './utils';
import { NFT } from './types';

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
  const totalPositions = groupedDeFiPositions.reduce(
    (sum, pos) => sum + (pos.positions?.length || 1),
    0
  );

  const averagePositionValue =
    groupedDeFiPositions.length > 0
      ? totalDefiValue / groupedDeFiPositions.length
      : 0;

  // Prepare pie chart data
  const pieChartData = React.useMemo(() => {
    return groupedDeFiPositions
      .filter(position => position.protocol !== 'Thala Farm') // Filter out TBD values
      .map((position, index) => ({
        name: cleanProtocolName(position.protocol),
        value: position.totalValue || 0,
        percentage:
          totalDefiValue > 0
            ? ((position.totalValue || 0) / totalDefiValue) * 100
            : 0,
        color: CHART_COLORS[index % CHART_COLORS.length],
        protocol: position.protocol,
        positions: position.positions?.length || 1,
      }))
      .sort((a, b) => b.value - a.value);
  }, [groupedDeFiPositions, totalDefiValue]);

  return (
    <div>
      {/* Combined DeFi Portfolio Card */}
      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/30 bg-muted/20 py-3 px-4">
          <CardTitle className="text-base font-medium tracking-tight">
            DeFi Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                  {groupedDeFiPositions.length}
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

          {/* Position Holdings with Pie Chart */}
          {groupedDeFiPositions.length > 0 && (
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Pie Chart */}
                {pieChartData.length > 0 && (
                  <div className="flex flex-col">
                    <h4 className="text-[10px] font-medium text-muted-foreground/70 mb-2 uppercase tracking-wider">
                      Protocol Allocation
                    </h4>
                    <div className="w-full h-52 sm:h-64 lg:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={1}
                            dataKey="value"
                            stroke="hsl(var(--border))"
                            strokeWidth={0.5}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                className="hover:opacity-80 transition-opacity"
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomTooltip />} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Holdings List */}
                <div className="flex flex-col">
                  <h4 className="text-[10px] font-medium text-muted-foreground/70 mb-2 uppercase tracking-wider">
                    Positions
                  </h4>
                  <div className="space-y-2 flex-1">
                    {groupedDeFiPositions
                      .sort((a, b) => b.totalValue - a.totalValue)
                      .map((position, index) => {
                        const primaryType = Array.from(
                          position.protocolTypes
                        )[0] as string;
                        const protocolDetails = getProtocolDetails(
                          position.protocol
                        );
                        const positionPercentage =
                          totalDefiValue > 0
                            ? (position.totalValue / totalDefiValue) * 100
                            : 0;
                        const chartEntry = pieChartData.find(
                          entry => entry.protocol === position.protocol
                        );

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 sm:p-2.5 border border-border/30 rounded-md bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
                            onClick={() => onProtocolClick(position)}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {chartEntry && (
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: chartEntry.color }}
                                />
                              )}
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-background/50 border border-border/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <Image
                                  src={getProtocolLogo(position.protocol)}
                                  alt={`${position.protocol} logo`}
                                  width={28}
                                  height={28}
                                  className="w-full h-full object-cover"
                                  onError={e => {
                                    const img = e.target as HTMLImageElement;
                                    img.src = '/placeholder.jpg';
                                  }}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <h3 className="font-medium tracking-tight truncate text-xs sm:text-sm">
                                    {cleanProtocolName(position.protocol)}
                                  </h3>
                                  {position.protocol.toLowerCase() ===
                                    'aptin' && (
                                    <Badge
                                      variant="destructive"
                                      className="text-[9px] h-3.5 px-1.5"
                                    >
                                      DEPRECATED
                                    </Badge>
                                  )}
                                  {protocolDetails?.security?.auditStatus ===
                                    'Audited' && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] h-3.5 px-1.5 border-green-200/50 text-green-700 dark:border-green-800/50 dark:text-green-400"
                                    >
                                      AUDITED
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                                  <span className="font-medium uppercase">
                                    {position.protocolTypes.size > 1
                                      ? 'MULTI'
                                      : primaryType === 'derivatives'
                                        ? 'PERP'
                                        : primaryType?.toUpperCase() || 'DEFI'}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {position.positions?.length || 1} POS
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0 ml-3">
                              <p className="font-mono font-semibold tracking-tight text-xs sm:text-sm">
                                {position.protocol === 'Thala Farm' ? (
                                  <span className="text-muted-foreground/50">
                                    —
                                  </span>
                                ) : (
                                  formatCurrency(position.totalValue)
                                )}
                              </p>
                              {position.protocol !== 'Thala Farm' && (
                                <p className="text-[10px] text-muted-foreground/70 font-mono">
                                  {positionPercentage.toFixed(1)}%
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty state for no positions */}
          {groupedDeFiPositions.length === 0 && (
            <div className="p-8 sm:p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-sm font-medium mb-1 tracking-tight">
                No DeFi Positions
              </h3>
              <p className="text-muted-foreground/70 text-xs">
                No DeFi positions detected in this wallet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
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

    return Object.entries(collectionMap)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10);
  }, [nfts]);

  const totalCollections = new Set(nfts.map(nft => nft.collection_name)).size;

  // Prepare pie chart data for collection distribution
  const pieChartData = React.useMemo(() => {
    return collections.map(([collection, count], index) => ({
      name:
        (collection || 'Unnamed Collection').length > 20
          ? `${(collection || 'Unnamed Collection').substring(0, 20)}...`
          : collection || 'Unnamed Collection',
      value: count as number,
      percentage: ((count as number) / nfts.length) * 100,
      color: CHART_COLORS[index % CHART_COLORS.length],
      fullName: collection || 'Unnamed Collection',
    }));
  }, [collections, nfts.length]);

  if (nfts.length === 0) {
    return (
      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8 sm:p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-sm font-medium mb-1 tracking-tight">
            No Digital Assets
          </h3>
          <p className="text-muted-foreground/70 text-xs">
            No NFT holdings detected in this wallet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Combined Digital Asset Holdings Card */}
      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/30 bg-muted/20 py-3 px-4">
          <CardTitle className="text-base font-medium tracking-tight">
            Digital Asset Holdings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Stats Row */}
          <div className="grid grid-cols-3 border-b border-border/30">
            <div className="p-3 sm:p-4 border-r border-border/30">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Package className="h-3 w-3 text-muted-foreground/70" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                    Total Assets
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-mono font-semibold tracking-tight">
                  {nfts.length.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-4 border-r border-border/30">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Archive className="h-3 w-3 text-muted-foreground/70" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                    Collections
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-mono font-semibold tracking-tight">
                  {totalCollections}
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Grid3X3 className="h-3 w-3 text-muted-foreground/70" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                    Displayed
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-mono font-semibold tracking-tight">
                  {nfts.length}
                </p>
              </div>
            </div>
          </div>

          {/* Collection Holdings with Pie Chart */}
          {collections.length > 0 && (
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Pie Chart */}
                {pieChartData.length > 0 && (
                  <div className="flex flex-col">
                    <h4 className="text-[10px] font-medium text-muted-foreground/70 mb-2 uppercase tracking-wider">
                      Collection Distribution
                    </h4>
                    <div className="w-full h-52 sm:h-64 lg:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={1}
                            dataKey="value"
                            stroke="hsl(var(--border))"
                            strokeWidth={0.5}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                className="hover:opacity-80 transition-opacity"
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomTooltip />} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Holdings List */}
                <div className="flex flex-col">
                  <h4 className="text-[10px] font-medium text-muted-foreground/70 mb-2 uppercase tracking-wider">
                    Collections
                  </h4>
                  <div className="space-y-2 flex-1">
                    {collections.map(([collection, count], index) => {
                      const collectionPercentage =
                        ((count as number) / nfts.length) * 100;
                      const chartEntry = pieChartData.find(
                        entry => entry.fullName === collection
                      );

                      return (
                        <div
                          key={collection}
                          className={`flex items-center justify-between p-2 sm:p-2.5 border border-border/30 rounded-md bg-muted/10 hover:bg-muted/20 transition-colors ${
                            onCollectionClick ? 'cursor-pointer' : ''
                          }`}
                          onClick={() => onCollectionClick?.(collection)}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {chartEntry && (
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: chartEntry.color }}
                              />
                            )}
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-background/50 border border-border/30 flex items-center justify-center flex-shrink-0">
                              <Archive className="h-3 w-3 text-muted-foreground/70" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium tracking-tight truncate text-xs sm:text-sm">
                                {collection || 'Unnamed Collection'}
                              </h3>
                              <span className="text-[10px] text-muted-foreground/70 uppercase">
                                COLLECTION
                              </span>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="font-mono font-semibold tracking-tight text-xs sm:text-sm">
                              {count as number}
                            </p>
                            <p className="text-[10px] text-muted-foreground/70 font-mono">
                              {collectionPercentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
