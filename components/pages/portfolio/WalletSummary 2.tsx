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
  Info 
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  TooltipProps 
} from 'recharts';
import { formatCurrency, formatPercentage, formatTokenAmount } from '@/lib/utils/format';
import { getTokenLogoUrlWithFallback } from '@/lib/utils/token-logos';
import { cn } from '@/lib/utils';

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

interface WalletSummaryProps {
  walletAddress: string | undefined;
  assets?: FungibleAsset[];
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
}

const CHART_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', 
  '#06b6d4', '#f43f5e', '#6366f1', '#84cc16', '#f97316'
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
  totalValue = 0,
  className,
  isLoading = false,
  pieChartData: providedPieChartData,
  pieChartColors: providedPieChartColors
}) => {
  // Calculate asset allocation for pie chart
  const assetAllocation = useMemo((): AssetAllocation[] => {
    // Use provided pie chart data if available
    if (providedPieChartData && providedPieChartData.length > 0) {
      return providedPieChartData.map((item, index) => {
        // Find the corresponding asset for logo
        const asset = assets?.find(a => a.metadata?.symbol === item.symbol);
        return {
          name: item.symbol,
          symbol: item.symbol,
          value: item.value,
          percentage: item.percentage,
          color: providedPieChartColors?.[index % (providedPieChartColors.length || 1)] || CHART_COLORS[index % CHART_COLORS.length],
          logo: asset ? getTokenLogoUrlWithFallback(asset.asset_type, asset.metadata) : '/placeholder.jpg'
        };
      });
    }

    // Fallback to original calculation if no provided data
    if (!assets || assets.length === 0 || totalValue === 0) return [];

    // Filter out zero-value assets and sort by value
    const validAssets = assets
      .filter(asset => (asset.value || 0) > 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Take top 5 assets, group the rest as "Others"
    const topAssets = validAssets.slice(0, 5);
    const otherAssets = validAssets.slice(5);
    const otherValue = otherAssets.reduce((sum, asset) => sum + (asset.value || 0), 0);

    const allocation = topAssets.map((asset, index) => ({
      name: asset.metadata?.name || 'Unknown',
      symbol: asset.metadata?.symbol || 'UNK',
      value: asset.value || 0,
      percentage: ((asset.value || 0) / totalValue) * 100,
      color: CHART_COLORS[index % CHART_COLORS.length],
      logo: getTokenLogoUrlWithFallback(asset.asset_type, asset.metadata)
    }));

    // Add "Others" if there are remaining assets
    if (otherValue > 0) {
      allocation.push({
        name: 'Others',
        symbol: 'Others',
        value: otherValue,
        percentage: (otherValue / totalValue) * 100,
        color: '#64748b',
        logo: '/placeholder.jpg'
      });
    }

    return allocation;
  }, [assets, totalValue, providedPieChartData, providedPieChartColors]);

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const totalAssets = assets.length;
    const verifiedAssets = assets.filter(asset => asset.isVerified !== false).length;
    
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
      highestValueAsset
    };
  }, [assets]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <CardTitle className="text-base sm:text-lg">Wallet Summary</CardTitle>
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
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <CardTitle className="text-base sm:text-lg">Wallet Summary</CardTitle>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Overview of your wallet assets and allocation</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Portfolio Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-lg font-semibold">{formatCurrency(totalValue)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Assets</p>
            <p className="text-lg font-semibold">{portfolioMetrics.totalAssets}</p>
          </div>
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <p className="text-xs text-muted-foreground">Verified</p>
            <p className="text-lg font-semibold">
              {portfolioMetrics.verifiedAssets}/{portfolioMetrics.totalAssets}
            </p>
          </div>
        </div>

        {/* Asset Allocation Chart */}
        {assetAllocation.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <h4 className="font-medium">Asset Allocation</h4>
            </div>
            
            {/* Interactive Centered Pie Chart */}
            <div className="flex justify-center">
              <div className="w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={assetAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="85%"
                      paddingAngle={4}
                      dataKey="value"
                      startAngle={90}
                      endAngle={450}
                    >
                      {assetAllocation.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          className="stroke-background hover:opacity-80 transition-opacity cursor-pointer"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}


        {/* Empty state */}
        {assets.length === 0 && (
          <div className="text-center py-8">
            <Grid className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No assets found in this wallet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};