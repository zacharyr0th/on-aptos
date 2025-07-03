import React, { useMemo, memo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  TooltipProps,
} from 'recharts';
import { useResponsive } from '@/hooks/useResponsive';
import { formatCurrency } from '@/lib/utils';
import { RWA_COLORS } from '@/lib/config/colors';

// Function to darken a hex color based on TVL ranking (higher TVL = darker)
const darkenColor = (hexColor: string, darkenFactor: number): string => {
  // Remove # if present
  const color = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Apply darkening factor (0 = no change, 1 = completely black)
  const newR = Math.round(r * (1 - darkenFactor));
  const newG = Math.round(g * (1 - darkenFactor));
  const newB = Math.round(b * (1 - darkenFactor));

  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
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
  if (!Number.isFinite(value)) return '0.0';
  return value >= 0.1 ? value.toFixed(1) : value.toFixed(2);
};

// Calculate market share
const calculateMarketShare = (
  tokenValue: number,
  totalValue: number
): number => {
  if (totalValue === 0 || !Number.isFinite(tokenValue)) return 0;
  return (tokenValue / totalValue) * 100;
};

// Format currency for display
const formatRWAValue = (value: number): string => {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  } else {
    return formatCurrency(value, 'USD');
  }
};

// Map asset ticker to actual provider (not just protocol)
const getActualProvider = (
  assetTicker: string,
  protocolName: string
): string => {
  // Direct asset-to-provider mapping (takes precedence)
  const assetToProvider: Record<string, string> = {
    // BlackRock assets
    BUIDL: 'BlackRock',

    // Franklin Templeton assets
    BENJI: 'Franklin Templeton',

    // Ondo Finance assets
    USDY: 'Ondo',

    // Libre Capital assets
    UMA: 'Libre Capital',
    BHMA: 'Libre Capital',
    HLSPCA: 'Libre Capital',

    // Securitize/Apollo assets
    ACRED: 'Securitize',

    // PACT Protocol assets
    'BSFG-EM-1': 'Pact',
    'BSFG-CAD-1': 'Pact',
    'BSFG-KES-1': 'Pact',
    'BSFG-AD-1': 'Pact',
  };

  // First check direct asset mapping
  if (assetToProvider[assetTicker]) {
    return assetToProvider[assetTicker];
  }

  // Fallback to protocol-based mapping
  const protocolToProvider: Record<string, string> = {
    pact: 'Pact',
    securitize: 'Securitize',
    'franklin-templeton-benji-investments': 'Franklin Templeton',
    'libre-capital': 'Libre Capital',
    ondo: 'Ondo',
  };

  return protocolToProvider[protocolName] || protocolName;
};

// Get the average color for a provider based on their assets
const getProviderAverageColor = (
  provider: string,
  assets: ProtocolData[]
): string => {
  // Get base colors for this provider's assets
  const colors = assets.map(
    asset => RWA_COLORS[asset.assetTicker] || RWA_COLORS.default
  );

  // For simplicity, use the first asset's color as the provider color
  // In a more sophisticated implementation, you could blend the colors
  return colors[0] || RWA_COLORS.default;
};

// Custom tooltip component
const CustomTooltip = memo<TooltipProps<number, string>>(props => {
  const { active, payload } = props as any;
  if (!active || !payload?.length) return null;

  try {
    const data = payload[0].payload as ProviderDataItem | AssetDataItem;
    const isProvider = !('provider' in data);

    return (
      <div
        className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 z-10 text-sm space-y-1"
        role="tooltip"
      >
        <p className="font-semibold text-popover-foreground">{data.name}</p>
        <p className="text-muted-foreground">
          {isProvider ? 'Total Value' : 'Asset Value'}: {data.formattedValue}
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
    console.error('Error rendering tooltip:', error);
    return (
      <div className="bg-popover/95 backdrop-blur border rounded-md shadow-lg p-3 z-10 text-sm">
        <p className="text-destructive">Error displaying data</p>
      </div>
    );
  }
});

CustomTooltip.displayName = 'CustomTooltip';

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

      data.forEach(protocol => {
        // Get the actual provider for this asset
        const provider = getActualProvider(
          protocol.assetTicker,
          protocol.protocol
        );

        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `Asset: ${protocol.assetTicker}, Protocol: ${protocol.protocol}, Provider: ${provider}, TVL: $${protocol.totalValue.toLocaleString()}`
          );
        }

        const currentTotal = providerTotals.get(provider) || 0;
        providerTotals.set(provider, currentTotal + protocol.totalValue);

        const currentAssets = providerAssets.get(provider) || [];
        currentAssets.push(protocol);
        providerAssets.set(provider, currentAssets);
      });

      // Debug provider totals
      if (process.env.NODE_ENV === 'development') {
        console.log(
          'Provider totals:',
          Array.from(providerTotals.entries()).map(
            ([provider, total]) => `${provider}: $${total.toLocaleString()}`
          )
        );
      }

      // Create provider data (inner ring) - sorted by cumulative TVL
      const providers: ProviderDataItem[] = Array.from(providerTotals.entries())
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

      // Create asset data (outer ring) - grouped by provider with TVL-based darkening
      const assets: AssetDataItem[] = [];

      // Sort providers by total value for consistent grouping (highest TVL first)
      const sortedProviders = Array.from(providerTotals.entries()).sort(
        ([, a], [, b]) => b - a
      );

      sortedProviders.forEach(([provider]) => {
        const providerAssetList = providerAssets.get(provider) || [];
        const sortedAssets = providerAssetList.sort(
          (a, b) => b.totalValue - a.totalValue
        );

        sortedAssets.forEach((asset, index) => {
          // Get the base color for this asset
          const baseColor = RWA_COLORS[asset.assetTicker] || RWA_COLORS.default;

          // Calculate darkening factor based on TVL rank within provider
          let darkenedColor: string;
          if (provider === 'Pact' && index === 0) {
            // For the largest TVL PACT asset, use the same color as the inner circle (provider color)
            darkenedColor = getProviderAverageColor(
              provider,
              providerAssetList
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

    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px]">
        <div className="w-full h-full relative">
          {/* Legend */}
          <div
            className={`absolute ${isMobile ? 'top-2 left-2' : 'top-3 left-3'} z-10 bg-card/95 backdrop-blur border rounded-lg ${isMobile ? 'p-1.5' : 'p-3'} ${isMobile ? 'text-xs' : 'text-sm'} ${isMobile ? 'space-y-1' : 'space-y-2'} shadow-sm`}
          >
            <div
              className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}
            >
              <div
                className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full bg-foreground/70`}
              ></div>
              <span className="text-card-foreground/90">Providers</span>
            </div>
            <div
              className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}
            >
              <div
                className={`${isMobile ? 'w-2 h-2 border' : 'w-3 h-3 border-2'} rounded-full border-foreground/70`}
              ></div>
              <span className="text-card-foreground/90">Assets</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            <PieChart>
              {/* Inner ring - Providers */}
              <Pie
                data={providerData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? '20%' : '30%'}
                outerRadius={isMobile ? '40%' : '50%'}
                paddingAngle={2}
                startAngle={90}
                endAngle={450}
              >
                {providerData.map((entry, index) => (
                  <Cell
                    key={`provider-cell-${index}`}
                    fill={entry.color}
                    className="stroke-background hover:opacity-90 transition-opacity"
                    strokeWidth={2}
                  />
                ))}
              </Pie>

              {/* Outer ring - Individual Assets */}
              <Pie
                data={assetData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? '45%' : '55%'}
                outerRadius={isMobile ? '65%' : '75%'}
                paddingAngle={1}
                startAngle={90}
                endAngle={450}
                label={false}
                labelLine={false}
              >
                {assetData.map((entry, index) => (
                  <Cell
                    key={`asset-cell-${index}`}
                    fill={entry.color}
                    className="stroke-background hover:opacity-90 transition-opacity"
                    strokeWidth={1}
                  />
                ))}
              </Pie>

              <Tooltip content={<CustomTooltip />} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
);

MarketShareChart.displayName = 'MarketShareChart';
