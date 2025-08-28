"use client";

import { GeistMono } from "geist/font/mono";
import { AlertTriangle, Copy, RefreshCw } from "lucide-react";
import Image from "next/image";
import React, { useState, useMemo, useCallback, memo, useEffect } from "react";
import { copyToClipboard } from "@/lib/utils/clipboard";

import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { useAptPrice } from "@/components/pages/portfolio/hooks/useAptPrice";
import { MarketShareChart } from "@/components/shared/MarketShareChart";
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
import { usePageTranslation } from "@/hooks/useTranslation";
import { LST_COLORS } from "@/lib/constants/ui/colors";
import { formatCurrency, formatAmount, formatAmountFull } from "@/lib/utils";
import { logger } from "@/lib/utils/core/logger";

import type { LSTTokenSupply } from "./types";

// LST Token metadata with individual token-specific icons
const LST_TOKEN_METADATA: Record<string, any> = {
  amAPT: {
    name: "Amnis APT",
    protocol: "Amnis",
    type: "Auto-compounding LST",
    thumbnail: "/icons/protocols/amnis.avif",
  },
  stAPT: {
    name: "Staked APT",
    protocol: "Amnis",
    type: "Liquid Staking Token",
    thumbnail: "/icons/protocols/amnis.avif",
  },
  thAPT: {
    name: "Thala APT",
    protocol: "Thala",
    type: "Liquid Staking Token",
    thumbnail: "/icons/protocols/thala.avif",
  },
  sthAPT: {
    name: "Staked Thala APT",
    protocol: "Thala",
    type: "Staked LST",
    thumbnail: "/icons/protocols/thala.avif",
  },
  kAPT: {
    name: "Kofi APT",
    protocol: "Kofi",
    type: "Liquid Staking Token",
    thumbnail: "/icons/protocols/kofi.avif",
  },
  stkAPT: {
    name: "Staked Kofi APT",
    protocol: "Kofi",
    type: "Staked LST",
    thumbnail: "/icons/protocols/kofi.avif",
  },
  truAPT: {
    name: "Trustake APT",
    protocol: "Trustake",
    type: "Liquid Staking Token",
    thumbnail: "/icons/apt.png",
  },
};

// Helper function to truncate address for display
const truncateAddress = (address: string): string => {
  if (!address) return "";
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
};

// copyToClipboard is imported from centralized utility

// Helper function to get protocol icon source
const getProtocolIcon = (protocol: string): string => {
  switch (protocol) {
    case "Amnis":
      return "/icons/protocols/amnis.avif";
    case "Thala":
      return "/icons/protocols/thala.avif";
    case "Kofi":
      return "/icons/protocols/kofi.avif";
    case "Trustake":
      return "/icons/apt.png";
    default:
      return "/icons/apt.png";
  }
};

// Ultra-optimized token card with comprehensive memoization
const TokenCard = memo(function TokenCard({
  token,
  totalAPT,
  aptPrice,
  t,
}: {
  token: LSTTokenSupply;
  totalAPT: number;
  aptPrice?: number;
  t: (key: string) => string;
}): React.ReactElement {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Consolidated token calculations with breakdown
  const tokenData = useMemo(() => {
    const aptValue = parseFloat(token.formatted_supply || "0");
    const usdValue = aptPrice ? aptValue * aptPrice : 0;
    const marketSharePercent = totalAPT > 0 ? (aptValue / totalAPT) * 100 : 0;

    // Format individual token breakdown for display
    const breakdown = (token as any).tokenBreakdown || [];
    const breakdownDisplay =
      breakdown.length > 1
        ? breakdown
            .map((t: any) =>
              formatAmount(parseFloat(t.formatted_supply), "APT", {
                decimals: 0,
              }),
            )
            .join(" / ")
        : formatAmount(aptValue, "APT", { decimals: 0 });

    return {
      marketSharePercent: marketSharePercent.toFixed(1),
      aptValue,
      usdValue,
      breakdownDisplay,
      breakdown,
    };
  }, [token, totalAPT, aptPrice]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  return (
    <>
      <div className="group">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 relative">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse rounded-full" />
              )}
              <Image
                src={getProtocolIcon(token.protocol)}
                alt={`${token.protocol} icon`}
                width={20}
                height={20}
                className={`object-contain rounded-full ${!imageLoaded ? "opacity-0" : ""}`}
                onLoad={handleImageLoad}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = "/icons/apt.png";
                  handleImageLoad();
                }}
              />
            </div>
            <h3 className="text-base font-semibold">{token.symbol}</h3>
          </div>
        </div>
        <p className="text-lg font-bold font-mono mb-0.5">
          {tokenData.breakdownDisplay}
          {aptPrice && (
            <span className="text-xs font-normal text-muted-foreground ml-2">
              ≈ {formatCurrency(tokenData.usdValue, "USD", { decimals: 0 })}
            </span>
          )}
        </p>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-muted-foreground">Market Share</span>
          <span className="text-xs text-muted-foreground font-mono">
            {tokenData.marketSharePercent}%
          </span>
        </div>
        <Progress
          className="h-1"
          value={parseFloat(tokenData.marketSharePercent)}
        />
      </div>
    </>
  );
});

// Loading state component
const LoadingState = memo(function LoadingState(): React.ReactElement {
  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-3 w-16 mb-2" />
              <div className="flex justify-between mb-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-1 w-full" />
            </div>
          ))}
        </div>
        <div className="md:col-span-1 lg:col-span-3 min-h-[250px] sm:min-h-[300px] relative">
          <Skeleton className="absolute inset-0" />
        </div>
      </div>
    </div>
  );
});

// Error state component
const CardErrorState = memo(function CardErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}): React.ReactElement {
  const statusMatch = error.match(/HTTP error! Status: (\d+)/);
  const status = statusMatch ? statusMatch[1] : null;
  const isCustomMessage = !error.startsWith("HTTP error!");

  const secondsMatch = error.match(/Try again in (\d+) seconds/);
  const initialSeconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;
  const [countdown, setCountdown] = useState(initialSeconds);

  React.useEffect(() => {
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
            Failed to load LST data
          </h3>
          {status && (
            <p className="text-muted-foreground text-sm mb-1">
              HTTP error! Status: {status}
            </p>
          )}

          {isCustomMessage ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                API rate limit reached. Data will refresh automatically.
              </span>
              {countdown > 0 && (
                <span className="text-muted-foreground">
                  Try again in {countdown}s
                </span>
              )}
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="h-8 px-3"
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}s` : "Try Again"}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Request failed. Please try again.
              <Button
                onClick={onRetry}
                variant="outline"
                className="ml-3"
                size="sm"
              >
                Try Again
              </Button>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

// LST Error State Component
const ErrorState = memo<{
  error: string;
  onRetry: () => void;
  t: any;
}>(({ error, onRetry, t }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
    <AlertTriangle className="h-12 w-12 text-destructive" />
    <div>
      <h3 className="text-lg font-semibold mb-2">Failed to load LST data</h3>
      <p className="text-muted-foreground max-w-md">{error}</p>
    </div>
    <Button onClick={onRetry} variant="outline">
      <RefreshCw className="h-4 w-4 mr-2" />
      Try Again
    </Button>
  </div>
));

ErrorState.displayName = "ErrorState";

export default function LSTPage(): React.ReactElement {
  const { t } = usePageTranslation("lst");

  const [lstSupplyData, setLstSupplyData] = useState<any | null>(null);
  const [lstSupplyLoading, setLstSupplyLoading] = useState(true);
  const [lstSupplyError, setLstSupplyError] = useState<Error | null>(null);
  const [lstSupplyFetching, setLstSupplyFetching] = useState(false);

  const fetchLstSupplyData = useCallback(async () => {
    try {
      setLstSupplyFetching(true);
      setLstSupplyError(null);

      const response = await fetch(`/api/aptos/lst?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch LST data: ${response.status}`);
      }

      const result = await response.json();
      setLstSupplyData(result.success ? result : result.data);
    } catch (error) {
      logger.error("Failed to fetch LST supply data:", error);
      setLstSupplyError(
        error instanceof Error ? error : new Error(String(error)),
      );
    } finally {
      setLstSupplyLoading(false);
      setLstSupplyFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchLstSupplyData();
  }, [fetchLstSupplyData]);

  const {
    aptPrice,
    error: aptPriceError,
    isLoading: aptPriceLoading,
  } = useAptPrice();

  const data: any = lstSupplyData || null;

  const loading = lstSupplyLoading || aptPriceLoading;
  const isRateLimited =
    lstSupplyError?.message?.includes("Rate limited") ||
    lstSupplyError?.message?.includes("429");
  const error = isRateLimited
    ? "API rate limit reached. Data will refresh automatically."
    : lstSupplyError?.message || (!aptPrice && aptPriceError) || null;
  const refreshing = lstSupplyFetching && !lstSupplyLoading;

  const fetchSupplyData = useCallback(async (): Promise<void> => {
    await fetchLstSupplyData();
  }, [fetchLstSupplyData]);

  const processedData = useMemo(() => {
    if (!data?.supplies) return null;

    const totalSupply = parseFloat(data.total || "0");
    const supplies = data.supplies.map((token: LSTTokenSupply) => ({
      ...token,
      // Calculate percentage based on supply
      percentage:
        totalSupply > 0
          ? (parseFloat(token.supply || "0") / totalSupply) * 100
          : 0,
    }));

    return {
      ...data,
      supplies: supplies.sort((a: any, b: any) => b.percentage - a.percentage),
    };
  }, [data]);

  const { totalAPT, totalUSD } = useMemo(() => {
    if (!processedData) return { totalAPT: 0, totalUSD: 0 };

    const totalAPTValue = parseFloat(
      processedData.total_supply_formatted || processedData.total || "0",
    );
    const totalUSDValue = aptPrice ? totalAPTValue * aptPrice : 0;

    return {
      totalAPT: totalAPTValue,
      totalUSD: totalUSDValue,
    };
  }, [processedData, aptPrice]);

  const handleRetry = useCallback(() => {
    fetchSupplyData();
  }, [fetchSupplyData]);

  // Debug logging
  React.useEffect(() => {
    logger.info("LST Page Render State:", {
      loading,
      error,
      hasProcessedData: !!processedData,
      hasSupplies: !!processedData?.supplies,
      suppliesLength: processedData?.supplies?.length || 0,
      aptPrice,
      totalAPT,
      totalUSD,
    });
  }, [loading, error, processedData, aptPrice, totalAPT, totalUSD]);

  return (
    <ErrorBoundary>
      <div
        className={`min-h-screen flex flex-col relative ${GeistMono.className}`}
      >
        {/* Background gradient removed - using global textured background */}

        <div className="fixed top-0 left-0 right-0 h-1 z-30">
          {refreshing && <div className="h-full bg-muted animate-pulse"></div>}
        </div>

        <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 flex-1 relative">
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
                  {aptPrice && (
                    <div className="flex items-center gap-1.5">
                      <Image
                        src="/icons/apt.png"
                        alt="APT"
                        width={16}
                        height={16}
                        className="object-contain dark:invert"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = "/placeholder.jpg";
                        }}
                      />
                      <span className="text-sm text-muted-foreground font-mono">
                        {formatCurrency(aptPrice, "USD", {
                          decimals: 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-lg font-bold font-mono">
                  {formatAmountFull(totalAPT, "APT", { decimals: 0 })}
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
                  {processedData?.supplies?.map((token: LSTTokenSupply) => (
                    <TokenCard
                      key={token.symbol}
                      token={token}
                      totalAPT={totalAPT}
                      aptPrice={aptPrice || undefined}
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
                      data={processedData.supplies.map(
                        (token: LSTTokenSupply) => {
                          const aptValue = parseFloat(
                            token.formatted_supply || "0",
                          );
                          const marketSharePercent =
                            totalAPT > 0 ? (aptValue / totalAPT) * 100 : 0;

                          const color =
                            LST_COLORS[token.symbol] || LST_COLORS.default;

                          return {
                            name: token.symbol,
                            value: marketSharePercent,
                            formattedSupply: formatAmount(aptValue, "APT"),
                            color,
                          };
                        },
                      )}
                      totalValue={totalUSD || 0}
                      colors={LST_COLORS}
                      topRightContent={
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-3 mb-1">
                            <h2 className="text-sm text-muted-foreground">
                              Total Supply
                            </h2>
                            {aptPrice && (
                              <div className="flex items-center gap-1.5">
                                <Image
                                  src="/icons/apt.png"
                                  alt="APT"
                                  width={16}
                                  height={16}
                                  className="object-contain dark:invert"
                                />
                                <span className="text-sm text-muted-foreground font-mono">
                                  {formatCurrency(aptPrice, "USD", {
                                    decimals: 2,
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-lg font-bold font-mono">
                            {formatAmountFull(totalAPT, "APT", { decimals: 0 })}
                            {totalUSD && (
                              <span className="text-sm font-normal text-muted-foreground ml-2 font-mono">
                                ≈{" "}
                                {formatCurrency(totalUSD, "USD", {
                                  decimals: 0,
                                })}
                              </span>
                            )}
                          </p>
                        </div>
                      }
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
                        <TableHead className="min-w-[100px] sm:min-w-[180px] hidden sm:table-cell">
                          Protocol
                        </TableHead>
                        <TableHead className="min-w-[140px] sm:min-w-[160px] hidden sm:table-cell">
                          Type
                        </TableHead>
                        <TableHead className="min-w-[100px] sm:min-w-[120px]">
                          Supply
                        </TableHead>
                        <TableHead className="min-w-[60px] sm:min-w-[80px] text-right">
                          %
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData?.supplies?.map((token: LSTTokenSupply) => {
                        const aptAmount = parseFloat(
                          token.formatted_supply || "0",
                        );
                        const marketSharePercent =
                          totalAPT > 0
                            ? ((aptAmount / totalAPT) * 100).toFixed(2)
                            : "0.00";

                        // Format breakdown display for table
                        const breakdown = (token as any).tokenBreakdown || [];
                        const breakdownDisplay =
                          breakdown.length > 1
                            ? breakdown
                                .map((t: any) =>
                                  formatAmount(
                                    parseFloat(t.formatted_supply),
                                    "APT",
                                    { decimals: 0 },
                                  ),
                                )
                                .join(" / ")
                            : formatAmount(aptAmount, "APT", { decimals: 0 });

                        return (
                          <TableRow key={token.symbol}>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-1.5 md:gap-2">
                                <Image
                                  src={getProtocolIcon(token.protocol)}
                                  alt={token.protocol}
                                  width={16}
                                  height={16}
                                  className="rounded-full flex-shrink-0 md:w-5 md:h-5"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.src = "/icons/apt.png";
                                  }}
                                />
                                <span className="font-medium">
                                  {token.symbol}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap hidden sm:table-cell">
                              <span className="text-sm text-muted-foreground">
                                {token.protocol}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap hidden sm:table-cell">
                              <span className="text-sm text-muted-foreground">
                                {breakdown.length > 1 ? "Combined LSTs" : "LST"}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap">
                              {breakdownDisplay}
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap text-right">
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
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
              <p className="text-muted-foreground">No LST data available</p>
              <Button onClick={handleRetry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
