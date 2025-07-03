import React, { useCallback, useMemo, memo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  TooltipProps,
} from 'recharts';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useResponsive } from '@/hooks/useResponsive';
import { Button } from '@/components/ui/button';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BTC_COLORS, Token } from '@/lib/config';
import { formatCurrency } from '@/lib/utils';
import {
  formatBTCAmount,
  formatPercentage,
  ChartDataItem,
  calculateMarketShare,
  batchConvertBTCAmounts,
  measurePerformance,
} from './types';

// Re-export token colors for backward compatibility
export const TOKEN_COLORS = BTC_COLORS;

// Enhanced props interface with better typing
export interface MarketShareChartProps {
  data: Token[];
  tokenMetadata?: Record<
    string,
    { assetAddress: string; name?: string; decimals?: number }
  >;
  bitcoinPrice?: number;
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
    const { name, value, formattedSupply, _usdValue } = data;

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
          <p className="text-muted-foreground">
            Value: {formatCurrency(_usdValue, 'USD')}
          </p>
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

  return (
    <div className="flex flex-col gap-4">
      {chartData.map(({ name, value, originalSymbol }, i) => {
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
    </div>
  );
});

CustomLegend.displayName = 'CustomLegend';

// Enhanced main chart component with comprehensive optimizations
export const MarketShareChart = memo<MarketShareChartProps>(
  ({ data, tokenMetadata = {}, bitcoinPrice }) => {
    const { isMobile, isDesktop } = useResponsive();
    const width = isDesktop ? 1024 : isMobile ? 320 : 768;

    // Ultra-optimized BTC values calculation with batch processing and caching
    const tokenBtcValues = useMemo(() => {
      return measurePerformance(() => {
        try {
          // Use batch processing for better performance
          const batchItems = data.map(token => ({
            supply: token.supply,
            decimals: tokenMetadata[token.symbol]?.decimals || 8,
            symbol: token.symbol,
          }));

          const results = batchConvertBTCAmounts(batchItems, bitcoinPrice);

          const values = results.map((result, index) => ({
            symbol: batchItems[index].symbol,
            btcValue: result.btcValue,
          }));

          return values;
        } catch (error) {
          console.error('Error calculating token BTC values:', error);
          return [];
        }
      }, 'tokenBtcValues calculation');
    }, [data, tokenMetadata, bitcoinPrice]);

    // Ultra-optimized supply chart data calculation
    const chartData = useMemo<ChartDataItem[]>(() => {
      if (!tokenBtcValues.length) return [];

      return measurePerformance(() => {
        try {
          const result: ChartDataItem[] = [];

          // Pre-calculate total for all tokens for market share calculation
          const allTokensForShare = tokenBtcValues.map(item => ({
            btcValue: item.btcValue,
          }));

          for (const item of tokenBtcValues) {
            const token = data.find(t => t.symbol === item.symbol);
            if (!token) continue;

            const usdValue =
              bitcoinPrice && Number.isFinite(bitcoinPrice)
                ? item.btcValue * bitcoinPrice
                : undefined;

            result.push({
              name: token.symbol,
              originalSymbol: token.symbol,
              value: calculateMarketShare(item.btcValue, allTokensForShare),
              formattedSupply: formatBTCAmount(item.btcValue),
              _btcValue: item.btcValue,
              _usdValue: usdValue,
            });
          }

          return result.sort((a, b) => b._btcValue - a._btcValue);
        } catch (error) {
          console.error('Error processing chart data:', error);
          return [];
        }
      }, 'chartData calculation');
    }, [data, tokenBtcValues, bitcoinPrice]);

    // Optimized chart configuration with memoization
    const chartConfig = useMemo(
      () => ({
        innerRadius: isMobile
          ? CHART_DIMENSIONS.mobile.innerRadius
          : CHART_DIMENSIONS.desktop.innerRadius,
        outerRadius: isMobile
          ? CHART_DIMENSIONS.mobile.outerRadius
          : CHART_DIMENSIONS.desktop.outerRadius,
        size: isMobile ? 'w-56 h-56' : 'w-64 h-64',
      }),
      [isMobile]
    );

    // Memoized color getter for cells
    const getCellColor = useCallback((entry: ChartDataItem) => {
      return TOKEN_COLORS[entry.name] || TOKEN_COLORS.default;
    }, []);

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
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="w-full h-full relative">
          <div className="flex items-center justify-center h-full">
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
                  {!isMobile && (
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                  )}
                </PieChart>
              </ResponsiveContainer>
            </div>

            {isDesktop && (
              <div className="ml-12">
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
