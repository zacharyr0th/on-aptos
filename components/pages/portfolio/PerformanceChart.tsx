import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Clock, Info } from 'lucide-react';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import { usePortfolioHistoryV2 } from '@/hooks/usePortfolioHistoryV2';

interface PerformanceChartProps {
  walletAddress: string | undefined;
  className?: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = React.memo(
  ({ walletAddress, className }) => {
    const { resolvedTheme } = useTheme();

    // Use working V2 hook
    const {
      data: portfolioHistory,
      isLoading,
      error,
    } = usePortfolioHistoryV2(walletAddress || null);

    // Memoized calculations
    const performanceMetrics = useMemo(() => {
      if (!portfolioHistory || portfolioHistory.length === 0) {
        return { change: 0, changePercent: 0, isPositive: true };
      }

      const current =
        portfolioHistory[portfolioHistory.length - 1]?.totalValue || 0;
      const previous = portfolioHistory[0]?.totalValue || 0;
      const change = current - previous;
      const changePercent = previous > 0 ? (change / previous) * 100 : 0;

      return {
        change,
        changePercent,
        isPositive: change >= 0,
      };
    }, [portfolioHistory]);

    // Memoized chart config and data processing
    const chartConfig = useMemo(
      () => ({
        value: {
          label: 'Portfolio Value',
          color: 'hsl(var(--chart-1))',
        },
      }),
      []
    );

    const chartData = useMemo(() => {
      if (!portfolioHistory || portfolioHistory.length === 0) {
        return { domain: { min: 0, max: 0 }, hasRateLimitedData: false };
      }

      const values = portfolioHistory.map(entry => entry.totalValue);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const hasRateLimitedData = portfolioHistory.some(
        entry => entry.rateLimited
      );

      return {
        domain: { min, max },
        hasRateLimitedData,
      };
    }, [portfolioHistory]);

    // Loading state
    if (isLoading) {
      return (
        <Card className={className}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">
                Performance Chart
              </CardTitle>
              <Skeleton className="h-8 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      );
    }

    // Error state
    if (error) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Performance Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Failed to load performance data</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // No data state
    if (!portfolioHistory || portfolioHistory.length === 0) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Performance Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No performance data available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={className}>
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base sm:text-lg">
                7d Performance
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Currently only includes APT balances. Non-APT tokens, NFTs,
                    and DeFi positions coming soon
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`font-medium ${performanceMetrics.isPositive ? 'text-green-600' : 'text-red-600'}`}
              >
                {performanceMetrics.isPositive ? '+' : ''}
                {formatCurrency(Math.abs(performanceMetrics.change))}
              </span>
              <span className="text-muted-foreground">|</span>
              <span
                className={`text-xs ${performanceMetrics.isPositive ? 'text-green-600' : 'text-red-600'}`}
              >
                {performanceMetrics.isPositive ? '+' : ''}
                {formatPercentage(performanceMetrics.changePercent)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            config={chartConfig}
            className="h-[250px] lg:h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={resolvedTheme === 'dark' ? 0.5 : 0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tickFormatter={value =>
                    new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }
                />
                <YAxis
                  className="text-xs"
                  domain={[
                    chartData.domain.min * 0.95,
                    chartData.domain.max * 1.05,
                  ]}
                  tickFormatter={value => {
                    if (value === 0) return '$0';
                    if (value >= 1000000)
                      return `$${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
                    return `$${value.toFixed(0)}`;
                  }}
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length && label) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">
                            {new Date(label).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Portfolio Value:{' '}
                            <span className="font-medium text-foreground">
                              {formatCurrency(payload[0].value)}
                            </span>
                          </p>
                          {data.rateLimited && (
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs text-yellow-600">
                                Delayed price data
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalValue"
                  stroke="hsl(var(--chart-1))"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  strokeWidth={2}
                />
                {/* Optimized: Only render rate-limited dots if there are any */}
                {chartData.hasRateLimitedData &&
                  portfolioHistory.map((entry, index) => {
                    if (entry.rateLimited) {
                      return (
                        <ReferenceDot
                          key={`rate-limit-${index}`}
                          x={entry.date}
                          y={entry.totalValue}
                          r={4}
                          fill="#f59e0b"
                          stroke="#d97706"
                          strokeWidth={1}
                          fillOpacity={0.8}
                        />
                      );
                    }
                    return null;
                  })}
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
          {/* Rate limit legend */}
          {chartData.hasRateLimitedData && (
            <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-yellow-500" />
                <span>Some prices may be delayed due to rate limits</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

PerformanceChart.displayName = 'PerformanceChart';
