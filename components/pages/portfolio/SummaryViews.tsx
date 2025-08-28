"use client";

import {
  Grid3x3,
  List,
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Coins,
  X,
  Copy,
  Check,
} from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState, useCallback, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { unifiedScanner } from "@/lib/services/defi/unified-scanner";
import type { DeFiPosition } from "@/lib/services/defi/unified-scanner";
import { cn } from "@/lib/utils";
import {
  sanitizeNFTMetadata,
  sanitizeImageUrl,
} from "@/lib/utils/core/security";
import { formatCurrency, formatTokenAmount } from "@/lib/utils/format";
import { logger } from "@/lib/utils/core/logger";

import { MinimalNFTGrid } from "./MinimalNFTGrid";
import { NFTTreemapSkeleton } from "./shared/LoadingSkeletons";
import { cleanProtocolName, getProtocolLogo } from "./shared/PortfolioMetrics";
import { NFTTreemap } from "./shared/WalletSummaryComponents";
import { NFT } from "./types";

interface DeFiSummaryViewProps {
  groupedDeFiPositions: any[];
  totalDefiValue: number;
  getProtocolLogo: (protocol: string) => string;
  onProtocolClick: (position: any) => void;
  selectedDeFiPosition?: any;
  accountNames?: any;
  walletAddress: string;
  onDialogOpenChange?: (open: boolean) => void;
  setSidebarView?: (view: "assets" | "nfts" | "defi") => void;
}

interface NFTSummaryViewProps {
  nfts: NFT[];
  currentPageNFTs?: number;
  totalNFTCount?: number | null;
  nftCollectionStats?: {
    collections: Array<{ name: string; count: number }>;
    totalCollections: number;
  } | null;
  accountNames?: any;
  isLoading?: boolean;
  onNFTSelect?: (nft: any) => void;
  selectedNFT?: any;
  hasMoreNFTs?: boolean;
  isLoadingMore?: boolean;
  loadMoreNFTs?: () => void;
  onCollectionClick?: (collection: string) => void;
  includeGrid?: boolean;
  filteredNFTs?: NFT[];
  nftsLoading?: boolean;
}

export const DeFiSummaryView: React.FC<DeFiSummaryViewProps> = ({
  groupedDeFiPositions,
  totalDefiValue,
  getProtocolLogo,
  onProtocolClick,
  walletAddress,
  onDialogOpenChange,
  setSidebarView,
}) => {
  const [defiData, setDefiData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [expandedProtocols, setExpandedProtocols] = useState<Set<string>>(
    new Set(),
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedPosition, setSelectedPosition] = useState<any | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const fetchDefiData = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/aptos/defi?walletAddress=${walletAddress}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-cache",
        },
      ).catch((fetchError) => {
        // Handle network errors specifically
        if (
          fetchError.name === "TypeError" &&
          fetchError.message === "Failed to fetch"
        ) {
          logger.warn("Network request blocked, possibly by browser extension");
          return null;
        }
        throw fetchError;
      });

      if (!response) {
        // Silently fail if blocked by extension
        setDefiData(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setDefiData(data);
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      logger.warn("Failed to fetch DeFi data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Fetch data on mount and when wallet address changes
  useEffect(() => {
    fetchDefiData();
  }, [fetchDefiData]);

  const toggleProtocol = (protocol: string) => {
    setExpandedProtocols((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(protocol)) {
        newSet.delete(protocol);
      } else {
        newSet.add(protocol);
      }
      return newSet;
    });
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      logger.warn("Failed to copy address:", err);
    }
  };

  const handlePositionClick = (position: any) => {
    setSelectedPosition(position);
    onDialogOpenChange?.(true);
  };

  // Show protocol showcase if no DeFi positions and not loading
  if (!isLoading && (!defiData || defiData.assetCount === 0)) {
    const { DeFiProtocolShowcase } = require("./DeFiProtocolShowcase");
    return <DeFiProtocolShowcase />;
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">Failed to load DeFi data</div>
        <button
          onClick={fetchDefiData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show loading state
  if (isLoading || !defiData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium tracking-tight">
            DeFi Positions
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 border rounded-lg">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-3 border-r border-border/30 last:border-r-0"
            >
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-6 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const protocols = defiData.protocols || [];
  const totalValue = defiData.totalValue || 0;
  const assetCount = defiData.assetCount || 0;
  const protocolCount = defiData.protocolCount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">DeFi Portfolio</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "grid"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
            title="Grid view"
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Simple Stats Grid - like main summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pb-6 border-b">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Total Value
          </p>
          <p className="text-2xl font-normal">{formatCurrency(totalValue)}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Protocols
          </p>
          <p className="text-2xl font-normal">{protocolCount}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Positions
          </p>
          <p className="text-2xl font-normal">{assetCount}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Avg. Value
          </p>
          <p className="text-2xl font-normal">
            {formatCurrency(assetCount > 0 ? totalValue / assetCount : 0)}
          </p>
        </div>
      </div>

      {/* Detailed Positions by Protocol */}
      {protocols.length > 0 && viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {protocols.map((protocol: any, index: number) => (
            <div
              key={index}
              className="bg-card border rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="relative cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Don't call onProtocolClick for icon clicks in DeFi summary
                      // This prevents the view from changing
                    }}
                  >
                    <Image
                      src={getProtocolLogo(protocol.name)}
                      alt={`${protocol.name} logo`}
                      width={40}
                      height={40}
                      className="rounded-lg hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = "/placeholder.jpg";
                      }}
                    />
                  </div>
                  <div>
                    <div className="font-semibold">
                      {cleanProtocolName(protocol.name)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {protocol.assets.length} position
                      {protocol.assets.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">
                    Total Value
                  </span>
                  <span className="font-mono font-bold text-lg">
                    {formatCurrency(protocol.totalValue)}
                  </span>
                </div>

                {/* Show clickable asset positions */}
                <div className="pt-2 border-t space-y-1">
                  {protocol.assets.map((asset: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs p-1.5 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() =>
                        handlePositionClick({
                          ...asset,
                          protocol: protocol.name,
                        })
                      }
                    >
                      <span className="text-muted-foreground">
                        {asset.metadata.symbol}
                      </span>
                      <span className="font-mono">
                        {formatCurrency(asset.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : protocols.length > 0 && viewMode === "list" ? (
        <div className="space-y-2">
          {protocols.map((protocol: any, index: number) => (
            <Collapsible
              key={index}
              open={expandedProtocols.has(protocol.name)}
              onOpenChange={() => toggleProtocol(protocol.name)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-card border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Image
                      src={getProtocolLogo(protocol.name)}
                      alt={`${protocol.name} logo`}
                      width={32}
                      height={32}
                      className="rounded-lg"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = "/placeholder.jpg";
                      }}
                    />
                    <div className="text-left">
                      <div className="font-semibold">
                        {cleanProtocolName(protocol.name)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {protocol.assets.length} position
                        {protocol.assets.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono font-bold text-lg">
                        {formatCurrency(protocol.totalValue)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Value
                      </div>
                    </div>
                    {expandedProtocols.has(protocol.name) ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="px-4 pb-2">
                <div className="space-y-2 mt-2">
                  {protocol.assets.map((asset: any, assetIndex: number) => (
                    <div
                      key={assetIndex}
                      className="flex items-center justify-between p-3 ml-11 bg-muted/20 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() =>
                        handlePositionClick({
                          ...asset,
                          protocol: protocol.name,
                        })
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-background rounded">
                          <Coins className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {asset.metadata.symbol}
                            {asset.defiType && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs capitalize"
                              >
                                {asset.defiType}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {asset.metadata.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold">
                          {formatTokenAmount(asset.balance)}{" "}
                          {asset.metadata.symbol}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(asset.value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      ) : null}

      {/* Explore DeFi Button */}
      <div className="flex justify-center pt-4">
        <a
          href="/defi"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Explore Aptos DeFi
        </a>
      </div>

      {/* Position Detail Dialog */}
      <Dialog
        open={!!selectedPosition}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPosition(null);
            // Ensure we stay in DeFi view when closing the dialog
            setSidebarView?.("defi");
          }
          onDialogOpenChange?.(open);
        }}
      >
        <DialogContent
          className="max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedPosition && (
                <>
                  <Image
                    src={getProtocolLogo(selectedPosition.protocol)}
                    alt={selectedPosition.protocol}
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                  <span>{selectedPosition.metadata?.symbol} Position</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedPosition?.protocol &&
                `${cleanProtocolName(selectedPosition.protocol)} DeFi Position`}
            </DialogDescription>
          </DialogHeader>

          {selectedPosition && (
            <div className="space-y-4 mt-4">
              {/* Token Info */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Token</span>
                  <span className="font-medium">
                    {selectedPosition.metadata?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Symbol</span>
                  <span className="font-mono">
                    {selectedPosition.metadata?.symbol}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant="outline" className="capitalize">
                    {selectedPosition.defiType || "Unknown"}
                  </Badge>
                </div>
              </div>

              {/* Balance & Value */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Balance</span>
                  <span className="font-mono font-semibold">
                    {formatTokenAmount(
                      selectedPosition.balance,
                      selectedPosition.metadata?.decimals,
                    )}{" "}
                    {selectedPosition.metadata?.symbol}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="font-mono">
                    {selectedPosition.price
                      ? formatCurrency(selectedPosition.price)
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-sm font-medium">Total Value</span>
                  <span className="font-mono font-bold text-lg">
                    {formatCurrency(selectedPosition.value || 0)}
                  </span>
                </div>
              </div>

              {/* Contract Address */}
              {selectedPosition.asset_type && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm text-muted-foreground">
                      Contract
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs break-all">
                        {selectedPosition.asset_type.length > 20
                          ? `${selectedPosition.asset_type.slice(0, 10)}...${selectedPosition.asset_type.slice(-10)}`
                          : selectedPosition.asset_type}
                      </span>
                      <button
                        onClick={() =>
                          handleCopyAddress(selectedPosition.asset_type)
                        }
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title="Copy address"
                      >
                        {copiedAddress ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Metadata */}
              {selectedPosition.metadata?.decimals && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Decimals
                    </span>
                    <span className="font-mono">
                      {selectedPosition.metadata.decimals}
                    </span>
                  </div>
                  {selectedPosition.token_standard && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Standard
                      </span>
                      <span className="font-mono text-xs">
                        {selectedPosition.token_standard}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const NFTSummaryView: React.FC<NFTSummaryViewProps> = ({
  nfts,
  currentPageNFTs: _currentPageNFTs,
  totalNFTCount,
  nftCollectionStats,
  onCollectionClick,
  includeGrid = false,
  filteredNFTs,
  nftsLoading = false,
  hasMoreNFTs = false,
  isLoadingMore = false,
  loadMoreNFTs,
  selectedNFT,
  onNFTSelect,
}) => {
  const [showMetrics, setShowMetrics] = React.useState(false);

  // Use totalNFTCount if available, otherwise fall back to loaded NFTs length
  const actualNFTCount = totalNFTCount ?? nfts.length;

  // Use collection stats from API if available, otherwise calculate from loaded NFTs
  const collections = React.useMemo((): [string, number][] => {
    if (nftCollectionStats && nftCollectionStats.collections.length > 0) {
      // Use pre-calculated collection stats from API
      return nftCollectionStats.collections.map(
        ({ name, count }) => [name, count] as [string, number],
      );
    } else {
      // Fallback to calculating from loaded NFTs
      const collectionMap = nfts.reduce((acc: Record<string, number>, nft) => {
        acc[nft.collection_name] = (acc[nft.collection_name] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(collectionMap).sort(([, a], [, b]) => b - a) as [
        string,
        number,
      ][];
    }
  }, [nfts, nftCollectionStats]);

  // Check if dark mode for treemap colors
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  React.useEffect(() => {
    const checkDark = () =>
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Prepare NFT stats for NFTTreemap component
  const nftStats = useMemo(() => {
    if (nftCollectionStats) {
      return nftCollectionStats;
    }
    // Create stats from collections array
    return {
      collections: collections.map(([name, count]) => ({
        name: name || "Unnamed Collection",
        count: count as number,
      })),
      totalCollections: collections.length,
    };
  }, [nftCollectionStats, collections]);

  const totalCollections =
    nftCollectionStats?.totalCollections ??
    new Set(nfts.map((nft) => nft.collection_name)).size;

  // Determine if we should show skeleton for treemap
  const shouldShowTreemapSkeleton =
    nftsLoading ||
    // Show skeleton if we don't have collection stats and we know there should be NFTs
    (!nftCollectionStats &&
      totalNFTCount !== null &&
      totalNFTCount !== undefined &&
      totalNFTCount > 0 &&
      nfts.length === 0);

  if (nfts.length === 0 && totalNFTCount === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No digital assets
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Minimal Stats */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            <span className="hidden sm:inline">Total Assets</span>
            <span className="sm:hidden">Total</span>
          </p>
          <p className="text-xl font-light">{actualNFTCount}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            <span className="hidden sm:inline">Collections</span>
            <span className="sm:hidden">Collections</span>
          </p>
          <p className="text-xl font-light">{totalCollections}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            <span className="hidden sm:inline">Top Collection</span>
            <span className="sm:hidden">Top</span>
          </p>
          <p className="text-xl font-light">
            {String(collections[0]?.[1] || 0)}
          </p>
        </div>
      </div>

      {/* Collections Treemap or NFT Details */}
      {selectedNFT ? (
        <div className="rounded-lg overflow-hidden">
          {/* NFT Image - Full width */}
          <div className="relative w-full aspect-square bg-neutral-100 dark:bg-neutral-900">
            <Image
              src={sanitizeImageUrl(
                selectedNFT.cdn_image_uri || selectedNFT.token_uri,
                "/placeholder.jpg",
              )}
              alt={sanitizeNFTMetadata(selectedNFT).token_name || "NFT"}
              fill
              className="object-contain"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.src = "/placeholder.jpg";
              }}
            />
          </div>

          {/* NFT Details Below */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-lg">
                {sanitizeNFTMetadata(selectedNFT).token_name || "Unnamed NFT"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {sanitizeNFTMetadata(selectedNFT).collection_name ||
                  "Unknown Collection"}
              </p>
            </div>

            {selectedNFT.amount > 1 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{selectedNFT.amount}</span>
              </div>
            )}

            {selectedNFT.description && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Description:</p>
                <p className="line-clamp-3">
                  {sanitizeNFTMetadata(selectedNFT).description}
                </p>
              </div>
            )}

            <button
              onClick={() => onNFTSelect && onNFTSelect(null)}
              className="text-sm text-primary hover:underline"
            >
              ← Back to collections
            </button>
          </div>
        </div>
      ) : shouldShowTreemapSkeleton ? (
        <NFTTreemapSkeleton />
      ) : (
        <NFTTreemap
          stats={nftStats}
          totalCount={actualNFTCount}
          isDarkMode={isDarkMode}
        />
      )}

      {/* NFT Grid - only on mobile */}
      {includeGrid && (
        <div className="h-[400px] overflow-y-auto">
          <MinimalNFTGrid
            nfts={filteredNFTs || nfts}
            nftsLoading={nftsLoading}
            hasMoreNFTs={hasMoreNFTs}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMoreNFTs || (() => {})}
            selectedNFT={selectedNFT || null}
            onNFTSelect={onNFTSelect || (() => {})}
          />
        </div>
      )}

      {/* Collector Metrics - Desktop: Always open with header, Mobile: Toggle */}
      <div className="space-y-4">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <h3 className="text-lg font-medium mb-4">Collector Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
            <div className="rounded-lg p-3 sm:p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Concentration
                </p>
                <p className="text-lg sm:text-xl font-semibold">
                  {(
                    (collections
                      .slice(0, 3)
                      .reduce(
                        (sum: number, [_, count]: [string, number]) =>
                          sum + count,
                        0,
                      ) /
                      actualNFTCount) *
                    100
                  ).toFixed(0)}
                  %
                </p>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                In top 3 collections
              </p>
            </div>
            <div className="rounded-lg p-3 sm:p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Toe Dipper
                </p>
                <p className="text-lg sm:text-xl font-semibold">
                  {
                    collections.filter(
                      ([_, count]: [string, number]) => count === 1,
                    ).length
                  }
                </p>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                1 per collection
              </p>
            </div>
            <div className="rounded-lg p-3 sm:p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Largest Collection
                </p>
                <p className="text-lg sm:text-xl font-semibold">
                  {Math.round(
                    ((collections[0]?.[1] || 0) / actualNFTCount) * 100,
                  )}
                  %
                </p>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Of total NFTs
              </p>
            </div>
            <div className="rounded-lg p-3 sm:p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Fan Status
                </p>
                <p className="text-lg sm:text-xl font-semibold">
                  {
                    collections.filter(
                      ([_, count]: [string, number]) => count >= 5,
                    ).length
                  }
                </p>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                5 per collection
              </p>
            </div>
            <div className="rounded-lg p-3 sm:p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Avg Holding
                </p>
                <p className="text-lg sm:text-xl font-semibold">
                  {Math.round(actualNFTCount / totalCollections)} NFTs
                </p>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Per collection
              </p>
            </div>
            <div className="rounded-lg p-3 sm:p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  Stan Status
                </p>
                <p className="text-lg sm:text-xl font-semibold">
                  {
                    collections.filter(
                      ([_, count]: [string, number]) => count >= 10,
                    ).length
                  }
                </p>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                10 per collection
              </p>
            </div>
          </div>
          {/* Desktop divider */}
          <div className="border-b border-neutral-200 dark:border-neutral-800 mt-6"></div>
        </div>

        {/* Mobile Toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium">Collector Metrics</span>
            <svg
              className={`w-5 h-5 transition-transform ${showMetrics ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Mobile Metrics Grid */}
          {showMetrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="rounded-lg p-3 sm:p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    Concentration
                  </p>
                  <p className="text-lg sm:text-xl font-semibold">
                    {(
                      (collections
                        .slice(0, 3)
                        .reduce(
                          (sum: number, [_, count]: [string, number]) =>
                            sum + count,
                          0,
                        ) /
                        actualNFTCount) *
                      100
                    ).toFixed(0)}
                    %
                  </p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  In top 3 collections
                </p>
              </div>
              <div className="rounded-lg p-3 sm:p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    Toe Dipper
                  </p>
                  <p className="text-lg sm:text-xl font-semibold">
                    {
                      collections.filter(
                        ([_, count]: [string, number]) => count === 1,
                      ).length
                    }
                  </p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  1 per collection
                </p>
              </div>
              <div className="rounded-lg p-3 sm:p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    Largest Collection
                  </p>
                  <p className="text-lg sm:text-xl font-semibold">
                    {Math.round(
                      ((collections[0]?.[1] || 0) / actualNFTCount) * 100,
                    )}
                    %
                  </p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Of total NFTs
                </p>
              </div>
              <div className="rounded-lg p-3 sm:p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    Fan Status
                  </p>
                  <p className="text-lg sm:text-xl font-semibold">
                    {
                      collections.filter(
                        ([_, count]: [string, number]) => count >= 5,
                      ).length
                    }
                  </p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  5 per collection
                </p>
              </div>
              <div className="rounded-lg p-3 sm:p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    Avg Holding
                  </p>
                  <p className="text-lg sm:text-xl font-semibold">
                    {Math.round(actualNFTCount / totalCollections)} NFTs
                  </p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Per collection
                </p>
              </div>
              <div className="rounded-lg p-3 sm:p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    Stan Status
                  </p>
                  <p className="text-lg sm:text-xl font-semibold">
                    {
                      collections.filter(
                        ([_, count]: [string, number]) => count >= 10,
                      ).length
                    }
                  </p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  10 per collection
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
