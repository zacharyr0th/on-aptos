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
import type { DisplayToken, SupplyData, Token } from "@/lib/config/tokens";
import { STABLECOIN_METADATA } from "@/lib/config/tokens/stablecoins";
import { STABLECOIN_COLORS } from "@/lib/constants/ui/colors";
import { usePageTranslation } from "@/lib/hooks/useTranslation";
import { formatAmount } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { logger } from "@/lib/utils/core/logger";
import {
  ChartDataItem,
  calculateMarketShare,
  formatAssetValue,
} from "@/lib/utils/format/chart-utils";
import { truncateAddress } from "../../shared/utils";

const TOKEN_METADATA = STABLECOIN_METADATA;

const TokenCard = memo(function TokenCard({
  token,
  totalSupply,
  susdePrice,
  suppliesData = {},
  usdtReserve,
  t,
}: {
  token: DisplayToken;
  totalSupply: string;
  susdePrice?: number;
  suppliesData?: Record<string, string>;
  usdtReserve?: any;
  t: (key: string) => string;
}): React.ReactElement {
  const { marketSharePercent, formattedDisplaySupply } = useMemo(() => {
    const calcMarketShare = () => {
      if (BigInt(totalSupply) === 0n) return "0";
      // Use supply_raw for market share calculation (fallback to supply for compatibility)
      const rawSupply = token.supply_raw || token.supply || "0";
      let tokenSupply = BigInt(rawSupply);

      // Normalize 8-decimal tokens to 6 decimals to match totalSupply normalization
      if (token.symbol === "MOD" || token.symbol === "USDA") {
        tokenSupply = tokenSupply / BigInt(100); // Convert from 8 to 6 decimals
      }

      const total = BigInt(totalSupply);

      // Use more precise calculation to avoid rounding errors
      const percentage = (tokenSupply * 10000n) / total;
      return (Number(percentage) / 100).toFixed(2);
    };

    const formatSingle = (s: string, symbol: string, isRaw: boolean = true) => {
      const supplyVal = BigInt(s);

      // Convert raw units to dollars if dealing with raw supply
      let dollars: number;
      if (isRaw) {
        // Use correct decimals for each token
        const decimals = ["MOD", "USDA"].includes(symbol) ? 100_000_000 : 1_000_000;
        dollars = Number(supplyVal) / decimals;
      } else {
        dollars = Number(supplyVal);
      }

      // Apply sUSDe price multiplier if available and token is sUSDe
      if (symbol === "sUSDe" && susdePrice && susdePrice > 0) {
        dollars = dollars * susdePrice;
      }

      // Use consistent formatting function
      return formatCurrencyShort(dollars);
    };

    // Centralized currency formatting function
    const formatCurrencyShort = (dollars: number): string => {
      if (dollars >= 1_000_000_000) return `$${(dollars / 1_000_000_000).toFixed(1)}b`;
      if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}m`;
      if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}k`;
      return `$${dollars.toFixed(0)}`;
    };

    const calcFormattedDisplay = () => {
      if ("isCombined" in token && token.isCombined) {
        const parts = token.components.map((component) =>
          formatSingle(
            component.supply_raw || component.supply,
            component.symbol,
            !!component.supply_raw
          )
        );
        return parts.join(" / ");
      }

      return formatSingle(token.supply_raw || token.supply, token.symbol, !!token.supply_raw);
    };

    return {
      marketSharePercent: calcMarketShare(),
      formattedDisplaySupply: calcFormattedDisplay(),
    };
  }, [token, totalSupply, susdePrice]);

  const symbol = token.symbol;
  const metadata = TOKEN_METADATA[symbol];

  return (
    <>
      <div className="group">
        <div className="flex items-center gap-2 mb-2">
          {"isCombined" in token && token.isCombined ? (
            <div className="flex items-center">
              {[...token.components]
                .sort((a, b) => (BigInt(b.supply) > BigInt(a.supply) ? 1 : -1))
                .map((component, index) => (
                  <React.Fragment key={component.symbol}>
                    <div className="flex items-center">
                      <div className="w-5 h-5 relative flex-shrink-0 mr-1">
                        <Image
                          src={
                            (TOKEN_METADATA[component.symbol]?.thumbnail as string) ||
                            "/placeholder.jpg"
                          }
                          alt={`${component.symbol} icon`}
                          width={20}
                          height={20}
                          className="object-contain rounded-full"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = "/placeholder.jpg";
                          }}
                        />
                      </div>
                    </div>
                    {index === 0 && <span className="mx-1 text-muted-foreground">/</span>}
                  </React.Fragment>
                ))}
            </div>
          ) : (
            <div className="w-5 h-5 relative">
              <Image
                src={(metadata?.thumbnail as string) || "/placeholder.jpg"}
                alt={`${symbol} icon`}
                width={20}
                height={20}
                className="object-contain rounded-full"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = "/placeholder.jpg";
                }}
              />
            </div>
          )}
          <h3 className="text-base font-semibold">{symbol}</h3>
        </div>
        <div>
          <p className="text-lg font-bold font-mono mb-0.5">{formattedDisplaySupply}</p>
        </div>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-muted-foreground">{t("stables:stats.market_share")}</span>
          <span className="text-xs text-muted-foreground font-mono">{marketSharePercent}%</span>
        </div>
        <Progress className="h-1" value={Number(marketSharePercent)} />
      </div>
    </>
  );
});

const LoadingState = memo(function LoadingState(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Mobile: Show total supply skeleton at top */}
      <div className="md:hidden mb-6">
        <div className="flex items-center justify-between mb-1">
          <Skeleton className="h-4 w-24" />
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
            {t("stables:loading.error_title")}
          </h3>
          {status && (
            <p className="text-muted-foreground text-sm mb-1">HTTP error! Status: {status}</p>
          )}

          {isCustomMessage ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{t("stables:loading.rate_limit_message")}</span>
              {countdown > 0 && (
                <span className="text-muted-foreground">{t("stables:loading.try_again_in")}</span>
              )}
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="h-8 px-3"
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}s` : t("stables:loading.try_again")}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {t("stables:loading.request_failed")}
              <Button onClick={onRetry} variant="outline" className="ml-3" size="sm">
                {t("stables:loading.try_again")}
              </Button>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

function StablesPage(): React.ReactElement {
  const { t } = usePageTranslation("stables");

  // Use direct API call for stables data
  const [stablesData, setStablesData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stablesError, setStablesError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchStablesData = useCallback(async () => {
    try {
      setIsFetching(true);
      setStablesError(null);

      const response = await fetch(`/api/aptos/stables?t=${Date.now()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-cache",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      logger.info(`[Stables Page] Fetched data: ${JSON.stringify(responseData).substring(0, 200)}`);
      // Extract the data from the response wrapper
      const data = responseData.data || responseData;
      setStablesData(data);
    } catch (error) {
      logger.error(
        `[Stables Page] Error fetching data: ${error instanceof Error ? error.message : String(error)}`
      );
      setStablesError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  // Fetch data once on mount, then rely on daily cache refresh
  useEffect(() => {
    fetchStablesData();
  }, [fetchStablesData]);

  // sUSDe price - default to 1 since CMC API is removed
  const susdePrice = 1;

  // Extract the actual data from API response
  const data: {
    supplies?: Array<{
      symbol: string;
      supply: string;
      supply_raw: string;
      [key: string]: unknown;
    }>;
    total?: string;
    total_raw?: string;
    usdt_reserve?: any;
    [key: string]: unknown;
  } | null = stablesData || null;
  const loading = isLoading;
  const error = stablesError?.message || null;
  const refreshing = isFetching && !isLoading;

  // Debug logging
  if (data) {
    logger.info(
      `[Stables Page] Data structure: has supplies = ${!!data.supplies}, supplies length = ${data.supplies?.length}`
    );
    logger.info(`[Stables Page] Full data keys: ${Object.keys(data).join(", ")}`);
    if (data.supplies && data.supplies.length > 0) {
      logger.info(`[Stables Page] First supply item: ${JSON.stringify(data.supplies[0])}`);
    }
  } else {
    logger.warn(`[Stables Page] Data is null or undefined`);
  }

  // Manual refresh handler for user-triggered refresh only
  const fetchSupplyData = useCallback(async (): Promise<void> => {
    await fetchStablesData();
  }, [fetchStablesData]);

  // Consolidated token type helper
  const getTokenType = (symbol: string): string => {
    if (["USDT", "USDC", "USDA", "USD1"].includes(symbol)) {
      return "Native Stablecoin";
    }
    if (["MOD"].includes(symbol)) {
      return "Algorithmic Stablecoin";
    }
    if (symbol.includes(".lz") || ["sUSDe", "USDe", "sUSDe/USDe"].includes(symbol)) {
      return "Bridged via LayerZero";
    }
    if (symbol.includes(".wh")) {
      return "Bridged via Wormhole";
    }
    if (symbol.includes(".ce")) {
      return "Bridged via Celer";
    }
    if (symbol === "multiUSDC") {
      return "Bridged via Multichain";
    }
    return "Stablecoin";
  };

  const {
    formattedTotalSupply,
    processedSupplies,
    processedSuppliesForTable,
    adjustedTotal,
    suppliesDataMap,
  } = useMemo(() => {
    if (!data || !data.supplies) {
      return {
        formattedTotalSupply: "",
        processedSupplies: [],
        processedSuppliesForTable: [],
        adjustedTotal: "0",
        suppliesDataMap: {},
      };
    }

    // Use the susdePrice variable defined above
    const supplies = data.supplies;

    // Create supplies data map
    const suppliesMap: Record<string, string> = {};
    if (Array.isArray(supplies)) {
      supplies.forEach((supply: any) => {
        suppliesMap[supply.symbol] = supply.supply_raw ?? supply.supply ?? "0";
      });
    }

    // Shared sorting function
    const sortBySupply = (tokens: DisplayToken[]) => {
      return tokens
        .filter((token) => token.supply !== "0")
        .sort((a, b) => {
          const supplyA = BigInt(a.supply || "0");
          const supplyB = BigInt(b.supply || "0");
          return supplyB > supplyA ? 1 : supplyB < supplyA ? -1 : 0;
        });
    };

    const processSuppliesForCards = () => {
      if (!Array.isArray(supplies)) return [];

      const usdeToken = supplies.find((t: any) => t.symbol === "USDe");
      const susdeToken = supplies.find((t: any) => t.symbol === "sUSDe");
      const otherTokens = supplies.filter((t: any) => !["USDe", "sUSDe"].includes(t.symbol));

      const displayTokens: DisplayToken[] = [...otherTokens];
      const ethenaComponents = [usdeToken, susdeToken].filter(Boolean) as Token[];

      if (ethenaComponents.length > 0) {
        displayTokens.push({
          symbol: "sUSDe/USDe",
          isCombined: true,
          supply: ethenaComponents
            .reduce((acc, curr) => acc + BigInt(curr?.supply || "0"), 0n)
            .toString(),
          supply_raw: ethenaComponents
            .reduce((acc, curr) => acc + BigInt(curr?.supply_raw || curr?.supply || "0"), 0n)
            .toString(),
          components: ethenaComponents,
        });
      }

      return sortBySupply(displayTokens);
    };

    const processSuppliesForTable = () => {
      if (!Array.isArray(supplies)) return [];
      return sortBySupply([...supplies]);
    };

    // Process supplies for display
    const processedSuppliesForCards = processSuppliesForCards();
    const processedSuppliesForTable = processSuppliesForTable();

    // Calculate raw total for TokenCard market share calculations from processedSupplies
    // This ensures the total matches what's actually displayed
    let rawSupplyTotal = BigInt(0);
    if (Array.isArray(processedSuppliesForCards)) {
      for (const token of processedSuppliesForCards) {
        const rawSupply = BigInt(token.supply_raw || token.supply || "0");
        // Normalize 8-decimal tokens to 6 decimals
        if (token.symbol === "MOD" || token.symbol === "USDA") {
          rawSupplyTotal += rawSupply / BigInt(100); // Convert from 8 to 6 decimals
        } else {
          rawSupplyTotal += rawSupply;
        }
      }
    }

    // Format total from processedSupplies to match pie chart
    const formatTotalFromProcessed = () => {
      const dollars = Number(processedSuppliesForCards.reduce(
        (sum: number, t: any) => sum + parseFloat(t.supply || "0"),
        0
      ));
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(dollars);
    };

    return {
      formattedTotalSupply: formatTotalFromProcessed(),
      processedSupplies: processedSuppliesForCards,
      processedSuppliesForTable,
      adjustedTotal: rawSupplyTotal.toString(),
      suppliesDataMap: suppliesMap,
    };
  }, [data, stablesData]);

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
            <ErrorState error={error} onRetry={fetchSupplyData} t={t} />
          ) : data ? (
            <>
              {/* Mobile: Show total supply at top */}
              <div className="md:hidden mb-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm text-muted-foreground">Total Supply</h2>
                </div>
                <p className="text-xl font-bold font-mono">{formattedTotalSupply}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Mobile: Show cards in 2 columns, Desktop: Show in 1 column on left */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-1 md:col-span-1 md:space-y-4">
                  {processedSupplies
                    ?.slice(0, 4)
                    .map((token: any) => (
                      <TokenCard
                        key={token.symbol}
                        token={token}
                        totalSupply={adjustedTotal}
                        susdePrice={susdePrice}
                        suppliesData={suppliesDataMap}
                        usdtReserve={data?.usdt_reserve}
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
                            {t("stables:loading.chart_error")}
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <MarketShareChart
                      data={
                        processedSupplies?.map((token: any) => {
                          const dollarSupply = parseFloat(token.supply || "0");
                          const totalDollarSupply = processedSupplies.reduce(
                            (sum: number, t: any) => sum + parseFloat(t.supply || "0"),
                            0
                          );
                          const percentage =
                            totalDollarSupply > 0 ? (dollarSupply / totalDollarSupply) * 100 : 0;
                          return {
                            name: token.symbol,
                            value: percentage, // Pie chart expects percentage in value field
                            formattedSupply: formatAmount(dollarSupply),
                            symbol: token.symbol,
                            supply: token.supply,
                            supply_raw: token.supply_raw,
                            decimals: token.decimals || 6,
                          };
                        }) || []
                      }
                      totalValue={
                        processedSupplies?.reduce(
                          (sum: number, t: any) => sum + parseFloat(t.supply || "0"),
                          0
                        ) || 0
                      }
                      colors={STABLECOIN_COLORS}
                      topRightContent={
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-3 mb-1">
                            <h2 className="text-sm text-muted-foreground">Total Supply</h2>
                          </div>
                          <p className="text-lg font-bold font-mono">{formattedTotalSupply}</p>
                        </div>
                      }
                    />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Remaining cards below the chart */}
              {processedSupplies && processedSupplies.length > 4 && (
                <div className="mb-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {processedSupplies.slice(4).map((token: any) => (
                      <TokenCard
                        key={token.symbol}
                        token={token}
                        totalSupply={adjustedTotal}
                        susdePrice={susdePrice}
                        suppliesData={suppliesDataMap}
                        usdtReserve={data?.usdt_reserve}
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
                        <TableHead className="min-w-[120px] sm:min-w-[150px]">Token</TableHead>
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
                      {processedSuppliesForTable?.map((token: any) => {
                        const metadata = TOKEN_METADATA[token.symbol];
                        const totalDollarSupply = processedSuppliesForTable.reduce(
                          (sum: number, t: any) => sum + Number(t.supply),
                          0
                        );
                        const marketSharePercent = (
                          (Number(token.supply) / totalDollarSupply) *
                          100
                        ).toFixed(2);

                        return (
                          <TableRow key={token.symbol}>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Image
                                  src={(metadata?.thumbnail as string) || "/placeholder.jpg"}
                                  alt={token.symbol}
                                  width={20}
                                  height={20}
                                  className="rounded-full flex-shrink-0"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.src = "/placeholder.jpg";
                                  }}
                                />
                                <span className="font-medium">{token.symbol}</span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap hidden sm:table-cell">
                              <span className="text-sm text-muted-foreground">
                                {getTokenType(token.symbol)}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap hidden sm:table-cell">
                              {metadata?.assetAddress ? (
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      metadata.assetAddress!,
                                      `${token.symbol} address`
                                    )
                                  }
                                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                                  title={`Copy ${token.symbol} address`}
                                >
                                  <span className="font-mono">
                                    {truncateAddress(metadata.assetAddress)}
                                  </span>
                                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono whitespace-nowrap">
                              <div className="flex flex-col">
                                <span>
                                  {(() => {
                                    const value = Number(token.supply);
                                    if (value >= 1_000_000_000)
                                      return `$${(value / 1_000_000_000).toFixed(1)}b`;
                                    if (value >= 1_000_000)
                                      return `$${(value / 1_000_000).toFixed(1)}m`;
                                    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
                                    return `$${value.toFixed(0)}`;
                                  })()}
                                </span>
                              </div>
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

export default StablesPage;
export { TOKEN_METADATA, type Token, type DisplayToken, type SupplyData };
