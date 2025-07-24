import { Copy } from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useMemo, memo } from 'react';

import { logger } from '@/lib/utils/logger';
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
import { Token } from '@/lib/config';
import { BTC_COLORS } from '@/lib/constants/ui/colors';
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
  totalBTC?: number;
  totalUSD?: number;
  showTotalInfo?: boolean;
}

// Chart configuration constants
const CHART_DIMENSIONS = {
  mobile: { innerRadius: '54%', outerRadius: '95%' },
  desktop: { innerRadius: '63%', outerRadius: '99%' },
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
          <p className="text-muted-foreground font-mono">
            Value: {formatCurrency(_usdValue, 'USD', { decimals: 0 })}
          </p>
        )}
      </div>
    );
  } catch (error) {
    logger.error('Error rendering tooltip:', error);
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
      logger.error('Failed to copy to clipboard:', error);
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
  ({
    data,
    tokenMetadata = {},
    bitcoinPrice,
    totalBTC,
    totalUSD,
    showTotalInfo = true,
  }) => {
    const { isMobile, isDesktop } = useResponsive();

    logger.log('[MarketShareChart] Props:', {
      totalBTC,
      totalUSD,
      bitcoinPrice,
      showTotalInfo,
    });

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
          logger.error('Error calculating token BTC values:', error);
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
          logger.error('Error processing chart data:', error);
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
        size: isMobile ? 'w-56 h-56' : 'w-80 h-80',
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
      <div className="relative w-full h-full">
        {/* Total and BTC info in top right corner - only show on desktop or when explicitly enabled */}
        {(totalBTC || bitcoinPrice) && (showTotalInfo || !isMobile) && (
          <div className="absolute top-4 right-4 z-10 hidden md:block">
            {totalBTC && (
              <div>
                <div className="flex items-center justify-end gap-3 mb-1">
                  <h2 className="text-sm text-muted-foreground">
                    Total Supply
                  </h2>
                  {bitcoinPrice && (
                    <div className="flex items-center gap-1.5">
                      <Image
                        src="/icons/btc/bitcoin.png"
                        alt="Bitcoin"
                        width={16}
                        height={16}
                        className="object-contain"
                        onError={e => {
                          const img = e.target as HTMLImageElement;
                          img.src = '/placeholder.jpg';
                        }}
                      />
                      <span className="text-sm text-muted-foreground font-mono">
                        {formatCurrency(bitcoinPrice, 'USD', { decimals: 0 })}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-lg font-bold font-mono text-right">
                  {formatBTCAmount(totalBTC)}
                  {totalUSD && (
                    <span className="text-sm font-normal text-muted-foreground ml-2 font-mono">
                      ≈ {formatCurrency(totalUSD, 'USD', { decimals: 0 })}
                    </span>
                  )}
                </p>
              </div>
            )}
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

            <div className="flex flex-col justify-center">
              <CustomLegend
                chartData={chartData}
                tokenMetadata={tokenMetadata}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MarketShareChart.displayName = 'MarketShareChart';
