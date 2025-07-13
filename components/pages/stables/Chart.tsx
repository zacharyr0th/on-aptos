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
    const { name, value, formattedSupply, components } = data;

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
        
        {/* Show individual tokens if this is the "Other" category */}
        {name === 'Other' && components && components.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Includes:</p>
            {components.map((component: any, index: number) => (
              <p key={index} className="text-xs text-muted-foreground ml-2">
                {component.symbol}: {component.formattedSupply || `$${Number(component.supply).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
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
          
          console.log('Chart totalSupply:', totalSupply, 'as BigInt:', totalSupplyBigInt.toString());

          for (const token of data) {
            // Skip tokens with 0 supply for chart display
            if (token.supply === '0') continue;
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

              // Calculate USD value properly for combined tokens
              let combinedUsdValue = 0;
              for (const component of token.components) {
                const componentSupply = BigInt(component.supply_raw || component.supply);
                const componentDecimals = (component.symbol === 'MOD' || component.symbol === 'mUSD') ? 8 : 6;
                const componentDivisor = Math.pow(10, componentDecimals);
                combinedUsdValue += Number(componentSupply) / componentDivisor;
              }

              const marketShare = calculateMarketShare(combinedSupply, totalSupplyBigInt);
              console.log(`Chart ${token.symbol}: combinedSupply=${combinedSupply.toString()}, marketShare=${marketShare}%`);
              
              result.push({
                name: token.symbol,
                originalSymbol: token.symbol,
                value: marketShare,
                formattedSupply,
                _usdValue: combinedUsdValue,
                components: token.components,
              });
            } else {
              // Handle regular tokens
              const supply = BigInt(token.supply_raw || token.supply || '0');
              const applyPrice =
                token.symbol === 'sUSDe' ? susdePrice : undefined;
              
              // Check if token has 8 decimals (MOD, mUSD)
              const decimals = (token.symbol === 'MOD' || token.symbol === 'mUSD') ? 8 : 6;
              const divisor = Math.pow(10, decimals);
              
              // Format supply based on correct decimals
              const dollarValue = Number(supply) / divisor;
              let formattedSupply: string;
              
              if (applyPrice && token.symbol === 'sUSDe') {
                const adjustedValue = dollarValue * applyPrice;
                if (adjustedValue >= 1_000_000_000) {
                  formattedSupply = `$${(adjustedValue / 1_000_000_000).toFixed(1)}b`;
                } else if (adjustedValue >= 1_000_000) {
                  formattedSupply = `$${(adjustedValue / 1_000_000).toFixed(1)}m`;
                } else if (adjustedValue >= 1_000) {
                  formattedSupply = `$${(adjustedValue / 1_000).toFixed(1)}k`;
                } else {
                  formattedSupply = `$${adjustedValue.toFixed(0)}`;
                }
              } else {
                if (dollarValue >= 1_000_000_000) {
                  formattedSupply = `$${(dollarValue / 1_000_000_000).toFixed(1)}b`;
                } else if (dollarValue >= 1_000_000) {
                  formattedSupply = `$${(dollarValue / 1_000_000).toFixed(1)}m`;
                } else if (dollarValue >= 1_000) {
                  formattedSupply = `$${(dollarValue / 1_000).toFixed(1)}k`;
                } else {
                  formattedSupply = `$${dollarValue.toFixed(0)}`;
                }
              }

              const marketShare = calculateMarketShare(supply, totalSupplyBigInt);
              console.log(`Chart ${token.symbol}: supply=${supply.toString()}, marketShare=${marketShare}%`);
              
              result.push({
                name: token.symbol,
                originalSymbol: token.symbol,
                value: marketShare,
                formattedSupply,
                _usdValue: dollarValue,
              });
            }
          }

          // Sort by market share descending
          const sorted = result.sort((a, b) => b.value - a.value);

          // Group small tokens into "Other" category
          const threshold = 5; // 5% threshold
          let cumulativePercentage = 0;
          const finalResult: typeof result = [];
          const otherTokens: typeof result = [];

          for (const token of sorted) {
            // Keep adding tokens to main result until we reach ~95%
            if (cumulativePercentage <= 95 || finalResult.length < 3) {
              // Always show at least top 3 tokens
              finalResult.push(token);
              cumulativePercentage += token.value;
            } else {
              otherTokens.push(token);
            }
          }

          // If we have tokens for "Other" category, combine them
          if (otherTokens.length > 0) {
            const otherValue = otherTokens.reduce((sum, token) => sum + token.value, 0);
            const otherUsdValue = otherTokens.reduce((sum, token) => sum + token._usdValue, 0);
            
            finalResult.push({
              name: 'Other',
              originalSymbol: 'Other',
              value: otherValue,
              formattedSupply: `$${(otherUsdValue).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
              _usdValue: otherUsdValue,
              components: otherTokens.map(token => ({
                symbol: token.originalSymbol,
                supply: token._usdValue.toString(),
                supply_raw: (token._usdValue * 1_000_000).toString(),
                formattedSupply: token.formattedSupply,
              })),
            });
          }

          // Cache the result
          processingRef.current.lastDataHash = dataHash;
          processingRef.current.lastResult = finalResult;

          return finalResult;
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
      } else if (entry.name === 'Other') {
        return '#d4d4d8'; // Pastel gray for "Other" category
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

          </div>
        </div>
      </div>
    );
  }
);

MarketShareChart.displayName = 'MarketShareChart';
