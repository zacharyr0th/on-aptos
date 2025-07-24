'use client';

import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { GeistMono } from 'geist/font/mono';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import Image from 'next/image';
import {
  formatCurrency,
  formatAmount,
  formatAmountFull,
  formatPercentage,
} from '@/lib/utils';
import { RWA_COLORS } from '@/lib/constants';
import { RWA_TOKEN_BY_TICKER } from './rwa-constants';
import { usePageTranslation } from '@/hooks/useTranslation';

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

// Protocol data interface for RWA protocols
interface ProtocolData {
  id: string;
  name: string;
  logoUrl?: string;
  totalValue: number;
  description: string;
  tokenAddress: string;
  assetTicker: string;
  assetClass: string | { name?: string; slug?: string };
  protocol: string;
}

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

  // Calculate token data
  const tokenData = useMemo(() => {
    const marketSharePercent = calculateMarketShare(
      protocol.totalValue,
      totalValue
    );

    return {
      marketSharePercent: formatPercentage(marketSharePercent),
      value: protocol.totalValue,
      formattedValue: (() => {
        const value = protocol.totalValue;
        if (value >= 1_000_000_000)
          return `$${(value / 1_000_000_000).toFixed(1)}b`;
        if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}m`;
        if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
        return `$${value.toFixed(0)}`;
      })(),
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

  return (
    <>
      <div className="group cursor-pointer" onClick={handleCardClick}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 relative">
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
          <h3 className="text-base font-semibold">{protocol.assetTicker}</h3>
        </div>
        <p className="text-lg font-bold font-mono mb-0.5">
          {tokenData.formattedValue}
        </p>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-muted-foreground">
            {t('rwas:stats.market_share')}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
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
            assetClass: (typeof protocol.assetClass === 'object' &&
            protocol.assetClass?.name
              ? protocol.assetClass.name
              : typeof protocol.assetClass === 'string'
                ? protocol.assetClass
                : 'real-world-asset') as string,
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
          assetClass: (typeof protocol.assetClass === 'object' &&
          protocol.assetClass?.name
            ? protocol.assetClass.name
            : typeof protocol.assetClass === 'string'
              ? protocol.assetClass
              : 'real-world-asset') as string,
        }}
        currentValue={protocol.totalValue}
      />
    </>
  );
});

const LoadingState = memo(function LoadingState(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Token cards skeleton */}
        <div className="md:col-span-1 space-y-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-3 w-24 mb-2" />
              <div className="flex justify-between mb-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-1 w-full" />
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="md:col-span-1 lg:col-span-3 min-h-[250px] sm:min-h-[300px] relative">
          <Skeleton className="absolute inset-0" />
        </div>
      </div>
    </div>
  );
});

const ErrorState = memo(function ErrorState({
  error,
  onRetry,
  t,
}: {
  error: string;
  onRetry: () => void;
  t: (key: string, fallback?: string) => string;
}): React.ReactElement {
  const statusMatch = error.match(/HTTP error! Status: (\d+)/);
  const status = statusMatch ? statusMatch[1] : null;
  const isCustomMessage = !error.startsWith('HTTP error!');

  // Extract seconds from error message for countdown
  const secondsMatch = error.match(/Try again in (\d+) seconds/);
  const initialSeconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;
  const [countdown, setCountdown] = useState(initialSeconds);

  React.useEffect(() => {
    // Only start countdown if we have seconds to count down from
    if (initialSeconds <= 0) return;

    setCountdown(initialSeconds);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [initialSeconds, error]);

  return (
    <Card className="border-destructive mb-6">
      <CardContent className="p-6 flex items-center">
        <AlertTriangle className="h-10 w-10 mr-4 flex-shrink-0 text-destructive" />
        <div>
          <h3 className="font-bold text-lg mb-1 text-card-foreground">
            {t('rwas:loading.error_title')}
          </h3>
          {status && (
            <p className="text-muted-foreground text-sm mb-1">
              HTTP error! Status: {status}
            </p>
          )}

          {isCustomMessage ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {t('rwas:loading.rate_limit_message')}
              </span>
              {countdown > 0 && (
                <span className="text-muted-foreground">
                  {t('rwas:loading.try_again_in')}
                </span>
              )}
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="h-8 px-3"
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}s` : t('rwas:loading.try_again')}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {t('rwas:loading.request_failed')}
              <Button
                onClick={onRetry}
                variant="outline"
                className="ml-3"
                size="sm"
              >
                {t('rwas:loading.try_again')}
              </Button>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default function RWAsPage(): React.ReactElement {
  const { t } = usePageTranslation('rwas');
  const [forceRefresh, setForceRefresh] = useState(false);

  // Fetch real-time RWA data using direct API call
  const [rwaResponse, setRwaResponse] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rwaError, setRwaError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchRwaData = useCallback(async () => {
    try {
      setIsFetching(true);
      setRwaError(null);

      const response = await fetch('/api/aptos/rwa', {
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
      setIsFetching(false);
    }
  }, []);

  // Auto-refetch every 5 minutes
  useEffect(() => {
    fetchRwaData();

    const interval = setInterval(fetchRwaData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRwaData, forceRefresh]);

  // Extract data - withApiEnhancements already wraps it in {data: ..., cached: ...}
  const data: any = rwaResponse?.data || null;
  const loading = isLoading;
  const error = rwaError?.message || null;
  const refreshing = isFetching && !isLoading;

  // Manual refresh handler
  const fetchSupplyData = useCallback(async (): Promise<void> => {
    setForceRefresh(prev => !prev); // Toggle to force refresh
    await fetchRwaData();
  }, [fetchRwaData]);

  // Extract protocols from the response and map fields
  const protocols = useMemo(() => {
    if (!data) return [];
    const protocolsData = data.protocols || [];
    // Map the API response to the expected format
    return protocolsData.map((protocol: any) => ({
      ...protocol,
      totalValue: protocol.totalValue || 0,
      assetTicker: protocol.assetTicker || protocol.symbol,
      protocol: protocol.protocol || protocol.name,
      tokenAddress: protocol.tokenAddress || protocol.address || '',
    }));
  }, [data]);
  const totalRWAValue = data?.totalAptosValue || 0;

  // Process data for display
  const processedData = useMemo(() => {
    if (!protocols.length) return null;

    // Sort by value (largest first)
    const sortedProtocols = [...protocols].sort(
      (a, b) => b.totalValue - a.totalValue
    );

    return {
      protocols: sortedProtocols,
      totalValue: totalRWAValue,
      totalFormatted: formatAmountFull(totalRWAValue, 'USD'),
      assetCount: sortedProtocols.length,
    };
  }, [protocols, totalRWAValue]);

  const handleRetry = useCallback(() => {
    fetchSupplyData();
  }, [fetchSupplyData]);

  return (
    <ErrorBoundary>
      <div
        className={`min-h-screen flex flex-col relative ${GeistMono.className}`}
      >
        {/* Background gradient - fixed to viewport */}
        <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

        <div className="fixed top-0 left-0 right-0 h-1 z-30">
          {refreshing && <div className="h-full bg-muted animate-pulse"></div>}
        </div>

        <div className="container-layout pt-6 relative">
          <Header />
        </div>

        <main className="container-layout py-3 flex-1 relative">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={handleRetry} t={t} />
          ) : processedData ? (
            <>
              {/* Mobile: Show total supply at top */}
              <div className="md:hidden mb-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm text-muted-foreground">Total Value</h2>
                </div>
                <p className="text-xl font-bold font-mono">
                  {(() => {
                    const value = processedData.totalValue;
                    if (value >= 1_000_000_000)
                      return `$${(value / 1_000_000_000).toFixed(1)}b`;
                    if (value >= 1_000_000)
                      return `$${(value / 1_000_000).toFixed(1)}m`;
                    if (value >= 1_000)
                      return `$${(value / 1_000).toFixed(1)}k`;
                    return `$${value.toFixed(0)}`;
                  })()}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Mobile: Show cards in 2 columns, Desktop: Show in 1 column on left */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-1 md:col-span-1 md:space-y-4">
                  {processedData.protocols
                    ?.slice(0, 4)
                    .map((protocol: any) => (
                      <TokenCard
                        key={protocol.id}
                        protocol={protocol}
                        totalValue={processedData.totalValue}
                        allProtocols={processedData.protocols}
                        t={t}
                      />
                    )) || []}
                </div>

                {/* Chart takes full width on mobile */}
                <div className="col-span-2 md:col-span-1 lg:col-span-3 min-h-[250px] sm:min-h-[300px] relative">
                  {/* Total value and RWA.xyz branding in top right corner */}
                  <div className="absolute top-4 right-4 z-10 text-right">
                    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mb-2">
                      <span>Powered by</span>
                      <div className="flex items-center gap-1">
                        <Image
                          src="/icons/rwas/rwa.png"
                          alt="RWA.xyz"
                          width={16}
                          height={16}
                          className="object-contain"
                          onError={e => {
                            const img = e.target as HTMLImageElement;
                            img.src = '/placeholder.jpg';
                          }}
                        />
                        <span className="font-medium">RWA.xyz</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-end gap-3 mb-1">
                        <h2 className="text-sm text-muted-foreground">
                          Total Value
                        </h2>
                      </div>
                      <p className="text-lg font-bold font-mono">
                        {(() => {
                          const value = processedData.totalValue;
                          if (value >= 1_000_000_000)
                            return `$${(value / 1_000_000_000).toFixed(1)}b`;
                          if (value >= 1_000_000)
                            return `$${(value / 1_000_000).toFixed(1)}m`;
                          if (value >= 1_000)
                            return `$${(value / 1_000).toFixed(1)}k`;
                          return `$${value.toFixed(0)}`;
                        })()}
                      </p>
                    </div>
                  </div>

                  <ErrorBoundary
                    fallback={
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center p-4">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                          <p className="text-sm text-muted-foreground">
                            {t('rwas:loading.chart_error')}
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

              {/* Remaining cards below the chart */}
              {processedData.protocols &&
                processedData.protocols.length > 4 && (
                  <div className="mb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {processedData.protocols.slice(4).map((protocol: any) => (
                        <TokenCard
                          key={protocol.id}
                          protocol={protocol}
                          totalValue={processedData.totalValue}
                          allProtocols={processedData.protocols}
                          t={t}
                        />
                      ))}
                    </div>
                  </div>
                )}

              {/* Asset Details Table */}
              <div className="mt-8 w-full overflow-hidden">
                <hr className="border-t border-border mb-6" />
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px] sm:min-w-[150px]">
                          Asset
                        </TableHead>
                        <TableHead className="min-w-[100px] sm:min-w-[120px]">
                          TVL
                        </TableHead>
                        <TableHead className="min-w-[50px] sm:min-w-[60px] hidden md:table-cell">
                          %
                        </TableHead>
                        <TableHead className="min-w-[100px] sm:min-w-[140px] hidden md:table-cell">
                          Category
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData.protocols?.map((protocol: any) => {
                        const marketSharePercent = (
                          (protocol.totalValue / processedData.totalValue) *
                          100
                        ).toFixed(2);

                        return (
                          <TableRow key={protocol.id}>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Image
                                  src={getLogoUrl(
                                    protocol.protocol,
                                    protocol.assetTicker
                                  )}
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
                              {(() => {
                                const value = protocol.totalValue;
                                if (value >= 1_000_000_000)
                                  return `$${(value / 1_000_000_000).toFixed(1)}b`;
                                if (value >= 1_000_000)
                                  return `$${(value / 1_000_000).toFixed(1)}m`;
                                if (value >= 1_000)
                                  return `$${(value / 1_000).toFixed(1)}k`;
                                return `$${value.toFixed(0)}`;
                              })()}
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap hidden md:table-cell">
                              {marketSharePercent}%
                            </TableCell>
                            <TableCell className="text-sm hidden md:table-cell">
                              {typeof protocol.assetClass === 'object' &&
                              protocol.assetClass?.name
                                ? protocol.assetClass.name
                                : protocol.assetClass || 'RWA'}
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

        <Footer className="relative" />
      </div>
    </ErrorBoundary>
  );
}
