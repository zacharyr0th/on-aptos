'use client';

import React, { useCallback, useMemo } from 'react';
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
import { Token, LST_COLORS } from '@/lib/config';
import { convertRawTokenAmount } from '@/lib/utils';

export interface MarketShareChartProps {
  data: Token[];
  totalSupply: string;
  tokenMetadata?: Record<
    string,
    { assetAddress: string; name?: string; decimals?: number }
  >;
}

interface ChartDataItem {
  name: string;
  value: number;
  formattedSupply: string;
  _aptValue: number;
  originalSymbol?: string;
  components?: Token[] | undefined;
}

// Use the centralized LST_COLORS from config
export const TOKEN_COLORS = LST_COLORS;

const CHART_DIMENSIONS = {
  mobile: { innerRadius: '54%', outerRadius: '95%' },
  desktop: { innerRadius: '63%', outerRadius: '99%' },
};

const BREAKPOINTS = { mobile: 640, desktop: 1024 };

const formatAPTAmount = (value: number): string =>
  `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// Calculate market share based on actual APT value, not raw token amounts with decimals
const calculateMarketShare = (
  aptValue: number,
  allTokens: { aptValue: number }[]
): number => {
  const totalAptValue = allTokens.reduce(
    (sum, token) => sum + token.aptValue,
    0
  );
  if (totalAptValue === 0) return 0;
  return (aptValue / totalAptValue) * 100;
};

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
}) => {
  if (!active || !payload?.length) return null;

  const { name, value, formattedSupply } = payload[0].payload as ChartDataItem;

  // Format percentage - use 1 decimal place for values ≥ 0.1%, otherwise use 2 places
  const formattedPercentage =
    value >= 0.1 ? value.toFixed(1) : value.toFixed(2);

  return (
    <div
      className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 z-10 text-sm space-y-1"
      role="tooltip"
    >
      <p className="font-semibold text-popover-foreground">{name}</p>
      <p className="text-muted-foreground">
        Market Share: {formattedPercentage}%
      </p>
      <div className="flex items-center text-muted-foreground">
        <span>Supply: {formattedSupply}</span>
      </div>
    </div>
  );
};

// Component for rendering a copyable token name
const TokenNameCopy: React.FC<{
  symbol: string;
  address?: string;
}> = ({ symbol, address }) => {
  const handleCopy = useCallback((text: string, label: string) => {
    if (!text) return;

    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} address to clipboard`);
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
};

const CustomLegend: React.FC<{
  chartData: ChartDataItem[];
  tokenMetadata?: Record<
    string,
    { assetAddress: string; name?: string; decimals?: number }
  >;
}> = ({ chartData, tokenMetadata }) => {
  if (!chartData.length) return null;

  return (
    <div className="flex flex-col gap-4">
      {chartData.map(
        ({ name, value, originalSymbol, _aptValue, components }, i) => {
          // Format percentage - use 1 decimal place for values ≥ 0.1%, otherwise use 2 places
          const formattedPercentage =
            value >= 0.1 ? value.toFixed(1) : value.toFixed(2);

          const normalizedName = name.replace(' / ', '/'); // Normalize for colors

          return (
            <div
              key={`legend-${i}`}
              className="flex items-center gap-3 min-w-[160px]"
            >
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{
                  backgroundColor:
                    TOKEN_COLORS[normalizedName] || TOKEN_COLORS.default,
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
        }
      )}
    </div>
  );
};

export const MarketShareChart = React.memo(function MarketShareChart({
  data,
  tokenMetadata = {},
}: MarketShareChartProps): React.ReactElement {
  const { isMobile, isDesktop } = useResponsive();
  const width = isDesktop ? 1024 : isMobile ? 320 : 768;

  // First pass to calculate APT values for all tokens
  const tokenAptValues = useMemo(() => {
    return data.map(token => {
      const decimals = tokenMetadata[token.symbol]?.decimals || 8;
      return {
        symbol: token.symbol,
        aptValue: convertRawTokenAmount(token.supply, decimals),
      };
    });
  }, [data, tokenMetadata]);

  const chartData = useMemo<ChartDataItem[]>(() => {
    if (!tokenAptValues.length) return [];

    const result = tokenAptValues.map(item => {
      const token = data.find(t => t.symbol === item.symbol)!;

      // Preserve original symbol for metadata lookup
      const originalSymbol = token.symbol;

      // Check if this is a combined token (safely type cast)
      const components =
        'components' in token
          ? (token.components as Token[] | undefined)
          : undefined;

      return {
        name: token.symbol,
        originalSymbol,
        value: calculateMarketShare(item.aptValue, tokenAptValues),
        formattedSupply: formatAPTAmount(item.aptValue),
        _aptValue: item.aptValue,
        components,
      };
    });

    // Sort by APT value in descending order - ensures highest quantity is displayed most prominently
    return result.sort((a, b) => b._aptValue - a._aptValue);
  }, [data, tokenAptValues]);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex items-center">
        <div className={isMobile ? 'w-56 h-56' : 'w-64 h-64'}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={
                  isMobile
                    ? CHART_DIMENSIONS.mobile.innerRadius
                    : CHART_DIMENSIONS.desktop.innerRadius
                }
                outerRadius={
                  isMobile
                    ? CHART_DIMENSIONS.mobile.outerRadius
                    : CHART_DIMENSIONS.desktop.outerRadius
                }
                paddingAngle={4}
                dataKey="value"
                startAngle={90}
                endAngle={450}
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={TOKEN_COLORS[entry.name] || TOKEN_COLORS.default}
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
            <CustomLegend chartData={chartData} tokenMetadata={tokenMetadata} />
          </div>
        )}
      </div>
    </div>
  );
});
