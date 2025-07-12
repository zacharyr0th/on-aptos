'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DollarSign, AlertTriangle } from 'lucide-react';
import { GeistMono } from 'geist/font/mono';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MarketShareChart,
  TOKEN_COLORS,
} from '@/components/pages/stables/Chart';
import { TokenDialog } from '@/components/pages/stables/Dialog';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { RootErrorBoundary } from '@/components/errors/RootErrorBoundary';
import { useCMCData } from '@/hooks/useMarketPrice';
import Image from 'next/image';
import {
  STABLECOIN_METADATA,
  Token,
  DisplayToken,
  SupplyData,
} from '@/lib/config';
import { usePageTranslation } from '@/hooks/useTranslation';
import { useDataPrefetch } from '@/hooks/useDataPrefetching';
// Simplified for better compatibility

const TOKEN_METADATA = STABLECOIN_METADATA;
const TokenCard = React.memo(function TokenCard({
  token,
  totalSupply,
  susdePrice,
  suppliesData = {},
  t,
}: {
  token: DisplayToken;
  totalSupply: string;
  susdePrice?: number;
  suppliesData?: Record<string, string>;
  t: (key: string) => string;
}): React.ReactElement {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { marketSharePercent, formattedDisplaySupply } = useMemo(() => {
    const calcMarketShare = () => {
      if (BigInt(totalSupply) === 0n) return '0';
      // Use supply_raw for market share calculation (fallback to supply for compatibility)
      const rawSupply = token.supply_raw || token.supply || '0';
      const tokenSupply = BigInt(rawSupply);
      const total = BigInt(totalSupply);

      // Use more precise calculation to avoid rounding errors
      const percentage = (tokenSupply * 10000n) / total;
      return (Number(percentage) / 100).toFixed(2);
    };

    const formatSingle = (s: string, symbol: string, isRaw: boolean = true) => {
      const supplyVal = BigInt(s);
      // Convert raw units to dollars if dealing with raw supply
      let dollars = isRaw ? Number(supplyVal) / 1_000_000 : Number(supplyVal);

      // Apply sUSDe price multiplier if available and token is sUSDe
      if (symbol === 'sUSDe' && susdePrice && susdePrice > 0) {
        dollars = dollars * susdePrice;
      }

      if (dollars >= 1_000_000_000)
        return `$${(dollars / 1_000_000_000).toFixed(1)}b`;
      if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}m`;
      if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}k`;
      return `$${dollars.toFixed(0)}`;
    };

    const calcFormattedDisplay = () => {
      if ('isCombined' in token && token.isCombined) {
        const susde = token.components.find(c => c.symbol === 'sUSDe');
        const usde = token.components.find(c => c.symbol === 'USDe');
        const parts: string[] = [];

        // Use supply_raw if available, otherwise use supply
        if (susde)
          parts.push(
            formatSingle(
              susde.supply_raw || susde.supply,
              'sUSDe',
              !!susde.supply_raw
            )
          );
        if (usde)
          parts.push(
            formatSingle(
              usde.supply_raw || usde.supply,
              'USDe',
              !!usde.supply_raw
            )
          );

        return parts.join(' / ');
      }
      // Use supply_raw if available, otherwise use supply
      return formatSingle(
        token.supply_raw || token.supply,
        token.symbol,
        !!token.supply_raw
      );
    };

    return {
      marketSharePercent: calcMarketShare(),
      formattedDisplaySupply: calcFormattedDisplay(),
    };
  }, [token, totalSupply, susdePrice]);

  const cardSymbol = token.symbol;
  const representativeSymbolForColor =
    'isCombined' in token && token.isCombined ? 'USDe' : token.symbol;
  const tokenColor =
    TOKEN_COLORS[representativeSymbolForColor as keyof typeof TOKEN_COLORS] ||
    TOKEN_COLORS.default;
  const metadata = TOKEN_METADATA[cardSymbol];

  const handleCardClick = useCallback(() => {
    if (metadata) {
      setIsDialogOpen(true);
    }
  }, [metadata]);

  return (
    <>
      <div
        className="bg-card border rounded-lg overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
        onClick={handleCardClick}
      >
        <div className="h-1" style={{ backgroundColor: tokenColor }} />
        <div className="flex justify-between items-center p-3 pb-0">
          <div className="flex items-center gap-2.5">
            {'isCombined' in token && token.isCombined ? (
              <div className="flex items-center">
                {[...token.components]
                  .sort((a, b) =>
                    BigInt(b.supply) > BigInt(a.supply) ? 1 : -1
                  )
                  .map((component, index) => (
                    <React.Fragment key={component.symbol}>
                      <div className="flex items-center">
                        <div className="w-6 h-6 relative flex-shrink-0 mr-1">
                          <Image
                            src={
                              TOKEN_METADATA[component.symbol]?.thumbnail ||
                              '/placeholder.jpg'
                            }
                            alt={`${component.symbol} icon`}
                            width={24}
                            height={24}
                            className="object-contain w-full h-full rounded-full"
                            priority
                            onError={e => {
                              const img = e.target as HTMLImageElement;
                              img.src = '/placeholder.jpg';
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {component.symbol}
                        </span>
                      </div>
                      {index === 0 && (
                        <span className="mx-1 text-muted-foreground">/</span>
                      )}
                    </React.Fragment>
                  ))}
              </div>
            ) : (
              <>
                <div className="w-6 h-6 relative flex-shrink-0">
                  <Image
                    src={metadata?.thumbnail || '/placeholder.jpg'}
                    alt={`${cardSymbol} icon`}
                    width={24}
                    height={24}
                    className="object-contain w-full h-full rounded-full"
                    priority
                    onError={e => {
                      const img = e.target as HTMLImageElement;
                      img.src = '/placeholder.jpg';
                    }}
                  />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {cardSymbol}
                </h3>
              </>
            )}
          </div>
        </div>
        <div className="px-3 pt-1 pb-0">
          <p className="text-xl font-bold text-card-foreground font-mono">
            {formattedDisplaySupply}
          </p>
        </div>
        <div className="p-3 pt-1.5">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              {t('stables:stats.market_share')}
            </span>
            <span className="font-medium text-muted-foreground font-mono">
              {marketSharePercent}%
            </span>
          </div>
          <Progress
            className="h-1"
            value={Number(marketSharePercent)}
            trackColor={`${tokenColor}20`}
            indicatorColor={tokenColor}
          />
        </div>
      </div>

      {metadata && (
        <TokenDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          metadata={metadata}
          supply={formattedDisplaySupply}
          suppliesData={suppliesData}
          susdePrice={
            // Pass the price for both standalone sUSDe and combined tokens
            token.symbol === 'sUSDe' ||
            token.symbol === 'sUSDe / USDe' ||
            // Also for combined tokens with sUSDe component
            ('isCombined' in token &&
              token.components.some(c => c.symbol === 'sUSDe'))
              ? susdePrice
              : undefined
          }
        />
      )}
    </>
  );
});

// Loading state component
function LoadingState(): React.ReactElement {
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Token cards skeleton */}
        <div className="lg:col-span-1 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border rounded-lg overflow-hidden">
              <Skeleton className="h-1 w-full" />
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-7 w-32 mb-1" />
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
        <div className="lg:col-span-3 bg-card border rounded-lg p-6">
          <Skeleton className="h-[250px] sm:h-[300px] w-full" />
        </div>
      </div>
    </div>
  );
}

// Error state component
function ErrorState({
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

  useEffect(() => {
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
            {t('stables:error.error_loading_stablecoin_data')}
          </h3>
          {status && (
            <p className="text-muted-foreground text-sm mb-1">
              HTTP error! Status: {status}
            </p>
          )}

          {isCustomMessage ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {t('stables:loading.rate_limit_message')}
              </span>
              {countdown > 0 && (
                <span className="text-muted-foreground">
                  {t('stables:loading.try_again_in')}
                </span>
              )}
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="h-8 px-3"
                disabled={countdown > 0}
              >
                {countdown > 0
                  ? `${countdown}s`
                  : t('stables:loading.try_again')}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {t('stables:loading.request_failed')}
              <Button
                onClick={onRetry}
                variant="outline"
                className="ml-3"
                size="sm"
              >
                {t('stables:loading.try_again')}
              </Button>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StablesPage(): React.ReactElement {
  const { t } = usePageTranslation('stables');
  const [forceRefresh, setForceRefresh] = useState(false);

  // Prefetch related data for this page
  useDataPrefetch('stables');

  // Use direct API call for stables data
  const [stablesData, setStablesData] = useState<{data: any} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stablesError, setStablesError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchStablesData = useCallback(async () => {
    try {
      setIsFetching(true);
      setStablesError(null);
      
      const response = await fetch('/api/aptos/stables', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setStablesData(data);
      
    } catch (error) {
      setStablesError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  // Auto-refetch every 5 minutes
  useEffect(() => {
    fetchStablesData();
    
    const interval = setInterval(fetchStablesData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStablesData, forceRefresh]);

  // Get sUSDe price data from CMC
  const { data: cmcData } = useCMCData();

  // Extract the actual data from API response
  const data: any = stablesData || null;
  const loading = isLoading;
  const error = stablesError?.message || null;
  const refreshing = isFetching && !isLoading;

  // Manual refresh handler
  const fetchSupplyData = useCallback(async (): Promise<void> => {
    setForceRefresh(prev => !prev); // Toggle to force refresh
    await fetchStablesData();
  }, [fetchStablesData]);

  const {
    formattedTotalSupply,
    processedSupplies,
    adjustedTotal,
    suppliesDataMap,
  } = useMemo(() => {
    if (!data || !data.data || !data.data.supplies)
      return {
        formattedTotalSupply: '',
        processedSupplies: [],
        adjustedTotal: '0',
        suppliesDataMap: {},
      };

    const susdePrice = cmcData?.price || 1; // Default to 1 if price not available
    const supplies = data.data.supplies;

    // Create supplies data map for the dialog
    const suppliesMap: Record<string, string> = {};
    supplies.forEach((supply: any) => {
      suppliesMap[supply.symbol] = supply.supply_raw ?? supply.supply ?? '0';
    });

    // Calculate raw total for market share calculations (no price adjustments)
    let rawTotalValue = BigInt(0);
    for (const token of supplies) {
      const rawSupply = token.supply_raw || token.supply || '0';
      rawTotalValue += BigInt(rawSupply);
    }

    // Calculate adjusted total for display purposes (with sUSDe price)
    let adjustedTotalValue = BigInt(0);
    for (const token of supplies) {
      const rawSupply = token.supply_raw || token.supply || '0';
      let tokenValue = BigInt(rawSupply);
      if (token.symbol === 'sUSDe' && susdePrice !== 1) {
        // Convert to a scaled integer value for BigInt math
        const priceScaled = Math.round(susdePrice * 1000000);
        tokenValue = (tokenValue * BigInt(priceScaled)) / BigInt(1000000);
      }
      adjustedTotalValue += tokenValue;
    }

    const formatTotal = () => {
      // Convert from raw units to dollars and use adjustedTotalValue
      const dollars = Number(adjustedTotalValue) / 1_000_000;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }).format(dollars);
    };

    const processSupplies = () => {
      const usdeToken = supplies.find((t: any) => t.symbol === 'USDe');
      const susdeToken = supplies.find((t: any) => t.symbol === 'sUSDe');
      const otherTokens = supplies.filter(
        (t: any) => t.symbol !== 'USDe' && t.symbol !== 'sUSDe'
      );

      const displayTokens: DisplayToken[] = [...otherTokens];
      const ethenaComponents: Token[] = [];

      if (usdeToken) ethenaComponents.push(usdeToken);
      if (susdeToken) ethenaComponents.push(susdeToken);

      if (ethenaComponents.length > 0) {
        displayTokens.push({
          symbol: 'sUSDe / USDe',
          isCombined: true,
          supply: ethenaComponents
            .reduce((acc, curr) => {
              const rawSupply = curr.supply_raw || curr.supply || '0';
              return acc + BigInt(rawSupply);
            }, 0n)
            .toString(),
          supply_raw: ethenaComponents
            .reduce((acc, curr) => {
              const rawSupply = curr.supply_raw || curr.supply || '0';
              return acc + BigInt(rawSupply);
            }, 0n)
            .toString(),
          components: ethenaComponents,
        });
      }

      return displayTokens.sort((a, b) => {
        const rawSupplyA = a.supply_raw || a.supply || '0';
        const rawSupplyB = b.supply_raw || b.supply || '0';
        const supplyA = BigInt(rawSupplyA);
        const supplyB = BigInt(rawSupplyB);
        return supplyB > supplyA ? 1 : supplyB < supplyA ? -1 : 0;
      });
    };

    return {
      formattedTotalSupply: formatTotal(),
      processedSupplies: processSupplies(),
      adjustedTotal: rawTotalValue.toString(),
      suppliesDataMap: suppliesMap,
    };
  }, [data, cmcData]);

  return (
    <RootErrorBoundary>
      <div
        className={`min-h-screen flex flex-col bg-background dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiMyMjIiIHN0cm9rZS13aWR0aD0iMC41Ij48L3BhdGg+Cjwvc3ZnPg==')] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxwYXRoIGQ9Im0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiNlZWUiIHN0cm9rZS13aWR0aD0iMC41Ij48L3BhdGg+Cjwvc3ZnPg==')] ${GeistMono.className}`}
      >
        <div className="fixed top-0 left-0 right-0 h-1 z-50">
          {refreshing && <div className="h-full bg-muted animate-pulse"></div>}
        </div>

        <div className="container-layout pt-6">
          <Header />
        </div>

        <main className="container-layout py-6 flex-1">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={fetchSupplyData} t={t} />
          ) : data ? (
            <>
              <div className="flex items-center bg-card border rounded-lg py-3 px-4 mb-6">
                <div className="flex-grow">
                  <h2 className="text-base sm:text-lg font-medium text-card-foreground">
                    {t('stables:stats.total_stablecoin_value')}
                  </h2>
                  <p className="text-xl sm:text-2xl font-bold text-card-foreground font-mono">
                    {formattedTotalSupply}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-secondary">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  {/* Show first 3 cards with non-zero supply */}
                  {processedSupplies?.filter(token => token.supply !== '0')?.slice(0, 3)?.map(token => (
                    <TokenCard
                      key={token.symbol}
                      token={token}
                      totalSupply={adjustedTotal}
                      susdePrice={cmcData?.price}
                      suppliesData={suppliesDataMap}
                      t={t}
                    />
                  )) || []}
                </div>

                <div className="lg:col-span-3 bg-card border rounded-lg overflow-hidden min-h-[250px] sm:min-h-[300px]">
                  <ErrorBoundary
                    fallback={
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center p-4">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                          <p className="text-sm text-muted-foreground">
                            {t('stables:error.failed_to_load_chart')}
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <MarketShareChart
                      data={processedSupplies || []}
                      totalSupply={adjustedTotal}
                      tokenMetadata={TOKEN_METADATA}
                      susdePrice={cmcData?.price}
                    />
                  </ErrorBoundary>
                </div>
              </div>
              
              {/* Bridged stablecoins below the chart */}
              {processedSupplies?.filter(token => token.supply !== '0')?.slice(3)?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Bridged Stablecoins</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {processedSupplies?.filter(token => token.supply !== '0')?.slice(3)?.map(token => (
                      <TokenCard
                        key={token.symbol}
                        token={token}
                        totalSupply={adjustedTotal}
                        susdePrice={cmcData?.price}
                        suppliesData={suppliesDataMap}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </main>

        <Footer />
      </div>
    </RootErrorBoundary>
  );
}

export { TOKEN_METADATA, type Token, type DisplayToken, type SupplyData };
