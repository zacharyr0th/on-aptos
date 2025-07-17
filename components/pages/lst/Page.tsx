'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { RootErrorBoundary } from '@/components/errors/RootErrorBoundary';
import { TokenDialog } from '@/components/pages/lst/Dialog';
import { MarketShareChart } from '@/components/pages/lst/Chart';
import Image from 'next/image';
import {
  LST_METADATA,
  LST_COLORS,
  Token,
  DisplayToken,
  SupplyData,
} from '@/lib/config';
import {
  formatQuantityValue,
  convertRawTokenAmount,
  formatNumber,
  formatAmount,
  formatAmountFull,
  formatLargeNumber,
  formatCurrency,
} from '@/lib/utils';
import { usePageTranslation } from '@/hooks/useTranslation';
// Simplified for better compatibility

// Use LST_METADATA from config instead of redefining here
const TOKEN_METADATA = LST_METADATA;

// Helper function to fix token symbol casing
const fixTokenSymbolCasing = (symbol: string): string => {
  return symbol.replace(/apt/gi, 'APT');
};

// Define token types
interface LSTToken extends Token {
  formatted_supply: string;
}

interface LSTSupplyData extends SupplyData {
  timestamp: string;
}

// Optimize token card by memoizing expensive calculations and component
const TokenCard = React.memo(function TokenCard({
  token,
  totalSupply,
  aptPrice,
  t,
}: {
  token: DisplayToken;
  totalSupply: string;
  aptPrice?: number;
  t: (key: string) => string;
}): React.ReactElement {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { marketSharePercent, formattedDisplaySupply, aptValue, usdValue } =
    useMemo(() => {
      const calcMarketShare = () => {
        if (BigInt(totalSupply) === 0n) return '0';

        // Calculate market share with proper precision
        const tokenSupply = BigInt(token.supply);
        const total = BigInt(totalSupply);
        const marketShare = (tokenSupply * 10000n) / total; // Multiply by 10000 for 2 decimal places

        // Convert to string with proper formatting (e.g., "12.34")
        const integerPart = marketShare / 100n;
        const decimalPart = marketShare % 100n;
        const formattedDecimal = decimalPart.toString().padStart(2, '0');

        return `${integerPart}.${formattedDecimal}`;
      };

      const formatSingle = (s: string, symbol: string) => {
        const metadata = TOKEN_METADATA[symbol] || { decimals: 8 };
        const decimals = metadata.decimals;
        const tokens = convertRawTokenAmount(s, decimals);

        // Format without symbol, just number with M/K
        return formatLargeNumber(tokens, 1).toUpperCase();
      };

      const calcFormattedDisplay = () => {
        if ('isCombined' in token && token.isCombined) {
          const parts: string[] = [];

          // Sort components by supply in descending order
          const sortedComponents = [...token.components].sort((a, b) => {
            const supplyA = BigInt(a.supply);
            const supplyB = BigInt(b.supply);
            return supplyB > supplyA ? 1 : -1;
          });

          sortedComponents.forEach(c => {
            parts.push(formatSingle(c.supply, c.symbol));
          });

          return parts.join(' / ');
        }
        return formatSingle(token.supply, token.symbol);
      };

      // Calculate APT value for USD conversion
      const calcAptValue = () => {
        // All LST tokens have 8 decimals
        const aptAmount = Number(BigInt(token.supply)) / 1_000_000_00;
        return aptAmount;
      };

      const aptAmount = calcAptValue();
      const usdAmount = aptPrice ? aptAmount * aptPrice : 0;

      return {
        marketSharePercent: calcMarketShare(),
        formattedDisplaySupply: calcFormattedDisplay(),
        aptValue: aptAmount,
        usdValue: usdAmount,
      };
    }, [token, totalSupply, aptPrice]);

  const cardSymbol = fixTokenSymbolCasing(token.symbol);
  const representativeSymbolForColor =
    'isCombined' in token && token.isCombined
      ? token.symbol.split('/')[0].trim()
      : token.symbol;

  const tokenColor =
    LST_COLORS[representativeSymbolForColor as keyof typeof LST_COLORS] ||
    LST_COLORS.default;
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
        <div className="flex justify-between items-center p-2.5 pb-0">
          <div className="flex items-center gap-2">
            {'isCombined' in token && token.isCombined ? (
              <div className="flex items-center">
                {/* Sort components by supply in descending order */}
                {[...token.components]
                  .sort((a, b) =>
                    BigInt(b.supply) > BigInt(a.supply) ? 1 : -1
                  )
                  .map((component, index) => (
                    <React.Fragment key={component.symbol}>
                      <div className="flex items-center">
                        <div className="w-5 h-5 relative mr-1">
                          <Image
                            src={
                              TOKEN_METADATA[component.symbol]?.thumbnail ||
                              '/placeholder.jpg'
                            }
                            alt={`${component.symbol} icon`}
                            width={16}
                            height={16}
                            className="object-contain rounded-full"
                            onError={e => {
                              const img = e.target as HTMLImageElement;
                              img.src = '/placeholder.jpg';
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {fixTokenSymbolCasing(component.symbol)}
                        </span>
                      </div>
                      {index === 0 && <span className="mx-1">/</span>}
                    </React.Fragment>
                  ))}
              </div>
            ) : (
              <>
                <div className="w-5 h-5 relative mr-1">
                  <Image
                    src={metadata?.thumbnail || '/placeholder.jpg'}
                    alt={`${cardSymbol} icon`}
                    width={20}
                    height={20}
                    className="object-contain"
                    onError={e => {
                      const img = e.target as HTMLImageElement;
                      img.src = '/placeholder.jpg';
                    }}
                  />
                </div>
                <h3 className="text-sm font-semibold text-card-foreground">
                  {cardSymbol}
                </h3>
              </>
            )}
          </div>
        </div>
        <div className="px-2.5 pt-1.5 pb-0">
          <p className="text-xl font-bold text-card-foreground font-mono">
            {formattedDisplaySupply}
          </p>
          {aptPrice && (
            <p className="text-xs text-muted-foreground font-mono">
              ≈ {formatCurrency(usdValue, 'USD')}
            </p>
          )}
        </div>
        <div className="p-2.5 pt-1.5">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              {t('lst:stats.market_share')}
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
        </div>
      </Card>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Token cards skeleton */}
        <div className="md:col-span-1 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border rounded-lg overflow-hidden">
              <Skeleton className="h-1 w-full" />
              <div className="p-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
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
        <div className="md:col-span-1 lg:col-span-3 bg-card border rounded-lg p-6">
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
  const isRateLimited = error?.includes('429') || error?.includes('rate limit');
  const statusMatch = error?.match(/HTTP error! Status: (\d+)/);
  const status = statusMatch ? statusMatch[1] : null;

  return (
    <Card className="border-destructive mb-6">
      <CardContent className="p-6 flex items-center">
        <AlertTriangle className="h-10 w-10 mr-4 flex-shrink-0 text-destructive" />
        <div>
          <h3 className="font-bold text-lg mb-1 text-card-foreground">
            {t('lst:error.error_loading_lst_data')}
          </h3>
          {status && (
            <p className="text-muted-foreground text-sm mb-1">
              HTTP error! Status: {status}
            </p>
          )}
          <p className="text-muted-foreground">
            {isRateLimited
              ? 'API rate limit reached. Data will refresh automatically.'
              : error || t('lst:loading.loading_lst_data')}
            <Button
              onClick={onRetry}
              variant="outline"
              className="ml-3"
              size="sm"
            >
              {t('lst:error.retry')}
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LSTPage(): React.ReactElement {
  const { t } = usePageTranslation('lst');
  const [forceRefresh, setForceRefresh] = useState(false);

  // Use direct API call for LST data
  const [lstData, setLstData] = useState<{ data: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lstError, setLstError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchLstData = useCallback(async () => {
    try {
      setIsFetching(true);
      setLstError(null);

      const response = await fetch('/api/aptos/lst', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[LST Page] API Response:', data);
      setLstData(data);
    } catch (error) {
      setLstError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  // Auto-refetch every 5 minutes
  useEffect(() => {
    fetchLstData();

    const interval = setInterval(fetchLstData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLstData, forceRefresh]);

  // Extract the actual data from REST API response
  const data: any = lstData?.data || null;
  const loading = isLoading;
  const error = lstError?.message || null;
  const refreshing = isFetching && !isLoading;

  // Manual refresh handler
  const fetchSupplyData = useCallback(async (): Promise<void> => {
    setForceRefresh(prev => !prev); // Toggle to force refresh
    await fetchLstData();
  }, [fetchLstData]);

  // Get APT price for USD calculation via direct API call
  const [aptPriceData, setAptPriceData] = useState<{ data: any } | null>(null);

  const fetchAptPrice = useCallback(async () => {
    try {
      const response = await fetch('/api/prices/cmc/apt', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Don't throw for price data - it's non-critical
        return;
      }

      const data = await response.json();
      console.log('[LST Page] APT Price Response:', data);
      setAptPriceData(data);
    } catch (error) {
      // Silently fail for price data as it's non-critical
      console.warn('Failed to fetch APT price:', error);
    }
  }, []);

  // Auto-refetch APT price every minute
  useEffect(() => {
    fetchAptPrice();

    const interval = setInterval(fetchAptPrice, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAptPrice]);

  const {
    formattedTotalSupply,
    formattedTotalUSD,
    processedSupplies,
    adjustedTotal,
  } = useMemo(() => {
    console.log('[LST Page] APT Price Data:', aptPriceData);
    if (!data)
      return {
        formattedTotalSupply: '',
        formattedTotalUSD: '',
        processedSupplies: [],
        adjustedTotal: '0',
      };

    // Format total supply in APT (FULL number)
    const formatTotal = () => {
      const totalApt = Number(BigInt(data.total)) / 1_000_000_00; // 8 decimals
      return formatAmountFull(totalApt, 'APT', { decimals: 2 });
    };

    // Format total supply in USD
    const formatTotalUSD = () => {
      const aptPrice =
        aptPriceData?.data?.price?.price ||
        aptPriceData?.data?.price ||
        (aptPriceData as any)?.price;
      if (!aptPrice) return '';
      const totalApt = Number(BigInt(data.total)) / 1_000_000_00; // 8 decimals
      const totalUSD = totalApt * aptPrice;
      return formatAmountFull(totalUSD, 'USD', { decimals: 2 });
    };

    // Process tokens - group by protocol with combined cards
    const processSupplies = () => {
      if (!data?.supplies) return [];

      const thalaTokens = data.supplies.filter(
        (t: any) =>
          t.symbol.toLowerCase() === 'thapt' ||
          t.symbol.toLowerCase() === 'sthapt'
      );
      const amnisTokens = data.supplies.filter(
        (t: any) =>
          t.symbol.toLowerCase() === 'amapt' ||
          t.symbol.toLowerCase() === 'stapt'
      );
      const kofiTokens = data.supplies.filter(
        (t: any) =>
          t.symbol.toLowerCase() === 'kapt' ||
          t.symbol.toLowerCase() === 'stkapt'
      );

      const displayTokens: DisplayToken[] = [];

      // Add combined protocol tokens
      if (thalaTokens.length > 0) {
        displayTokens.push({
          symbol: 'thAPT/sthAPT',
          isCombined: true,
          supply: thalaTokens.reduce(
            (acc: any, curr: any) =>
              (BigInt(acc) + BigInt(curr.supply)).toString(),
            '0'
          ),
          components: thalaTokens,
        });
      }

      if (amnisTokens.length > 0) {
        displayTokens.push({
          symbol: 'amAPT/stAPT',
          isCombined: true,
          supply: amnisTokens.reduce(
            (acc: any, curr: any) =>
              (BigInt(acc) + BigInt(curr.supply)).toString(),
            '0'
          ),
          components: amnisTokens,
        });
      }

      if (kofiTokens.length > 0) {
        displayTokens.push({
          symbol: 'kAPT/stkAPT',
          isCombined: true,
          supply: kofiTokens.reduce(
            (acc: any, curr: any) =>
              (BigInt(acc) + BigInt(curr.supply)).toString(),
            '0'
          ),
          components: kofiTokens,
        });
      }

      // Add individual tokens that aren't part of protocol pairs
      const pairedTokenSymbols = new Set([
        'thapt',
        'sthapt',
        'amapt',
        'stapt',
        'kapt',
        'stkapt',
      ]);

      const individualTokens = data.supplies.filter(
        (t: any) => !pairedTokenSymbols.has(t.symbol.toLowerCase())
      );

      individualTokens.forEach((token: any) => {
        displayTokens.push({
          symbol: token.symbol,
          supply: token.supply,
        });
      });

      // Sort by supply in descending order
      return displayTokens.sort((a, b) => {
        const supplyA = BigInt(a.supply);
        const supplyB = BigInt(b.supply);
        return supplyB > supplyA ? 1 : -1;
      });
    };

    return {
      formattedTotalSupply: formatTotal(),
      formattedTotalUSD: formatTotalUSD(),
      processedSupplies: processSupplies(),
      adjustedTotal: data.total,
    };
  }, [data, aptPriceData]);

  return (
    <RootErrorBoundary>
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
            <ErrorState error={error} onRetry={fetchSupplyData} t={t} />
          ) : data ? (
            <>
              <div className="flex items-center bg-card border rounded-lg py-3 px-4 mb-6">
                <div className="flex-grow">
                  <h2 className="text-base sm:text-lg font-medium text-card-foreground">
                    {t('lst:stats.total_lst_value')}
                  </h2>
                  <p className="text-xl sm:text-2xl font-bold text-card-foreground font-mono">
                    {formattedTotalSupply}
                    {formattedTotalUSD && (
                      <span className="text-base font-normal text-muted-foreground ml-2 font-mono">
                        ≈ {formattedTotalUSD}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="md:col-span-1 space-y-4">
                  {processedSupplies?.map(token => (
                    <TokenCard
                      key={token.symbol}
                      token={token}
                      totalSupply={adjustedTotal}
                      aptPrice={
                        aptPriceData?.data?.price?.price ||
                        aptPriceData?.data?.price ||
                        (aptPriceData as any)?.price
                      }
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
                            {t('lst:error.failed_to_load_chart')}
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <MarketShareChart
                      data={processedSupplies || []}
                      totalSupply={adjustedTotal}
                      tokenMetadata={TOKEN_METADATA}
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedSupplies?.map(token => {
                        const aptAmount =
                          Number(BigInt(token.supply)) / 1_000_000_00; // 8 decimals
                        const aptPrice =
                          aptPriceData?.data?.price?.price ||
                          aptPriceData?.data?.price ||
                          (aptPriceData as any)?.price;
                        const usdValue = aptPrice ? aptAmount * aptPrice : 0;

                        // Calculate market share
                        const totalAptSupply =
                          Number(BigInt(adjustedTotal)) / 1_000_000_00;
                        const marketSharePercent = (
                          (aptAmount / totalAptSupply) *
                          100
                        ).toFixed(2);

                        const representativeSymbol =
                          'isCombined' in token && token.isCombined
                            ? token.symbol.split('/')[0].trim()
                            : token.symbol;
                        const tokenColor =
                          LST_COLORS[
                            representativeSymbol as keyof typeof LST_COLORS
                          ] || LST_COLORS.default;

                        return (
                          <TableRow key={token.symbol}>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {'isCombined' in token && token.isCombined ? (
                                  <div className="flex items-center gap-1">
                                    {token.components.map(
                                      (component, index) => (
                                        <Image
                                          key={component.symbol}
                                          src={
                                            TOKEN_METADATA[component.symbol]
                                              ?.thumbnail || '/placeholder.jpg'
                                          }
                                          alt={component.symbol}
                                          width={20}
                                          height={20}
                                          className={`rounded-full flex-shrink-0 ${index > 0 ? '-ml-2' : ''}`}
                                          onError={e => {
                                            const img =
                                              e.target as HTMLImageElement;
                                            img.src = '/placeholder.jpg';
                                          }}
                                        />
                                      )
                                    )}
                                    <span className="font-medium ml-1">
                                      {token.symbol}
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <Image
                                      src={
                                        TOKEN_METADATA[token.symbol]
                                          ?.thumbnail || '/placeholder.jpg'
                                      }
                                      alt={token.symbol}
                                      width={20}
                                      height={20}
                                      className="rounded-full flex-shrink-0"
                                      onError={e => {
                                        const img =
                                          e.target as HTMLImageElement;
                                        img.src = '/placeholder.jpg';
                                      }}
                                    />
                                    <span className="font-medium">
                                      {token.symbol}
                                    </span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap">
                              ~
                              {formatAmountFull(aptAmount, 'APT', {
                                decimals: 0,
                              })}
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap">
                              {aptPrice ? formatCurrency(usdValue, 'USD') : '—'}
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap">
                              {marketSharePercent}%
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
    </RootErrorBoundary>
  );
}

export { type LSTToken, type LSTSupplyData };
