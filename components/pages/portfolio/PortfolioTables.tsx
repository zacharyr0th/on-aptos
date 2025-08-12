"use client";

import { GeistMono } from "geist/font/mono";
import { Coins, TrendingUp, AlertTriangle, HelpCircle } from "lucide-react";
import Image from "next/image";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatCurrency, formatTokenAmount } from "@/lib/utils/format/format";
import { getTokenLogoUrlWithFallbackSync } from "@/lib/utils/token/token-utils";

import { cleanProtocolName, getDetailedProtocolInfo } from "./shared/PortfolioMetrics";

interface BaseTableProps {
  selectedItem: any;
  onItemSelect: (item: any) => void;
}

interface AssetsTableProps extends BaseTableProps {
  visibleAssets: any[];
  showOnlyVerified: boolean;
  portfolioAssets: any[];
}

interface DeFiTableProps extends BaseTableProps {
  groupedDeFiPositions: any[] | null;
  defiPositionsLoading: boolean;
  defiSortBy: string;
  defiSortOrder: "asc" | "desc";
  getProtocolLogo: (protocol: string) => string;
  onSortChange: (sortBy: string, order: "asc" | "desc") => void;
}

export const AssetsTable = ({
  visibleAssets,
  selectedItem,
  showOnlyVerified,
  portfolioAssets,
  onItemSelect,
}: AssetsTableProps) => {
  // Check if we're on mobile
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Separate APT from other assets
  const aptAsset = visibleAssets.find(
    (asset) => asset.asset_type === "0x1::aptos_coin::AptosCoin",
  );
  const otherAssets = visibleAssets
    .filter((asset) => asset.asset_type !== "0x1::aptos_coin::AptosCoin")
    .sort((a, b) => {
      const valueA = a.value || 0;
      const valueB = b.value || 0;
      return valueB - valueA; // Descending order
    });

  // Mobile card component
  const AssetCard = ({
    asset,
    showDivider = false,
  }: {
    asset: any;
    showDivider?: boolean;
  }) => (
    <React.Fragment key={`asset-card-${asset.asset_type}-${asset.amount}`}>
      <div
        className={cn(
          "p-4 cursor-pointer transition-all hover:bg-muted/50 rounded-lg active:scale-[0.98]",
          selectedItem?.asset_type === asset.asset_type && "bg-muted/80",
        )}
        onClick={() => onItemSelect(asset)}
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0">
            <Image
              src={getTokenLogoUrlWithFallbackSync(
                asset.asset_type,
                asset.metadata,
              )}
              alt={asset.metadata?.symbol || "Asset"}
              width={48}
              height={48}
              className={`rounded-full object-cover w-full h-full ${
                asset.metadata?.symbol?.toUpperCase() === "APT" ||
                asset.asset_type.includes("aptos_coin")
                  ? "dark:invert"
                  : ""
              }`}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                const symbol = asset.metadata?.symbol;
                if (img.src.includes(".svg") && symbol) {
                  img.src = `https://raw.githubusercontent.com/PanoraExchange/Aptos-Tokens/main/logos/${symbol}.png`;
                } else {
                  img.src = "/placeholder.jpg";
                }
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">
                  {asset.metadata?.symbol || "Unknown"}
                </span>
                {asset.protocolInfo && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-2 py-0.5 h-5 font-normal"
                  >
                    {asset.protocolInfo.protocolLabel}
                  </Badge>
                )}
              </div>
              <div className={`font-bold text-base ${GeistMono.className}`}>
                {asset.price ? formatCurrency(asset.value || 0) : "—"}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="truncate">
                {asset.metadata?.name || "Unknown Asset"}
              </span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={GeistMono.className}>
                  {formatTokenAmount(asset.balance || 0, undefined, {
                    showSymbol: false,
                  })}
                </span>
                {asset.price && (
                  <>
                    <span>•</span>
                    <span className={GeistMono.className}>
                      {formatCurrency(asset.price)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showDivider && <div className="border-b border-border/30 my-6" />}
    </React.Fragment>
  );

  const renderAssetRow = (asset: any, showDivider = false) => (
    <React.Fragment key={`asset-${asset.asset_type}-${asset.amount}`}>
      <TableRow
        className={cn(
          "cursor-pointer hover:bg-muted/30 transition-colors h-14 border-b-0",
          selectedItem?.asset_type === asset.asset_type &&
            "bg-muted/40 rounded-lg",
        )}
        onClick={() => onItemSelect(asset)}
      >
        <TableCell className="py-2 w-1/2 sm:w-2/5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0">
              <Image
                src={getTokenLogoUrlWithFallbackSync(
                  asset.asset_type,
                  asset.metadata,
                )}
                alt={asset.metadata?.symbol || "Asset"}
                width={32}
                height={32}
                className={`rounded-full object-cover w-full h-full ${
                  asset.metadata?.symbol?.toUpperCase() === "APT" ||
                  asset.asset_type.includes("aptos_coin")
                    ? "dark:invert"
                    : ""
                }`}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  const symbol = asset.metadata?.symbol;
                  if (img.src.includes(".svg") && symbol) {
                    img.src = `https://raw.githubusercontent.com/PanoraExchange/Aptos-Tokens/main/logos/${symbol}.png`;
                  } else {
                    img.src = "/placeholder.jpg";
                  }
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {asset.metadata?.symbol || "Unknown"}
                </span>
                {asset.protocolInfo && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 font-normal"
                  >
                    {asset.protocolInfo.protocolLabel}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {asset.metadata?.name || "Unknown Asset"}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-2 w-1/4 sm:w-1/5 text-center sm:text-right pr-2">
          <div
            className={`text-sm text-muted-foreground text-center sm:text-right ${GeistMono.className}`}
          >
            {formatTokenAmount(asset.balance || 0, undefined, {
              showSymbol: false,
            })}
          </div>
        </TableCell>
        <TableCell className="hidden sm:table-cell py-2 w-1/5 text-right pr-2">
          <div
            className={`text-sm text-muted-foreground ${GeistMono.className}`}
          >
            {asset.price ? (
              formatCurrency(asset.price)
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center justify-end gap-1 cursor-help">
                      <span>—</span>
                      <HelpCircle className="h-3 w-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">
                      Price data unavailable for this token.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This token may be new or not yet tracked by price feeds.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </TableCell>
        <TableCell className="py-2 w-1/4 sm:w-1/5 text-right pr-4">
          <div
            className={`font-medium text-sm text-right ${GeistMono.className}`}
          >
            {asset.price ? formatCurrency(asset.value || 0) : "—"}
          </div>
        </TableCell>
      </TableRow>
      {showDivider && (
        <TableRow className="h-0">
          <TableCell colSpan={4} className="p-0 sm:table-cell">
            <div className="w-full border-b-2 border-border/50" />
          </TableCell>
          <TableCell colSpan={3} className="p-0 table-cell sm:hidden">
            <div className="w-full border-b-2 border-border/50" />
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );

  return (
    <div className="asset-table-container" data-asset-table>
      {visibleAssets.length > 0 ? (
        <>
          {/* Mobile Card Layout */}
          {isMobile ? (
            <div className="space-y-2">
              {aptAsset && (
                <AssetCard
                  asset={aptAsset}
                  showDivider={otherAssets.length > 0}
                />
              )}
              {otherAssets.map((asset) => (
                <AssetCard key={asset.asset_type} asset={asset} />
              ))}
            </div>
          ) : (
            /* Desktop Table Layout */
            <div className="flex flex-col sm:h-[calc(100vh-280px)]">
              {/* Fixed APT Header */}
              <div className="flex-shrink-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/50">
                      <TableHead className="w-1/2 sm:w-2/5 text-left font-medium text-muted-foreground text-xs">
                        Ticker
                      </TableHead>
                      <TableHead className="w-1/4 sm:w-1/5 font-medium text-muted-foreground text-xs text-center sm:text-right pr-2 [&>div]:justify-center sm:[&>div]:justify-end">
                        Quantity
                      </TableHead>
                      <TableHead className="hidden sm:table-cell w-1/5 font-medium text-muted-foreground text-xs text-right pr-2 [&>div]:justify-end">
                        Price
                      </TableHead>
                      <TableHead className="w-1/4 sm:w-1/5 font-medium text-muted-foreground text-xs text-right pr-4 [&>div]:justify-end">
                        Value
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  {aptAsset && (
                    <TableBody>{renderAssetRow(aptAsset, true)}</TableBody>
                  )}
                </Table>
              </div>

              {/* Scrollable Other Assets */}
              {otherAssets.length > 0 && (
                <div className="flex-1 overflow-y-auto">
                  <Table>
                    <TableHeader className="sr-only">
                      <TableRow>
                        <TableHead className="w-1/2 sm:w-2/5 text-left font-medium text-muted-foreground text-xs">
                          Ticker
                        </TableHead>
                        <TableHead className="w-1/4 sm:w-1/5 font-medium text-muted-foreground text-xs text-center sm:text-right pr-2 [&>div]:justify-center sm:[&>div]:justify-end">
                          Quantity
                        </TableHead>
                        <TableHead className="hidden sm:table-cell w-1/5 font-medium text-muted-foreground text-xs text-right pr-2 [&>div]:justify-end">
                          Price
                        </TableHead>
                        <TableHead className="w-1/4 sm:w-1/5 font-medium text-muted-foreground text-xs text-right pr-4 [&>div]:justify-end">
                          Value
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otherAssets.map((asset) => renderAssetRow(asset))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>
            {showOnlyVerified ? "No verified assets found" : "No assets found"}
          </p>
          {showOnlyVerified &&
            portfolioAssets &&
            portfolioAssets.length === 0 && (
              <p className="text-sm mt-2">
                Try disabling the &quot;Verified tokens only&quot; filter to see
                all assets
              </p>
            )}
        </div>
      )}
    </div>
  );
};

export const DeFiPositionsTable = ({
  groupedDeFiPositions,
  defiPositionsLoading,
  selectedItem,
  defiSortBy,
  defiSortOrder,
  getProtocolLogo,
  onItemSelect,
  onSortChange,
}: DeFiTableProps) => {
  // Check if we're on mobile
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  if (defiPositionsLoading) {
    return (
      <>
        {/* Mobile Card Skeleton */}
        <div className="block md:hidden space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-3">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Skeleton */}
        <div className="hidden md:block">
          <div className="border rounded-lg">
            <div className="grid grid-cols-3 gap-4 p-3 border-b bg-muted/50">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12 ml-auto" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-3 gap-4 p-3 border-b last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (!groupedDeFiPositions || groupedDeFiPositions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg mb-2">No DeFi positions found</p>
        <p className="text-sm">
          Start using DeFi protocols on Aptos to see your positions here
        </p>
      </div>
    );
  }

  const handleSortByType = () => {
    if (defiSortBy === "type") {
      onSortChange("type", defiSortOrder === "asc" ? "desc" : "asc");
    } else {
      onSortChange("type", "asc");
    }
  };

  const handleSortByValue = () => {
    if (defiSortBy === "value") {
      onSortChange("value", defiSortOrder === "asc" ? "desc" : "asc");
    } else {
      onSortChange("value", "desc");
    }
  };

  const sortedPositions = [...groupedDeFiPositions];

  // Show all positions - no filtering by value
  // sortedPositions = sortedPositions.filter(position => {
  //   if (isLPToken(position)) {
  //     return true;
  //   }
  //   return position.totalValue >= MIN_DEFI_VALUE_THRESHOLD;
  // });

  if (defiSortBy === "type") {
    sortedPositions.sort((a, b) => {
      const typeA = Array.from(a.protocolTypes)[0] as string;
      const typeB = Array.from(b.protocolTypes)[0] as string;
      const displayA = typeA === "derivatives" ? "perps" : typeA;
      const displayB = typeB === "derivatives" ? "perps" : typeB;

      if (defiSortOrder === "asc") {
        return displayA.localeCompare(displayB);
      } else {
        return displayB.localeCompare(displayA);
      }
    });
  } else if (defiSortBy === "value") {
    sortedPositions.sort((a, b) => {
      if (defiSortOrder === "asc") {
        return a.totalValue - b.totalValue;
      } else {
        return b.totalValue - a.totalValue;
      }
    });
  }

  // Mobile DeFi Card Component
  const DeFiCard = ({
    groupedPosition,
    index,
  }: {
    groupedPosition: any;
    index: number;
  }) => {
    const positionId = `defi-card-${groupedPosition.protocol}-${index}`;
    const isSelected = selectedItem?.protocol === groupedPosition.protocol;
    const primaryType = Array.from(groupedPosition.protocolTypes)[0] as string || "";
    const protocolInfo = getDetailedProtocolInfo(groupedPosition.protocol);

    return (
      <div
        key={positionId}
        className={cn(
          "p-4 cursor-pointer transition-all hover:bg-muted/50 rounded-lg active:scale-[0.98]",
          isSelected && "bg-muted/80",
        )}
        onClick={() => onItemSelect(groupedPosition)}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-background border border-border/50">
              <Image
                src={getProtocolLogo(groupedPosition.protocol)}
                alt={`${groupedPosition.protocol} logo`}
                fill
                className="object-cover"
                sizes="48px"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = "/placeholder.jpg";
                }}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">
                  {cleanProtocolName(groupedPosition.protocol)}
                </span>
                {groupedPosition.protocol.toLowerCase() === "aptin" && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-red-500 dark:bg-red-600 text-white border-red-600 dark:border-red-700">
                        <p className="text-sm font-medium">
                          This protocol is deprecated
                        </p>
                        <p className="text-sm">
                          It's recommended to remove your assets
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className={`font-bold text-base ${GeistMono.className}`}>
                {formatCurrency(groupedPosition.totalValue)}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="text-[10px] px-2 py-0.5 h-5 font-normal"
                >
                  {groupedPosition.protocolTypes.size > 1
                    ? "Multiple"
                    : primaryType === "derivatives"
                      ? "Perps"
                      : primaryType
                          ? primaryType
                              .replace("_", " ")
                              .split(" ")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1),
                              )
                              .join(" ")
                          : "Unknown"}
                </Badge>
                <span>•</span>
                <span>
                  {groupedPosition.positions?.length || 1} position
                  {groupedPosition.positions?.length !== 1 ? "s" : ""}
                </span>
              </div>
              {protocolInfo?.href && (
                <a
                  href={protocolInfo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  Visit Protocol →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="defi-table-container" data-defi-table>
      {/* Mobile Card Layout */}
      {isMobile ? (
        <div className="space-y-2">
          {sortedPositions.map((groupedPosition, index) => (
            <DeFiCard
              key={`${groupedPosition.protocol}-${index}`}
              groupedPosition={groupedPosition}
              index={index}
            />
          ))}
        </div>
      ) : (
        /* Desktop Table Layout */
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50">
              <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                Protocol
              </TableHead>
              <TableHead
                className="hidden sm:table-cell h-10 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={handleSortByType}
              >
                Type{" "}
                {defiSortBy === "type" && (
                  <span className="text-[10px]">
                    {defiSortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
              <TableHead
                className="h-10 text-xs font-medium text-muted-foreground text-right cursor-pointer hover:text-foreground transition-colors"
                onClick={handleSortByValue}
              >
                Value{" "}
                {defiSortBy === "value" && (
                  <span className="text-[10px]">
                    {defiSortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPositions.map((groupedPosition, index) => {
              const positionId = `defi-${groupedPosition.protocol}-${index}`;
              const isSelected =
                selectedItem?.protocol === groupedPosition.protocol;
              const primaryType = Array.from(
                groupedPosition.protocolTypes,
              )[0] as string || "";

              return (
                <TableRow
                  key={positionId}
                  className={cn(
                    "cursor-pointer hover:bg-muted/30 transition-colors h-14 border-b-0",
                    isSelected && "bg-muted/40 rounded-lg",
                  )}
                  onClick={() => onItemSelect(groupedPosition)}
                >
                  <TableCell className="py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {(() => {
                          const protocolInfo = getDetailedProtocolInfo(
                            groupedPosition.protocol,
                          );
                          const logoElement = (
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-background border border-border/50">
                              <Image
                                src={getProtocolLogo(groupedPosition.protocol)}
                                alt={`${groupedPosition.protocol} logo`}
                                fill
                                className="object-cover"
                                sizes="32px"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.src = "/placeholder.jpg";
                                }}
                              />
                            </div>
                          );

                          if (protocolInfo?.href) {
                            return (
                              <a
                                href={protocolInfo.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                                title={`Visit ${cleanProtocolName(groupedPosition.protocol)} website`}
                              >
                                {logoElement}
                              </a>
                            );
                          }

                          return logoElement;
                        })()}
                      </div>
                      <span className="font-medium text-sm">
                        {cleanProtocolName(groupedPosition.protocol)}
                      </span>
                      {groupedPosition.protocol.toLowerCase() === "aptin" && (
                        <div className="hidden xs:block">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center">
                                  <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 ml-1 cursor-help" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-red-500 dark:bg-red-600 text-white border-red-600 dark:border-red-700">
                                <p className="text-sm font-medium">
                                  This protocol is deprecated
                                </p>
                                <p className="text-sm">
                                  It&apos;s recommended to remove your assets
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-2">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 font-normal"
                    >
                      {groupedPosition.protocolTypes.size > 1
                        ? "Multiple"
                        : primaryType === "derivatives"
                          ? "Perps"
                          : primaryType
                              ? primaryType.replace("_", " ")
                                  .split(" ")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() + word.slice(1),
                                  )
                                  .join(" ")
                              : "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <div className="flex items-center justify-end gap-1">
                      <div
                        className={`font-medium text-sm ${GeistMono.className}`}
                      >
                        {formatCurrency(groupedPosition.totalValue)}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
