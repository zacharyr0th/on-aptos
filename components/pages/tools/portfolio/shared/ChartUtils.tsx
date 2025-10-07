"use client";

import React from "react";
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCurrency } from "@/lib/utils/format/format";

// Shared color schemes - Modern gradient palette that adapts to light/dark mode
export const CHART_COLORS_DARK = [
  "#6366f1", // Indigo-500 - primary accent
  "#8b5cf6", // Violet-500 - secondary accent
  "#ec4899", // Pink-500 - tertiary accent
  "#06b6d4", // Cyan-500 - quaternary accent
  "#10b981", // Emerald-500 - success
  "#f59e0b", // Amber-500 - warning
  "#ef4444", // Red-500 - danger
  "#3b82f6", // Blue-500 - info
  "#a855f7", // Purple-500 - special
  "#14b8a6", // Teal-500 - alternative
  "#f97316", // Orange-500 - alternative warning
  "#84cc16", // Lime-500 - alternative success
];

export const CHART_COLORS_LIGHT = [
  "#a5b4fc", // Indigo-300 - lighter primary
  "#c4b5fd", // Violet-300 - lighter secondary
  "#f9a8d4", // Pink-300 - lighter tertiary
  "#67e8f9", // Cyan-300 - lighter quaternary
  "#6ee7b7", // Emerald-300 - lighter success
  "#fcd34d", // Amber-300 - lighter warning
  "#fca5a5", // Red-300 - lighter danger
  "#93c5fd", // Blue-300 - lighter info
  "#d8b4fe", // Purple-300 - lighter special
  "#5eead4", // Teal-300 - lighter alternative
  "#fdba74", // Orange-300 - lighter alt warning
  "#bef264", // Lime-300 - lighter alt success
];

// Export a default that can be used without theme detection
export const CHART_COLORS = CHART_COLORS_LIGHT;

export const MINIMAL_CHART_COLORS = [
  "#1f2937", // Gray-800
  "#374151", // Gray-700
  "#4b5563", // Gray-600
  "#6b7280", // Gray-500
  "#9ca3af", // Gray-400
  "#d1d5db", // Gray-300
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
export const CustomTooltip = React.memo(({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload as ChartDataItem;

  return (
    <div className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 z-[9999] text-sm space-y-1">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
        <p className="font-semibold text-popover-foreground">
          {data.fullName || data.symbol || data.name}
        </p>
      </div>
      <p className="text-muted-foreground">Value: {formatCurrency(data.value)}</p>
      <p className="text-muted-foreground">{data.percentage.toFixed(1)}% of portfolio</p>
    </div>
  );
});

CustomTooltip.displayName = "CustomTooltip";

// PieChart component with recharts
interface PieChartProps {
  data: ChartDataItem[];
  innerRadius?: string;
  outerRadius?: string;
  centerContent?: React.ReactNode;
  className?: string;
  onClick?: (data: ChartDataItem) => void;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  centerContent,
  className = "w-full h-full",
  innerRadius = "62%",
  outerRadius = "90%",
  onClick,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`relative ${className} flex items-center justify-center`}>
        <div>No data available</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={4}
            dataKey="value"
            onClick={onClick}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="none"
                style={{ cursor: onClick ? "pointer" : "default" }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </RechartsPieChart>
      </ResponsiveContainer>
      {centerContent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {centerContent}
        </div>
      )}
    </div>
  );
};

// Asset allocation data calculation utility
export const calculateAssetAllocation = (
  assets: any[],
  defiPositions: any[],
  totalValue: number,
  colorScheme: string[] = CHART_COLORS
): ChartDataItem[] => {
  const allItems: ChartDataItem[] = [];
  let colorIndex = 0;

  // Add all tokens with value > $0.1
  assets
    .filter((asset) => (asset.value || 0) > 0.1)
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .forEach((asset) => {
      allItems.push({
        name: asset.metadata?.name || "Unknown",
        symbol: asset.metadata?.symbol || "UNK",
        value: asset.value || 0,
        percentage: totalValue > 0 ? ((asset.value || 0) / totalValue) * 100 : 0,
        color: colorScheme[colorIndex % colorScheme.length],
        category: "Tokens",
      });
      colorIndex++;
    });

  // Add all DeFi positions with value
  defiPositions
    .filter((position) => position.totalValue > 0)
    .sort((a, b) => b.totalValue - a.totalValue)
    .forEach((position) => {
      allItems.push({
        name: position.protocol,
        symbol: position.protocol,
        value: position.totalValue,
        percentage: totalValue > 0 ? (position.totalValue / totalValue) * 100 : 0,
        color: colorScheme[colorIndex % colorScheme.length],
        category: "DeFi",
        isDefi: true,
      });
      colorIndex++;
    });

  return allItems;
};
