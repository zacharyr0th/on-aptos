'use client';

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import { logger } from '@/lib/utils/logger';



interface AnalyticsDashboardProps {
  walletAddress: string;
  timeframe?: string;
  totalValue?: number;
}

interface PerformanceData {
  date_day: string;
  total_balance_usd: number;
}

export function AnalyticsDashboard({
  walletAddress,
  timeframe = 'year',
  totalValue = 0,
}: AnalyticsDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [aptPrice, setAptPrice] = useState<number | null>(null);
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [percentChange, setPercentChange] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeframeOptions = [
    { value: 'year', label: '1Y' },
    { value: 'all', label: 'ALL' },
  ];

  const fetchAnalytics = useCallback(async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try direct API call as a fallback
      const directAPICall = fetch(
        `https://api.mainnet.aptoslabs.com/v1/analytics/historical_store_balances?account_address=${walletAddress}&lookback=${selectedTimeframe}`
      );

      const [balanceHistoryRes, aptPriceRes, directRes] =
        await Promise.allSettled([
          fetch(
            `/api/analytics/balance-history?address=${walletAddress}&lookback=${selectedTimeframe}`
          ),
          fetch(
            `/api/analytics/token-latest-price?address=0x1::aptos_coin::AptosCoin`
          ),
          directAPICall,
        ]);

      if (
        balanceHistoryRes.status === 'fulfilled' &&
        balanceHistoryRes.value.ok
      ) {
        const balanceData = await balanceHistoryRes.value.json();
        if (balanceData.data && Array.isArray(balanceData.data)) {
          setPerformanceData(balanceData.data);

          const data = balanceData.data;
          if (data.length > 0) {
            const current = data[data.length - 1]?.total_balance_usd || 0;
            const previous = data[0]?.total_balance_usd || 0;

            setCurrentValue(current);

            if (previous > 0) {
              const change = ((current - previous) / previous) * 100;
              setPercentChange(change);
            }
          }
        }
      } else {
        // Try direct API as fallback
        if (directRes.status === 'fulfilled' && directRes.value.ok) {
          const directData = await directRes.value.json();
          if (directData.data && Array.isArray(directData.data)) {
            setPerformanceData(directData.data);

            const data = directData.data;
            if (data.length > 0) {
              const current = data[data.length - 1]?.total_balance_usd || 0;
              const previous = data[0]?.total_balance_usd || 0;

              setCurrentValue(current);

              if (previous > 0) {
                const change = ((current - previous) / previous) * 100;
                setPercentChange(change);
              }
            }
          }
        }
      }

      if (aptPriceRes.status === 'fulfilled' && aptPriceRes.value.ok) {
        const priceData = await aptPriceRes.value.json();
        if (
          priceData.data &&
          Array.isArray(priceData.data) &&
          priceData.data.length > 0
        ) {
          setAptPrice(priceData.data[0].price_usd);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      logger.error('Analytics fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, selectedTimeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAnalytics} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Performance Chart Header */}
      <div className="flex items-start justify-between mb-6 flex-shrink-0">
        <div>
          <h2 className="text-xl font-semibold">Portfolio Performance</h2>
          <p className="text-sm text-muted-foreground">
            Track your portfolio value over the last {selectedTimeframe}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Performance Percentage */}
          <div className="text-right">
            <div className="flex items-center gap-1">
              {percentChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-lg font-semibold ${percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}
              >
                {percentChange >= 0 ? '+' : ''}
                {formatPercentage(percentChange)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Last {selectedTimeframe}
            </p>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {timeframeOptions.map(option => (
                <Button
                  key={option.value}
                  variant={
                    selectedTimeframe === option.value ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => setSelectedTimeframe(option.value)}
                  className="text-xs px-3"
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <RefreshCw
              className={cn(
                'h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground',
                isLoading && 'animate-spin'
              )}
              onClick={fetchAnalytics}
            />
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="flex-1 min-h-[400px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : performanceData && performanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={performanceData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e0e0e0"
                opacity={0.5}
              />
              <XAxis
                dataKey="date_day"
                tickFormatter={value => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
                stroke="#666"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                tickFormatter={value => {
                  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
                  return `$${value.toFixed(0)}`;
                }}
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                labelFormatter={value => new Date(value).toLocaleDateString()}
                formatter={(value: number) => [
                  formatCurrency(value),
                  'Portfolio Value',
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                labelStyle={{ color: '#666' }}
              />
              <Line
                type="monotone"
                dataKey="total_balance_usd"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 6,
                  stroke: '#3b82f6',
                  strokeWidth: 2,
                  fill: 'white',
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No performance data available for this timeframe
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Check your wallet address and try a different timeframe
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
