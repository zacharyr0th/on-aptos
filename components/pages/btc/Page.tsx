'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { GeistMono } from 'geist/font/mono';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { MarketShareChart, TOKEN_COLORS } from '@/components/pages/btc/Chart';
import { TokenDialog } from '@/components/pages/btc/Dialog';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { RootErrorBoundary } from '@/components/errors/RootErrorBoundary';
import { useBitcoinPrice } from '@/hooks/useMarketPrice';
import { trpc } from '@/lib/trpc/client';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { BTC_METADATA, Token, SupplyData } from '@/lib/config';
import {
  formatCurrency,
  formatAmount,
  convertRawTokenAmount,
  formatPercentage,
} from '@/lib/utils';
import {
  measurePerformance,
  batchConvertBTCAmounts,
  calculateMarketShare,
} from './types';
import { usePageTranslation } from '@/hooks/useTranslation';
import { useDataPrefetch } from '@/hooks/useDataPrefetching';
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

  // Ultra-fast calculations with memoization
  const tokenData = useMemo(() => {
    return measurePerformance(() => {
      // Get the token metadata to access decimals
      const metadata = TOKEN_METADATA[token.symbol];
      const decimals = metadata?.decimals || 8; // Default to 8 if not specified

      // Convert raw token amount to actual BTC value and round to whole number
      const rawBtcValue = convertRawTokenAmount(token.supply, decimals);
      const btcValue = Math.round(rawBtcValue);

      // Calculate USD value if Bitcoin price is available
      const usdValue = bitcoinPrice ? btcValue * bitcoinPrice : 0;

      // Pre-calculate all tokens for market share
      const allTokensForShare = [{ btcValue: totalBTC }];
      const marketSharePercent = calculateMarketShare(
        btcValue,
        allTokensForShare
      );

      return {
        marketSharePercent: formatPercentage(marketSharePercent),
        btcValue,
        usdValue,
        metadata,
      };
    }, `TokenCard-${token.symbol} calculation`);
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
                src={tokenData.metadata?.thumbnail || '/icons/bitcoin.png'}
                alt={`${token.symbol} icon`}
                width={20}
                height={20}
                className={`object-contain rounded-full ${!imageLoaded ? 'opacity-0' : ''}`}
                onLoad={handleImageLoad}
              />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground">
              {token.symbol}
            </h3>
          </div>
        </div>
        <div className="px-2.5 pt-1.5 pb-0">
          <p className="text-xl font-bold text-card-foreground">
            {formatAmount(tokenData.btcValue, 'BTC')}
          </p>
          {bitcoinPrice && (
            <p className="text-xs text-muted-foreground">
              ≈ {formatCurrency(tokenData.usdValue, 'USD')}
            </p>
          )}
        </div>
        <div className="p-2.5 pt-1.5">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              {t('btc:stats.market_share')}
            </span>
            <span className="font-medium text-muted-foreground">
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

  // Prefetch related data for this page
  useDataPrefetch('btc');

  // Use tRPC for comprehensive BTC supply data (shows all BTC tokens)
  const {
    data: btcSupplyData,
    isLoading: btcSupplyLoading,
    error: btcSupplyError,
    refetch: refetchBtcSupply,
    isFetching: btcSupplyFetching,
  } = trpc.domains.assets.bitcoin.getComprehensiveSupplies.useQuery(
    { forceRefresh },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
      refetchIntervalInBackground: true,
    }
  );

  // Use tRPC for Echelon data (for MoneyMarkets component)
  const {
    data: echelonData,
    isLoading: echelonLoading,
    refetch: refetchEchelon,
    isFetching: echelonFetching,
  } = trpc.domains.assets.bitcoin.getSupplies.useQuery(
    { forceRefresh },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
      refetchIntervalInBackground: true,
    }
  );

  // Use our Bitcoin price hook as fallback only
  const {
    data: bitcoinPriceHookData,
    error: bitcoinPriceError,
    loading: bitcoinPriceLoading,
  } = useBitcoinPrice();

  // Extract bitcoin price with priority fallbacks for echelon or price hook
  const bitcoinPriceData = useMemo(() => {
    return measurePerformance(() => {
      // First priority: Try to get price from Echelon data
      if (echelonData?.data?.markets) {
        const aBTCMarket = echelonData.data.markets.find(
          (m: { symbol: string }) => m.symbol === 'aBTC'
        );
        if (aBTCMarket?.price) {
          return {
            price: aBTCMarket.price,
            updated: echelonData.timestamp || new Date().toISOString(),
          };
        }
      }

      // Second priority: Use bitcoin price hook data
      if (bitcoinPriceHookData?.price) {
        return bitcoinPriceHookData;
      }

      // Last resort fallback to a reasonable default
      return {
        price: 100000, // $100k as reasonable default
        updated: new Date().toISOString(),
      };
    }, 'Bitcoin price calculation');
  }, [echelonData, bitcoinPriceHookData]);

  // Extract the actual data from tRPC responses and transform to expected format
  const data: SupplyData | null = useMemo(() => {
    return measurePerformance(() => {
      if (!btcSupplyData || !btcSupplyData.data || !btcSupplyData.data.supplies)
        return null;

      // Transform comprehensive BTC supply data to expected format
      type SupplyToken = {
        symbol: string;
        supply: string;
        formatted_supply: string;
      };

      return {
        supplies: btcSupplyData.data.supplies.map((token: SupplyToken) => ({
          symbol: token.symbol,
          supply: token.supply,
          formatted_supply: token.formatted_supply,
        })),
        total: btcSupplyData.data.total,
        total_formatted: btcSupplyData.data.total_formatted,
        total_decimals: btcSupplyData.data.total_decimals,
        timestamp: btcSupplyData.timestamp,
      };
    }, 'Data transformation');
  }, [btcSupplyData]);

  const loading = btcSupplyLoading || (bitcoinPriceLoading && !echelonData);
  const isRateLimited =
    btcSupplyError?.message?.includes('Rate limited') ||
    btcSupplyError?.message?.includes('429');
  const error = isRateLimited
    ? 'API rate limit reached. Data will refresh automatically.'
    : btcSupplyError?.message ||
      (!bitcoinPriceData && bitcoinPriceError) ||
      null;
  const refreshing =
    (btcSupplyFetching && !btcSupplyLoading) ||
    (echelonFetching && !echelonLoading);

  // Manual refresh handler
  const fetchSupplyData = useCallback(async (): Promise<void> => {
    setForceRefresh(prev => !prev); // Toggle to force refresh
    await Promise.all([refetchBtcSupply(), refetchEchelon()]);
  }, [refetchBtcSupply, refetchEchelon]);

  // Process the supply data for display
  const processedData = useMemo(() => {
    return measurePerformance(() => {
      if (!data) return null;

      // Use batch processing for better performance
      const batchItems = data.supplies.map(token => ({
        supply: token.supply,
        decimals: TOKEN_METADATA[token.symbol]?.decimals || 8,
        symbol: token.symbol,
      }));

      const results = batchConvertBTCAmounts(batchItems);

      // Sort by BTC value (largest first)
      const sortedSupplies = data.supplies
        .map((token, index) => ({
          ...token,
          btcValue: results[index].btcValue,
        }))
        .sort((a, b) => b.btcValue - a.btcValue)
        .map(({ btcValue: _, ...token }) => token); // Remove btcValue after sorting

      return {
        ...data,
        supplies: sortedSupplies,
      };
    }, 'Data processing');
  }, [data]);

  // Calculate the total BTC and USD value correctly
  const { totalBTC, totalUSD } = useMemo(() => {
    return measurePerformance(() => {
      if (!processedData || !processedData.supplies) {
        return { totalBTC: 0, totalUSD: 0 };
      }

      // Use batch processing for total calculation
      const batchItems = processedData.supplies.map(token => ({
        supply: token.supply,
        decimals: TOKEN_METADATA[token.symbol]?.decimals || 8,
      }));

      const results = batchConvertBTCAmounts(
        batchItems,
        bitcoinPriceData?.price
      );

      const totalBTCValue = results.reduce((sum, result) => {
        return sum + Math.round(result.btcValue);
      }, 0);

      const totalUSDValue = results.reduce((sum, result) => {
        return sum + (result.usdValue || 0);
      }, 0);

      return {
        totalBTC: totalBTCValue,
        totalUSD: totalUSDValue,
      };
    }, 'Total calculation');
  }, [processedData, bitcoinPriceData]);

  // Function to handle retry for either data source
  const handleRetry = useCallback(() => {
    if (error) {
      fetchSupplyData();
    }
    // Note: Bitcoin price hook auto-retries, so no need to handle that case
  }, [error, fetchSupplyData]);

  return (
    <RootErrorBoundary>
      <div
        className={`min-h-screen bg-background dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiMyMjIiIHN0cm9rZS13aWR0aD0iMC41Ij48L3BhdGg+Cjwvc3ZnPg==')] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiNlZWUiIHN0cm9rZS13aWR0aD0iMC41Ij48L3BhdGg+Cjwvc3ZnPg==')] ${GeistMono.className}`}
      >
        <div className="fixed top-0 left-0 right-0 h-1 z-50">
          {refreshing && <div className="h-full bg-muted animate-pulse"></div>}
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-6">
          <Header />

          <main className="my-6 overflow-visible">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState error={error} onRetry={handleRetry} t={t} />
            ) : processedData && bitcoinPriceData ? (
              <>
                <div className="flex items-center bg-card border rounded-lg py-3 px-4 mb-6">
                  <div className="flex-grow">
                    <h2 className="text-base sm:text-lg font-medium text-card-foreground">
                      {t('btc:stats.total_supply')}
                    </h2>
                    <p className="text-xl sm:text-2xl font-bold text-card-foreground">
                      {formatAmount(totalBTC, 'BTC')}
                      <span className="text-base font-normal text-muted-foreground ml-2">
                        ≈ {formatCurrency(totalUSD, 'USD')}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="bg-amber-100 dark:bg-amber-950 p-2 mb-1 rounded">
                      <Image
                        src="/icons/btc/bitcoin.png"
                        alt={t('btc:assets.bitcoin')}
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(bitcoinPriceData.price, 'USD')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="md:col-span-1 space-y-4">
                    {processedData.supplies.map(token => (
                      <TokenCard
                        key={token.symbol}
                        token={token}
                        totalBTC={totalBTC}
                        bitcoinPrice={bitcoinPriceData.price}
                        t={t}
                      />
                    ))}
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
                        bitcoinPrice={bitcoinPriceData.price}
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              </>
            ) : null}
          </main>

          <div className="mt-6">
            <Footer />
          </div>
        </div>
      </div>
    </RootErrorBoundary>
  );
}

export { TOKEN_METADATA, type Token, type SupplyData };
