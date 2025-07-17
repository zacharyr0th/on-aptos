'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const data = [
  { name: 'Tokens', value: 45, color: 'hsl(var(--chart-1))' },
  { name: 'DeFi Positions', value: 40, color: 'hsl(var(--chart-2))' },
  { name: 'NFTs', value: 15, color: 'hsl(var(--chart-3))' },
];

const chartConfig = {
  tokens: {
    label: 'Tokens',
    color: 'hsl(var(--chart-1))',
  },
  defi: {
    label: 'DeFi Positions',
    color: 'hsl(var(--chart-2))',
  },
  nfts: {
    label: 'NFTs',
    color: 'hsl(var(--chart-3))',
  },
};

export function PortfolioDistributionChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value: number) => `${value}%`}
              hideLabel
            />
          }
        />
      </PieChart>
    </ChartContainer>
  );
}