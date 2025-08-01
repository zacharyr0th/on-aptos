"use client";

import * as React from "react";
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from "recharts";

// Chart colors matching portfolio page style
const CHART_COLORS = [
  "#93c5fd", // Light Blue
  "#c4b5fd", // Light Purple
  "#f9a8d4", // Light Pink
  "#fed7aa", // Light Orange
  "#a7f3d0", // Light Green
  "#a5f3fc", // Light Cyan
  "#fca5a5", // Light Red
  "#fde68a", // Light Yellow
  "#e9d5ff", // Light Lavender
  "#cbd5e1", // Light Slate
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
          <div className="text-xl sm:text-3xl lg:text-4xl font-bold">$12,456</div>
        </div>
      </div>
    </div>
  );
}