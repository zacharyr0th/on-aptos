import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  Grid,
  Info,
  DollarSign,
  Building2,
  Activity,
  Shield,
  Coins,
  ChartBar,
  ArrowUpRight,
  ArrowDownRight,
  Image as ImageIcon,
  Layers,
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
import { processAllocationData } from '@/lib/utils/token-categorization';

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
  selectedNFT?: any;
  selectedDeFiPosition?: any;
  pieChartData?: Array<{
    symbol: string;
    value: number;
    percentage: number;
  }>;
  pieChartColors?: string[];
  nfts?: any[];
  nftTotalValue?: number;
}

interface AssetAllocation {
  name: string;
  symbol: string;
  value: number;
  percentage: number;
  color: string;
  logo: string;
  isDefi?: boolean;
  category?: string;
}

const CHART_COLORS = [
  '#93c5fd', // Light Blue
  '#c4b5fd', // Light Purple
  '#f9a8d4', // Light Pink
  '#fed7aa', // Light Orange
  '#a7f3d0', // Light Green
  '#a5f3fc', // Light Cyan
  '#fca5a5', // Light Red
  '#c7d2fe', // Light Indigo
  '#d9f99d', // Light Lime
  '#fdba74', // Light Amber
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
        Value: {formatCurrency(data.value)}
      </p>
      <p className="text-muted-foreground">
        {data.percentage.toFixed(1)}% of portfolio
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
  nfts = [],
  nftTotalValue = 0,
}) => {
  const [activeTab, setActiveTab] = useState('allocation');

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const totalAssets = assets.length;
    const verifiedAssets = assets.filter(
      asset => asset.isVerified !== false
    ).length;
    const totalDefiValue = (defiPositions || []).reduce(
      (sum, pos) => sum + (pos.totalValue || 0),
      0
    );

    return {
      totalAssets,
      verifiedAssets,
      totalDefiValue,
      tokenValue: totalValue - totalDefiValue,
      nftCount: nfts.length,
    };
  }, [assets, defiPositions, totalValue, nfts]);

  // Calculate allocation data and process categories/top tokens
  const { allocationCategories, topTokens } = useMemo(() => {
    const allocations: Array<{
      assetType: string;
      symbol: string;
      value: number;
      percentage: number;
    }> = [];

    // Add token assets
    if (assets && assets.length > 0) {
      assets
        .filter(asset => (asset.value || 0) > 0.1)
        .forEach(asset => {
          allocations.push({
            assetType: asset.asset_type,
            symbol: asset.metadata?.symbol || 'UNK',
            value: asset.value || 0,
            percentage:
              totalValue > 0 ? ((asset.value || 0) / totalValue) * 100 : 0,
          });
        });
    }

    // Add DeFi positions aggregated
    if (defiPositions && defiPositions.length > 0) {
      const defiTotal = defiPositions.reduce(
        (sum, pos) => sum + (pos.totalValue || 0),
        0
      );
      if (defiTotal > 0) {
        allocations.push({
          assetType: 'DeFi Positions',
          symbol: 'DEFI',
          value: defiTotal,
          percentage: totalValue > 0 ? (defiTotal / totalValue) * 100 : 0,
        });
      }
    }

    // Process the allocations to get categories and top tokens
    const { categories, topTokens: topTokensList } =
      processAllocationData(allocations);

    return {
      allocationCategories: categories,
      topTokens: topTokensList,
    };
  }, [assets, defiPositions, totalValue]);

  // Calculate allocation data for the donut chart (all by value)
  const { allAssetsData } = useMemo(() => {
    const allItems: AssetAllocation[] = [];
    let colorIndex = 0;

    // Add all tokens with value > $0.1
    if (assets && assets.length > 0) {
      assets
        .filter(asset => (asset.value || 0) > 0.1)
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .forEach(asset => {
          allItems.push({
            name: asset.metadata?.name || 'Unknown',
            symbol: asset.metadata?.symbol || 'UNK',
            value: asset.value || 0,
            percentage:
              totalValue > 0 ? ((asset.value || 0) / totalValue) * 100 : 0,
            color: CHART_COLORS[colorIndex % CHART_COLORS.length],
            logo: getTokenLogoUrlWithFallback(asset.asset_type, asset.metadata),
            category: 'Tokens',
          });
          colorIndex++;
        });
    }

    // Add all DeFi positions with value
    if (defiPositions && defiPositions.length > 0) {
      defiPositions
        .filter(position => position.totalValue > 0)
        .sort((a, b) => b.totalValue - a.totalValue)
        .forEach(position => {
          allItems.push({
            name: position.protocol,
            symbol: position.protocol,
            value: position.totalValue,
            percentage:
              totalValue > 0 ? (position.totalValue / totalValue) * 100 : 0,
            color: CHART_COLORS[colorIndex % CHART_COLORS.length],
            logo: getProtocolLogo(position.protocol),
            category: 'DeFi',
          });
          colorIndex++;
        });
    }

    return { allAssetsData: allItems };
  }, [assets, defiPositions, totalValue]);

  // Keep the old data structure for backward compatibility but not used
  const { categoryData, assetData, valueBasedCategoryData } = useMemo(() => {
    const tokenCount = assets.length;
    const defiCount = defiPositions.length;

    const totalAssetCount = tokenCount + defiCount;

    // Calculate value-based totals
    const tokenValue = assets.reduce(
      (sum, asset) => sum + (asset.value || 0),
      0
    );
    const defiValue = defiPositions.reduce(
      (sum, pos) => sum + (pos.totalValue || 0),
      0
    );

    // Inner ring - Categories by value
    const valueCategories = [
      { name: 'Tokens', value: tokenValue, color: '#93c5fd' },
      { name: 'DeFi', value: defiValue, color: '#c4b5fd' },
    ].filter(cat => cat.value > 0);

    // Keep original count-based categories for compatibility
    const categories = [
      { name: 'Tokens', value: tokenCount, color: '#93c5fd' },
      { name: 'DeFi', value: defiCount, color: '#c4b5fd' },
    ].filter(cat => cat.value > 0);

    // Outer ring - Individual assets (show count, not value)
    const assetItems: AssetAllocation[] = [];

    // Add tokens (show top tokens by value but represent by count = 1 each)
    if (assets && assets.length > 0) {
      const tokenAssets = assets
        .filter(asset => (asset.value || 0) > 0.1)
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .slice(0, 8);

      tokenAssets.forEach((asset, index) => {
        assetItems.push({
          name: asset.metadata?.name || 'Unknown',
          symbol: asset.metadata?.symbol || 'UNK',
          value: 1, // Each token counts as 1 asset
          percentage: totalAssetCount > 0 ? (1 / totalAssetCount) * 100 : 0,
          color: CHART_COLORS[index % CHART_COLORS.length],
          logo: getTokenLogoUrlWithFallback(asset.asset_type, asset.metadata),
          category: 'Tokens',
        });
      });
    }

    // Add DeFi positions (each protocol counts as 1)
    if (defiPositions && defiPositions.length > 0) {
      defiPositions.forEach((position, index) => {
        assetItems.push({
          name: position.protocol,
          symbol: position.protocol,
          value: 1, // Each protocol counts as 1 asset
          percentage: totalAssetCount > 0 ? (1 / totalAssetCount) * 100 : 0,
          color: CHART_COLORS[(index + assets.length) % CHART_COLORS.length],
          logo: '/placeholder.jpg',
          category: 'DeFi',
        });
      });
    }

    return {
      categoryData: categories,
      assetData: assetItems,
      valueBasedCategoryData: valueCategories,
    };
  }, [assets, defiPositions]);

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
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-64" />
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
    <div className="space-y-12">
      {/* Minimal Stats */}
      <div className="grid grid-cols-3 gap-12">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            Tokens
          </p>
          <p className="text-xl font-light">{assets.length}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            NFTs
          </p>
          <p className="text-xl font-light">{portfolioMetrics.nftCount}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            DeFi Protocols
          </p>
          <p className="text-xl font-light">{defiPositions.length}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-neutral-200 dark:border-neutral-800"></div>

      {/* Portfolio Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Allocation Chart */}
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h3 className="text-lg font-semibold">Allocation</h3>
          </div>

          <div className="h-80">
            {allAssetsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  {/* Single ring showing all assets by value */}
                  <Pie
                    data={allAssetsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {allAssetsData.map((entry, index) => (
                      <Cell
                        key={`asset-${index}`}
                        fill={entry.color}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>

                  <RechartsTooltip content={<CustomTooltip />} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
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
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h3 className="text-lg font-semibold">Holdings</h3>
          </div>

          {/* Enhanced Legend */}
          <div className="space-y-3">
            {/* Show top assets from the chart */}
            {allAssetsData.length > 0 ? (
              <div className="space-y-2">
                <div className="space-y-2">
                  {/* Show all assets */}
                  {allAssetsData.map((asset, index) => (
                    <div
                      key={`${asset.symbol}-${index}`}
                      className="flex items-center gap-3 py-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: asset.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            {asset.symbol}
                          </div>
                          {asset.category === 'DeFi' && (
                            <Badge variant="secondary" className="text-xs">
                              DeFi
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(asset.value)}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {asset.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))}
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
    </div>
  );
};
