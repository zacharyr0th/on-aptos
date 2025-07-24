'use client';

import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
  DollarSign,
  Clock,
  Zap,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';

import { useAnalytics } from './hooks/useAnalytics';

interface RealTimeMetricsProps {
  walletAddress: string;
  refreshInterval?: number; // in milliseconds, default 30 seconds
}

export function RealTimeMetrics({
  walletAddress,
  refreshInterval = 30000,
}: RealTimeMetricsProps) {
  const [timeframe] = useState('24h');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);

  const {
    portfolioPerformance,
    tokenLatestPrice,
    topPriceChanges,
    isLoading,
    error,
    refetch,
    lastUpdated,
  } = useAnalytics(walletAddress, timeframe);

  // Auto-refresh effect
  useEffect(() => {
    if (!isAutoRefreshing) return;

    const interval = setInterval(() => {
      refetch();
      setLastRefresh(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isAutoRefreshing, refreshInterval, refetch]);

  const handleManualRefresh = () => {
    refetch();
    setLastRefresh(new Date());
  };

  // Calculate real-time metrics
  const currentValue =
    portfolioPerformance && portfolioPerformance.length > 0
      ? portfolioPerformance[portfolioPerformance.length - 1].value
      : 0;

  const previousValue =
    portfolioPerformance && portfolioPerformance.length > 1
      ? portfolioPerformance[portfolioPerformance.length - 2].value
      : currentValue;

  const valueChange = currentValue - previousValue;
  const percentChange =
    previousValue > 0 ? (valueChange / previousValue) * 100 : 0;

  // Get top mover for quick insight
  const topMover =
    topPriceChanges && topPriceChanges.length > 0 ? topPriceChanges[0] : null;

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-red-700 text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-Time Metrics Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="relative">
              <Activity className="h-4 w-4 text-blue-600" />
              {isAutoRefreshing && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            Real-Time Portfolio
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
              className={cn(
                'h-6 px-2 text-xs',
                isAutoRefreshing ? 'text-green-600' : 'text-gray-500'
              )}
            >
              <Zap className="h-3 w-3 mr-1" />
              {isAutoRefreshing ? 'LIVE' : 'PAUSED'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="h-6 px-2"
            >
              <RefreshCw
                className={cn('h-3 w-3', isLoading && 'animate-spin')}
              />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Last updated:{' '}
          {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Portfolio Value */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Portfolio Value</p>
            <p className="text-lg font-bold">{formatCurrency(currentValue)}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              {percentChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  percentChange >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {percentChange >= 0 ? '+' : ''}
                {formatPercentage(percentChange)}
              </span>
            </div>
            <p
              className={cn(
                'text-xs',
                valueChange >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {valueChange >= 0 ? '+' : ''}
              {formatCurrency(valueChange)}
            </p>
          </div>
        </div>

        {/* APT Price */}
        <div className="flex items-center justify-between py-2 border-t border-border/50">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">APT Price</p>
            <p className="text-sm font-semibold">
              {tokenLatestPrice ? formatCurrency(tokenLatestPrice) : '—'}
            </p>
          </div>
          {topMover && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Top Mover</p>
              <div className="flex items-center gap-1">
                <Badge
                  variant={
                    topMover.price_change_percentage >= 0
                      ? 'default'
                      : 'destructive'
                  }
                  className="text-xs px-1"
                >
                  {topMover.asset_symbol}
                </Badge>
                <span
                  className={cn(
                    'text-xs font-medium',
                    topMover.price_change_percentage >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {topMover.price_change_percentage >= 0 ? '+' : ''}
                  {formatPercentage(topMover.price_change_percentage)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Market Insights */}
        {topPriceChanges && topPriceChanges.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Market Pulse
            </p>
            <div className="flex gap-1 flex-wrap">
              {topPriceChanges.slice(0, 3).map((change, index) => (
                <Badge
                  key={index}
                  variant={
                    change.price_change_percentage >= 0
                      ? 'default'
                      : 'destructive'
                  }
                  className="text-xs px-2 py-1"
                >
                  {change.asset_symbol}{' '}
                  {change.price_change_percentage >= 0 ? '+' : ''}
                  {formatPercentage(change.price_change_percentage)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-center pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isAutoRefreshing ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Auto-refreshing every {refreshInterval / 1000}s</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span>Auto-refresh paused</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
