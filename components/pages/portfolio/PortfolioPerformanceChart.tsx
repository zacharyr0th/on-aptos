"use client";

import { GeistMono } from "geist/font/mono";
import { Activity, Info } from "lucide-react";
import React, { useState, useEffect } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils/format/format";

import { usePortfolioPerformance } from "./hooks/usePortfolioPerformance";

interface PortfolioPerformanceChartProps {
  walletAddress: string;
  currentValue?: number;
}

// const _timeframes = [
//   { label: "1H", value: "1h" as const },
//   { label: "12H", value: "12h" as const },
//   { label: "1D", value: "24h" as const },
//   { label: "1W", value: "7d" as const },
//   { label: "1M", value: "30d" as const },
//   { label: "3M", value: "90d" as const },
//   { label: "1Y", value: "1y" as const },
//   { label: "ALL", value: "all" as const },
// ];

const CustomTooltip = ({ active, payload, _label }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const date = new Date(data.timestamp);

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg p-3 z-10">
      <p
        className={`font-semibold text-card-foreground ${GeistMono.className}`}
      >
        {formatCurrency(data.value)}
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

export function PortfolioPerformanceChart({
  walletAddress,
}: PortfolioPerformanceChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "1h" | "12h" | "24h" | "7d" | "30d" | "90d" | "1y" | "all"
  >("7d");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const { data, isLoading, error, performanceMetrics } =
    usePortfolioPerformance({
      walletAddress,
      timeframe: selectedTimeframe,
    });

  if (error) {
    return (
      <div className="p-6 text-center">
        <Activity className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Performance data unavailable
        </p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    timestamp: new Date(item.timestamp).getTime(),
  }));

  const isPositive = (performanceMetrics?.percentage || 0) >= 0;
  const strokeColor = isPositive ? "#86efac" : "#fca5a5"; // Pastel green and pastel red
  const gradientId = `portfolio-gradient-${isPositive ? "positive" : "negative"}`;

  return (
    <div className="space-y-4">
      {/* Header with timeframe selector */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Performance</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Tokens & DeFi Positions Only</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-muted-foreground">Total value over time</p>
        </div>
        <div className="flex gap-1">
          {[
            { label: "7D", value: "7d" as const },
            { label: "1M", value: "30d" as const },
            { label: "1Y", value: "1y" as const },
          ].map((timeframe) => (
            <Button
              key={timeframe.value}
              variant={
                selectedTimeframe === timeframe.value ? "default" : "ghost"
              }
              size="sm"
              className="h-7 px-2 text-xs font-medium"
              onClick={() => setSelectedTimeframe(timeframe.value)}
            >
              {timeframe.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 relative">
        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-md z-10 rounded-lg">
          <div className="text-center space-y-1.5 px-6 py-4 rounded-md bg-background/40">
            <div className="text-lg font-medium text-muted-foreground/80">
              Coming Soon
            </div>
            <p className="text-xs text-muted-foreground/60 max-w-48">
              Performance tracking is currently under development
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="w-full h-full flex flex-col">
            {/* Chart area skeleton */}
            <div className="flex-1 relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between w-12">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
              </div>

              {/* Chart lines/area */}
              <div className="ml-14 mr-4 h-full relative">
                <div className="absolute inset-0 flex items-end">
                  <div className="w-full h-3/4 bg-gradient-to-t from-accent/10 to-accent/30 rounded-t-lg animate-pulse" />
                </div>
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between opacity-10">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-t border-border" />
                  ))}
                </div>
              </div>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between ml-14 mr-4 mt-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 0, left: 0, bottom: 20 }}
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
                  fontSize: 12,
                  fill: isDarkMode ? "#ffffff" : "#000000",
                }}
                axisLine={{
                  stroke: isDarkMode ? "#ffffff" : "#000000",
                  opacity: 0.5,
                }}
                tickLine={{
                  stroke: isDarkMode ? "#ffffff" : "#000000",
                  opacity: 0.5,
                }}
                interval="preserveStartEnd"
                minTickGap={50}
                tickFormatter={(value) => {
                  if (typeof window === "undefined") return "";
                  const date = new Date(value);
                  return date.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis
                domain={[
                  "dataMin - dataMin * 0.02",
                  "dataMax + dataMax * 0.02",
                ]}
                tick={{
                  fontSize: 12,
                  fill: isDarkMode ? "#ffffff" : "#000000",
                }}
                axisLine={{
                  stroke: isDarkMode ? "#ffffff" : "#000000",
                  opacity: 0.5,
                }}
                tickLine={{
                  stroke: isDarkMode ? "#ffffff" : "#000000",
                  opacity: 0.5,
                }}
                tickFormatter={(value) => {
                  if (typeof window === "undefined") return "";
                  return formatCurrency(Math.round(value));
                }}
              />
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDarkMode ? "#ffffff" : "#000000"}
                opacity={0.1}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
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
                No performance data available
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="relative">
        {/* Coming Soon Overlay for Stats */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-md z-10 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground/60">
              Stats Coming Soon
            </div>
          </div>
        </div>

        {performanceMetrics && (
          <div className="space-y-2">
            {/* High and Low on one line */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#86efac" }}
                />
                <span className="text-xs">
                  High: {formatCurrency(performanceMetrics.high)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#fca5a5" }}
                />
                <span className="text-xs">
                  Low: {formatCurrency(performanceMetrics.low)}
                </span>
              </div>
            </div>

            {/* Change on bottom line */}
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    performanceMetrics.change >= 0 ? "#86efac" : "#fca5a5",
                }}
              />
              <span className="text-xs">
                Change: {performanceMetrics.change >= 0 ? "+" : ""}
                {formatCurrency(performanceMetrics.change)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
