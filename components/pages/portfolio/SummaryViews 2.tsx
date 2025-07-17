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
  Tooltip as RechartsTooltip 
} from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import { defiProtocols } from '@/components/pages/defi/data';
import { cleanProtocolName } from './utils';
import { NFT } from './types';

const CHART_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', 
  '#06b6d4', '#f43f5e', '#6366f1', '#84cc16', '#f97316'
];

// Custom tooltip component for the pie charts
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
      <p className="text-muted-foreground">
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
  
  const averagePositionValue = groupedDeFiPositions.length > 0 
    ? totalDefiValue / groupedDeFiPositions.length 
    : 0;

  // Prepare pie chart data
  const pieChartData = React.useMemo(() => {
    return groupedDeFiPositions
      .filter(position => position.protocol !== 'Thala Farm') // Filter out TBD values
      .map((position, index) => ({
        name: cleanProtocolName(position.protocol),
        value: position.totalValue || 0,
        percentage: totalDefiValue > 0 ? ((position.totalValue || 0) / totalDefiValue) * 100 : 0,
        color: CHART_COLORS[index % CHART_COLORS.length],
        protocol: position.protocol,
        positions: position.positions?.length || 1
      }))
      .sort((a, b) => b.value - a.value);
  }, [groupedDeFiPositions, totalDefiValue]);

  return (
    <div className="space-y-8">
      {/* Professional Overview */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-lg font-semibold tracking-tight">
            DeFi Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            <div className="p-6 border-r border-border">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Total Value
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold tracking-tight">
                  {formatCurrency(totalDefiValue)}
                </p>
              </div>
            </div>
            
            <div className="p-6 border-r border-border lg:border-r">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Protocols
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold tracking-tight">
                  {groupedDeFiPositions.length}
                </p>
              </div>
            </div>
            
            <div className="p-6 border-r border-border">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Positions
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold tracking-tight">
                  {totalPositions}
                </p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Avg. Position
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold tracking-tight">
                  {formatCurrency(averagePositionValue)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position Holdings with Pie Chart */}
      {groupedDeFiPositions.length > 0 && (
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Position Holdings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pie Chart */}
              {pieChartData.length > 0 && (
                <div className="flex flex-col">
                  <h4 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                    Protocol Allocation
                  </h4>
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="hsl(var(--border))"
                          strokeWidth={1}
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
                <h4 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                  Positions
                </h4>
                <div className="space-y-4 flex-1">
                  {groupedDeFiPositions
                    .sort((a, b) => b.totalValue - a.totalValue)
                    .map((position, index) => {
                      const primaryType = Array.from(position.protocolTypes)[0] as string;
                      const protocolDetails = getProtocolDetails(position.protocol);
                      const positionPercentage = totalDefiValue > 0 ? (position.totalValue / totalDefiValue) * 100 : 0;
                      const chartEntry = pieChartData.find(entry => entry.protocol === position.protocol);

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => onProtocolClick(position)}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {chartEntry && (
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0 border" 
                                style={{ backgroundColor: chartEntry.color, borderColor: chartEntry.color }} 
                              />
                            )}
                            <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
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
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold tracking-tight truncate text-sm">
                                  {cleanProtocolName(position.protocol)}
                                </h3>
                                {position.protocol.toLowerCase() === 'aptin' && (
                                  <Badge variant="destructive" className="text-xs">
                                    DEPRECATED
                                  </Badge>
                                )}
                                {protocolDetails?.security?.auditStatus === 'Audited' && (
                                  <Badge variant="outline" className="text-xs border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                                    AUDITED
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-medium uppercase">
                                  {position.protocolTypes.size > 1
                                    ? 'MULTI'
                                    : (primaryType === 'derivatives' ? 'PERP' : primaryType?.toUpperCase() || 'DEFI')}
                                </span>
                                <span>•</span>
                                <span>{position.positions?.length || 1} POS</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 ml-4">
                            <p className="font-mono font-bold tracking-tight text-sm">
                              {position.protocol === 'Thala Farm'
                                ? <span className="text-muted-foreground">—</span>
                                : formatCurrency(position.totalValue)}
                            </p>
                            {position.protocol !== 'Thala Farm' && (
                              <p className="text-xs text-muted-foreground font-mono">
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
          </CardContent>
        </Card>
      )}
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

  if (nfts.length === 0) {
    return (
      <Card className="border border-border bg-card">
        <CardContent className="p-12 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 tracking-tight">No Digital Assets</h3>
          <p className="text-muted-foreground text-sm">
            No NFT holdings detected in this wallet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Professional NFT Overview */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Digital Asset Holdings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-3">
            <div className="p-6 border-r border-border">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Total Assets
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold tracking-tight">
                  {nfts.length.toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="p-6 border-r border-border">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Collections
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold tracking-tight">
                  {totalCollections}
                </p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Displayed
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold tracking-tight">
                  {nfts.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collection Holdings */}
      {collections.length > 0 && (
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Collection Holdings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {collections.map(([collection, count]) => {
                const collectionPercentage = (count as number / nfts.length) * 100;
                
                return (
                  <div
                    key={collection}
                    className={`p-6 transition-colors ${
                      onCollectionClick ? 'cursor-pointer hover:bg-muted/50' : ''
                    }`}
                    onClick={() => onCollectionClick?.(collection)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
                          <Archive className="h-5 w-5 text-muted-foreground" />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold tracking-tight truncate">
                            {collection || 'Unnamed Collection'}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="font-medium uppercase text-xs">
                              COLLECTION
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 ml-6 space-y-1">
                        <p className="text-xl font-mono font-bold tracking-tight">
                          {count as number}
                        </p>
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-foreground rounded-full transition-all duration-200"
                              style={{ width: `${Math.min(collectionPercentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground font-mono min-w-[3rem]">
                            {collectionPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
