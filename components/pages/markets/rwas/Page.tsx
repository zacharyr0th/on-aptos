"use client";

import { GeistMono } from "geist/font/mono";
import { AlertTriangle, Copy } from "lucide-react";
import Image from "next/image";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
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
import { RWA_COLORS, RWA_TOKEN_BY_TICKER } from "@/lib/constants";
import { usePageTranslation } from "@/lib/hooks/useTranslation";
import { formatCurrency, formatLargeNumber, formatPercentage } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils/clipboard";
import {
  ChartDataItem,
  calculateMarketShare,
  darkenColor,
  formatAssetValue,
} from "@/lib/utils/format/chart-utils";
import { truncateAddress } from "../../shared/utils";

// Consolidated provider mapping
const PROVIDER_MAPPINGS = {
  // Direct asset-to-provider mapping (takes precedence)
  assets: {
    BUIDL: "BlackRock",
    BENJI: "F. Templeton",
    USDY: "Ondo",
    UMA: "Libre Capital",
    BHMA: "Libre Capital",
    HLSPCA: "Libre Capital",
    ACRED: "Securitize",
    "BSFG-EM-1": "Pact",
    "BSFG-EM-NPA-1": "Pact",
    "BSFG-EM-NPA-2": "Pact",
    "BSFG-CAD-1": "Pact",
    "BSFG-KES-1": "Pact",
    "BSFG-AD-1": "Pact",
  },
  // Protocol-based mapping (fallback)
  protocols: {
    pact: "Pact",
    securitize: "Securitize",
    "franklin-templeton-benji-investments": "F. Templeton",
    "libre-capital": "Libre Capital",
    ondo: "Ondo",
  },
  // Provider logos
  logos: {
    Pact: "/icons/rwas/pact.webp",
    BlackRock: "/icons/rwas/blackrock.webp",
    "F. Templeton": "/icons/rwas/ft.jpeg",
    Securitize: "/icons/rwas/securitize.webp",
    "Libre Capital": "/icons/rwas/libre.webp",
    Ondo: "/icons/rwas/ondo.jpeg",
  },
};

// Map asset ticker to actual provider
const getActualProvider = (assetTicker: string, protocolName: string): string => {
  return (
    (PROVIDER_MAPPINGS.assets as any)[assetTicker] ||
    (PROVIDER_MAPPINGS.protocols as any)[protocolName] ||
    protocolName
  );
};

// Get logo based on actual provider
const getLogoUrl = (protocolName: string, assetTicker: string): string => {
  const provider = getActualProvider(assetTicker, protocolName);
  return (PROVIDER_MAPPINGS.logos as any)[provider] || "/icons/rwas/pact.webp";
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
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate token data
  const tokenData = useMemo(() => {
    const marketSharePercent = calculateMarketShare(protocol.totalValue, totalValue);
    return {
      marketSharePercent: formatPercentage(marketSharePercent),
      formattedValue: formatLargeNumber(protocol.totalValue),
    };
  }, [protocol.totalValue, totalValue]);

  // Get base color and apply TVL-based darkening based on overall ranking
  const baseColor = RWA_COLORS[protocol.assetTicker] || RWA_COLORS.default;

  // Find this protocol's rank among all protocols (sorted by TVL)
  const sortedProtocols = [...allProtocols].sort((a, b) => b.totalValue - a.totalValue);
  const protocolRank = sortedProtocols.findIndex((p) => p.id === protocol.id);
  const darkenFactor =
    allProtocols.length > 1 ? (protocolRank * 0.15) / (allProtocols.length - 1) : 0;
  const cardColor = darkenColor(baseColor, darkenFactor);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  return (
    <>
      <div className="group">
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
              className={`object-contain rounded-full ${!imageLoaded ? "opacity-0" : ""}`}
              onLoad={handleImageLoad}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = "/placeholder.jpg";
                handleImageLoad();
              }}
            />
          </div>
          <h3 className="text-base font-semibold">{protocol.assetTicker}</h3>
        </div>
        <p className="text-lg font-bold font-mono mb-0.5">{tokenData.formattedValue}</p>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-muted-foreground">{t("rwas:stats.market_share")}</span>
          <span className="text-xs text-muted-foreground font-mono">
            {tokenData.marketSharePercent}%
          </span>
        </div>
        <Progress className="h-1" value={parseFloat(tokenData.marketSharePercent)} />
      </div>
    </>
  );
});

const LoadingState = memo(function LoadingState(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Mobile: Show total value skeleton at top */}
      <div className="md:hidden mb-6">
        <div className="flex items-start justify-between mb-1">
          <Skeleton className="h-4 w-24" />
          <div className="text-right">
            <Skeleton className="h-3 w-16 mb-1" />
            <div className="flex items-center gap-1 justify-end">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
        <Skeleton className="h-7 w-32" />
      </div>

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
            {t("rwas:loading.error_title")}
          </h3>
          {status && (
            <p className="text-muted-foreground text-sm mb-1">HTTP error! Status: {status}</p>
          )}

          {isCustomMessage ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{t("rwas:loading.rate_limit_message")}</span>
              {countdown > 0 && (
                <span className="text-muted-foreground">{t("rwas:loading.try_again_in")}</span>
              )}
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="h-8 px-3"
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}s` : t("rwas:loading.try_again")}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {t("rwas:loading.request_failed")}
              <Button onClick={onRetry} variant="outline" className="ml-3" size="sm">
                {t("rwas:loading.try_again")}
              </Button>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

function RWAsPage(): React.ReactElement {
  const { t } = usePageTranslation("rwas");

  // Fetch real-time RWA data using direct API call
  const [rwaResponse, setRwaResponse] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rwaError, setRwaError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchRwaData = useCallback(async () => {
    try {
      setIsFetching(true);
      setRwaError(null);

      const response = await fetch("/api/aptos/rwa", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      // Extract the data from the response wrapper
      const data = responseData.data || responseData;
      setRwaResponse(data);
    } catch (error) {
      setRwaError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  // Fetch data once on mount, then rely on daily cache refresh
  useEffect(() => {
    fetchRwaData();
  }, [fetchRwaData]);

  // Extract data - RWA API returns direct response
  const data: any = rwaResponse || null;
  const loading = isLoading;
  const error = rwaError?.message || null;
  const refreshing = isFetching && !isLoading;

  // Manual refresh handler for user-triggered refresh only
  const fetchSupplyData = useCallback(async (): Promise<void> => {
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
      tokenAddress: protocol.tokenAddress || protocol.address || "",
    }));
  }, [data]);
  const totalRWAValue = data?.totalAptosValue || 0;

  // Process data for display
  const processedData = useMemo(() => {
    if (!protocols.length) return null;

    // Sort by value (largest first)
    const sortedProtocols = [...protocols].sort((a, b) => b.totalValue - a.totalValue);

    return {
      protocols: sortedProtocols,
      totalValue: totalRWAValue,
      assetCount: sortedProtocols.length,
    };
  }, [protocols, totalRWAValue]);

  const handleRetry = useCallback(() => {
    fetchSupplyData();
  }, [fetchSupplyData]);

  return (
    <ErrorBoundary>
      <div className={`min-h-screen flex flex-col relative ${GeistMono.className}`}>
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
                <div className="flex items-start justify-between mb-1">
                  <h2 className="text-sm text-muted-foreground">Total Value</h2>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>Powered by</div>
                    <div className="flex items-center gap-1 justify-end">
                      <Image
                        src="/icons/rwas/rwa.webp"
                        alt="RWA.xyz"
                        width={16}
                        height={16}
                        className="object-contain rounded-full"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = "/placeholder.jpg";
                        }}
                      />
                      <span className="font-medium">RWA.xyz</span>
                    </div>
                  </div>
                </div>
                <p className="text-xl font-bold font-mono">
                  {formatLargeNumber(processedData.totalValue)}
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
                  {/* Total value and RWA.xyz branding in top right corner - desktop only */}
                  <div className="absolute top-4 right-4 z-10 text-right hidden md:block">
                    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mb-2">
                      <span>Powered by</span>
                      <div className="flex items-center gap-1">
                        <Image
                          src="/icons/rwas/rwa.webp"
                          alt="RWA.xyz"
                          width={16}
                          height={16}
                          className="object-contain rounded-full"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = "/placeholder.jpg";
                          }}
                        />
                        <span className="font-medium">RWA.xyz</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-end gap-3 mb-1">
                        <h2 className="text-sm text-muted-foreground">Total Value</h2>
                      </div>
                      <p className="text-lg font-bold font-mono">
                        {formatLargeNumber(processedData.totalValue)}
                      </p>
                    </div>
                  </div>

                  <ErrorBoundary
                    fallback={
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center p-4">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                          <p className="text-sm text-muted-foreground">
                            {t("rwas:loading.chart_error")}
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <MarketShareChart
                      data={processedData.protocols.map((protocol: any) => ({
                        name: protocol.assetTicker,
                        value: calculateMarketShare(protocol.totalValue, processedData.totalValue),
                        formattedSupply: formatLargeNumber(protocol.totalValue),
                        color: RWA_COLORS[protocol.assetTicker] || RWA_COLORS.default,
                        provider: getActualProvider(protocol.assetTicker, protocol.protocol),
                      }))}
                      totalValue={processedData.totalValue}
                      colors={RWA_COLORS}
                      topRightContent={
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mb-2">
                            <span>Powered by</span>
                            <div className="flex items-center gap-1">
                              <Image
                                src="/icons/rwas/rwa.webp"
                                alt="RWA.xyz"
                                width={16}
                                height={16}
                                className="object-contain rounded-full"
                              />
                              <span className="font-medium">RWA.xyz</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-end gap-3 mb-1">
                              <h2 className="text-sm text-muted-foreground">Total Value</h2>
                            </div>
                            <p className="text-lg font-bold font-mono">
                              {formatLargeNumber(processedData.totalValue)}
                            </p>
                          </div>
                        </div>
                      }
                    />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Remaining cards below the chart */}
              {processedData.protocols && processedData.protocols.length > 4 && (
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
                        <TableHead className="min-w-[120px] sm:min-w-[150px]">Asset</TableHead>
                        <TableHead className="min-w-[140px] sm:min-w-[160px] hidden sm:table-cell">
                          Type
                        </TableHead>
                        <TableHead className="min-w-[140px] sm:min-w-[160px] hidden sm:table-cell">
                          Address
                        </TableHead>
                        <TableHead className="min-w-[100px] sm:min-w-[120px]">Supply</TableHead>
                        <TableHead className="min-w-[60px] sm:min-w-[80px] text-right">%</TableHead>
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
                                  src={getLogoUrl(protocol.protocol, protocol.assetTicker)}
                                  alt={protocol.name}
                                  width={20}
                                  height={20}
                                  className="rounded-full flex-shrink-0"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.src = "/placeholder.jpg";
                                  }}
                                />
                                <span className="font-medium">{protocol.assetTicker}</span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap hidden sm:table-cell">
                              <span className="text-sm text-muted-foreground">
                                {protocol.assetClass?.name || protocol.assetClass || "RWA"}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap hidden sm:table-cell">
                              {protocol.tokenAddress ? (
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      protocol.tokenAddress,
                                      `${protocol.assetTicker} address`
                                    )
                                  }
                                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                                  title={`Copy ${protocol.assetTicker} address`}
                                >
                                  <span className="font-mono">
                                    {truncateAddress(protocol.tokenAddress)}
                                  </span>
                                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap">
                              {formatCurrency(protocol.totalValue, "USD", {
                                decimals: 0,
                              })}
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
      </div>
    </ErrorBoundary>
  );
}

export default RWAsPage;
export { RWA_TOKEN_BY_TICKER as TOKEN_METADATA };
