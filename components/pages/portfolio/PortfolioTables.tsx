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
import {
  BaseTableProps,
  SortableTableProps,
  AssetsTableProps as BaseAssetsTableProps,
  DeFiTableProps as BaseDeFiTableProps,
} from "@/lib/types/ui";
import { cn } from "@/lib/utils";
import { formatCurrency, formatTokenAmount } from "@/lib/utils/format";
import { getTokenLogoUrlWithFallbackSync } from "@/lib/utils/token/token-utils";

import {
  cleanProtocolName,
  getDetailedProtocolInfo,
} from "./shared/PortfolioMetrics";

interface AssetsTableProps extends BaseAssetsTableProps {
  // visibleAssets, showOnlyVerified, portfolioAssets are inherited from BaseAssetsTableProps
}

interface DeFiTableProps extends BaseDeFiTableProps {
  defiSortBy: string;
  defiSortOrder: "asc" | "desc";
  // groupedDeFiPositions, defiPositionsLoading, getProtocolLogo are inherited from BaseDeFiTableProps
}

export const AssetsTable = (props: any) => {
  // Handle both prop formats
  const visibleAssets = props.visibleAssets || props.assets || [];
  const selectedItem = props.selectedItem || props.selectedAsset;
  const showOnlyVerified =
    props.showOnlyVerified || props.hideFilteredAssets || false;
  const portfolioAssets = props.portfolioAssets || props.assets || [];
  const onItemSelect = props.onItemSelect || props.onAssetSelect;
  const isLoading = props.isLoading || false;
  // Check if we're on mobile
  const [isMobile, setIsMobile] = React.useState(false);
  const [displayedCount, setDisplayedCount] = React.useState(50); // Start with more items loaded
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  React.useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Separate APT from other assets
  const safeVisibleAssets = visibleAssets || [];
  const aptAsset = safeVisibleAssets.find(
    (asset: any) => asset.asset_type === "0x1::aptos_coin::AptosCoin",
  );
  const otherAssets = safeVisibleAssets
    .filter((asset: any) => asset.asset_type !== "0x1::aptos_coin::AptosCoin")
    .sort((a: any, b: any) => {
      const valueA = a.value || 0;
      const valueB = b.value || 0;
      return valueB - valueA; // Descending order
    });

  // Reset displayed count when assets change
  React.useEffect(() => {
    setDisplayedCount(50); // Start with 50 items loaded
  }, [visibleAssets.length]);

  // Handle scroll-based loading
  React.useEffect(() => {
    if (isMobile || isLoading) return;

    const handleScroll = () => {
      const container = document.querySelector(".asset-table-scroll-container");
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      // Load more when user scrolls to 80% of the content
      if (
        scrollPercentage > 0.8 &&
        displayedCount <= otherAssets.length &&
        !isLoadingMore
      ) {
        setIsLoadingMore(true);

        // Simulate loading delay for smooth UX
        setTimeout(() => {
          setDisplayedCount((prevCount) =>
            Math.min(prevCount + 100, otherAssets.length + 1),
          );
          setIsLoadingMore(false);
        }, 300);
      }
    };

    const container = document.querySelector(".asset-table-scroll-container");
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [displayedCount, otherAssets.length, isLoading, isMobile, isLoadingMore]);

  // Show assets based on displayedCount, or all on mobile
  const limitedOtherAssets = isMobile
    ? otherAssets
    : otherAssets.slice(0, Math.min(displayedCount - 1, otherAssets.length));

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
              src={
                asset.logoUrl ||
                getTokenLogoUrlWithFallbackSync(
                  asset.asset_type,
                  asset.metadata,
                )
              }
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
                {!asset.isVerified && (
                  <span
                    className="text-xs text-amber-500 dark:text-amber-400"
                    title="Unverified token"
                  >
                    ⚠
                  </span>
                )}
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
                {asset.price && asset.price > 0
                  ? formatCurrency(asset.value || 0)
                  : "—"}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="truncate">
                {asset.metadata?.name || "Unknown Asset"}
              </span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={GeistMono.className}>
                  {formatTokenAmount(asset.balance || 0, asset.symbol, {
                    showSymbol: false,
                    useCompact: true,
                  })}
                </span>
                {asset.price && asset.price > 0 && (
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

  const renderAssetRow = (asset: any, showDivider = false) => {
    // Calculate 24h and 7d changes (placeholder values - you'll need to get real data)
    const change24h = asset.priceChange24h || 0;
    const change7d = asset.priceChange7d || 0;

    return (
      <React.Fragment key={`asset-${asset.asset_type}-${asset.amount}`}>
        <TableRow
          className={cn(
            "cursor-pointer hover:bg-muted/30 transition-colors h-14 border-b-0",
            selectedItem?.asset_type === asset.asset_type &&
              "bg-muted/40 rounded-lg",
          )}
          onClick={() => onItemSelect(asset)}
        >
          <TableCell className="py-2 w-[30%]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0">
                <Image
                  src={
                    asset.logoUrl ||
                    getTokenLogoUrlWithFallbackSync(
                      asset.asset_type,
                      asset.metadata,
                    )
                  }
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
                  {!asset.isVerified && (
                    <span
                      className="text-xs text-amber-500 dark:text-amber-400"
                      title="Unverified token"
                    >
                      ⚠
                    </span>
                  )}
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
          <TableCell className="py-2 w-[15%] text-right pr-2">
            <div
              className={`text-sm text-muted-foreground ${GeistMono.className}`}
            >
              {formatTokenAmount(asset.balance || 0, undefined, {
                showSymbol: false,
              })}
            </div>
          </TableCell>
          <TableCell className="hidden lg:table-cell py-2 w-[15%] text-right pr-2">
            <div
              className={`text-sm text-muted-foreground ${GeistMono.className}`}
            >
              {asset.price && asset.price > 0 ? (
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
          <TableCell className="py-2 w-[15%] text-right pr-2">
            <div className={`font-medium text-sm ${GeistMono.className}`}>
              {asset.price && asset.price > 0
                ? formatCurrency(asset.value || 0)
                : "—"}
            </div>
          </TableCell>
          <TableCell className="hidden md:table-cell py-2 w-[12.5%] text-right pr-2">
            <div
              className={cn(
                "text-sm font-medium",
                GeistMono.className,
                change24h > 0
                  ? "text-green-600 dark:text-green-400"
                  : change24h < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground",
              )}
            >
              {asset.price && asset.price > 0
                ? change24h !== 0
                  ? `${change24h > 0 ? "+" : ""}${change24h.toFixed(2)}%`
                  : "—"
                : "—"}
            </div>
          </TableCell>
          <TableCell className="hidden md:table-cell py-2 w-[12.5%] text-right pr-4">
            <div
              className={cn(
                "text-sm font-medium",
                GeistMono.className,
                change7d > 0
                  ? "text-green-600 dark:text-green-400"
                  : change7d < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground",
              )}
            >
              {asset.price && asset.price > 0
                ? change7d !== 0
                  ? `${change7d > 0 ? "+" : ""}${change7d.toFixed(2)}%`
                  : "—"
                : "—"}
            </div>
          </TableCell>
        </TableRow>
        {showDivider && (
          <TableRow className="h-0">
            <TableCell colSpan={6} className="p-0">
              <div className="w-full border-b-2 border-border/50" />
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="asset-table-container" data-asset-table>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-16 ml-auto mb-1" />
                <Skeleton className="h-3 w-20 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="asset-table-container" data-asset-table>
      {safeVisibleAssets.length > 0 ? (
        <>
          {/* Mobile Card Layout */}
          {isMobile ? (
            <div className="space-y-2">
              {aptAsset && (
                <AssetCard
                  asset={aptAsset}
                  showDivider={limitedOtherAssets.length > 0}
                />
              )}
              {limitedOtherAssets.map((asset: any) => (
                <AssetCard key={asset.asset_type} asset={asset} />
              ))}
            </div>
          ) : (
            /* Desktop Table Layout with scroll container */
            <div
              className="asset-table-scroll-container overflow-y-auto"
              style={{ height: "36rem", maxHeight: "70vh" }}
            >
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50">
                    <TableHead className="w-[30%] text-left font-medium text-muted-foreground text-xs">
                      Ticker
                    </TableHead>
                    <TableHead className="w-[15%] font-medium text-muted-foreground text-xs text-right pr-2">
                      Quantity
                    </TableHead>
                    <TableHead className="hidden lg:table-cell w-[15%] font-medium text-muted-foreground text-xs text-right pr-2">
                      Price
                    </TableHead>
                    <TableHead className="w-[15%] font-medium text-muted-foreground text-xs text-right pr-2">
                      Value
                    </TableHead>
                    <TableHead className="hidden md:table-cell w-[12.5%] font-medium text-muted-foreground text-xs text-right pr-2">
                      24h
                    </TableHead>
                    <TableHead className="hidden md:table-cell w-[12.5%] font-medium text-muted-foreground text-xs text-right pr-4">
                      7d
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aptAsset &&
                    renderAssetRow(aptAsset, limitedOtherAssets.length > 0)}
                  {limitedOtherAssets.map((asset: any) =>
                    renderAssetRow(asset),
                  )}
                </TableBody>
              </Table>
              {/* Loading indicator */}
              {isLoadingMore && (
                <div className="text-center py-3 text-sm text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Loading more assets...
                  </div>
                </div>
              )}
              {/* Show indicator if there are more assets to load */}
              {!isLoadingMore &&
                displayedCount <= otherAssets.length &&
                otherAssets.length > 49 && (
                  <div className="text-center py-3 text-sm text-muted-foreground">
                    Showing {limitedOtherAssets.length + (aptAsset ? 1 : 0)} of{" "}
                    {safeVisibleAssets.length} assets • Scroll to load more
                  </div>
                )}
              {/* Show when all assets are loaded */}
              {!isLoadingMore &&
                displayedCount > otherAssets.length &&
                safeVisibleAssets.length > 50 && (
                  <div className="text-center py-3 text-sm text-muted-foreground">
                    All {safeVisibleAssets.length} assets loaded
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

export const DeFiPositionsTable = (props: any) => {
  // Handle both prop formats
  const groupedDeFiPositions =
    props.groupedDeFiPositions || props.positions || [];
  const defiPositionsLoading =
    props.defiPositionsLoading || props.isLoading || false;
  const selectedItem = props.selectedItem || props.selectedPosition;
  const defiSortBy = props.defiSortBy || props.sortBy || "value";
  const defiSortOrder = props.defiSortOrder || props.sortOrder || "desc";
  const getProtocolLogo = props.getProtocolLogo;
  const onItemSelect = props.onItemSelect || props.onPositionSelect;
  const onSortChange = props.onSortChange || props.onSort;
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

  if (defiSortBy === "type" && defiSortOrder) {
    sortedPositions.sort((a, b) => {
      if (!a || !b) return 0;

      const typeA = a?.protocolTypes
        ? (Array.from(a.protocolTypes)[0] as string)
        : undefined;
      const typeB = b?.protocolTypes
        ? (Array.from(b.protocolTypes)[0] as string)
        : undefined;
      const displayA = typeA
        ? typeA === "derivatives"
          ? "perps"
          : typeA
        : "unknown";
      const displayB = typeB
        ? typeB === "derivatives"
          ? "perps"
          : typeB
        : "unknown";

      if (typeof displayA !== "string" || typeof displayB !== "string") {
        return 0;
      }

      if (!defiSortOrder || defiSortOrder === "asc") {
        return displayA.localeCompare(displayB);
      } else {
        return displayB.localeCompare(displayA);
      }
    });
  } else if (defiSortBy === "value" && defiSortOrder) {
    sortedPositions.sort((a, b) => {
      if (!a || !b) return 0;
      const aValue = a.totalValue || 0;
      const bValue = b.totalValue || 0;

      if (defiSortOrder === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
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
    const primaryType =
      (Array.from(groupedPosition.protocolTypes)[0] as string) || "";
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
              <TableHead className="w-[35%] h-10 text-xs font-medium text-muted-foreground">
                Protocol
              </TableHead>
              <TableHead
                className="hidden sm:table-cell w-[20%] h-10 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
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
                className="w-[15%] h-10 text-xs font-medium text-muted-foreground text-right cursor-pointer hover:text-foreground transition-colors pr-2"
                onClick={handleSortByValue}
              >
                Value{" "}
                {defiSortBy === "value" && (
                  <span className="text-[10px]">
                    {defiSortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
              <TableHead className="hidden md:table-cell w-[15%] h-10 text-xs font-medium text-muted-foreground text-right pr-2">
                24h
              </TableHead>
              <TableHead className="hidden md:table-cell w-[15%] h-10 text-xs font-medium text-muted-foreground text-right pr-4">
                7d
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPositions.map((groupedPosition, index) => {
              const positionId = `defi-${groupedPosition.protocol}-${index}`;
              const isSelected =
                selectedItem?.protocol === groupedPosition.protocol;
              const primaryType =
                (Array.from(groupedPosition.protocolTypes)[0] as string) || "";

              // Calculate 24h and 7d changes (placeholder values - you'll need to get real data)
              const change24h = groupedPosition.priceChange24h || 0;
              const change7d = groupedPosition.priceChange7d || 0;

              return (
                <TableRow
                  key={positionId}
                  className={cn(
                    "cursor-pointer hover:bg-muted/30 transition-colors h-14 border-b-0",
                    isSelected && "bg-muted/40 rounded-lg",
                  )}
                  onClick={() => onItemSelect(groupedPosition)}
                >
                  <TableCell className="py-2 w-[35%]">
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
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-2 w-[20%]">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 font-normal"
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
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1),
                                )
                                .join(" ")
                            : "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 w-[15%] text-right pr-2">
                    <div className="flex items-center justify-end gap-1">
                      <div
                        className={`font-medium text-sm ${GeistMono.className}`}
                      >
                        {formatCurrency(groupedPosition.totalValue)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-2 w-[15%] text-right pr-2">
                    <div
                      className={cn(
                        "text-sm font-medium",
                        GeistMono.className,
                        change24h > 0
                          ? "text-green-600 dark:text-green-400"
                          : change24h < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground",
                      )}
                    >
                      {change24h !== 0
                        ? `${change24h > 0 ? "+" : ""}${change24h.toFixed(2)}%`
                        : "—"}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-2 w-[15%] text-right pr-4">
                    <div
                      className={cn(
                        "text-sm font-medium",
                        GeistMono.className,
                        change7d > 0
                          ? "text-green-600 dark:text-green-400"
                          : change7d < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground",
                      )}
                    >
                      {change7d !== 0
                        ? `${change7d > 0 ? "+" : ""}${change7d.toFixed(2)}%`
                        : "—"}
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
