'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DollarSign, AlertTriangle } from 'lucide-react';
import { GeistMono } from 'geist/font/mono';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  // Helper function to check if a token is bridged
  const isBridged = (symbol: string): boolean => {
    return (
      symbol.startsWith('lz') ||
      symbol.startsWith('wh') ||
      symbol.startsWith('ce') ||
      symbol === 'sUSDe' ||
      symbol === 'USDe' ||
      symbol === 'sUSDe/USDe'
    );
  };

  // Helper function to check if a token is native
  const isNative = (symbol: string): boolean => {
    return symbol === 'USDT' || symbol === 'USDC';
  };

  // Helper function to check if a token is algorithmic
  const isAlgorithmic = (symbol: string): boolean => {
    return (
      symbol === 'MOD' ||
      symbol === 'mUSD' ||
      symbol === 'sUSDe' ||
      symbol === 'USDe' ||
      symbol === 'sUSDe/USDe'
    );
  };

  // Get bridge info for display
  const getBridgeInfo = (
    symbol: string
  ): { type: string | null; icon: string | null; isOFT: boolean } => {
    if (symbol.startsWith('lz')) {
      return {
        type: 'LayerZero',
        icon: '/icons/protocols/lz.png',
        isOFT: false,
      };
    }
    if (symbol.startsWith('wh')) {
      return {
        type: 'Wormhole',
        icon: '/icons/protocols/wormhole.png',
        isOFT: false,
      };
    }
    if (symbol.startsWith('ce')) {
      return {
        type: 'Celer',
        icon: '/icons/protocols/celer.jpg',
        isOFT: false,
      };
    }
    if (symbol === 'sUSDe' || symbol === 'USDe' || symbol === 'sUSDe / USDe') {
      return {
        type: 'LayerZero',
        icon: '/icons/protocols/lz.png',
        isOFT: true,
      };
    }
    return { type: null, icon: null, isOFT: false };
  };

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
      // Debug log for MOD to understand the issue
      if (symbol === 'MOD') {
        console.log('MOD formatSingle:', {
          input: s,
          isRaw,
          symbol,
          inputAsBigInt: BigInt(s).toString(),
          inputAsNumber: Number(s),
        });
      }

      const supplyVal = BigInt(s);

      // Convert raw units to dollars if dealing with raw supply
      let dollars: number;
      if (isRaw) {
        // Use correct decimals for each token
        if (symbol === 'mUSD' || symbol === 'MOD') {
          dollars = Number(supplyVal) / 100_000_000; // 8 decimals
          if (symbol === 'MOD') {
            console.log('MOD calculation:', {
              supplyVal: supplyVal.toString(),
              divisor: 100_000_000,
              result: dollars,
            });
          }
        } else {
          dollars = Number(supplyVal) / 1_000_000; // 6 decimals (default)
        }
      } else {
        // If not raw, the value is already in whole units
        dollars = Number(supplyVal);
      }

      // Debug log the calculated dollars for MOD
      if (symbol === 'MOD') {
        console.log('MOD final dollars:', dollars);
      }

      // Apply sUSDe price multiplier if available and token is sUSDe
      if (symbol === 'sUSDe' && susdePrice && susdePrice > 0) {
        dollars = dollars * susdePrice;
      }

      // Final debug log for MOD before formatting
      if (symbol === 'MOD') {
        console.log('MOD final formatting:', {
          dollars,
          formatted:
            dollars >= 1_000
              ? `$${(dollars / 1_000).toFixed(1)}k`
              : `$${dollars.toFixed(0)}`,
        });
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

      // Debug log for MOD
      if (token.symbol === 'MOD') {
        console.log('MOD calcFormattedDisplay:', {
          token,
          supply_raw: token.supply_raw,
          supply: token.supply,
          hasSupplyRaw: !!token.supply_raw,
        });
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
  const bridgeInfo = getBridgeInfo(cardSymbol);

  const handleCardClick = useCallback(() => {
    if (metadata) {
      setIsDialogOpen(true);
    }
  }, [metadata]);

  return (
    <>
      <div
        className="bg-card border rounded-lg overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors relative"
        onClick={handleCardClick}
      >
        <div className="h-1" style={{ backgroundColor: tokenColor }} />
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {bridgeInfo.icon && (
            <div className="relative w-6 h-6 rounded-full overflow-hidden bg-white dark:bg-gray-800 p-0.5 shadow-sm">
              <Image
                src={bridgeInfo.icon}
                alt={bridgeInfo.type || 'Bridge'}
                width={20}
                height={20}
                className="object-contain w-full h-full rounded-full"
              />
            </div>
          )}
        </div>
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

  // Use direct API call for stables data
  const [stablesData, setStablesData] = useState<{ data: any } | null>(null);
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
      setStablesError(
        error instanceof Error ? error : new Error(String(error))
      );
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

  // Helper function to check if a token is bridged
  const isBridgedToken = (symbol: string): boolean => {
    // Check for bridge suffixes (.lz, .wh, .ce) or Ethena tokens
    return (
      symbol.includes('.lz') ||
      symbol.includes('.wh') ||
      symbol.includes('.ce') ||
      symbol === 'sUSDe' ||
      symbol === 'USDe' ||
      symbol === 'sUSDe / USDe'
    );
  };

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

    // Calculate raw total for market share calculations (using dollar values)
    let rawTotalValue = BigInt(0);
    for (const token of supplies) {
      // Use the supply field which is already in dollar units
      const dollarSupply = token.supply || '0';
      rawTotalValue += BigInt(dollarSupply);
    }

    // Calculate adjusted total for display purposes (with sUSDe price)
    let adjustedTotalValue = BigInt(0);
    for (const token of supplies) {
      // Use the supply field which is already in dollar units
      const dollarSupply = token.supply || '0';
      let tokenValue = BigInt(dollarSupply);
      if (token.symbol === 'sUSDe' && susdePrice !== 1) {
        // Convert to a scaled integer value for BigInt math
        const priceScaled = Math.round(susdePrice * 1000000);
        tokenValue = (tokenValue * BigInt(priceScaled)) / BigInt(1000000);
      }
      adjustedTotalValue += tokenValue;
    }

    const formatTotal = () => {
      // adjustedTotalValue is already in dollars
      const dollars = Number(adjustedTotalValue);
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
          symbol: 'sUSDe/USDe',
          isCombined: true,
          supply: ethenaComponents
            .reduce((acc, curr) => {
              // Use the supply field which is already in dollar units
              const dollarSupply = curr.supply || '0';
              return acc + BigInt(dollarSupply);
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

      // Sort all tokens by dollar supply value and filter out zero supply
      return displayTokens
        .filter(token => token.supply !== '0')
        .sort((a, b) => {
          // Use the supply field which contains the dollar value
          const supplyA = BigInt(a.supply || '0');
          const supplyB = BigInt(b.supply || '0');
          return supplyB > supplyA ? 1 : supplyB < supplyA ? -1 : 0;
        });
    };

    // Calculate raw total for TokenCard market share calculations
    // Need to normalize to 6 decimals for tokens with 8 decimals
    let rawSupplyTotal = BigInt(0);
    for (const token of supplies) {
      const rawSupply = BigInt(token.supply_raw || token.supply || '0');
      // Normalize 8-decimal tokens to 6 decimals
      if (token.symbol === 'MOD' || token.symbol === 'mUSD') {
        rawSupplyTotal += rawSupply / BigInt(100); // Convert from 8 to 6 decimals
      } else {
        rawSupplyTotal += rawSupply;
      }
    }

    return {
      formattedTotalSupply: formatTotal(),
      processedSupplies: processSupplies(),
      adjustedTotal: rawSupplyTotal.toString(),
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
                  {/* Show first 3 cards */}
                  {processedSupplies.slice(0, 3).map(token => (
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
                      data={processedSupplies}
                      totalSupply={adjustedTotal}
                      tokenMetadata={TOKEN_METADATA}
                      susdePrice={cmcData?.price}
                    />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Remaining cards below */}
              {processedSupplies.length > 3 && (
                <div className="mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {processedSupplies.slice(3).map(token => (
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

              {/* Asset Details Table */}
              <div className="mt-8 w-full overflow-hidden">
                <hr className="border-t border-border mb-6" />
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px] sm:min-w-[150px]">
                          {t('table.token', 'Token')}
                        </TableHead>
                        <TableHead className="min-w-[100px] sm:min-w-[120px]">
                          {t('table.supply', 'Supply')}
                        </TableHead>
                        <TableHead className="min-w-[50px] sm:min-w-[60px]">
                          {t('table.market_share', '%')}
                        </TableHead>
                        <TableHead className="min-w-[100px] sm:min-w-[140px]">
                          {t('table.type', 'Type')}
                        </TableHead>
                        <TableHead className="min-w-[80px] sm:min-w-[100px]">
                          {t('table.issuer', 'Issuer')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedSupplies.map(token => {
                        const metadata =
                          TOKEN_METADATA[token.symbol] ||
                          (token.symbol === 'sUSDe/USDe'
                            ? TOKEN_METADATA['sUSDe']
                            : null);
                        // Calculate total supply in dollars for percentage calculation
                        const totalDollarSupply = processedSupplies.reduce(
                          (sum, t) => sum + Number(t.supply),
                          0
                        );
                        const marketSharePercent = (
                          (Number(token.supply) / totalDollarSupply) *
                          100
                        ).toFixed(2);
                        const tokenColor =
                          'isCombined' in token && token.isCombined
                            ? TOKEN_COLORS['USDe'] || TOKEN_COLORS.default
                            : TOKEN_COLORS[token.symbol] ||
                              TOKEN_COLORS.default;

                        return (
                          <TableRow key={token.symbol}>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {'isCombined' in token && token.isCombined ? (
                                  <div className="flex items-center gap-1">
                                    <Image
                                      src={
                                        TOKEN_METADATA['sUSDe']?.thumbnail ||
                                        '/placeholder.jpg'
                                      }
                                      alt="sUSDe"
                                      width={20}
                                      height={20}
                                      className="rounded-full flex-shrink-0"
                                    />
                                    <Image
                                      src={
                                        TOKEN_METADATA['USDe']?.thumbnail ||
                                        '/placeholder.jpg'
                                      }
                                      alt="USDe"
                                      width={20}
                                      height={20}
                                      className="rounded-full -ml-2 flex-shrink-0"
                                    />
                                    <span className="font-medium ml-1">
                                      {token.symbol}
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <Image
                                      src={
                                        metadata?.thumbnail ||
                                        '/placeholder.jpg'
                                      }
                                      alt={token.symbol}
                                      width={20}
                                      height={20}
                                      className="rounded-full flex-shrink-0"
                                    />
                                    <span className="font-medium">
                                      {token.symbol}
                                    </span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap">
                              $
                              {Number(token.supply).toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap">
                              {marketSharePercent}%
                            </TableCell>
                            <TableCell className="text-sm">
                              {metadata?.type
                                ?.replace(/\s*\(.*?\)\s*/g, '')
                                .trim() || '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {metadata?.issuer?.split(' ')[0] || '-'}
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

export { TOKEN_METADATA, type Token, type DisplayToken, type SupplyData };
