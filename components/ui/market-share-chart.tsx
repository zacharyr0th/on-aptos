import { Copy } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useMemo, memo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  TooltipProps,
} from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useResponsive } from "@/hooks/useResponsive";
import { formatCurrency } from "@/lib/utils";
import { logger } from "@/lib/utils/core/logger";
import {
  ChartDataItem,
  formatPercentage,
  formatAssetValue,
  calculateMarketShare,
  groupSmallItems,
  measurePerformance,
  CHART_DIMENSIONS,
} from "@/lib/utils/format/chart-utils";
import { copyToClipboard, getTokenLogoUrlSync } from "@/lib/utils/token/token-utils";

// Generic asset data interface
export interface AssetData {
  symbol: string;
  supply: string;
  supply_raw?: string;
  decimals?: number;
  [key: string]: unknown;
}

// Enhanced props interface with asset type support
export interface MarketShareChartProps {
  data: AssetData[];
  totalSupply?: string | number;
  totalUSD?: number;
  totalBTC?: number;
  assetType: "stablecoins" | "btc" | "rwas";
  tokenMetadata?: Record<
    string,
    { assetAddress: string; name?: string; decimals?: number }
  >;
  colorMap: Record<string, string>;
  priceMultiplier?: number; // For BTC price or sUSDe price
  showTotalInfo?: boolean;
  centerLabel?: string;
  additionalInfo?: React.ReactNode; // For custom info display (like BTC price)
}

// Optimized custom tooltip with memoization
const CustomTooltip = memo<TooltipProps<number, string>>((props) => {
  const { active, payload } = props as any;
  const { isMobile } = useResponsive();
  if (!active || !payload?.length) return null;

  try {
    const data = payload[0].payload as ChartDataItem;
    const { name, value, formattedSupply, _usdValue, _btcValue } = data;

    return (
      <div
        className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 text-sm space-y-1"
        role="tooltip"
      >
        <p className="font-semibold text-popover-foreground">{name}</p>
        <p className="text-muted-foreground">
          Market Share: {formatPercentage(value)}%
        </p>
        <p className="text-muted-foreground">Supply: {formattedSupply}</p>
        {_usdValue && (
          <p className="text-muted-foreground font-mono">
            Value: {formatCurrency(_usdValue, "USD", { decimals: 0 })}
          </p>
        )}
        {_btcValue && (
          <p className="text-muted-foreground font-mono">
            BTC Value: {_btcValue.toFixed(6)} BTC
          </p>
        )}
      </div>
    );
  } catch (error) {
    logger.error(
      `Error rendering tooltip: ${error instanceof Error ? error.message : String(error)}`
    );
    return (
      <div className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 text-sm">
        <p className="text-destructive">Error displaying data</p>
      </div>
    );
  }
});

CustomTooltip.displayName = "CustomTooltip";

// Enhanced token name copy component
const TokenNameCopy = memo<{
  symbol: string;
  address?: string;
}>(({ symbol, address }) => {
  const handleCopy = useCallback(async (text: string, label: string) => {
    if (!text) return;
    await copyToClipboard(text, label);
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
              onClick={(e) => {
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

TokenNameCopy.displayName = "TokenNameCopy";

// Enhanced custom legend with performance optimization
const CustomLegend = memo<{
  chartData: ChartDataItem[];
  tokenMetadata?: Record<
    string,
    { assetAddress: string; name?: string; decimals?: number }
  >;
  colorMap: Record<string, string>;
}>(({ chartData, tokenMetadata, colorMap }) => {
  if (!chartData.length) return null;

  // Show all items if 4 or fewer, otherwise show top 3 + "others"
  const shouldShowAll = chartData.length <= 4;
  const itemsToShow = shouldShowAll ? chartData : chartData.slice(0, 3);
  const remaining = shouldShowAll ? [] : chartData.slice(3);
  const remainingCount = remaining.length;

  return (
    <div className="flex flex-col gap-4">
      {itemsToShow.map(({ name, value, originalSymbol }, i) => {
        const displayValue = Number.isFinite(value) ? value.toFixed(2) : "0.00";
        const color = colorMap[name] || colorMap.default || "#6b7280";

        return (
          <div key={`legend-${name}-${i}`} className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="min-w-[64px] flex flex-wrap text-card-foreground gap-x-1">
              <TokenNameCopy
                symbol={name}
                address={tokenMetadata?.[originalSymbol || name]?.assetAddress}
              />
            </div>
            <span className="text-sm text-muted-foreground ml-auto pl-2">
              {displayValue}%
            </span>
          </div>
        );
      })}

      {/* Show "+ (n) more" if there are more than 4 tokens */}
      {remainingCount > 0 && (
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: "hsl(240 5% 84%)" }}
          />
          <div className="min-w-[64px] flex flex-wrap text-card-foreground gap-x-1">
            <span className="text-sm font-medium text-muted-foreground">
              + ({remainingCount}) more
            </span>
          </div>
          <span className="text-sm text-muted-foreground ml-auto pl-2">
            {remaining.reduce((sum, item) => sum + item.value, 0).toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
});

CustomLegend.displayName = "CustomLegend";

// Main chart component
export const MarketShareChart = memo<MarketShareChartProps>(
  ({
    data,
    totalSupply,
    totalUSD,
    totalBTC,
    assetType,
    tokenMetadata = {},
    colorMap,
    priceMultiplier,
    showTotalInfo = true,
    centerLabel,
    additionalInfo,
  }) => {
    const { isMobile } = useResponsive();

    // Process data based on asset type
    const chartData = useMemo<ChartDataItem[]>(() => {
      return measurePerformance(() => {
        try {
          if (!data.length) return [];

          const processedData: ChartDataItem[] = data.map((asset) => {
            const supply = asset.supply_raw || asset.supply || "0";
            const supplyNum = Number(BigInt(supply)) / Math.pow(10, asset.decimals || 6);
            
            let usdValue = supplyNum;
            let btcValue: number | undefined;

            // Apply price multipliers based on asset type
            if (assetType === "btc" && priceMultiplier) {
              btcValue = supplyNum;
              usdValue = supplyNum * priceMultiplier;
            } else if (assetType === "stablecoins" && asset.symbol === "sUSDe" && priceMultiplier) {
              usdValue = supplyNum * priceMultiplier;
            }

            // Calculate market share
            const totalValue = totalUSD || (totalBTC ? totalBTC * (priceMultiplier || 1) : 0) || 
                              data.reduce((sum, item) => {
                                const itemSupply = Number(BigInt(item.supply_raw || item.supply || "0")) / Math.pow(10, item.decimals || 6);
                                return sum + itemSupply;
                              }, 0);

            const marketShare = calculateMarketShare(usdValue, totalValue);

            return {
              name: asset.symbol,
              originalSymbol: asset.symbol,
              value: marketShare,
              formattedSupply: formatAssetValue(usdValue, assetType === "btc" ? "BTC" : "USD"),
              _usdValue: assetType !== "btc" ? usdValue : undefined,
              _btcValue: btcValue,
            };
          });

          // Sort by value and group small items
          const sortedData = processedData.sort((a, b) => b.value - a.value);
          return groupSmallItems(sortedData, 1.0, colorMap.Other || "hsl(240 5% 45%)");
        } catch (error) {
          logger.error(`Error processing chart data: ${error instanceof Error ? error.message : String(error)}`);
          return [];
        }
      }, "chartData calculation");
    }, [data, totalSupply, totalUSD, totalBTC, assetType, priceMultiplier]);

    // Chart configuration
    const chartConfig = useMemo(
      () => ({
        innerRadius: isMobile
          ? CHART_DIMENSIONS.mobile.innerRadius
          : CHART_DIMENSIONS.desktop.innerRadius,
        outerRadius: isMobile
          ? CHART_DIMENSIONS.mobile.outerRadius
          : CHART_DIMENSIONS.desktop.outerRadius,
        size: isMobile ? "w-56 h-56" : "w-80 h-80",
      }),
      [isMobile]
    );

    // Memoized color getter for cells
    const getCellColor = useCallback(
      (entry: ChartDataItem) => {
        return entry.color || colorMap[entry.name] || colorMap.default || "#6b7280";
      },
      [colorMap]
    );

    // Calculate center display value
    const centerValue = useMemo(() => {
      if (centerLabel) return centerLabel;
      if (totalUSD) return formatAssetValue(totalUSD, "USD");
      if (totalBTC && priceMultiplier) return formatAssetValue(totalBTC * priceMultiplier, "USD");
      if (totalBTC) return formatAssetValue(totalBTC, "BTC");
      return "$0";
    }, [centerLabel, totalUSD, totalBTC, priceMultiplier]);

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
        {/* Total info in top right corner */}
        {(totalUSD || totalBTC) && (showTotalInfo || !isMobile) && (
          <div className="absolute top-4 right-4 z-10 hidden md:block">
            <div>
              <div className="flex items-center justify-end gap-3 mb-1">
                <h2 className="text-sm text-muted-foreground">Total Supply</h2>
                {additionalInfo}
              </div>
              <p className="text-lg font-bold font-mono text-right">
                {centerValue}
              </p>
            </div>
          </div>
        )}

        <div
          className={`flex items-center justify-center w-full h-full ${isMobile ? "p-4" : "p-6"}`}
        >
          <div
            className={`flex ${isMobile ? "flex-col items-center gap-6" : "flex-row items-center justify-center gap-12 w-full max-w-5xl"}`}
          >
            <div className={`${chartConfig.size} flex-shrink-0 relative`}>
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
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={false}
                    wrapperStyle={{ zIndex: 1000 }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center value */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div
                    className={`font-bold ${isMobile ? "text-xl" : "text-2xl sm:text-3xl lg:text-4xl"}`}
                  >
                    {centerValue}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`flex flex-col justify-center ${isMobile ? "w-full" : "w-64 flex-shrink-0"}`}
            >
              <CustomLegend
                chartData={chartData}
                tokenMetadata={tokenMetadata}
                colorMap={colorMap}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MarketShareChart.displayName = "MarketShareChart";