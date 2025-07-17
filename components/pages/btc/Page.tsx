'use client';

import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { GeistMono } from 'geist/font/mono';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MarketShareChart, TOKEN_COLORS } from '@/components/pages/btc/Chart';
import { TokenDialog } from '@/components/pages/btc/Dialog';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { useBitcoinPrice } from '@/hooks/useMarketPrice';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { BTC_METADATA, Token, SupplyData } from '@/lib/config';
import {
  formatCurrency,
  formatAmount,
  formatAmountFull,
  convertRawTokenAmount,
  formatPercentage,
} from '@/lib/utils';
import {
  measurePerformance,
  batchConvertBTCAmounts,
  calculateMarketShare,
} from './types';
import { usePageTranslation } from '@/hooks/useTranslation';
// Removed complex suspense boundaries for simpler implementation

// Use BTC_METADATA from config instead of redefining here
const TOKEN_METADATA = BTC_METADATA;

// Ultra-optimized token card with comprehensive memoization
const TokenCard = memo(function TokenCard({
  token,
  totalBTC,
  bitcoinPrice,
  t,
}: {
  token: Token;
  totalBTC: number;
  bitcoinPrice?: number;
  t: (key: string) => string;
}): React.ReactElement {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Simplified calculations like LST page
  const tokenData = useMemo(() => {
    // Get the token metadata to access decimals
    const metadata = TOKEN_METADATA[token.symbol];
    const decimals = metadata?.decimals || 8;

    // Convert raw token amount to actual BTC value
    const btcValue = convertRawTokenAmount(token.supply, decimals);

    // Calculate USD value if Bitcoin price is available
    const usdValue = bitcoinPrice ? btcValue * bitcoinPrice : 0;

    // Calculate market share percentage
    const marketSharePercent = totalBTC > 0 ? (btcValue / totalBTC) * 100 : 0;

    return {
      marketSharePercent: marketSharePercent.toFixed(2),
      btcValue,
      usdValue,
      metadata,
    };
  }, [token, totalBTC, bitcoinPrice]);

  const tokenColor = TOKEN_COLORS[token.symbol] || TOKEN_COLORS.default;

  const handleCardClick = useCallback(() => {
    if (tokenData.metadata) {
      setIsDialogOpen(true);
    }
  }, [tokenData.metadata]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  return (
    <>
      <div
        className="bg-card border rounded-lg overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
        onClick={handleCardClick}
      >
        <div className="h-1" style={{ backgroundColor: tokenColor }} />
        <div className="flex justify-between items-center p-2.5 pb-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 relative">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse rounded-full" />
              )}
              <Image
                src={tokenData.metadata?.thumbnail || '/placeholder.jpg'}
                alt={`${token.symbol} icon`}
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
            <h3 className="text-lg font-semibold text-card-foreground">
              {token.symbol}
            </h3>
          </div>
        </div>
        <div className="px-2.5 pt-1.5 pb-0">
          <p className="text-xl font-bold text-card-foreground font-mono">
            {formatAmount(tokenData.btcValue, 'BTC')}
          </p>
          {bitcoinPrice && (
            <p className="text-xs text-muted-foreground font-mono">
              ≈ {formatCurrency(tokenData.usdValue, 'USD')}
            </p>
          )}
        </div>
        <div className="p-2.5 pt-1.5">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              {t('btc:stats.market_share')}
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

      {tokenData.metadata && (
        <TokenDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          metadata={tokenData.metadata}
          supply={token.supply}
          bitcoinPrice={bitcoinPrice}
        />
      )}
    </>
  );
});

// Ultra-optimized loading state component
const LoadingState = memo(function LoadingState(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Skeleton for total supply card */}
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

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Token cards skeleton */}
        <div className="md:col-span-1 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border rounded-lg overflow-hidden">
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
        <div className="md:col-span-1 lg:col-span-3 bg-card border rounded-lg p-6">
          <Skeleton className="h-[250px] sm:h-[300px] w-full" />
        </div>
      </div>
    </div>
  );
});

// Ultra-optimized error state component
const ErrorState = memo(function ErrorState({
  error,
  onRetry,
  t,
}: {
  error: string;
  onRetry: () => void;
  t: (key: string) => string;
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
            {t('btc:loading.error_title')}
          </h3>
          {status && (
            <p className="text-muted-foreground text-sm mb-1">
              HTTP error! Status: {status}
            </p>
          )}

          {isCustomMessage ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {t('btc:loading.rate_limit_message')}
              </span>
              {countdown > 0 && (
                <span className="text-muted-foreground">
                  {t('btc:loading.try_again_in')}
                </span>
              )}
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="h-8 px-3"
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}s` : t('btc:loading.try_again')}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {t('btc:loading.request_failed')}
              <Button
                onClick={onRetry}
                variant="outline"
                className="ml-3"
                size="sm"
              >
                {t('btc:loading.try_again')}
              </Button>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default function BitcoinPage(): React.ReactElement {
  const { t } = usePageTranslation('btc');
  const [forceRefresh, setForceRefresh] = useState(false);

  // Use direct API call for BTC supply data
  const [btcSupplyData, setBtcSupplyData] = useState<{ data: any } | null>(
    null
  );
  const [btcSupplyLoading, setBtcSupplyLoading] = useState(true);
  const [btcSupplyError, setBtcSupplyError] = useState<Error | null>(null);
  const [btcSupplyFetching, setBtcSupplyFetching] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/aptos/btc');
        const data = await response.json();
        setBtcSupplyData(data);
        setBtcSupplyLoading(false);
      } catch (error) {
        console.error('[BTC Page] Fetch error:', error);
        setBtcSupplyError(error as Error);
        setBtcSupplyLoading(false);
      }
    };
    
    fetchData();
  }, [forceRefresh]);

  // Manual refresh handler
  const fetchSupplyData = useCallback(async (): Promise<void> => {
    try {
      setBtcSupplyFetching(true);
      setBtcSupplyError(null);
      
      const response = await fetch('/api/aptos/btc');
      const data = await response.json();
      console.log('[BTC Page] Manual refresh data:', data);
      setBtcSupplyData(data);
    } catch (error) {
      console.error('[BTC Page] Manual refresh error:', error);
      setBtcSupplyError(error as Error);
    } finally {
      setBtcSupplyFetching(false);
    }
  }, []);

  // Use our Bitcoin price hook as fallback only
  const {
    data: bitcoinPriceHookData,
    error: bitcoinPriceError,
    loading: bitcoinPriceLoading,
  } = useBitcoinPrice();

  // Extract bitcoin price from price hook - NO FALLBACK, use real data only
  const bitcoinPriceData = useMemo(() => {
    return measurePerformance(() => {
      console.log('[BTC Page] bitcoinPriceHookData:', bitcoinPriceHookData);
      return bitcoinPriceHookData;
    }, 'Bitcoin price calculation');
  }, [bitcoinPriceHookData]);

  // Extract the actual data from REST API responses
  const data: any = btcSupplyData?.data || null;

  const loading = btcSupplyLoading || bitcoinPriceLoading;
  const isRateLimited =
    btcSupplyError?.message?.includes('Rate limited') ||
    btcSupplyError?.message?.includes('429');
  const error = isRateLimited
    ? 'API rate limit reached. Data will refresh automatically.'
    : btcSupplyError?.message ||
      (!bitcoinPriceData && bitcoinPriceError) ||
      null;
  const refreshing = btcSupplyFetching && !btcSupplyLoading;


  // Process the supply data for display - simplified approach like LST page
  const processedData = useMemo(() => {
    console.log('[BTC Page] Processing data:', data);
    if (!data || !data.supplies || !Array.isArray(data.supplies)) {
      console.log('[BTC Page] No data to process');
      return null;
    }

    // Sort by BTC value (largest first) - simple approach
    const sortedSupplies = [...data.supplies].sort((a: any, b: any) => {
      const aDecimals = TOKEN_METADATA[a.symbol]?.decimals || 8;
      const bDecimals = TOKEN_METADATA[b.symbol]?.decimals || 8;
      const aBtc = convertRawTokenAmount(a.supply, aDecimals);
      const bBtc = convertRawTokenAmount(b.supply, bDecimals);
      return bBtc - aBtc;
    });

    console.log('[BTC Page] Sorted supplies:', sortedSupplies);
    return {
      ...data,
      supplies: sortedSupplies,
    };
  }, [data]);

  // Calculate the total BTC and USD value - simplified approach
  const { totalBTC, totalUSD } = useMemo(() => {
    console.log('[BTC Page] Calculating totals, processedData:', processedData);
    if (
      !processedData ||
      !processedData.supplies ||
      !Array.isArray(processedData.supplies)
    ) {
      return { totalBTC: 0, totalUSD: 0 };
    }

    let totalBTCValue = 0;
    let totalUSDValue = 0;

    processedData.supplies.forEach((token: any) => {
      const decimals = TOKEN_METADATA[token.symbol]?.decimals || 8;
      const btcAmount = convertRawTokenAmount(token.supply, decimals);
      totalBTCValue += btcAmount;

      if (bitcoinPriceData?.price) {
        totalUSDValue += btcAmount * bitcoinPriceData.price;
      }
    });

    console.log('[BTC Page] Calculated totals:', {
      totalBTC: totalBTCValue,
      totalUSD: totalUSDValue,
    });
    return {
      totalBTC: totalBTCValue,
      totalUSD: totalUSDValue,
    };
  }, [processedData, bitcoinPriceData]);

  // Function to handle retry for either data source
  const handleRetry = useCallback(() => {
    if (error) {
      fetchSupplyData();
    }
    // Note: Bitcoin price hook auto-retries, so no need to handle that case
  }, [error, fetchSupplyData]);

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

        <main className="container-layout py-6 flex-1 relative">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={handleRetry} t={t} />
          ) : processedData ? (
            <>
              {console.log('[BTC Page] Render check:', {
                processedData,
                bitcoinPriceData,
                data,
                loading,
                error,
              })}
              <div className="flex items-center bg-card border rounded-lg py-3 px-4 mb-6">
                <div className="flex-grow">
                  <h2 className="text-base sm:text-lg font-medium text-card-foreground">
                    {t('btc:stats.total_supply')}
                  </h2>
                  <p className="text-xl sm:text-2xl font-bold text-card-foreground font-mono">
                    {formatAmountFull(totalBTC, 'BTC')}
                    <span className="text-base font-normal text-muted-foreground ml-2 font-mono">
                      ≈ {formatCurrency(totalUSD, 'USD')}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="mb-1">
                    <Image
                      src="/icons/btc/bitcoin.png"
                      alt={t('btc:assets.bitcoin')}
                      width={32}
                      height={32}
                      className="object-contain"
                      onError={e => {
                        const img = e.target as HTMLImageElement;
                        img.src = '/placeholder.jpg';
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {bitcoinPriceData?.price
                      ? formatCurrency(bitcoinPriceData.price, 'USD')
                      : 'Loading...'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="md:col-span-1 space-y-4">
                  {processedData?.supplies?.map((token: any) => (
                    <TokenCard
                      key={token.symbol}
                      token={token}
                      totalBTC={totalBTC}
                      bitcoinPrice={bitcoinPriceData?.price}
                      t={t}
                    />
                  )) || []}
                </div>

                <div className="md:col-span-1 lg:col-span-3 bg-card border rounded-lg overflow-hidden min-h-[250px] sm:min-h-[300px]">
                  <ErrorBoundary
                    fallback={
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center p-4">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                          <p className="text-sm text-muted-foreground">
                            {t('btc:loading.chart_error')}
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <MarketShareChart
                      data={processedData.supplies}
                      tokenMetadata={TOKEN_METADATA}
                      bitcoinPrice={bitcoinPriceData?.price}
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
                          Token
                        </TableHead>
                        <TableHead className="min-w-[100px] sm:min-w-[120px]">
                          Amount
                        </TableHead>
                        <TableHead className="min-w-[100px] sm:min-w-[120px]">
                          Value
                        </TableHead>
                        <TableHead className="min-w-[50px] sm:min-w-[60px]">
                          %
                        </TableHead>
                        <TableHead className="min-w-[100px] sm:min-w-[140px]">
                          Type
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData?.supplies?.map((token: any) => {
                        const metadata = TOKEN_METADATA[token.symbol];
                        const decimals = metadata?.decimals || 8;
                        const btcAmount = convertRawTokenAmount(
                          token.supply,
                          decimals
                        );
                        const usdValue = bitcoinPriceData?.price
                          ? btcAmount * bitcoinPriceData.price
                          : 0;
                        const marketSharePercent = (
                          (btcAmount / totalBTC) *
                          100
                        ).toFixed(2);
                        const tokenColor =
                          TOKEN_COLORS[token.symbol] || TOKEN_COLORS.default;

                        return (
                          <TableRow key={token.symbol}>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Image
                                  src={
                                    metadata?.thumbnail || '/placeholder.jpg'
                                  }
                                  alt={token.symbol}
                                  width={20}
                                  height={20}
                                  className="rounded-full flex-shrink-0"
                                  onError={e => {
                                    const img = e.target as HTMLImageElement;
                                    img.src = '/placeholder.jpg';
                                  }}
                                />
                                <span className="font-medium">
                                  {token.symbol}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap">
                              {formatAmount(btcAmount, 'BTC')}
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap">
                              {bitcoinPriceData?.price
                                ? formatCurrency(usdValue, 'USD')
                                : '—'}
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap">
                              {marketSharePercent}%
                            </TableCell>
                            <TableCell className="text-sm">
                              {metadata?.type || '—'}
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

export { TOKEN_METADATA, type Token, type SupplyData };
