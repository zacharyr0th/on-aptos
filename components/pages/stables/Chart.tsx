import { Copy } from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useMemo, memo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  TooltipProps,
} from 'recharts';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/useResponsive';
import { DisplayToken } from '@/lib/config';
import { STABLECOIN_COLORS } from '@/lib/constants/ui/colors';
import { formatCurrency } from '@/lib/utils';

import {
  formatPercentage,
  ChartDataItem,
  calculateMarketShare,
  measurePerformance,
} from './types';

// Re-export token colors for backward compatibility
export const TOKEN_COLORS = STABLECOIN_COLORS;

// Enhanced props interface with better typing
export interface MarketShareChartProps {
  data: DisplayToken[];
  totalSupply: string;
  tokenMetadata?: Record<
    string,
    { assetAddress: string; name?: string; decimals?: number }
  >;
  susdePrice?: number;
  showTotalInfo?: boolean;
}

// Chart configuration constants
const CHART_DIMENSIONS = {
  mobile: { innerRadius: '54%', outerRadius: '95%' },
  desktop: { innerRadius: '63%', outerRadius: '99%' },
} as const;

const BREAKPOINTS = {
  mobile: 640,
  desktop: 1024,
} as const;

// Optimized custom tooltip with memoization and reduced DOM operations
const CustomTooltip = memo<TooltipProps<number, string>>(props => {
  const { active, payload } = props as any;
  if (!active || !payload?.length) return null;

  try {
    const data = payload[0].payload as ChartDataItem;
    const { name, value, formattedSupply, _usdValue, components } = data;

    return (
      <div
        className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 z-10 text-sm space-y-1"
        role="tooltip"
      >
        <p className="font-semibold text-popover-foreground">{name}</p>
        <p className="text-muted-foreground">
          Market Share: {formatPercentage(value)}%
        </p>
        <p className="text-muted-foreground">Supply: {formattedSupply}</p>
        {_usdValue && (
          <p className="text-muted-foreground font-mono">
            Value: {formatCurrency(_usdValue, 'USD', { decimals: 0 })}
          </p>
        )}

        {/* Show individual tokens if this is the "Other" category */}
        {name === 'Other' && components && components.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Includes:
            </p>
            {components.map((component: any, index: number) => (
              <p key={index} className="text-xs text-muted-foreground ml-2">
                {component.symbol}: {component.formattedSupply}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error rendering tooltip:', error);
    return (
      <div className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 z-10 text-sm">
        <p className="text-destructive">Error displaying data</p>
      </div>
    );
  }
});

CustomTooltip.displayName = 'CustomTooltip';

// Enhanced token name copy component with better error handling
const TokenNameCopy = memo<{
  symbol: string;
  address?: string;
}>(({ symbol, address }) => {
  const handleCopy = useCallback(async (text: string, label: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${label} address to clipboard`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  if (!address) {
    return <span className="text-sm font-medium">{symbol}</span>;
  }

  return (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>
          <span className="relative inline-flex items-center group cursor-pointer">
            <span
              onClick={() => handleCopy(address, symbol)}
              className="text-sm font-medium group-hover:text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-primary after:scale-x-0 group-hover:after:scale-x-100 hover:after:scale-x-100 after:transition-transform after:origin-left"
            >
              {symbol}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 ml-0.5 p-0 inline-flex align-middle cursor-pointer"
              onClick={e => {
                e.stopPropagation();
                handleCopy(address, symbol);
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy {symbol} Address</p>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
});

TokenNameCopy.displayName = 'TokenNameCopy';

// Enhanced custom legend with performance optimization
const CustomLegend = memo<{
  chartData: ChartDataItem[];
  tokenMetadata?: Record<
    string,
    { assetAddress: string; name?: string; decimals?: number }
  >;
}>(({ chartData, tokenMetadata }) => {
  if (!chartData.length) return null;

  // Show top 4 tokens and aggregate the rest
  const top4 = chartData.slice(0, 4);
  const remaining = chartData.slice(4);
  const remainingCount = remaining.length;

  return (
    <div className="flex flex-col gap-4">
      {top4.map(({ name, value, originalSymbol }, i) => {
        const displayValue = Number.isFinite(value)
          ? formatPercentage(value)
          : '0.0';

        return (
          <div
            key={`legend-${name}-${i}`}
            className="flex items-center gap-3 min-w-[160px]"
          >
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{
                backgroundColor: TOKEN_COLORS[name] || TOKEN_COLORS.default,
              }}
            />

            <div className="min-w-[64px] flex flex-wrap text-card-foreground gap-x-1">
              <TokenNameCopy
                symbol={name}
                address={tokenMetadata?.[originalSymbol || name]?.assetAddress}
              />
            </div>

            <span className="text-sm text-muted-foreground ml-auto pl-4">
              {displayValue}%
            </span>
          </div>
        );
      })}

      {/* Show "+ (n) more" if there are more than 4 tokens */}
      {remainingCount > 0 && (
        <div className="flex items-center gap-3 min-w-[160px]">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{
              backgroundColor: '#d4d4d8', // Gray color for "more" indicator
            }}
          />

          <div className="min-w-[64px] flex flex-wrap text-card-foreground gap-x-1">
            <span className="text-sm font-medium text-muted-foreground">
              + ({remainingCount}) more
            </span>
          </div>

          <span className="text-sm text-muted-foreground ml-auto pl-4">
            {formatPercentage(
              remaining.reduce((sum, item) => sum + item.value, 0)
            )}
            %
          </span>
        </div>
      )}
    </div>
  );
});

CustomLegend.displayName = 'CustomLegend';

// Enhanced main chart component with comprehensive optimizations
export const MarketShareChart = memo<MarketShareChartProps>(
  ({
    data,
    totalSupply,
    tokenMetadata = {},
    susdePrice,
    showTotalInfo = true,
  }) => {
    const { isMobile, isDesktop } = useResponsive();
    const width = isDesktop ? 1024 : isMobile ? 320 : 768;

    console.log('[MarketShareChart] Props:', {
      totalSupply,
      susdePrice,
      showTotalInfo,
    });

    // Ultra-optimized stablecoin values calculation with batch processing and caching
    const tokenStableValues = useMemo(() => {
      return measurePerformance(() => {
        try {
          const values = data.map(token => {
            const supply = token.supply_raw || token.supply || '0';
            const supplyBigInt = BigInt(supply);

            // Check if token has 8 decimals (MOD, mUSD, USDA)
            const decimals =
              token.symbol === 'MOD' ||
              token.symbol === 'mUSD' ||
              token.symbol === 'USDA'
                ? 8
                : 6;
            const divisor = Math.pow(10, decimals);

            // Calculate USD value
            let usdValue = Number(supplyBigInt) / divisor;

            // Apply sUSDe price multiplier if needed
            if (token.symbol === 'sUSDe' && susdePrice && susdePrice > 0) {
              usdValue = usdValue * susdePrice;
            }

            return {
              symbol: token.symbol,
              usdValue,
            };
          });

          return values;
        } catch (error) {
          console.error('Error calculating token stable values:', error);
          return [];
        }
      }, 'tokenStableValues calculation');
    }, [data, susdePrice]);

    // Ultra-optimized supply chart data calculation
    const chartData = useMemo<ChartDataItem[]>(() => {
      if (!tokenStableValues.length) return [];

      return measurePerformance(() => {
        try {
          const result: ChartDataItem[] = [];
          const totalSupplyBigInt = BigInt(totalSupply);

          // Calculate total USD value for market share
          const totalUSDValue = tokenStableValues.reduce(
            (sum, item) => sum + item.usdValue,
            0
          );

          // First, create all token entries
          const allTokens: ChartDataItem[] = [];
          for (const item of tokenStableValues) {
            const token = data.find(t => t.symbol === item.symbol);
            if (!token) continue;

            // Calculate market share based on USD value
            const marketShare =
              totalUSDValue > 0 ? (item.usdValue / totalUSDValue) * 100 : 0;

            // Format supply display
            const formatSupply = (value: number) => {
              if (value >= 1_000_000_000)
                return `$${(value / 1_000_000_000).toFixed(1)}b`;
              if (value >= 1_000_000)
                return `$${(value / 1_000_000).toFixed(1)}m`;
              if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
              return `$${value.toFixed(0)}`;
            };

            allTokens.push({
              name: token.symbol,
              originalSymbol: token.symbol,
              value: marketShare,
              formattedSupply: formatSupply(item.usdValue),
              _usdValue: item.usdValue,
            });
          }

          // Sort by market share descending
          const sortedTokens = allTokens.sort((a, b) => b.value - a.value);

          // Group tokens: keep individual tokens until we reach ~85-90% cumulative, then group the rest as "Other"
          let cumulativePercentage = 0;
          const individualTokens: ChartDataItem[] = [];
          const otherTokens: ChartDataItem[] = [];

          for (const token of sortedTokens) {
            // Keep adding individual tokens until we reach 85% cumulative or have at least 3 tokens
            if (cumulativePercentage < 85 && individualTokens.length >= 3) {
              // If this token would make us exceed 90%, put it in "Other"
              if (cumulativePercentage + token.value > 90) {
                otherTokens.push(token);
              } else {
                individualTokens.push(token);
                cumulativePercentage += token.value;
              }
            } else if (individualTokens.length < 3) {
              // Always show at least top 3 tokens individually
              individualTokens.push(token);
              cumulativePercentage += token.value;
            } else {
              otherTokens.push(token);
            }
          }

          // Add individual tokens to result
          result.push(...individualTokens);

          // If we have tokens for "Other" category, combine them
          if (otherTokens.length > 0) {
            const otherValue = otherTokens.reduce(
              (sum, token) => sum + token.value,
              0
            );
            const otherUsdValue = otherTokens.reduce(
              (sum, token) => sum + (token._usdValue || 0),
              0
            );

            // Format supply display for Other category
            const formatSupply = (value: number) => {
              if (value >= 1_000_000_000)
                return `$${(value / 1_000_000_000).toFixed(1)}b`;
              if (value >= 1_000_000)
                return `$${(value / 1_000_000).toFixed(1)}m`;
              if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
              return `$${value.toFixed(0)}`;
            };

            result.push({
              name: 'Other',
              originalSymbol: 'Other',
              value: otherValue,
              formattedSupply: formatSupply(otherUsdValue),
              _usdValue: otherUsdValue,
              components: otherTokens.map(token => ({
                symbol: token.originalSymbol || token.name,
                supply: (token._usdValue || 0).toString(),
                supply_raw: ((token._usdValue || 0) * 1_000_000).toString(),
                formattedSupply: token.formattedSupply,
              })),
            });
          }

          return result;
        } catch (error) {
          console.error('Error processing chart data:', error);
          return [];
        }
      }, 'chartData calculation');
    }, [data, tokenStableValues, totalSupply]);

    // Optimized chart configuration with memoization
    const chartConfig = useMemo(
      () => ({
        innerRadius: isMobile
          ? CHART_DIMENSIONS.mobile.innerRadius
          : CHART_DIMENSIONS.desktop.innerRadius,
        outerRadius: isMobile
          ? CHART_DIMENSIONS.mobile.outerRadius
          : CHART_DIMENSIONS.desktop.outerRadius,
        size: isMobile ? 'w-56 h-56' : 'w-80 h-80',
      }),
      [isMobile]
    );

    // Memoized color getter for cells
    const getCellColor = useCallback((entry: ChartDataItem) => {
      if (entry.name === 'Other') {
        return '#d4d4d8'; // Gray color for "Other" category
      }
      return TOKEN_COLORS[entry.name] || TOKEN_COLORS.default;
    }, []);

    // Calculate total USD for display
    const totalUSD = useMemo(() => {
      return tokenStableValues.reduce((sum, item) => sum + item.usdValue, 0);
    }, [tokenStableValues]);

    // Error boundary fallback
    if (!chartData.length) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div className="text-center p-8">
            <p className="text-muted-foreground">No data available for chart</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        {/* Total supply info in top right corner - only show on desktop or when explicitly enabled */}
        {totalUSD && (showTotalInfo || !isMobile) && (
          <div className="absolute top-4 right-4 z-10 hidden md:block">
            <div>
              <div className="flex items-center justify-end gap-3 mb-1">
                <h2 className="text-sm text-muted-foreground">Total Supply</h2>
              </div>
              <p className="text-lg font-bold font-mono text-right">
                {formatCurrency(totalUSD, 'USD', { decimals: 0 })}
              </p>
            </div>
          </div>
        )}

        <div
          className={`flex items-center justify-center w-full h-full ${isMobile ? 'p-4' : 'p-6'}`}
        >
          <div
            className={`flex ${isMobile ? 'flex-col items-center gap-6' : 'flex-row items-center justify-center gap-12 w-full max-w-5xl'}`}
          >
            <div className={chartConfig.size}>
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
                    {chartData.map((entry, i) => (
                      <Cell
                        key={`cell-${entry.name}-${i}`}
                        fill={getCellColor(entry)}
                        className="stroke-background hover:opacity-90 transition-opacity"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {!isMobile && (
              <div className="flex flex-col justify-center">
                <CustomLegend
                  chartData={chartData}
                  tokenMetadata={tokenMetadata}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

MarketShareChart.displayName = 'MarketShareChart';
