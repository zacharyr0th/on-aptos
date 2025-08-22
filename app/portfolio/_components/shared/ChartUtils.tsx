"use client";

import React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { formatCurrency } from "@/lib/utils/format/format";

// Shared color schemes
export const CHART_COLORS = [
  "#93c5fd", // Light Blue
  "#c4b5fd", // Light Purple
  "#f9a8d4", // Light Pink
  "#fed7aa", // Light Orange
  "#a7f3d0", // Light Green
  "#a5f3fc", // Light Cyan
  "#fca5a5", // Light Red
  "#c7d2fe", // Light Indigo
  "#d9f99d", // Light Lime
  "#fdba74", // Light Amber
];

// Sleek minimal black-based color scheme
export const MINIMAL_CHART_COLORS = [
  "#000000", // Pure Black
  "#1a1a1a", // Near Black
  "#2d2d2d", // Dark Charcoal
  "#404040", // Charcoal
  "#525252", // Dark Gray
  "#666666", // Medium Gray
  "#7a7a7a", // Gray
  "#8d8d8d", // Light Gray
  "#a1a1a1", // Lighter Gray
  "#b4b4b4", // Silver
  "#c8c8c8", // Light Silver
  "#dbdbdb", // Pale Silver
];

// Premium monochrome with subtle accent colors
export const PREMIUM_CHART_COLORS = [
  "#0a0a0a", // Deepest Black
  "#1c1c1c", // Rich Black
  "#2e2e2e", // Onyx
  "#3f3f3f", // Graphite
  "#505050", // Tungsten
  "#616161", // Iron
  "#727272", // Steel
  "#838383", // Titanium
  "#949494", // Platinum
  "#a5a5a5", // Chrome
  "#b6b6b6", // Nickel
  "#c7c7c7", // Pearl
];

// Shared chart data interfaces
export interface ChartDataItem {
  name: string;
  symbol?: string;
  value: number;
  percentage: number;
  color: string;
  logo?: string;
  isDefi?: boolean;
  category?: string;
  fullName?: string;
}

// Custom tooltip component for pie charts
export const CustomTooltip = React.memo({ active, payload }: unknown) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload as ChartDataItem;

  return (
    <div className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 z-[9999] text-sm space-y-1">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <p className="font-semibold text-popover-foreground">
          {data.fullName || data.symbol || data.name}
        </p>
      </div>
      <p className="text-muted-foreground font-mono">
        Value: {formatCurrency(data.value)}
      </p>
      <p className="text-muted-foreground font-mono">
        {data.percentage.toFixed(1)}% of portfolio
      </p>
    </div>
  );
});

CustomTooltip.displayName = "CustomTooltip";

// PieChart component with recharts - Optimized with memoization
interface PieChartProps {
  data: ChartDataItem[];
  innerRadius?: string;
  outerRadius?: string;
  centerContent?: React.ReactNode;
  className?: string;
  onClick?: (data: ChartDataItem) => void;
  colorScheme?: "default" | "minimal" | "premium";
  animationDuration?: number;
}

export const PieChart: React.FC<PieChartProps> = React.memo(
  ({
    data,
    centerContent,
    className = "w-full h-full",
    innerRadius = "62%",
    outerRadius = "90%",
    onClick,
    colorScheme = "minimal",
    animationDuration = 800,
  }) => {
    // Use the appropriate color scheme
    const colors = React.useMemo(() => {
      switch (colorScheme) {
        case "minimal":
          return MINIMAL_CHART_COLORS;
        case "premium":
          return PREMIUM_CHART_COLORS;
        default:
          return CHART_COLORS;
      }
    }, [colorScheme]);

    // Memoize processed data
    const processedData = React.useMemo(() => {
      if (!data || data.length === 0) return [];
      return data.map((item, _index) => ({
        ...item,
        color: item.color || colors[index % colors.length],
      }));
    }, [data, colors]);

    if (processedData.length === 0) {
      return (
        <div
          className={`relative ${className} flex items-center justify-center`}
        >
          <div className="text-muted-foreground">No data available</div>
        </div>
      );
    }

    return (
      <div className={`relative ${className}`}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              onClick={onClick}
              animationBegin={0}
              animationDuration={animationDuration}
              animationEasing="ease-out"
            >
              {processedData.map((item, _index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  style={{
                    cursor: onClick ? "pointer" : "default",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip />}
              animationDuration={200}
              cursor={{ fill: "transparent" }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
        {centerContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {centerContent}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for memoization
    return (
      prevProps.data === nextProps.data &&
      prevProps.innerRadius === nextProps.innerRadius &&
      prevProps.outerRadius === nextProps.outerRadius &&
      prevProps.colorScheme === nextProps.colorScheme
    );
  },
);

// Asset allocation data calculation utility - Optimized
export const calculateAssetAllocation = (
  assets: Array<Record<string, unknown>>,
  defiPositions: Array<Record<string, unknown>>,
  totalValue: number,
  colorScheme: string[] = MINIMAL_CHART_COLORS, // Default to minimal colors
): ChartDataItem[] => {
  // Early return for empty data
  if (
    (!assets || assets.length === 0) &&
    (!defiPositions || defiPositions.length === 0)
  ) {
    return [];
  }

  const allItems: ChartDataItem[] = [];
  let colorIndex = 0;

  // Add all tokens with value > $0.1
  const significantAssets = assets
    .filter((asset) => (asset.value || 0) > 0.1)
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  significantAssets.forEach((asset) => {
    allItems.push({
      name: asset.metadata?.name || "Unknown",
      symbol: asset.metadata?.symbol || "UNK",
      value: asset.value || 0,
      percentage: totalValue > 0 ? ((asset.value || 0) / totalValue) * 100 : 0,
      color: colorScheme[colorIndex % colorScheme.length],
      category: "Tokens",
      fullName:
        asset.metadata?.name || asset.metadata?.symbol || "Unknown Token",
    });
    colorIndex++;
  });

  // Add all DeFi positions with value
  if (defiPositions && defiPositions.length > 0) {
    const significantDefi = defiPositions
      .filter((position) => position.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue);

    significantDefi.forEach((position) => {
      allItems.push({
        name: position.protocol,
        symbol: position.protocol,
        value: position.totalValue,
        percentage:
          totalValue > 0 ? (position.totalValue / totalValue) * 100 : 0,
        color: colorScheme[colorIndex % colorScheme.length],
        category: "DeFi",
        isDefi: true,
        fullName: `${position.protocol} Position`,
      });
      colorIndex++;
    });
  }

  return allItems;
};
