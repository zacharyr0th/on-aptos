"use client";

import * as React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

// Chart colors that work in both light and dark modes
const CHART_COLORS = [
  "hsl(210 70% 65%)", // Blue
  "hsl(270 60% 70%)", // Purple
  "hsl(330 65% 75%)", // Pink
  "hsl(30 70% 75%)", // Orange
  "hsl(150 50% 70%)", // Green
  "hsl(190 60% 70%)", // Cyan
  "hsl(0 60% 75%)", // Red
  "hsl(50 70% 70%)", // Yellow
  "hsl(260 50% 80%)", // Lavender
  "hsl(210 20% 65%)", // Slate
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
const dataWithColors = assetData.map((item, index) => ({
  ...item,
  color: CHART_COLORS[index % CHART_COLORS.length],
  percentage: item.value,
}));

// Custom tooltip matching portfolio page style
const CustomTooltip = React.memo(({ active, payload }: any) => {
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
      <div className="text-xs text-muted-foreground mt-1">
        {data.percentage}% • ${(data.value * 124.5678).toFixed(2)}
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
          >
            {dataWithColors.map((entry, index) => (
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
          <div className="text-xl sm:text-3xl lg:text-4xl font-bold">
            $12,456
          </div>
        </div>
      </div>
    </div>
  );
}
