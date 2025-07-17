import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Fuel, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useGasUsage } from '@/hooks/useAptosAnalytics';

interface GasUsageCardProps {
  walletAddress: string | undefined;
  className?: string;
  timeframe?: '1h' | '12h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'all';
}

export const GasUsageCard: React.FC<GasUsageCardProps> = React.memo(
  ({ walletAddress, className, timeframe = '7d' }) => {
    // Calculate date range and granularity based on timeframe
    const { startTimestamp, endTimestamp, granularity } = useMemo(() => {
      const end = Date.now();
      let start = end;
      let bucketGranularity = '1d';

      switch (timeframe) {
        case '1h':
          start = end - 1 * 60 * 60 * 1000;
          bucketGranularity = '5m';
          break;
        case '12h':
          start = end - 12 * 60 * 60 * 1000;
          bucketGranularity = '15m';
          break;
        case '24h':
          start = end - 24 * 60 * 60 * 1000;
          bucketGranularity = '1h';
          break;
        case '7d':
          start = end - 7 * 24 * 60 * 60 * 1000;
          bucketGranularity = '1d';
          break;
        case '30d':
          start = end - 30 * 24 * 60 * 60 * 1000;
          bucketGranularity = '1d';
          break;
        case '90d':
          start = end - 90 * 24 * 60 * 60 * 1000;
          bucketGranularity = '7d';
          break;
        case '1y':
          start = end - 365 * 24 * 60 * 60 * 1000;
          bucketGranularity = '7d';
          break;
        case 'all':
          start = end - 365 * 2 * 24 * 60 * 60 * 1000; // 2 years max for gas
          bucketGranularity = '7d';
          break;
      }

      return {
        startTimestamp: start,
        endTimestamp: end,
        granularity: bucketGranularity,
      };
    }, [timeframe]);

    // Create stable Date objects from timestamps
    const startDate = useMemo(() => new Date(startTimestamp), [startTimestamp]);
    const endDate = useMemo(() => new Date(endTimestamp), [endTimestamp]);

    const { data, loading, error } = useGasUsage(
      walletAddress || null,
      startDate,
      endDate,
      granularity
    );

    // Calculate total gas usage
    const totalGasUsage = useMemo(() => {
      if (!data || data.length === 0) return { octas: 0, usd: 0 };

      return data.reduce(
        (acc, item) => ({
          octas: acc.octas + item.total_gas_used_octas,
          usd: acc.usd + item.total_gas_used_usd,
        }),
        { octas: 0, usd: 0 }
      );
    }, [data]);

    // Loading state
    if (loading) {
      return (
        <Card className={className}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Gas Usage</CardTitle>
              <Skeleton className="h-5 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      );
    }

    // Error state
    if (error) {
      return (
        <Card className={className}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Gas Usage</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Failed to load gas usage data
            </p>
          </CardContent>
        </Card>
      );
    }

    // No data state
    if (!data || data.length === 0 || totalGasUsage.usd === 0) {
      return (
        <Card className={className}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Gas Usage</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {timeframe}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Fuel className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-semibold">$0.00</p>
            </div>
            <p className="text-sm text-muted-foreground">
              No gas usage in this period
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Gas Usage</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {timeframe}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Fuel className="h-4 w-4 text-orange-500" />
            <p className="text-2xl font-semibold">
              {formatCurrency(totalGasUsage.usd)}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {(totalGasUsage.octas / 1e8).toFixed(4)} APT spent on gas
          </p>
        </CardContent>
      </Card>
    );
  }
);

GasUsageCard.displayName = 'GasUsageCard';
