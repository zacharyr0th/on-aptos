'use client';

import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

export const SimulatedChart = () => {
  const { theme } = useTheme();

  // Generate simulated portfolio data
  const chartData = useMemo(() => {
    const baseValue = 100000;
    const volatility = 0.02;
    const trend = 0.0004; // Slight upward trend

    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));

      // Generate realistic looking price movement
      const random = (Math.random() - 0.5) * 2;
      const trendComponent = i * trend * baseValue;
      const volatilityComponent = random * volatility * baseValue;
      const value =
        baseValue + trendComponent + volatilityComponent + (i > 15 ? 5000 : 0);

      return {
        date: date.toISOString().split('T')[0],
        totalValue: Math.round(value),
      };
    });
  }, []);

  return (
    <ChartContainer
      config={{
        totalValue: {
          label: 'Portfolio Value',
          color: 'hsl(var(--chart-1))',
        },
      }}
      className="h-full w-full min-h-[200px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorValueDemo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="currentColor" stopOpacity={0.2} />
              <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tickFormatter={value => {
              const date = new Date(value);
              return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
            }}
            interval={Math.floor(chartData.length / 4)}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            className="text-xs"
            tickFormatter={value => {
              if (value === 0) return '$0';
              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
              return `$${value.toFixed(0)}`;
            }}
            domain={['dataMin - 5000', 'dataMax + 5000']}
            tick={{ fontSize: 10 }}
            width={45}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            formatter={value => [
              `$${Number(value).toLocaleString()}`,
              'Portfolio Value',
            ]}
          />
          <Area
            type="monotone"
            dataKey="totalValue"
            stroke="hsl(var(--chart-1))"
            fillOpacity={1}
            fill="url(#colorValueDemo)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
