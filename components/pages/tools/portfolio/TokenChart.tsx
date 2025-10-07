"use client";

import { GeistMono } from "geist/font/mono";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import React, { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTokenChart } from "@/lib/hooks/portfolio/useTokenChart";
import { formatCurrency } from "@/lib/utils/format/format";

interface TokenChartProps {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  currentPrice?: number;
}

const timeframes = [
  { label: "1H", value: "hour" as const },
  { label: "1D", value: "day" as const },
  { label: "1W", value: "week" as const },
  { label: "1M", value: "month" as const },
  { label: "1Y", value: "year" as const },
  { label: "ALL", value: "all" as const },
];

const CustomTooltip = ({ active, payload, _label }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const date = new Date(data.bucketed_timestamp_minutes_utc);

  return (
    <div className="bg-popover border rounded-lg shadow-md p-3 z-10">
      <p className={`font-semibold text-card-foreground ${GeistMono.className}`}>
        {formatCurrency(data.price_usd)}
      </p>
      <p className="text-muted-foreground text-xs mt-1">
        {date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
};

export function TokenChart({
  tokenAddress,
  tokenSymbol,
  tokenName,
  currentPrice,
}: TokenChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "hour" | "day" | "week" | "month" | "year" | "all"
  >("month");

  const {
    data,
    latestPrice: apiLatestPrice,
    isLoading,
    error,
    priceChange,
  } = useTokenChart({
    tokenAddress,
    timeframe: selectedTimeframe,
  });

  // Use the most accurate price: API latest price, then chart data, then fallback to prop
  const displayPrice =
    apiLatestPrice || (data.length > 0 ? data[data.length - 1].price_usd : 0) || currentPrice || 0;

  if (error) {
    return (
      <div className="p-6 text-center">
        <Activity className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Chart data unavailable</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    timestamp: new Date(item.bucketed_timestamp_minutes_utc).getTime(),
  }));

  const isPositive = (priceChange?.percentage || 0) >= 0;
  const strokeColor = isPositive ? "#22c55e" : "#ef4444";
  const gradientId = `gradient-${tokenSymbol.replace(/[^a-zA-Z0-9]/g, "")}-${isPositive ? "positive" : "negative"}`;

  return (
    <div className="space-y-4">
      {/* Header with price and change */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{tokenSymbol} Price</h3>
          <p className="text-sm text-muted-foreground">{tokenName}</p>
        </div>
        {data.length > 0 && (
          <div className="text-right">
            <p className={`font-semibold ${GeistMono.className}`}>{formatCurrency(displayPrice)}</p>
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
              )}
              <span
                className={`text-xs font-medium ${
                  isPositive
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {(priceChange?.percentage || 0).toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Timeframe selector */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
        {timeframes.map((timeframe) => (
          <Button
            key={timeframe.value}
            variant={selectedTimeframe === timeframe.value ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs font-medium"
            onClick={() => setSelectedTimeframe(timeframe.value)}
          >
            {timeframe.label}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                  <stop offset="50%" stopColor={strokeColor} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={["dataMin - dataMin * 0.02", "dataMax + dataMax * 0.02"]}
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--muted-foreground))"
                opacity={0.1}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price_usd"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                fillOpacity={1}
                connectNulls
                dot={false}
                activeDot={{
                  r: 5,
                  fill: strokeColor,
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No price data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-4">
          <div>
            <p className="text-xs text-muted-foreground">High</p>
            <p className={`font-semibold text-sm ${GeistMono.className}`}>
              {formatCurrency(Math.max(...data.map((d) => d.price_usd)))}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Low</p>
            <p className={`font-semibold text-sm ${GeistMono.className}`}>
              {formatCurrency(Math.min(...data.map((d) => d.price_usd)))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
