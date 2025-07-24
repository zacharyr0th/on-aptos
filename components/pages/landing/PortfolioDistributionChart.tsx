'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PORTFOLIO_CHART_COLORS } from '@/lib/constants/ui/colors';

// Inner layer - Categories (3 main categories)
const categoryData = [
  {
    name: 'Tokens',
    value: 45,
    color: PORTFOLIO_CHART_COLORS.categories.tokens,
  },
  { name: 'DeFi', value: 40, color: PORTFOLIO_CHART_COLORS.categories.defi },
  { name: 'NFTs', value: 15, color: PORTFOLIO_CHART_COLORS.categories.nfts },
];

// Outer layer - Individual Assets (many items per category)
const assetData = [
  // Tokens category (45% total)
  { name: 'APT', value: 18, color: PORTFOLIO_CHART_COLORS.tokens.primary },
  { name: 'USDC', value: 12, color: PORTFOLIO_CHART_COLORS.tokens.secondary },
  { name: 'wBTC', value: 8, color: PORTFOLIO_CHART_COLORS.tokens.tertiary },
  { name: 'USDT', value: 4, color: PORTFOLIO_CHART_COLORS.tokens.quaternary },
  { name: 'wETH', value: 3, color: PORTFOLIO_CHART_COLORS.tokens.quinary },

  // DeFi category (40% total)
  { name: 'Thala LP', value: 15, color: PORTFOLIO_CHART_COLORS.defi.primary },
  {
    name: 'Amnis stAPT',
    value: 10,
    color: PORTFOLIO_CHART_COLORS.defi.secondary,
  },
  { name: 'Pancake LP', value: 8, color: PORTFOLIO_CHART_COLORS.defi.tertiary },
  {
    name: 'Tortuga stAPT',
    value: 4,
    color: PORTFOLIO_CHART_COLORS.defi.quaternary,
  },
  { name: 'Ditto stAPT', value: 2, color: PORTFOLIO_CHART_COLORS.defi.quinary },
  {
    name: 'Aries Markets',
    value: 1,
    color: PORTFOLIO_CHART_COLORS.defi.senary,
  },

  // NFTs category (15% total)
  {
    name: 'Aptos Monkeys',
    value: 6,
    color: PORTFOLIO_CHART_COLORS.nfts.primary,
  },
  {
    name: 'Aptomingos',
    value: 4,
    color: PORTFOLIO_CHART_COLORS.nfts.secondary,
  },
  {
    name: 'Topaz Troopers',
    value: 2,
    color: PORTFOLIO_CHART_COLORS.nfts.tertiary,
  },
  {
    name: 'Souffl3 NFTs',
    value: 2,
    color: PORTFOLIO_CHART_COLORS.nfts.quaternary,
  },
  { name: 'Other NFTs', value: 1, color: PORTFOLIO_CHART_COLORS.nfts.quinary },
];

const chartConfig = {
  tokens: {
    label: 'Tokens',
    color: 'hsl(var(--chart-1))',
  },
  defi: {
    label: 'DeFi',
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
        {/* Inner layer - Categories (3 main categories) */}
        <Pie
          data={categoryData}
          cx="50%"
          cy="50%"
          innerRadius={20}
          outerRadius={50}
          paddingAngle={2}
          dataKey="value"
        >
          {categoryData.map((entry, index) => (
            <Cell key={`category-${index}`} fill={entry.color} />
          ))}
        </Pie>

        {/* Outer layer - Individual Assets (many items per category) */}
        <Pie
          data={assetData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={1}
          dataKey="value"
        >
          {assetData.map((entry, index) => (
            <Cell key={`asset-${index}`} fill={entry.color} />
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
