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
import { usePortfolioHistory } from './hooks/usePortfolioHistory';
import { cn } from '@/lib/utils';

interface PerformanceChartProps {
  walletAddress: string | undefined;
  className?: string;
  timeframe?: '1h' | '12h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'all';
}

interface TimeframeMetrics {
  change: number;
  changePercent: number;
  isPositive: boolean;
  startValue: number;
  endValue: number;
  highValue: number;
  lowValue: number;
  volatility: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = React.memo(
  ({ walletAddress, className, timeframe = '7d' }) => {
    const { resolvedTheme } = useTheme();

    // Use V3 hook with timeframe directly - no need to convert to days
    const {
      data: portfolioHistory,
      isLoading,
      error,
    } = usePortfolioHistory(walletAddress, { timeframe });

    // Memoized calculations with comprehensive metrics
    const performanceMetrics = useMemo((): TimeframeMetrics => {
      if (!portfolioHistory || portfolioHistory.length === 0) {
        return {
          change: 0,
          changePercent: 0,
          isPositive: true,
          startValue: 0,
          endValue: 0,
          highValue: 0,
          lowValue: 0,
          volatility: 0,
        };
      }

      const values = portfolioHistory.map(entry => entry.totalValue);
      const startValue = values[0] || 0;
      const endValue = values[values.length - 1] || 0;
      const change = endValue - startValue;
      const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;
      
      // Calculate high and low
      const highValue = Math.max(...values);
      const lowValue = Math.min(...values);
      
      // Calculate volatility (standard deviation of returns)
      const returns: number[] = [];
      for (let i = 1; i < values.length; i++) {
        if (values[i - 1] > 0) {
          const dailyReturn = (values[i] - values[i - 1]) / values[i - 1];
          returns.push(dailyReturn);
        }
      }
      
      const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance) * 100; // Convert to percentage

      return {
        change,
        changePercent,
        isPositive: change >= 0,
        startValue,
        endValue,
        highValue,
        lowValue,
        volatility,
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
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg">
                  {timeframe.toUpperCase()} Performance
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
            
            {/* Additional Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">High</span>
                <p className="font-medium">{formatCurrency(performanceMetrics.highValue)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Low</span>
                <p className="font-medium">{formatCurrency(performanceMetrics.lowValue)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Start</span>
                <p className="font-medium">{formatCurrency(performanceMetrics.startValue)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Volatility</span>
                <p className="font-medium">{performanceMetrics.volatility.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-2 sm:px-6">
          <ChartContainer
            config={chartConfig}
            className="h-[200px] sm:h-[250px] lg:h-[300px] w-full -mx-2 sm:mx-0"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={
                        resolvedTheme === 'dark' ? '#e5e7eb' : '#1f2937'
                      }
                      stopOpacity={resolvedTheme === 'dark' ? 0.3 : 0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor={
                        resolvedTheme === 'dark' ? '#f9fafb' : '#374151'
                      }
                      stopOpacity={resolvedTheme === 'dark' ? 0.2 : 0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-[10px] sm:text-xs"
                  tick={{ fontSize: 10 }}
                  tickFormatter={value => {
                    const date = new Date(value);
                    if (timeframe === '1h' || timeframe === '12h') {
                      return date.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      });
                    } else if (timeframe === '24h') {
                      return date.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        hour12: true,
                      });
                    } else if (timeframe === 'all') {
                      return date.toLocaleDateString('en-US', {
                        year: '2-digit',
                        month: 'short',
                      });
                    }
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                  }}
                />
                <YAxis
                  className="text-[10px] sm:text-xs"
                  tick={{ fontSize: 10 }}
                  width={40}
                  domain={[
                    chartData.domain.min * 0.95,
                    chartData.domain.max * 1.05,
                  ]}
                  tickFormatter={value => {
                    if (value === 0) return '$0';
                    if (value >= 1000000)
                      return `$${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
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
                  stroke="none"
                  fillOpacity={1}
                  fill="url(#colorValue)"
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
