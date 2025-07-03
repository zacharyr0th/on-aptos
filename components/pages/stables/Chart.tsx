import React, { useCallback, useMemo, memo, useRef } from 'react';
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
import { STABLECOIN_COLORS, DisplayToken } from '@/lib/config';
import {
  formatPercentage,
  formatUSDValue,
  calculateMarketShare,
  measurePerformance,
  ChartDataItem,
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
    const { name, value, formattedSupply } = data;

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
      {chartData.map(({ name, value, originalSymbol, components }, i) => {
        // Fix color mapping - use consistent normalization
        let colorKey = name;
        if (name === 'sUSDe/USDe') {
          colorKey = 'USDe'; // Map combined token to USDe color
        }

        // Format percentage with performance optimizations
        const formattedPercentage = formatPercentage(value);

        return (
          <div
            key={`legend-${name}-${i}`}
            className="flex items-center gap-3 min-w-[160px]"
          >
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{
                backgroundColor: TOKEN_COLORS[colorKey] || TOKEN_COLORS.default,
              }}
            />

            <div className="min-w-[64px] flex flex-wrap text-card-foreground gap-x-1">
              {components && components.length > 1 ? (
                // For combined tokens, show each component completely separately
                <>
                  {components.map((component, idx) => {
                    // Get metadata specifically for this individual token
                    const address =
                      tokenMetadata?.[component.symbol]?.assetAddress;

                    return (
                      <React.Fragment key={component.symbol}>
                        <TokenNameCopy
                          symbol={component.symbol}
                          address={address}
                        />
                        {idx < components.length - 1 && (
                          <span className="text-muted-foreground mx-0.5 select-none">
                            /
                          </span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              ) : (
                // For regular tokens
                <TokenNameCopy
                  symbol={name}
                  address={
                    tokenMetadata?.[originalSymbol || name]?.assetAddress
                  }
                />
              )}
            </div>

            <span className="text-sm text-muted-foreground ml-auto pl-4">
              {formattedPercentage}%
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
  ({ data, totalSupply, tokenMetadata = {}, susdePrice }) => {
    const { isMobile, isDesktop } = useResponsive();
    const width = isDesktop ? 1024 : isMobile ? 320 : 768;
    const processingRef = useRef({
      lastDataHash: '',
      lastResult: null as ChartDataItem[] | null,
    });

    // Ultra-optimized chart data calculation with batch processing and caching
    const chartData = useMemo<ChartDataItem[]>(() => {
      return measurePerformance(() => {
        try {
          // Create hash of input data for cache invalidation
          const dataHash = JSON.stringify({ data, totalSupply, susdePrice });
          if (
            processingRef.current.lastDataHash === dataHash &&
            processingRef.current.lastResult
          ) {
            return processingRef.current.lastResult;
          }

          const totalSupplyBigInt = BigInt(totalSupply);
          const result: ChartDataItem[] = [];

          for (const token of data) {
            // Handle combined tokens (like sUSDe/USDe)
            if ('isCombined' in token && token.isCombined && token.components) {
              const combinedSupply = token.components.reduce(
                (sum, component) =>
                  sum + BigInt(component.supply_raw || component.supply),
                0n
              );

              // Format supply with sUSDe price for combined tokens containing sUSDe
              const hasSUSDe = token.components.some(c => c.symbol === 'sUSDe');
              const formattedSupply = formatUSDValue(
                combinedSupply,
                hasSUSDe ? susdePrice : undefined
              );

              result.push({
                name: token.symbol,
                originalSymbol: token.symbol,
                value: calculateMarketShare(combinedSupply, totalSupplyBigInt),
                formattedSupply,
                _usdValue: Number(combinedSupply) / 1_000_000,
                components: token.components,
              });
            } else {
              // Handle regular tokens
              const supply = BigInt(token.supply_raw || token.supply || '0');
              const applyPrice =
                token.symbol === 'sUSDe' ? susdePrice : undefined;
              const formattedSupply = formatUSDValue(supply, applyPrice);

              result.push({
                name: token.symbol,
                originalSymbol: token.symbol,
                value: calculateMarketShare(supply, totalSupplyBigInt),
                formattedSupply,
                _usdValue: Number(supply) / 1_000_000,
              });
            }
          }

          // Sort by market share descending
          const sorted = result.sort((a, b) => b.value - a.value);

          // Cache the result
          processingRef.current.lastDataHash = dataHash;
          processingRef.current.lastResult = sorted;

          return sorted;
        } catch (error) {
          console.error('Error processing chart data:', error);
          return [];
        }
      }, 'chartData calculation');
    }, [data, totalSupply, susdePrice]);

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
      let colorKey = entry.name;
      if (entry.name === 'sUSDe/USDe') {
        colorKey = 'USDe'; // Map combined token to USDe color
      }
      return TOKEN_COLORS[colorKey] || TOKEN_COLORS.default;
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
