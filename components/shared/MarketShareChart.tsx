import React, { useMemo, memo, useCallback } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  TooltipProps,
} from "recharts";

import { useResponsive } from "@/hooks/useResponsive";
import { logger, errorLogger } from "@/lib/utils/core/logger";
import {
  formatAssetValue,
  CHART_DIMENSIONS,
  ChartDataItem,
} from "@/lib/utils/format/chart-utils";

export interface MarketShareChartProps {
  data: ChartDataItem[];
  totalValue: number;
  colors: Record<string, string>;
  centerContent?: React.ReactNode;
  topRightContent?: React.ReactNode;
  onDataProcessed?: (data: ChartDataItem[]) => ChartDataItem[];
  showTotalInfo?: boolean;
}

// Custom tooltip component
const CustomTooltip = memo<
  TooltipProps<number, string> & {
    customRenderer?: (data: any) => React.ReactNode;
  }
>((props) => {
  const { active, payload, customRenderer } = props as any;
  if (!active || !payload?.length) return null;

  try {
    const data = payload[0].payload as ChartDataItem;

    if (customRenderer) {
      return customRenderer(data);
    }

    const { name, value, formattedSupply, provider } = data;
    const isProvider = !provider || provider === name;

    return (
      <div
        className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 z-10 text-sm space-y-1"
        role="tooltip"
      >
        <p className="font-semibold text-popover-foreground">{name}</p>
        {formattedSupply && (
          <p className="text-muted-foreground">
            {isProvider ? "Total Value" : "Value"}: {formattedSupply}
          </p>
        )}
        <p className="text-muted-foreground">Share: {value.toFixed(2)}%</p>
        {!isProvider && provider && (
          <p className="text-muted-foreground text-xs">Provider: {provider}</p>
        )}
      </div>
    );
  } catch (error) {
    errorLogger.error("Error rendering tooltip:", error);
    return (
      <div className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 z-10 text-sm">
        <p className="text-destructive">Error displaying data</p>
      </div>
    );
  }
});

CustomTooltip.displayName = "CustomTooltip";

// Custom legend component
const CustomLegend = memo<{
  chartData: ChartDataItem[];
  colors: Record<string, string>;
  maxItems?: number;
  customRenderer?: (item: ChartDataItem, index: number) => React.ReactNode;
}>(({ chartData, colors, maxItems = 4, customRenderer }) => {
  if (!chartData.length) return null;

  const shouldShowAll = chartData.length <= maxItems;
  const itemsToShow = shouldShowAll
    ? chartData
    : chartData.slice(0, maxItems - 1);
  const remainingItems = shouldShowAll ? [] : chartData.slice(maxItems - 1);
  const remainingCount = remainingItems.length;
  const remainingPercentage = remainingItems.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      {itemsToShow.map((item, i) => {
        if (customRenderer) {
          return customRenderer(item, i);
        }

        const displayValue = Number.isFinite(item.value)
          ? item.value.toFixed(2)
          : "0.00";
        const color =
          item.color || colors[item.name] || colors.default || "#888";

        return (
          <div
            key={`legend-${item.name}-${i}`}
            className="flex items-center gap-3"
          >
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="min-w-[64px] flex flex-wrap text-card-foreground gap-x-1">
              <span>{item.name}</span>
            </div>
            <span className="text-sm text-muted-foreground ml-auto pl-2">
              {displayValue}%
            </span>
          </div>
        );
      })}

      {remainingCount > 0 && (
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: "#d4d4d8" }}
          />
          <div className="min-w-[64px] flex flex-wrap text-card-foreground gap-x-1">
            <span className="text-sm font-medium text-muted-foreground">
              + ({remainingCount}) more
            </span>
          </div>
          <span className="text-sm text-muted-foreground ml-auto pl-2">
            {remainingPercentage.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
});

CustomLegend.displayName = "CustomLegend";

// Main chart component
export const MarketShareChart = memo<MarketShareChartProps>(
  ({
    data,
    totalValue,
    colors,
    centerContent,
    topRightContent,
    onDataProcessed,
    showTotalInfo = true,
  }) => {
    const { isMobile } = useResponsive();

    // Process data if custom processor provided, otherwise apply default 2% threshold grouping
    const chartData = useMemo(() => {
      if (onDataProcessed) {
        return onDataProcessed(data);
      }

      // Default behavior: group items under 2% into "Others"
      const sortedData = [...data].sort((a, b) => b.value - a.value);
      const mainItems = sortedData.filter((item) => item.value >= 2.0);
      const otherItems = sortedData.filter((item) => item.value < 2.0);

      const result = [...mainItems];

      if (otherItems.length > 0) {
        const othersValue = otherItems.reduce(
          (sum, item) => sum + item.value,
          0,
        );

        // Calculate total supply more robustly - try multiple field formats
        const othersSupply = otherItems.reduce((sum, item) => {
          let itemSupply = 0;

          // Try different ways to get numeric supply value
          if (typeof item.value === "number") {
            itemSupply = item.value;
          } else if (item.formattedSupply) {
            // Extract number from formatted string (handles $1.2B, $500M, etc.)
            const matches = item.formattedSupply.match(/[\d.]+/g);
            if (matches && matches.length > 0) {
              let num = parseFloat(matches[0]);
              if (item.formattedSupply.toLowerCase().includes("b")) {
                num *= 1_000_000_000;
              } else if (item.formattedSupply.toLowerCase().includes("m")) {
                num *= 1_000_000;
              } else if (item.formattedSupply.toLowerCase().includes("k")) {
                num *= 1_000;
              }
              itemSupply = num;
            }
          }

          return sum + itemSupply;
        }, 0);

        result.push({
          name: "Others",
          value: othersValue,
          formattedSupply: formatAssetValue(othersSupply, "USD"),
        } as ChartDataItem);
      }

      return result;
    }, [data, onDataProcessed]);

    // Optimized chart configuration
    const chartConfig = useMemo(
      () => ({
        innerRadius: isMobile
          ? CHART_DIMENSIONS.mobile.innerRadius
          : CHART_DIMENSIONS.desktop.innerRadius,
        outerRadius: isMobile
          ? CHART_DIMENSIONS.mobile.outerRadius
          : CHART_DIMENSIONS.desktop.outerRadius,
        size: isMobile ? "w-56 h-56" : "w-80 h-80",
      }),
      [isMobile],
    );

    // Memoized color getter for cells
    const getCellColor = useCallback(
      (entry: ChartDataItem) => {
        if (entry.name === "Other") {
          return "#d4d4d8";
        }
        return entry.color || colors[entry.name] || colors.default || "#888";
      },
      [colors],
    );

    // Error boundary fallback
    if (!chartData.length) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px]">
          <div className="text-center p-8">
            <p className="text-muted-foreground">No data available for chart</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        {/* Top right content */}
        {topRightContent && showTotalInfo && (
          <div className="absolute top-4 right-4 z-10 hidden md:block">
            {topRightContent}
          </div>
        )}

        <div
          className={`flex items-center justify-center w-full h-full ${isMobile ? "p-4" : "p-6"}`}
        >
          <div
            className={`flex ${isMobile ? "flex-col items-center gap-6" : "flex-row items-center justify-center gap-12 w-full max-w-5xl"}`}
          >
            <div className={`${chartConfig.size} flex-shrink-0 relative`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={chartConfig.innerRadius}
                    outerRadius={chartConfig.outerRadius}
                    paddingAngle={4}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}-${index}`}
                        fill={getCellColor(entry)}
                        className="stroke-background hover:opacity-90 transition-opacity"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={false}
                    wrapperStyle={{ zIndex: 1000 }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  {centerContent || (
                    <div
                      className={`font-bold ${isMobile ? "text-xl" : "text-2xl sm:text-3xl lg:text-4xl"}`}
                    >
                      {formatAssetValue(totalValue, "USD")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className={`flex flex-col justify-center ${isMobile ? "w-full" : "w-64 flex-shrink-0"}`}
            >
              <CustomLegend chartData={chartData} colors={colors} />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

MarketShareChart.displayName = "MarketShareChart";
