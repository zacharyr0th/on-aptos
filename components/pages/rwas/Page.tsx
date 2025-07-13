'use client';

import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MarketShareChart } from '@/components/pages/rwas/Chart';
import { RwaTokenDialog } from '@/components/pages/rwas/Dialog';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { RootErrorBoundary } from '@/components/errors/RootErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import {
  formatAmount,
  formatPercentage as formatPercent,
  formatNumber,
} from '@/lib/utils/format';
import { RWA_COLORS } from '@/lib/config/colors';
import { RWA_TOKEN_BY_TICKER } from './rwa-constants';
import { useResponsive } from '@/hooks/useResponsive';
import { usePageTranslation } from '@/hooks/useTranslation';
// Removed complex suspense boundaries for simpler implementation

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

// Map asset ticker to actual provider (same logic as chart)
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

// Protocol data interface for RWA protocols
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

// Format currency for display - using centralized formatAmount
const formatRWAAmount = (value: number): string => {
  return formatAmount(value, 'USD');
};

// Format total value with full amount and 2 decimal places
const formatTotalRWAAmount = (value: number): string => {
  return formatAmount(value, 'USD', { compact: false, decimals: 2 });
};

// Format percentage - using centralized formatPercent
const formatPercentage = (value: number): string => {
  if (!Number.isFinite(value)) return '0.0';
  // formatPercent expects value as percentage (not decimal), so we don't divide by 100
  return formatPercent(value, {
    minimumFractionDigits: value >= 0.1 ? 1 : 2,
    maximumFractionDigits: value >= 0.1 ? 1 : 2,
  }).replace('%', ''); // Remove % since we add it manually in the component
};

// Calculate market share
const calculateMarketShare = (
  tokenValue: number,
  totalValue: number
): number => {
  if (totalValue === 0 || !Number.isFinite(tokenValue)) return 0;
  return (tokenValue / totalValue) * 100;
};

// Enhanced token card component
const TokenCard = memo(function TokenCard({
  protocol,
  totalValue,
  allProtocols,
  t,
}: {
  protocol: ProtocolData;
  totalValue: number;
  allProtocols: ProtocolData[];
  t: (key: string, fallback?: string) => string;
}): React.ReactElement {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isMobile } = useResponsive();

  // Calculate token data
  const tokenData = useMemo(() => {
    const marketSharePercent = calculateMarketShare(
      protocol.totalValue,
      totalValue
    );

    return {
      marketSharePercent: formatPercentage(marketSharePercent),
      value: protocol.totalValue,
      formattedValue: formatRWAAmount(protocol.totalValue),
    };
  }, [protocol.totalValue, totalValue]);

  // Get base color and apply TVL-based darkening based on overall ranking
  const baseColor = RWA_COLORS[protocol.assetTicker] || RWA_COLORS.default;

  // Find this protocol's rank among all protocols (sorted by TVL)
  const sortedProtocols = [...allProtocols].sort(
    (a, b) => b.totalValue - a.totalValue
  );
  const protocolRank = sortedProtocols.findIndex(p => p.id === protocol.id);
  const darkenFactor =
    allProtocols.length > 1
      ? (protocolRank * 0.15) / (allProtocols.length - 1)
      : 0;
  const tokenColor = darkenColor(baseColor, darkenFactor);

  const handleCardClick = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  // Get logo based on actual provider
  const getLogoUrl = (protocolName: string, assetTicker: string): string => {
    // Get the actual provider first
    const provider = getActualProvider(assetTicker, protocolName);

    const providerLogos: Record<string, string> = {
      // Provider-based logos
      Pact: '/icons/rwas/pact.png',
      BlackRock: '/icons/rwas/blackrock.png',
      'Franklin Templeton': '/icons/rwas/ft.jpeg',
      Securitize: '/icons/rwas/securitize.png',
      'Libre Capital': '/icons/rwas/libre.png',
      Ondo: '/icons/rwas/ondo.jpeg',
    };

    return providerLogos[provider] || '/icons/rwas/pact.png';
  };

  return (
    <>
      <div
        className="bg-card border rounded-lg overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
        onClick={handleCardClick}
      >
        <div className="h-1" style={{ backgroundColor: tokenColor }} />
        <div
          className={`flex justify-between items-center ${isMobile ? 'p-2 pb-0' : 'p-2 sm:p-2.5 pb-0'}`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} relative flex-shrink-0`}
            >
              {!imageLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse rounded-full" />
              )}
              <Image
                src={getLogoUrl(protocol.protocol, protocol.assetTicker)}
                alt={`${protocol.assetTicker} icon`}
                width={20}
                height={20}
                className={`object-contain rounded-full ${!imageLoaded ? 'opacity-0' : ''}`}
                onLoad={handleImageLoad}
                onError={e => {
                  const img = e.target as HTMLImageElement;
                  img.src = '/placeholder.jpg';
                  handleImageLoad();
                }}
              />
            </div>
            <h3
              className={`${isMobile ? 'text-sm font-semibold' : 'text-base sm:text-lg font-semibold'} text-card-foreground truncate`}
            >
              {protocol.assetTicker}
            </h3>
          </div>
          <Badge
            variant="outline"
            className={`${isMobile ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} flex-shrink-0 ml-2`}
          >
            {getActualProvider(protocol.assetTicker, protocol.protocol)}
          </Badge>
        </div>
        <div
          className={`${isMobile ? 'px-2 pt-1 pb-0' : 'px-2 sm:px-2.5 pt-1 sm:pt-1.5 pb-0'}`}
        >
          <p
            className={`${isMobile ? 'text-base font-bold' : 'text-lg sm:text-xl font-bold'} text-card-foreground font-mono`}
          >
            {tokenData.formattedValue}
          </p>
          <p
            className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground truncate`}
          >
            {protocol.name}
          </p>
        </div>
        <div
          className={`${isMobile ? 'p-2 pt-1' : 'p-2 sm:p-2.5 pt-1 sm:pt-1.5'}`}
        >
          <div
            className={`flex justify-between ${isMobile ? 'text-xs mb-1' : 'text-xs mb-1.5'}`}
          >
            <span className="text-muted-foreground">
              {t('rwas:stats.market_share')}
            </span>
            <span className="font-medium text-muted-foreground font-mono">
              {tokenData.marketSharePercent}%
            </span>
          </div>
          <Progress
            className="h-1"
            value={parseFloat(tokenData.marketSharePercent)}
            trackColor={`${tokenColor}20`}
            indicatorColor={tokenColor}
          />
        </div>
      </div>

      <RwaTokenDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        token={{
          // Get detailed token info from constants if available, otherwise use API data
          ...(RWA_TOKEN_BY_TICKER[protocol.assetTicker] || {
            tokenId: parseInt(protocol.id) || 0,
            name: protocol.name || 'Unknown Asset',
            address: protocol.tokenAddress || '',
            standards: 'Aptos-FA',
            assetId: parseInt(protocol.id) || 0,
            assetTicker: protocol.assetTicker || 'N/A',
            assetName: protocol.name || 'Unknown Asset',
            networkId: 38,
            network: 'aptos',
            protocolId: parseInt(protocol.id) || 0,
            protocol: protocol.protocol || 'unknown',
            assetClassId: 0,
            assetClass: protocol.assetClass || 'real-world-asset',
            assetRegulatoryFramework: '',
            assetGoverningBody: '',
            assetIssuerId: 0,
            assetIssuer: getActualProvider(
              protocol.assetTicker,
              protocol.protocol
            ),
            assetIssuerLegalStructureCountryId: 0,
            assetIssuerLegalStructureCountry: '',
          }),
          // Override with fresh API data (with validation)
          name: protocol.name || 'Unknown Asset',
          assetName: protocol.name || 'Unknown Asset',
          assetTicker: protocol.assetTicker || 'N/A',
          address: protocol.tokenAddress || '',
          protocol: protocol.protocol || 'unknown',
          assetClass: protocol.assetClass || 'real-world-asset',
        }}
        currentValue={protocol.totalValue}
      />
    </>
  );
});

// Loading state component
const LoadingState = memo(function LoadingState(): React.ReactElement {
  const { isMobile } = useResponsive();

  return (
    <div className="space-y-6">
      {/* Skeleton for total value card */}
      <Card className="border rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-grow">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-8 w-60" />
          </div>
          <div className="flex flex-col items-end">
            <Skeleton className="h-10 w-10 rounded mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </Card>

      {/* Desktop Layout Skeleton */}
      <div className="hidden lg:block">
        {/* Top section: 3 cards + chart */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          {/* First 3 cards skeleton */}
          <div className="col-span-1 space-y-4">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-card border rounded-lg overflow-hidden"
              >
                <Skeleton className="h-1 w-full" />
                <div className="p-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-7 w-32 mb-1" />
                  <Skeleton className="h-4 w-24 mb-3" />
                  <div className="flex justify-between text-xs mb-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-1 w-full" />
                </div>
              </div>
            ))}
          </div>

          {/* Chart skeleton */}
          <div className="col-span-3 bg-card border rounded-lg p-6">
            <Skeleton className="h-[250px] sm:h-[300px] w-full" />
          </div>
        </div>

        {/* Remaining rows skeleton - 2 rows of 4 cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div
              key={`row1-${i}`}
              className="bg-card border rounded-lg overflow-hidden"
            >
              <Skeleton className="h-1 w-full" />
              <div className="p-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-7 w-32 mb-1" />
                <Skeleton className="h-4 w-24 mb-3" />
                <div className="flex justify-between text-xs mb-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-1 w-full" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div
              key={`row2-${i}`}
              className="bg-card border rounded-lg overflow-hidden"
            >
              <Skeleton className="h-1 w-full" />
              <div className="p-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-7 w-32 mb-1" />
                <Skeleton className="h-4 w-24 mb-3" />
                <div className="flex justify-between text-xs mb-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-1 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Layout Skeleton */}
      <div className="lg:hidden space-y-6">
        {/* All cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div
              key={`mobile-${i}`}
              className="bg-card border rounded-lg overflow-hidden"
            >
              <Skeleton className="h-1 w-full" />
              <div className={`${isMobile ? 'p-2' : 'p-2.5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton
                    className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} rounded-full`}
                  />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-7 w-32 mb-1" />
                <Skeleton className="h-4 w-24 mb-3" />
                <div className="flex justify-between text-xs mb-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-1 w-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="bg-card border rounded-lg p-6">
          <Skeleton className="h-[250px] w-full" />
        </div>
      </div>
    </div>
  );
});

// Error state component
const ErrorState = memo(function ErrorState({
  error,
  onRetry,
  t,
}: {
  error: string;
  onRetry: () => void;
  t: (key: string, fallback?: string) => string;
}): React.ReactElement {
  return (
    <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-red-900 dark:text-red-100 mb-1">
              {t('rwas:error.error_loading_rwa_data')}
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-2">{error}</p>
            <Button onClick={onRetry} variant="destructive" size="sm">
              {t('rwas:error.retry')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default function RWAsPage(): React.ReactElement {
  const { isMobile } = useResponsive();
  const { t } = usePageTranslation('rwas');

  // Fetch real-time RWA data using direct API call
  const [rwaResponse, setRwaResponse] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rwaError, setRwaError] = useState<Error | null>(null);

  const fetchRwaData = useCallback(async () => {
    try {
      setIsLoading(true);
      setRwaError(null);

      const response = await fetch('/api/rwa', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[RWA Page] API Response:', data);
      setRwaResponse(data);
    } catch (error) {
      setRwaError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchRwaData();
  }, [fetchRwaData]);

  // Removed preload metrics - using direct API instead

  // Background refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        // Only refresh if user is on the page
        if (!document.hidden) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Background refresh triggered');
          }
          fetchRwaData();
        }
      },
      10 * 60 * 1000
    ); // 10 minutes

    return () => clearInterval(interval);
  }, [fetchRwaData]);

  // Removed prefetch logic - using direct API instead

  // Extract protocols from the response and map fields
  const protocols = useMemo(() => {
    const assets = rwaResponse?.data?.assets || [];
    // Map the API response to the expected format
    return assets.map((asset: any) => ({
      ...asset,
      totalValue: asset.aptosTvl || 0,
      assetTicker: asset.symbol || asset.assetTicker,
      protocol: asset.name || asset.protocol,
      tokenAddress: asset.tokenAddress || asset.address || '',
    }));
  }, [rwaResponse?.data?.assets]);
  const totalRWAValue = rwaResponse?.data?.totalAptosValue || 0;
  const dataSource = rwaResponse?.data?.dataSource || 'RWA.xyz API';
  const timestamp = rwaResponse?.data?.timestamp;

  // Process data for display
  const processedData = useMemo(() => {
    if (!protocols.length) return null;

    if (process.env.NODE_ENV === 'development') {
      // Validate that all data comes from RWA.xyz API
      console.log('🔍 Processing RWA data from RWA.xyz API:', {
        protocolCount: protocols.length,
        totalValue: totalRWAValue,
        dataSource,
        timestamp,
      });

      // Log each protocol's data to verify it's real
      protocols.forEach((protocol: any, index: number) => {
        console.log(
          `📊 Protocol ${index + 1}: ${protocol.assetTicker} - ${formatAmount(protocol.totalValue, 'USD', { compact: false })} (${protocol.protocol})`
        );

        // Validate required fields are present
        if (!protocol.totalValue || protocol.totalValue <= 0) {
          console.warn(
            `⚠️ Invalid totalValue for ${protocol.assetTicker}: ${protocol.totalValue}`
          );
        }
        if (!protocol.tokenAddress) {
          console.warn(`⚠️ Missing tokenAddress for ${protocol.assetTicker}`);
        }
      });
    }

    // Sort by value (largest first)
    const sortedProtocols = [...protocols].sort(
      (a, b) => b.totalValue - a.totalValue
    );

    // Calculate unique providers
    const uniqueProviders = new Set<string>();
    sortedProtocols.forEach((protocol: any) => {
      const provider = getActualProvider(
        protocol.assetTicker,
        protocol.protocol
      );
      uniqueProviders.add(provider);
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ All data validated from RWA.xyz API - NO MOCK DATA USED');
    }

    return {
      protocols: sortedProtocols,
      totalValue: totalRWAValue,
      totalFormatted: formatTotalRWAAmount(totalRWAValue),
      assetCount: sortedProtocols.length,
      providerCount: uniqueProviders.size,
    };
  }, [protocols, totalRWAValue, dataSource, timestamp]);

  const handleRetry = useCallback(() => {
    fetchRwaData();
  }, [fetchRwaData]);

  const loading = isLoading;
  const error = rwaError?.message || null;

  return (
    <RootErrorBoundary>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="container-layout pt-6">
          <Header />
        </div>

        <main className="container-layout py-6 flex-1">
          {/* Under Construction Notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-yellow-600 dark:text-yellow-400">
                🚧
              </div>
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Under Construction
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  The RWA page is currently being updated. Please check again later.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={handleRetry} t={t} />
          ) : processedData ? (
            <>
              {/* Total Value Card */}
              <div
                className={`flex items-center bg-card border rounded-lg ${isMobile ? 'py-2.5 px-3' : 'py-3 px-4'} mb-4 sm:mb-6`}
              >
                <div className="flex-grow min-w-0">
                  <h2
                    className={`${isMobile ? 'text-sm font-medium' : 'text-sm sm:text-base lg:text-lg font-medium'} text-card-foreground`}
                  >
                    {t('rwas:stats.total_rwa_value')}
                  </h2>
                  <p
                    className={`${isMobile ? 'text-lg font-bold' : 'text-lg sm:text-xl lg:text-2xl font-bold'} text-card-foreground font-mono`}
                  >
                    {isMobile
                      ? formatRWAAmount(processedData.totalValue)
                      : processedData.totalFormatted}
                  </p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 space-y-2">
                  <div
                    className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground text-center`}
                  >
                    {t('rwas:stats.real_world_assets')}
                  </div>
                  <div
                    className={`flex items-center ${isMobile ? 'gap-0.5' : 'gap-1'} text-xs text-muted-foreground`}
                  >
                    <span>{t('rwas:stats.data_powered_by_prefix')}</span>
                    <a
                      href="https://rwa.xyz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      RWA.xyz
                    </a>
                    <Image
                      src="/icons/rwas/rwa.png"
                      alt="RWA.xyz"
                      width={12}
                      height={12}
                      className="inline rounded-full"
                      onError={e => {
                        const img = e.target as HTMLImageElement;
                        img.src = '/placeholder.jpg';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Desktop: Top row with 3 cards + chart, Mobile: All cards then chart */}
              {/* Desktop Layout */}
              <div className="hidden lg:block">
                {/* Top row: 3 cards + chart */}
                <div className="grid grid-cols-4 gap-4 xl:gap-6 mb-4 xl:mb-6 items-start">
                  {/* First 3 cards */}
                  <div className="col-span-1 space-y-3 xl:space-y-4">
                    {processedData.protocols.slice(0, 3).map(protocol => (
                      <TokenCard
                        key={protocol.id}
                        protocol={protocol}
                        totalValue={processedData.totalValue}
                        allProtocols={processedData.protocols}
                        t={t}
                      />
                    ))}
                  </div>

                  {/* Chart - matches height of 3 cards */}
                  <div className="col-span-3 bg-card border rounded-lg overflow-hidden h-full">
                    <ErrorBoundary
                      fallback={
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center p-4">
                            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                            <p className="text-sm text-muted-foreground">
                              {t('error.failed_to_load_chart')}
                            </p>
                          </div>
                        </div>
                      }
                    >
                      <MarketShareChart
                        data={processedData.protocols}
                        totalValue={processedData.totalValue}
                      />
                    </ErrorBoundary>
                  </div>
                </div>

                {/* Two rows of 4 cards */}
                {processedData.protocols.length > 3 && (
                  <>
                    {/* First row of 4 cards (indices 3-6) */}
                    <div className="grid grid-cols-4 gap-3 xl:gap-4 mb-4 xl:mb-6">
                      {processedData.protocols.slice(3, 7).map(protocol => (
                        <TokenCard
                          key={protocol.id}
                          protocol={protocol}
                          totalValue={processedData.totalValue}
                          allProtocols={processedData.protocols}
                          t={t}
                        />
                      ))}
                    </div>

                    {/* Second row of 4 cards (indices 7-10) */}
                    {processedData.protocols.length > 7 && (
                      <div className="grid grid-cols-4 gap-3 xl:gap-4 mb-4 xl:mb-6">
                        {processedData.protocols.slice(7, 11).map(protocol => (
                          <TokenCard
                            key={protocol.id}
                            protocol={protocol}
                            totalValue={processedData.totalValue}
                            allProtocols={processedData.protocols}
                            t={t}
                          />
                        ))}
                      </div>
                    )}

                    {/* Additional rows if needed (more than 11 assets) */}
                    {processedData.protocols.length > 11 && (
                      <div className="grid grid-cols-4 gap-3 xl:gap-4 mb-4 xl:mb-6">
                        {processedData.protocols.slice(11).map(protocol => (
                          <TokenCard
                            key={protocol.id}
                            protocol={protocol}
                            totalValue={processedData.totalValue}
                            allProtocols={processedData.protocols}
                            t={t}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Mobile and Tablet Layout */}
              <div className="lg:hidden space-y-4 sm:space-y-6">
                {/* All individual cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {processedData.protocols.map(protocol => (
                    <TokenCard
                      key={protocol.id}
                      protocol={protocol}
                      totalValue={processedData.totalValue}
                      allProtocols={processedData.protocols}
                      t={t}
                    />
                  ))}
                </div>

                {/* Chart */}
                <div className="bg-card border rounded-lg overflow-hidden min-h-[250px] sm:min-h-[300px]">
                  <ErrorBoundary
                    fallback={
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center p-4">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                          <p className="text-sm text-muted-foreground">
                            {t('rwas:error.failed_to_load_chart')}
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <MarketShareChart
                      data={processedData.protocols}
                      totalValue={processedData.totalValue}
                    />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Asset Details Table */}
              <div className="mt-8 w-full overflow-hidden">
                <hr className="border-t border-border mb-6" />
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px] sm:min-w-[150px]">
                          Protocol
                        </TableHead>
                        <TableHead className="min-w-[100px] sm:min-w-[120px]">
                          TVL
                        </TableHead>
                        <TableHead className="min-w-[50px] sm:min-w-[60px]">
                          %
                        </TableHead>
                        <TableHead className="min-w-[100px] sm:min-w-[140px]">
                          Category
                        </TableHead>
                        <TableHead className="min-w-[80px] sm:min-w-[100px]">
                          Chain
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData.protocols.map(protocol => {
                        const marketSharePercent = (
                          (protocol.tvl / processedData.totalValue) *
                          100
                        ).toFixed(2);

                        return (
                          <TableRow key={protocol.id}>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Image
                                  src={protocol.logo || '/placeholder.jpg'}
                                  alt={protocol.name}
                                  width={20}
                                  height={20}
                                  className="rounded-full flex-shrink-0"
                                  onError={e => {
                                    const img = e.target as HTMLImageElement;
                                    img.src = '/placeholder.jpg';
                                  }}
                                />
                                <span className="font-medium">
                                  {protocol.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap">
                              {formatCurrency(protocol.tvl, 'USD')}
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap">
                              {marketSharePercent}%
                            </TableCell>
                            <TableCell className="text-sm">
                              {protocol.category || 'RWA'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {protocol.chain || 'Aptos'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : null}
        </main>

        <Footer />
      </div>
    </RootErrorBoundary>
  );
}
