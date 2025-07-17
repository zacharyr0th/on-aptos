import React, { useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  Grid,
  Info,
  DollarSign,
  Building2,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  TooltipProps,
} from 'recharts';
import {
  formatCurrency,
  formatPercentage,
  formatTokenAmount,
} from '@/lib/utils/format';
import { getTokenLogoUrlWithFallback } from '@/lib/utils/token-logos';
import { cn } from '@/lib/utils';
import { getProtocolLogo } from './utils';

interface FungibleAsset {
  asset_type: string;
  balance?: number;
  value?: number;
  metadata?: {
    symbol?: string;
    name?: string;
    decimals?: number;
  };
  isVerified?: boolean;
}

interface DeFiPosition {
  protocol: string;
  totalValue: number;
  positions: any[];
}

interface WalletSummaryProps {
  walletAddress: string | undefined;
  assets?: FungibleAsset[];
  defiPositions?: DeFiPosition[];
  totalValue?: number;
  className?: string;
  isLoading?: boolean;
  pieChartData?: Array<{
    symbol: string;
    value: number;
    percentage: number;
  }>;
  pieChartColors?: string[];
}

interface AssetAllocation {
  name: string;
  symbol: string;
  value: number;
  percentage: number;
  color: string;
  logo: string;
  isDefi?: boolean;
}

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

// Custom tooltip component for the pie chart
const CustomTooltip = React.memo(({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload as AssetAllocation;

  return (
    <div className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 z-10 text-sm space-y-1">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <p className="font-semibold text-popover-foreground">{data.symbol}</p>
      </div>
      <p className="text-muted-foreground">
        Allocation: {formatPercentage(data.percentage)}%
      </p>
      <p className="text-muted-foreground">
        Value: {formatCurrency(data.value)}
      </p>
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

export const WalletSummary: React.FC<WalletSummaryProps> = ({
  walletAddress,
  assets = [],
  defiPositions = [],
  totalValue = 0,
  className,
  isLoading = false,
  pieChartData: providedPieChartData,
  pieChartColors: providedPieChartColors,
}) => {
  // Calculate asset allocation for pie chart
  const assetAllocation = useMemo((): AssetAllocation[] => {
    // Use provided pie chart data if available, but filter for value > $0.1
    if (providedPieChartData && providedPieChartData.length > 0) {
      return providedPieChartData
        .filter(item => item.value > 0.1) // Filter out items with value <= $0.1
        .map((item, index) => {
          // Find the corresponding asset for logo
          const asset = assets?.find(a => a.metadata?.symbol === item.symbol);
          return {
            name: item.symbol,
            symbol: item.symbol,
            value: item.value,
            percentage: item.percentage,
            color:
              providedPieChartColors?.[
                index % (providedPieChartColors.length || 1)
              ] || CHART_COLORS[index % CHART_COLORS.length],
            logo: asset
              ? getTokenLogoUrlWithFallback(asset.asset_type, asset.metadata)
              : '/placeholder.jpg',
          };
        });
    }

    // Fallback to original calculation if no provided data
    if (
      ((!assets || assets.length === 0) &&
        (!defiPositions || defiPositions.length === 0)) ||
      totalValue === 0
    )
      return [];

    // Combine assets and DeFi positions, filtering for value > $0.1
    const allItems: Array<{
      name: string;
      symbol: string;
      value: number;
      logo: string;
      isDefi?: boolean;
    }> = [];

    // Add valid assets (value > $0.1)
    if (assets) {
      assets
        .filter(asset => (asset.value || 0) > 0.1)
        .forEach(asset => {
          allItems.push({
            name: asset.metadata?.name || 'Unknown',
            symbol: asset.metadata?.symbol || 'UNK',
            value: asset.value || 0,
            logo: getTokenLogoUrlWithFallback(asset.asset_type, asset.metadata),
            isDefi: false,
          });
        });
    }

    // Remove DeFi positions - we don't want them in the tokens view anymore

    // Sort by value descending
    allItems.sort((a, b) => b.value - a.value);

    // Take top 6 items, group the rest as "Other"
    const topItems = allItems.slice(0, 6);
    const otherItems = allItems.slice(6);
    const otherValue = otherItems.reduce((sum, item) => sum + item.value, 0);

    const allocation = topItems.map((item, index) => ({
      name: item.name,
      symbol: item.symbol,
      value: item.value,
      percentage: (item.value / totalValue) * 100,
      color: CHART_COLORS[index % CHART_COLORS.length],
      logo: item.logo,
      isDefi: item.isDefi,
    }));

    // Add "Other" if there are remaining items
    if (otherValue > 0) {
      allocation.push({
        name: 'Other',
        symbol: 'Other',
        value: otherValue,
        percentage: (otherValue / totalValue) * 100,
        color: '#94a3b8',
        logo: '/placeholder.jpg',
      });
    }

    return allocation;
  }, [
    assets,
    defiPositions,
    totalValue,
    providedPieChartData,
    providedPieChartColors,
  ]);

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const totalAssets = assets.length;
    const verifiedAssets = assets.filter(
      asset => asset.isVerified !== false
    ).length;

    let highestValueAsset: FungibleAsset | null = null;
    let maxValue = 0;

    for (const asset of assets) {
      const assetValue = asset.value || 0;
      if (assetValue > maxValue) {
        maxValue = assetValue;
        highestValueAsset = asset;
      }
    }

    return {
      totalAssets,
      verifiedAssets,
      highestValueAsset,
    };
  }, [assets]);

  // Loading state
  if (isLoading) {
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <Skeleton className="h-32" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
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
    <div className="space-y-8">
      {/* Combined Portfolio Overview and Asset Holdings */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Stats Row */}
          <div className="grid grid-cols-3 border-b border-border">
            <div className="p-6 border-r border-border">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Total Value
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold tracking-tight">
                  {formatCurrency(totalValue)}
                </p>
              </div>
            </div>

            <div className="p-6 border-r border-border">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Assets
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold tracking-tight">
                  {portfolioMetrics.totalAssets}
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Verified
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold tracking-tight">
                  {portfolioMetrics.verifiedAssets}/
                  {portfolioMetrics.totalAssets}
                </p>
              </div>
            </div>
          </div>

          {/* Asset Holdings with Pie Chart */}
          {assetAllocation.length > 0 && (
            <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pie Chart */}
              <div className="flex flex-col">
                <h4 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                  Allocation
                </h4>
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={assetAllocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="hsl(var(--border))"
                        strokeWidth={1}
                      >
                        {assetAllocation.map((entry, index) => (
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

              {/* Holdings List */}
              <div className="flex flex-col">
                <h4 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                  Holdings
                </h4>
                <div className="space-y-4 flex-1">
                  {assetAllocation.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 border"
                          style={{
                            backgroundColor: item.color,
                            borderColor: item.color,
                          }}
                        />
                        <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.symbol !== 'Other' ? (
                            <Image
                              src={item.logo}
                              alt={item.symbol}
                              width={32}
                              height={32}
                              className={cn(
                                'w-full h-full object-cover',
                                item.symbol === 'APT' && 'dark:invert'
                              )}
                            />
                          ) : (
                            <PieChart className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold tracking-tight truncate text-sm">
                            {item.symbol}
                          </h3>
                          <span className="text-xs text-muted-foreground uppercase">
                            {item.symbol === 'Other' ? 'MULTIPLE' : 'TOKEN'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-mono font-bold tracking-tight text-sm">
                          {formatCurrency(item.value)}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {item.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty state */}
      {assets.length === 0 && (
        <Card className="border border-border bg-card">
          <CardContent className="p-12 text-center">
            <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 tracking-tight">
              No Assets
            </h3>
            <p className="text-muted-foreground text-sm">
              No token holdings detected in this wallet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
