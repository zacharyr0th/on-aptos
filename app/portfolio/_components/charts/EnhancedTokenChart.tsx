"use client";

import { GeistMono } from "geist/font/mono";
import { Activity, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { FungibleAsset } from "@/lib/types/consolidated";
import { formatCurrency } from "@/lib/utils/format/format";

import { useTokenChart } from "../../_hooks/useTokenChart";

// interface TokenPriceData {
//   bucketed_timestamp_minutes_utc: string;
//   price_usd: number;
//   timestamp?: number;
// }

interface EnhancedTokenChartProps {
  tokenAddress?: string;
  tokenSymbol: string;
  tokenName: string;
  currentPrice?: number;
  faAddress?: string;
  selectedAsset?: FungibleAsset;
  className?: string;
}

const timeframes = [
  { label: "1H", value: "hour" as const },
  { label: "1D", value: "day" as const },
  { label: "1W", value: "week" as const },
  { label: "1M", value: "month" as const },
  { label: "1Y", value: "year" as const },
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      bucketed_timestamp_minutes_utc?: string;
      timestamp?: string;
      price_usd?: number;
    };
  }>;
  _label?: string;
}

const CustomTooltip = ({ active, payload, _label }: TooltipProps) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const date = new Date(
    data.bucketed_timestamp_minutes_utc || data.timestamp || Date.now(),
  );

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg p-3 z-10">
      <p
        className={`font-semibold text-card-foreground ${GeistMono.className}`}
      >
        {formatCurrency(data.price_usd || 0)}
      </p>
      <p className="text-muted-foreground text-xs mt-1">
        {date.toLocaleDateString((undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
};

export function EnhancedTokenChart({
  tokenAddress,
  tokenSymbol,
  tokenName,
  currentPrice,
  faAddress,
  selectedAsset,
  className,
}: EnhancedTokenChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "hour" | "day" | "week" | "month" | "year"
  >("month");

  // Enhanced address resolution with multiple fallbacks
  const resolvedTokenAddress = useMemo(() => {
    // Priority order for address resolution:
    // 1. FA address from selectedAsset (most reliable for new tokens)
    // 2. FA address prop
    // 3. Token address from selectedAsset
    // 4. Asset type from selectedAsset (portfolio assets)
    // 5. Token address prop
    // 6. Default APT handling

    if (selectedAsset) {
      if (selectedAsset.asset_type) {
        return selectedAsset.asset_type;
      }
    }

    if (faAddress && faAddress !== "null") {
      return faAddress;
    }

    if (tokenAddress && tokenAddress !== "null") {
      return tokenAddress;
    }

    // Handle APT token fallback
    if (
      tokenSymbol?.toUpperCase() === "APT" ||
      tokenAddress?.includes("aptos_coin") ||
      tokenAddress === "0x1"
    ) {
      return "0x1::aptos_coin::AptosCoin";
    }

    return tokenAddress;
  }, [tokenAddress, faAddress, selectedAsset, tokenSymbol]);

  // Use the useTokenChart hook for data fetching
  const { data, latestPrice, isLoading, error, priceChange } = useTokenChart({
    tokenAddress: resolvedTokenAddress,
    timeframe: selectedTimeframe,
    faAddress,
    selectedAsset,
  });

  // Enhanced price resolution
  const resolvedCurrentPrice = useMemo(() => {
    return (
      latestPrice ||
      (data.length > 0 ? data[data.length - 1].price_usd : 0) ||
      selectedAsset?.price ||
      selectedAsset?.price_usd ||
      0 ||
      currentPrice ||
      0
    );
  }, [latestPrice, data, selectedAsset, currentPrice]);

  if (error) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <Activity className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Chart data unavailable</p>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <p>Token Address: {tokenAddress}</p>
            <p>FA Address: {faAddress}</p>
            <p>Resolved Address: {resolvedTokenAddress}</p>
            <p>Selected Asset: {selectedAsset?.asset_type}</p>
            <p>Error: {error}</p>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="mt-3"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    timestamp: new Date(item.bucketed_timestamp_minutes_utc).getTime(),
  }));

  const isPositive = (priceChange?.percentage || 0) >= 0;
  const strokeColor = isPositive ? "#86efac" : "#fca5a5";
  const gradientId = `gradient-${tokenSymbol.replace(/[^a-zA-Z0-9]/g, "")}-${isPositive ? "positive" : "negative"}`;

  return (
    <div className={`space-y-3 lg:space-y-4 h-full flex flex-col ${className}`}>
      {/* Header with price and change */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-base lg:text-lg font-semibold truncate">
            {tokenSymbol} Price
          </h3>
          <p className="text-xs lg:text-sm text-muted-foreground truncate">
            {tokenName}
          </p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
          {data.length > 0 && (
            <div className="text-right">
              <p
                className={`text-sm lg:text-base font-semibold ${GeistMono.className}`}
              >
                {formatCurrency(resolvedCurrentPrice)}
              </p>
              {priceChange && (
                <div className="flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`text-xs font-medium font-mono ${
                      isPositive
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {priceChange.percentage.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            disabled={isLoading}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Refresh chart data"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Timeframe selector */}
      <div className="flex gap-0.5 lg:gap-1 p-0.5 lg:p-1 bg-muted/30 rounded-lg overflow-x-auto">
        {timeframes.map((timeframe) => (
          <Button
            key={timeframe.value}
            variant={
              selectedTimeframe === timeframe.value ? "default" : "ghost"
            }
            size="sm"
            className="h-6 lg:h-7 px-1.5 lg:px-2 text-xs font-medium flex-shrink-0"
            onClick={() => setSelectedTimeframe(timeframe.value)}
          >
            {timeframe.label}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[300px]">
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
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 5, left: 5, bottom: 10 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                  <stop
                    offset="50%"
                    stopColor={strokeColor}
                    stopOpacity={0.1}
                  />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tick={{
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  if (selectedTimeframe === "hour") {
                    return date.toLocaleTimeString((undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  } else if (selectedTimeframe === "day") {
                    return date.toLocaleTimeString((undefined, {
                      hour: "2-digit",
                    });
                  } else {
                    return date.toLocaleDateString((undefined, {
                      month: "short",
                      day: "numeric",
                    });
                  }
                }}
                axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 0.5 }}
                tickLine={{ stroke: "hsl(var(--border))", strokeWidth: 0.5 }}
                ticks={chartData
                  .filter((_, index) => {
                    // Show fewer ticks based on data length
                    const totalPoints = chartData.length;
                    if (totalPoints <= 10) return true;
                    if (totalPoints <= 50) return index % 2 === 0;
                    if (totalPoints <= 100) return index % 4 === 0;
                    return index % 8 === 0;
                  })
                  .map((d) => d.timestamp)}
              />
              <YAxis
                domain={[
                  (dataMin: number) => dataMin * 0.98,
                  (dataMax: number) => dataMax * 1.02,
                ]}
                tick={{
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                }}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `$${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `$${(value / 1000).toFixed(1)}K`;
                  } else if (value >= 1) {
                    return `$${value.toFixed(0)}`;
                  } else if (value >= 0.01) {
                    return `$${value.toFixed(2)}`;
                  } else {
                    return `$${value.toFixed(4)}`;
                  }
                }}
                axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 0.5 }}
                tickLine={{ stroke: "hsl(var(--border))", strokeWidth: 0.5 }}
                label={{
                  value: "Price (USD)",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                    textAnchor: "middle",
                  },
                }}
              />
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
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
              <p className="text-sm text-muted-foreground">
                No price data available
              </p>
              {process.env.NODE_ENV === "development" && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  <p>Token Address: {tokenAddress}</p>
                  <p>FA Address: {faAddress}</p>
                  <p>Resolved Address: {resolvedTokenAddress}</p>
                  <p>Selected Asset: {selectedAsset?.asset_type}</p>
                  <p>Symbol: {tokenSymbol}</p>
                  <p>Loading: {String(isLoading)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
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
