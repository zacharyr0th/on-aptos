import React, { useMemo, memo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  TooltipProps,
} from "recharts";

import { useResponsive } from "@/hooks/useResponsive";
import { RWA_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { logger, errorLogger } from "@/lib/utils/logger";

// Function to darken a hex color based on TVL ranking (higher TVL = darker)
const darkenColor = (hexColor: string, darkenFactor: number): string => {
  // Remove # if present
  const color = hexColor.replace("#", "");

  // Parse RGB values
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Apply darkening factor (0 = no change, 1 = completely black)
  const newR = Math.round(r * (1 - darkenFactor));
  const newG = Math.round(g * (1 - darkenFactor));
  const newB = Math.round(b * (1 - darkenFactor));

  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

// Chart data interfaces
interface ProviderDataItem {
  name: string;
  value: number;
  formattedValue: string;
  color: string;
}

interface AssetDataItem {
  name: string;
  value: number;
  formattedValue: string;
  color: string;
  provider: string;
}

// Protocol data interface
interface ProtocolData {
  id: string;
  name: string;
  logoUrl?: string;
  totalValue: number;
  description: string;
  tokenAddress: string;
  assetTicker: string;
  assetClass: string;
  protocol: string;
}

// Enhanced props interface
export interface MarketShareChartProps {
  data: ProtocolData[];
  totalValue: number;
}

// Format percentage with consistent precision
const formatPercentage = (value: number): string => {
  if (!Number.isFinite(value)) return "0.0";
  return value >= 0.1 ? value.toFixed(1) : value.toFixed(2);
};

// Calculate market share
const calculateMarketShare = (
  tokenValue: number,
  totalValue: number,
): number => {
  if (totalValue === 0 || !Number.isFinite(tokenValue)) return 0;
  return (tokenValue / totalValue) * 100;
};

// Format currency for display
const formatRWAValue = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  } else {
    return formatCurrency(value, "USD");
  }
};

// Map asset ticker to actual provider (not just protocol)
const getActualProvider = (
  assetTicker: string,
  protocolName: string,
): string => {
  // Direct asset-to-provider mapping (takes precedence)
  const assetToProvider: Record<string, string> = {
    // BlackRock assets
    BUIDL: "BlackRock",

    // Franklin Templeton assets
    BENJI: "F. Templeton",

    // Ondo Finance assets
    USDY: "Ondo",

    // Libre Capital assets
    UMA: "Libre Capital",
    BHMA: "Libre Capital",
    HLSPCA: "Libre Capital",

    // Securitize/Apollo assets
    ACRED: "Securitize",

    // PACT Protocol assets - all BSFG variants
    "BSFG-EM-1": "Pact",
    "BSFG-EM-NPA-1": "Pact",
    "BSFG-EM-NPA-2": "Pact",
    "BSFG-CAD-1": "Pact",
    "BSFG-KES-1": "Pact",
    "BSFG-AD-1": "Pact",
  };

  // First check direct asset mapping
  if (assetToProvider[assetTicker]) {
    return assetToProvider[assetTicker];
  }

  // Fallback to protocol-based mapping
  const protocolToProvider: Record<string, string> = {
    pact: "Pact",
    securitize: "Securitize",
    "franklin-templeton-benji-investments": "F. Templeton",
    "libre-capital": "Libre Capital",
    ondo: "Ondo",
  };

  return protocolToProvider[protocolName] || protocolName;
};

// Get the average color for a provider based on their assets
const getProviderAverageColor = (
  provider: string,
  assets: ProtocolData[],
): string => {
  // Get base colors for this provider's assets
  const colors = assets.map(
    (asset) => RWA_COLORS[asset.assetTicker] || RWA_COLORS.default,
  );

  // For simplicity, use the first asset's color as the provider color
  // In a more sophisticated implementation, you could blend the colors
  return colors[0] || RWA_COLORS.default;
};

// Custom tooltip component
const CustomTooltip = memo<TooltipProps<number, string>>((props) => {
  const { active, payload } = props as any;
  if (!active || !payload?.length) return null;

  try {
    const data = payload[0].payload as ProviderDataItem | AssetDataItem;
    const isProvider = !("provider" in data);

    return (
      <div
        className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 z-10 text-sm space-y-1"
        role="tooltip"
      >
        <p className="font-semibold text-popover-foreground">{data.name}</p>
        <p className="text-muted-foreground">
          {isProvider ? "Total Value" : "Asset Value"}: {data.formattedValue}
        </p>
        <p className="text-muted-foreground">
          Share: {formatPercentage(data.value)}%
        </p>
        {!isProvider && (
          <p className="text-muted-foreground text-xs">
            Provider: {(data as AssetDataItem).provider}
          </p>
        )}
      </div>
    );
  } catch (error) {
    errorLogger.error(`Error rendering tooltip: ${error}`);
    return (
      <div className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 z-10 text-sm">
        <p className="text-destructive">Error displaying data</p>
      </div>
    );
  }
});

CustomTooltip.displayName = "CustomTooltip";

// Custom legend component for RWAs
const CustomLegend = memo<{
  providerData: ProviderDataItem[];
  assetData: AssetDataItem[];
}>(({ providerData }) => {
  if (!providerData.length) return null;

  // Show all items if 4 or fewer, otherwise show top 3 + "others"
  const shouldShowAll = providerData.length <= 4;
  const itemsToShow = shouldShowAll ? providerData : providerData.slice(0, 3);
  const remainingProviders = shouldShowAll ? [] : providerData.slice(3);
  const remainingCount = remainingProviders.length;
  const remainingPercentage = remainingProviders.reduce(
    (sum, provider) => sum + provider.value,
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      {itemsToShow.map((provider, i) => {
        const displayValue = Number.isFinite(provider.value)
          ? provider.value.toFixed(2)
          : "0.00";

        return (
          <div
            key={`legend-${provider.name}-${i}`}
            className="flex items-center gap-3"
          >
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{
                backgroundColor: provider.color,
              }}
            />

            <div className="min-w-[64px] flex flex-wrap text-card-foreground gap-x-1">
              <span>{provider.name}</span>
            </div>

            <span className="text-sm text-muted-foreground ml-auto pl-2">
              {displayValue}%
            </span>
          </div>
        );
      })}

      {/* Show "and +X others" if there are more than 3 providers */}
      {remainingCount > 0 && (
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{
              backgroundColor: "#d4d4d8", // Gray color for "others"
            }}
          />

          <div className="min-w-[64px] flex flex-wrap text-card-foreground gap-x-1">
            <span className="text-sm font-medium text-muted-foreground">
              + ({remainingCount}) more
            </span>
          </div>

          <span className="text-sm text-muted-foreground ml-auto pl-2">
            {remainingPercentage.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
});

CustomLegend.displayName = "CustomLegend";

// Main chart component
export const MarketShareChart = memo<MarketShareChartProps>(
  ({ data, totalValue }) => {
    const { isMobile } = useResponsive(); // Using standard responsive hook

    // Process data for two-level chart
    const { providerData, assetData } = useMemo(() => {
      if (!data.length || totalValue === 0) {
        return { providerData: [], assetData: [] };
      }

      // Group data by provider and calculate totals
      const providerTotals = new Map<string, number>();
      const providerAssets = new Map<string, ProtocolData[]>();

      data.forEach((protocol) => {
        // Get the actual provider for this asset
        const provider = getActualProvider(
          protocol.assetTicker,
          protocol.protocol,
        );

        // Debug logging
        if (process.env.NODE_ENV === "development") {
          logger.debug(
            `Asset: ${protocol.assetTicker}, Protocol: ${protocol.protocol}, Provider: ${provider}, TVL: $${protocol.totalValue.toLocaleString()}`,
          );
        }

        const currentTotal = providerTotals.get(provider) || 0;
        providerTotals.set(provider, currentTotal + protocol.totalValue);

        const currentAssets = providerAssets.get(provider) || [];
        currentAssets.push(protocol);
        providerAssets.set(provider, currentAssets);
      });

      // Debug provider totals
      if (process.env.NODE_ENV === "development") {
        logger.debug(
          `Provider totals: ${Array.from(providerTotals.entries())
            .map(
              ([provider, total]) => `${provider}: $${total.toLocaleString()}`,
            )
            .join(", ")}`,
        );
      }

      // Create provider data with grouping for small providers
      const allProviders: ProviderDataItem[] = Array.from(
        providerTotals.entries(),
      )
        .map(([provider, value]) => {
          const providerAssetList = providerAssets.get(provider) || [];
          return {
            name: provider,
            value: calculateMarketShare(value, totalValue),
            formattedValue: formatRWAValue(value),
            color: getProviderAverageColor(provider, providerAssetList),
          };
        })
        .sort((a, b) => b.value - a.value);

      // Group providers under 1% into "Other" category for chart display
      const chartProviders: ProviderDataItem[] = [];
      const otherProviders: ProviderDataItem[] = [];

      for (const provider of allProviders) {
        // Keep providers with 1% or more market share
        if (provider.value >= 1.0) {
          chartProviders.push(provider);
        } else {
          otherProviders.push(provider);
        }
      }

      // If we have providers for "Other" category, combine them
      const providers: ProviderDataItem[] = [...chartProviders];
      if (otherProviders.length > 0) {
        const otherValue = otherProviders.reduce(
          (sum, provider) => sum + provider.value,
          0,
        );
        const otherTotalValue = otherProviders.reduce((sum, provider) => {
          const providerName = provider.name;
          return sum + (providerTotals.get(providerName) || 0);
        }, 0);

        providers.push({
          name: "Other",
          value: otherValue,
          formattedValue: formatRWAValue(otherTotalValue),
          color: "#d4d4d8", // Gray color for "Other" category
        });
      }

      // Create asset data (outer ring) - only for non-"Other" providers
      const assets: AssetDataItem[] = [];

      // Process assets for chart providers (excluding "Other")
      chartProviders.forEach((providerItem) => {
        const provider = providerItem.name;
        const providerAssetList = providerAssets.get(provider) || [];
        const sortedAssets = providerAssetList.sort(
          (a, b) => b.totalValue - a.totalValue,
        );

        sortedAssets.forEach((asset, index) => {
          // Get the base color for this asset
          const baseColor = RWA_COLORS[asset.assetTicker] || RWA_COLORS.default;

          // Calculate darkening factor based on TVL rank within provider
          let darkenedColor: string;
          if (provider === "Pact" && index === 0) {
            // For the largest TVL PACT asset, use the same color as the inner circle (provider color)
            darkenedColor = getProviderAverageColor(
              provider,
              providerAssetList,
            );
          } else {
            // For other assets, apply normal darkening logic
            const darkenFactor =
              sortedAssets.length > 1
                ? 0.4 - (index * 0.4) / (sortedAssets.length - 1)
                : 0;
            darkenedColor = darkenColor(baseColor, darkenFactor);
          }

          assets.push({
            name: asset.assetTicker,
            value: calculateMarketShare(asset.totalValue, totalValue),
            formattedValue: formatRWAValue(asset.totalValue),
            color: darkenedColor,
            provider: provider,
          });
        });
      });

      // Add single "Other" asset entry if we have other providers
      if (otherProviders.length > 0) {
        const otherTotalValue = otherProviders.reduce((sum, provider) => {
          const providerName = provider.name;
          return sum + (providerTotals.get(providerName) || 0);
        }, 0);

        assets.push({
          name: "Other",
          value: calculateMarketShare(otherTotalValue, totalValue),
          formattedValue: formatRWAValue(otherTotalValue),
          color: "#d4d4d8", // Gray color for "Other"
          provider: "Other",
        });
      }

      return { providerData: providers, assetData: assets };
    }, [data, totalValue]);

    // Error boundary fallback
    if (!providerData.length || !assetData.length) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px]">
          <div className="text-center p-8">
            <p className="text-muted-foreground">No data available for chart</p>
          </div>
        </div>
      );
    }

    // Define consistent chart sizing - matching BTC/Stables pages
    const chartConfig = {
      innerRadius: isMobile ? "54%" : "63%",
      outerRadius: isMobile ? "95%" : "99%",
      size: isMobile ? "w-56 h-56" : "w-80 h-80",
    };

    return (
      <div className="relative w-full h-full">
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
                    data={providerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={chartConfig.innerRadius}
                    outerRadius={chartConfig.outerRadius}
                    paddingAngle={4}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                  >
                    {providerData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}-${index}`}
                        fill={entry.color}
                        className="stroke-background hover:opacity-90 transition-opacity"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center value */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div
                    className={`font-bold ${isMobile ? "text-xl" : "text-2xl sm:text-3xl lg:text-4xl"}`}
                  >
                    {formatRWAValue(totalValue)}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`flex flex-col justify-center ${isMobile ? "w-full" : "w-64 flex-shrink-0"}`}
            >
              <CustomLegend providerData={providerData} assetData={assetData} />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

MarketShareChart.displayName = "MarketShareChart";
