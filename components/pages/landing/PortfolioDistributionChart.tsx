"use client";

import * as React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

import { formatCurrency } from "@/lib/utils/format/format";

// Minimal chart colors matching the portfolio page
const CHART_COLORS = [
  "#1a1a1a", // Primary black
  "#2a2a2a", // Dark gray
  "#3a3a3a", // Medium dark gray
  "#4a4a4a", // Medium gray
  "#5a5a5a", // Light gray
  "#6a6a6a", // Lighter gray
  "#7a7a7a", // Light medium gray
  "#8a8a8a", // Light gray
  "#9a9a9a", // Very light gray
  "#aaaaaa", // Lightest gray
];

// Sample data for the chart
const assetData = [
  { name: "APT", value: 35, symbol: "APT" },
  { name: "USDC", value: 25, symbol: "USDC" },
  { name: "stAPT", value: 15, symbol: "stAPT" },
  { name: "USDT", value: 10, symbol: "USDT" },
  { name: "wBTC", value: 8, symbol: "wBTC" },
  { name: "Others", value: 7, symbol: "Others" },
];

// Add colors to data
const dataWithColors = assetData.map((item, _index) => ({
  ...item,
  color: CHART_COLORS[index % CHART_COLORS.length],
  percentage: item.value,
}));

// Custom tooltip matching portfolio page style
const CustomTooltip = React.memo({ active, payload }: Record<string, unknown>) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-popover px-3 py-2 rounded-lg shadow-lg border z-[9999]">
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <span className="text-xs font-medium">{data.name}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1 font-mono">
        {data.percentage}% • {formatCurrency(data.value * 124.5678)}
      </div>
    </div>
  );
});

CustomTooltip.displayName = "CustomTooltip";

export function PortfolioDistributionChart() {
  return (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="85%"
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            animationBegin={0}
            animationDuration={600}
          >
            {dataWithColors.map((item, _index) => (
              <Cell
                key={`asset-${index}`}
                fill={entry.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
          </Pie>
          <RechartsTooltip content={<CustomTooltip />} />
        </RechartsPieChart>
      </ResponsiveContainer>

      {/* Center value */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-xl sm:text-3xl lg:text-4xl font-bold font-mono">
            {formatCurrency(12456)}
          </div>
        </div>
      </div>
    </div>
  );
}
