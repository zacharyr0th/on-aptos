"use client";

import { GeistMono } from "geist/font/mono";
import { AlertTriangle } from "lucide-react";
import Image from "next/image";
import React, { useState, useMemo, useCallback, memo, useEffect } from "react";

import { logger } from "@/lib/utils/logger";

import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { Footer } from "@/components/layout/Footer";
import { MarketShareChart, TOKEN_COLORS } from "@/components/pages/btc/Chart";
import { TokenDialog } from "@/components/pages/btc/Dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBitcoinPrice } from "@/hooks/useMarketPrice";
import { usePageTranslation } from "@/hooks/useTranslation";
import { BTC_METADATA, Token } from "@/lib/config";
import {
  formatCurrency,
  formatAmount,
  formatAmountFull,
  formatPercentage,
} from "@/lib/utils";

// Removed unused imports
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

  // Simple calculations using formatted_supply from API
  const tokenData = useMemo(() => {
    const metadata = TOKEN_METADATA[token.symbol];

    // Use the formatted_supply directly from the API (already converted)
    const btcValue = parseFloat(token.formatted_supply || "0");

    // Calculate USD value if Bitcoin price is available
    const usdValue = bitcoinPrice ? btcValue * bitcoinPrice : 0;

    // Calculate market share for this token
    const marketSharePercent = totalBTC > 0 ? (btcValue / totalBTC) * 100 : 0;

    return {
      marketSharePercent: marketSharePercent.toFixed(1),
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
      <div className="group cursor-pointer" onClick={handleCardClick}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 relative">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse rounded-full" />
            )}
            <Image
              src={
                token.symbol === "WBTC"
                  ? "/icons/btc/WBTC.png"
                  : tokenData.metadata?.thumbnail || "/placeholder.jpg"
              }
              alt={`${token.symbol} icon`}
              width={20}
              height={20}
              className={`object-contain rounded-full ${!imageLoaded ? "opacity-0" : ""}`}
              onLoad={handleImageLoad}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = "/placeholder.jpg";
                handleImageLoad();
              }}
            />
          </div>
          <h3 className="text-base font-semibold">{token.symbol}</h3>
        </div>
        <p className="text-lg font-bold font-mono mb-0.5">
          {formatAmount(tokenData.btcValue, "BTC")}
          {bitcoinPrice && (
            <span className="text-xs font-normal text-muted-foreground ml-2">
              ≈ {formatCurrency(tokenData.usdValue, "USD", { decimals: 0 })}
            </span>
          )}
        </p>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-muted-foreground">
            {t("btc:stats.market_share")}
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
      {/* Mobile: Show total supply skeleton at top */}
      <div className="md:hidden mb-6">
        <div className="flex items-center justify-between mb-1">
          <Skeleton className="h-4 w-24" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <Skeleton className="h-7 w-32" />
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Token cards skeleton */}
        <div className="md:col-span-1 space-y-6">
          {[1, 2, 3, 4].map((i) => (
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

        {/* Chart skeleton - no container */}
        <div className="md:col-span-1 lg:col-span-3 min-h-[250px] sm:min-h-[300px] relative">
          <Skeleton className="absolute inset-0" />
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
  const isCustomMessage = !error.startsWith("HTTP error!");

  // Extract seconds from error message for countdown
  const secondsMatch = error.match(/Try again in (\d+) seconds/);
  const initialSeconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;
  const [countdown, setCountdown] = useState(initialSeconds);

  React.useEffect(() => {
    // Only start countdown if we have seconds to count down from
    if (initialSeconds <= 0) return;

    setCountdown(initialSeconds);

    const timer = setInterval(() => {
      setCountdown((prev) => {
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
            {t("btc:loading.error_title")}
          </h3>
          {status && (
            <p className="text-muted-foreground text-sm mb-1">
              HTTP error! Status: {status}
            </p>
          )}

          {isCustomMessage ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {t("btc:loading.rate_limit_message")}
              </span>
              {countdown > 0 && (
                <span className="text-muted-foreground">
                  {t("btc:loading.try_again_in")}
                </span>
              )}
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="h-8 px-3"
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}s` : t("btc:loading.try_again")}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {t("btc:loading.request_failed")}
              <Button
                onClick={onRetry}
                variant="outline"
                className="ml-3"
                size="sm"
              >
                {t("btc:loading.try_again")}
              </Button>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default function BitcoinPage(): React.ReactElement {
  const { t } = usePageTranslation("btc");

  // Use direct API call for BTC supply data
  const [btcSupplyData, setBtcSupplyData] = useState<{ data: any } | null>(
    null,
  );
  const [btcSupplyLoading, setBtcSupplyLoading] = useState(true);
  const [btcSupplyError, setBtcSupplyError] = useState<Error | null>(null);
  const [btcSupplyFetching, setBtcSupplyFetching] = useState(false);

  const fetchBtcSupplyData = useCallback(async () => {
    try {
      setBtcSupplyFetching(true);
      setBtcSupplyError(null);

      const response = await fetch(`/api/aptos/btc?t=${Date.now()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-cache",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      logger.info("[BTC Page] API Response:", data);

      // Check if the response has an error
      if (data.error) {
        throw new Error(data.error);
      }

      setBtcSupplyData(data);
    } catch (error) {
      logger.error("[BTC Page] Error fetching data:", error);
      setBtcSupplyError(
        error instanceof Error ? error : new Error(String(error)),
      );
    } finally {
      setBtcSupplyLoading(false);
      setBtcSupplyFetching(false);
    }
  }, []);

  // Fetch data once on mount, then rely on daily cache refresh
  useEffect(() => {
    fetchBtcSupplyData();
  }, [fetchBtcSupplyData]);

  // Use our Bitcoin price hook as fallback only
  const {
    data: bitcoinPriceHookData,
    error: bitcoinPriceError,
    loading: bitcoinPriceLoading,
  } = useBitcoinPrice();

  // Extract bitcoin price from price hook - NO FALLBACK, use real data only
  const bitcoinPriceData = useMemo(() => {
    logger.info("[BTC Page] bitcoinPriceHookData:", bitcoinPriceHookData);
    return bitcoinPriceHookData;
  }, [bitcoinPriceHookData]);

  // Extract the actual data from REST API responses - match stablecoin pattern
  const data: any = btcSupplyData?.data || null;

  const loading = btcSupplyLoading || bitcoinPriceLoading;
  const isRateLimited =
    btcSupplyError?.message?.includes("Rate limited") ||
    btcSupplyError?.message?.includes("429");
  const error = isRateLimited
    ? "API rate limit reached. Data will refresh automatically."
    : btcSupplyError?.message ||
      (!bitcoinPriceData && bitcoinPriceError) ||
      null;
  const refreshing = btcSupplyFetching && !btcSupplyLoading;

  // Manual refresh handler for user-triggered refresh only
  const fetchSupplyData = useCallback(async (): Promise<void> => {
    await fetchBtcSupplyData();
  }, [fetchBtcSupplyData]);

  // Simple data processing - just sort by formatted_supply
  const processedData = useMemo(() => {
    if (!data || !data.supplies || !Array.isArray(data.supplies)) {
      return null;
    }

    // Sort by BTC value (largest first) using formatted_supply
    const sortedSupplies = [...data.supplies].sort((a: any, b: any) => {
      const aValue = parseFloat(a.formatted_supply || "0");
      const bValue = parseFloat(b.formatted_supply || "0");
      return bValue - aValue;
    });

    return {
      ...data,
      supplies: sortedSupplies,
    };
  }, [data]);

  // Simple total calculation using API data
  const { totalBTC, totalUSD } = useMemo(() => {
    if (!processedData || !processedData.total) {
      return { totalBTC: 0, totalUSD: 0 };
    }

    // Use the total from the API directly
    const totalBTCValue = parseFloat(processedData.total || "0");
    const totalUSDValue = bitcoinPriceData?.price
      ? totalBTCValue * bitcoinPriceData.price
      : 0;

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

        <main className="container-layout py-6 flex-1 relative">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={handleRetry} t={t} />
          ) : processedData ? (
            <>
              {/* Mobile: Show total supply at top */}
              <div className="md:hidden mb-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm text-muted-foreground">
                    Total Supply
                  </h2>
                  {bitcoinPriceData?.price && (
                    <div className="flex items-center gap-1.5">
                      <Image
                        src="/icons/btc/bitcoin.png"
                        alt="Bitcoin"
                        width={16}
                        height={16}
                        className="object-contain"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = "/placeholder.jpg";
                        }}
                      />
                      <span className="text-sm text-muted-foreground font-mono">
                        {formatCurrency(bitcoinPriceData.price, "USD", {
                          decimals: 0,
                        })}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xl font-bold font-mono">
                  {formatAmountFull(totalBTC, "BTC", { decimals: 2 })}
                  {totalUSD && (
                    <span className="text-sm font-normal text-muted-foreground ml-2 font-mono">
                      ≈ {formatCurrency(totalUSD, "USD", { decimals: 0 })}
                    </span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Mobile: Show cards in 2 columns, Desktop: Show in 1 column on left */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-1 md:col-span-1 md:space-y-4">
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

                {/* Chart takes full width on mobile */}
                <div className="col-span-2 md:col-span-1 lg:col-span-3 min-h-[250px] sm:min-h-[300px] relative">
                  <ErrorBoundary
                    fallback={
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center p-4">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                          <p className="text-sm text-muted-foreground">
                            {t("btc:loading.chart_error")}
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <MarketShareChart
                      data={processedData.supplies}
                      tokenMetadata={TOKEN_METADATA}
                      bitcoinPrice={bitcoinPriceData?.price}
                      totalBTC={totalBTC}
                      totalUSD={totalUSD}
                    />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Asset Details Table */}
              <div className="mt-8 w-full overflow-hidden">
                <hr className="border-t border-border mb-6" />
                <div className="w-full overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left px-4 w-[120px] md:w-[150px]">
                          Token
                        </TableHead>
                        <TableHead className="px-4 w-[90px] md:w-[120px]">
                          <div className="flex justify-end text-right w-full">
                            Amount
                          </div>
                        </TableHead>
                        <TableHead className="px-4 w-[100px] md:w-[140px]">
                          <div className="flex justify-end text-right w-full">
                            Value
                          </div>
                        </TableHead>
                        <TableHead className="px-8 w-[60px] md:w-[80px] hidden md:table-cell">
                          <div className="flex justify-end text-right w-full">
                            %
                          </div>
                        </TableHead>
                        <TableHead className="px-4 w-[100px] md:w-[180px] hidden md:table-cell">
                          <div className="flex justify-end text-right w-full">
                            Type
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData?.supplies?.map((token: any) => {
                        const metadata = TOKEN_METADATA[token.symbol];
                        // Use formatted_supply directly from API
                        const btcAmount = parseFloat(
                          token.formatted_supply || "0",
                        );
                        const usdValue = bitcoinPriceData?.price
                          ? btcAmount * bitcoinPriceData.price
                          : 0;
                        const marketSharePercent =
                          totalBTC > 0
                            ? ((btcAmount / totalBTC) * 100).toFixed(2)
                            : "0.00";
                        const tokenColor =
                          TOKEN_COLORS[token.symbol] || TOKEN_COLORS.default;

                        return (
                          <TableRow key={token.symbol}>
                            <TableCell className="text-left px-4">
                              <div className="flex items-center gap-1.5 md:gap-2">
                                <Image
                                  src={
                                    token.symbol === "WBTC"
                                      ? "/icons/btc/WBTC.png"
                                      : metadata?.thumbnail ||
                                        "/placeholder.jpg"
                                  }
                                  alt={token.symbol}
                                  width={16}
                                  height={16}
                                  className="rounded-full flex-shrink-0 md:w-5 md:h-5"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.src = "/placeholder.jpg";
                                  }}
                                />
                                <span className="font-medium text-sm md:text-base">
                                  {token.symbol}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right px-4 font-mono text-sm md:text-base">
                              {formatAmount(btcAmount, "BTC", { decimals: 0 })}
                            </TableCell>
                            <TableCell className="text-right px-4 font-mono text-sm md:text-base">
                              {bitcoinPriceData?.price
                                ? formatCurrency(usdValue, "USD", {
                                    decimals: 0,
                                  })
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right px-8 font-mono text-sm md:text-base hidden md:table-cell">
                              {marketSharePercent}%
                            </TableCell>
                            <TableCell className="text-right px-4 text-sm md:text-base hidden md:table-cell">
                              {metadata?.type || "—"}
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

export { TOKEN_METADATA, type Token };
