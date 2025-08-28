import { TrendingUp, TrendingDown } from "lucide-react";
import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";

import { usePortfolioHistory } from "./hooks/usePortfolioHistory";

interface PerformanceSummaryProps {
  walletAddress: string | undefined;
  className?: string;
}

interface TimeframeData {
  label: string;
  timeframe: "24h" | "7d" | "30d" | "90d" | "1y";
  days: number;
}

const timeframes: TimeframeData[] = [
  { label: "24h", timeframe: "24h", days: 1 },
  { label: "7d", timeframe: "7d", days: 7 },
  { label: "30d", timeframe: "30d", days: 30 },
  { label: "90d", timeframe: "90d", days: 90 },
  { label: "1y", timeframe: "1y", days: 365 },
];

export const PerformanceSummary: React.FC<PerformanceSummaryProps> = React.memo(
  ({ walletAddress, className }) => {
    // Fetch data for the longest timeframe (1 year) and calculate others from it
    const { data: yearData, isLoading } = usePortfolioHistory(walletAddress, {
      days: 365,
    });

    // Calculate metrics for each timeframe
    const timeframeData = timeframes.map((tf) => {
      // Filter data to the specific timeframe
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - tf.days);

      const filteredData =
        yearData?.filter((entry) => new Date(entry.date) >= cutoffDate) || [];

      // Calculate metrics
      let change = 0;
      let changePercent = 0;
      let isPositive = true;

      if (filteredData.length > 0) {
        const values = filteredData.map((entry) => entry.totalValue);
        const startValue = values[0] || 0;
        const endValue = values[values.length - 1] || 0;
        change = endValue - startValue;
        changePercent = startValue > 0 ? (change / startValue) * 100 : 0;
        isPositive = change >= 0;
      }

      return {
        ...tf,
        change,
        changePercent,
        isPositive,
        isLoading,
        hasData: filteredData.length > 0,
      };
    });

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {timeframeData.map((tf) => (
              <div key={tf.timeframe} className="space-y-1">
                <p className="text-xs text-muted-foreground">{tf.label}</p>
                {tf.isLoading ? (
                  <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                ) : tf.hasData ? (
                  <div className="flex items-center gap-1">
                    {tf.isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                    )}
                    <span
                      className={cn(
                        "text-sm font-medium",
                        tf.isPositive
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {tf.isPositive ? "+" : ""}
                      {formatPercentage(tf.changePercent)}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
                <p className="text-xs text-muted-foreground">
                  {tf.hasData ? (
                    <>
                      {tf.isPositive ? "+" : ""}
                      {formatCurrency(Math.abs(tf.change))}
                    </>
                  ) : (
                    "No data"
                  )}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  },
);

PerformanceSummary.displayName = "PerformanceSummary";
