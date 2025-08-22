"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import React, { useState, useEffect } from "react";

import { useSelection } from "@/app/portfolio/_providers";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatTokenPrice } from "@/lib/utils/format/format";

interface PanoraToken {
  chainId: number;
  panoraId: string;
  tokenAddress: string | null;
  faAddress: string | null;
  name: string;
  symbol: string;
  decimals: number;
  usdPrice: string;
  logoUrl?: string;
  panoraTags?: string[];
  change24h?: number;
  marketCap?: number;
  isVerified?: boolean;
}

export function TokenPricesSidebar({
  connected,
  compact,
}: {
  connected?: boolean;
  compact?: boolean;
}) {
  const [tokens, setTokens] = useState<PanoraToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalTokens, setTotalTokens] = useState(0);
  const TOKENS_PER_PAGE = 50; // Increased for infinite scroll
  const { selectedAsset, setSelectedAsset } = useSelection();

  const fetchTokenPrices = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      // Build query parameters for pagination
      const params = new URLSearchParams();
      params.set("limit", TOKENS_PER_PAGE.toString());
      const offset = (page - 1) * TOKENS_PER_PAGE;
      params.set("offset", offset.toString());

      const response = await fetch(`/api/aptos/tokens?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch token prices");
      }

      const data = await response.json();

      // Get total count for pagination
      const totalAvailable = data.data?.summary?.total_tokens || 3361;

      // Transform the response to match our interface
      const allTokens = data.data?.tokens || data.tokens || [];

      const tokensData = allTokens.map((token: unknown) => ({
        chainId: 1,
        panoraId:
          token.panoraId ||
          token.symbol ||
          token.faAddress ||
          token.tokenAddress,
        tokenAddress: token.tokenAddress,
        faAddress: token.faAddress,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals || 8,
        usdPrice: token.price?.toString() || "0",
        logoUrl: token.logoUrl,
        panoraTags: token.panoraTags || [],
        marketCap: token.marketCap || 0,
        change24h: token.priceChange24h,
        isVerified:
          token.isVerified || token.panoraTags?.includes("Verified") || false,
      }));

      // Sort by verification status first, then by market cap/price
      tokensData.sort((a: unknown, b: unknown) => {
        if (a.isVerified !== b.isVerified) {
          return b.isVerified ? 1 : -1;
        }
        if (a.marketCap && b.marketCap) {
          return b.marketCap - a.marketCap;
        }
        return parseFloat(b.usdPrice) - parseFloat(a.usdPrice);
      });

      if (append) {
        setTokens((prevTokens) => [...prevTokens, ...tokensData]);
      } else {
        setTokens(tokensData);
      }

      setTotalTokens(totalAvailable);
      setCurrentPage(page);

      // Check if there are more pages
      const totalPages = Math.ceil(totalAvailable / TOKENS_PER_PAGE);
      setHasMore(page < totalPages && tokensData.length === TOKENS_PER_PAGE);
    } catch (error) {
      logger.error(`Failed to fetch token prices: ${error}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more tokens for infinite scroll
  const loadMoreTokens = () => {
    if (!loadingMore && hasMore) {
      fetchTokenPrices(currentPage + 1, true);
    }
  };

  // Handle scroll detection for infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const threshold = 100; // Load more when 100px from bottom

    if (
      scrollHeight - scrollTop - clientHeight < threshold &&
      hasMore &&
      !loadingMore
    ) {
      loadMoreTokens();
    }
  };

  useEffect(() => {
    fetchTokenPrices(1);
  }, []);

  // Auto-refresh every 30 seconds - only refresh the first page
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if we're not loading more data
      if (!loadingMore) {
        fetchTokenPrices(1, false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadingMore]);

  return (
    <div className="h-full flex flex-col">
      {!compact && (
        <div className="px-2 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base">Live Prices</h3>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {totalTokens.toLocaleString()} tokens
            </Badge>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-2" onScroll={handleScroll}>
          <div className="">
            {loading ? (
              // Loading skeleton for initial load
              Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="p-2 rounded animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted" />
                      <div>
                        <div className="h-3 w-12 bg-muted rounded mb-1" />
                        <div className="h-2 w-20 bg-muted rounded" />
                      </div>
                    </div>
                    <div>
                      <div className="h-3 w-16 bg-muted rounded mb-1" />
                      <div className="h-2 w-12 bg-muted rounded ml-auto" />
                    </div>
                  </div>
                </div>
              ))
            ) : tokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No price data available
              </div>
            ) : (
              (compact ? tokens.slice(0, 8) : tokens).map((token, _index) => {
                // Use real price change if available, otherwise don't show change
                const change24h = token.change24h || 0;
                const hasChange = token.change24h !== undefined;
                const isPositive = change24h >= 0;

                const isSelected =
                  selectedAsset?.address ===
                    (token.faAddress || token.tokenAddress) ||
                  selectedAsset?.token_address ===
                    (token.faAddress || token.tokenAddress) ||
                  selectedAsset?.symbol === token.symbol;

                return (
                  <div
                    key={`${token.panoraId || token.faAddress || token.tokenAddress}-${index}`}
                    className={cn(
                      "transition-all duration-200 cursor-pointer group",
                      connected ? "py-3" : "py-2.5",
                      isSelected ? "bg-primary/5" : "hover:bg-muted/30",
                      index !== 0 && "border-t border-border/30",
                    )}
                    onClick={() => {
                      setSelectedAsset({
                        address: token.faAddress || token.tokenAddress,
                        token_address: token.faAddress || token.tokenAddress,
                        symbol: token.symbol,
                        name: token.name,
                        logoUrl: token.logoUrl,
                        price: parseFloat(token.usdPrice),
                        decimals: token.decimals,
                      });
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Token Logo */}
                        <div className="relative flex-shrink-0">
                          {token.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={token.logoUrl}
                              alt={token.symbol}
                              className={cn(
                                "rounded-full object-cover ring-2 ring-background",
                                connected ? "w-12 h-12" : "w-10 h-10",
                                token.symbol === "APT" ? "dark:invert" : "",
                              )}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback =
                                    document.createElement("div");
                                  fallback.className = connected
                                    ? "w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-background"
                                    : "w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-background";
                                  fallback.innerHTML = `<span class="text-xs font-bold text-primary">${token.symbol.slice(0, 2).toUpperCase()}</span>`;
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          ) : (
                            <div
                              className={cn(
                                "rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-background",
                                connected ? "w-12 h-12" : "w-10 h-10",
                              )}
                            >
                              <span className="text-xs font-bold text-primary">
                                {token.symbol.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Token Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-semibold truncate",
                                connected ? "text-base" : "text-sm",
                              )}
                              title={token.symbol}
                            >
                              {token.symbol}
                            </span>
                          </div>
                          <span
                            className="text-xs text-muted-foreground truncate block mt-0.5"
                            title={token.name}
                          >
                            {token.name}
                          </span>
                        </div>
                      </div>

                      {/* Price Info */}
                      <div className="text-right flex-shrink-0 min-w-[80px]">
                        <div
                          className={cn(
                            "font-mono font-semibold",
                            connected ? "text-base" : "text-sm",
                          )}
                          title="Price (USD)"
                        >
                          {parseFloat(token.usdPrice) > 0
                            ? formatTokenPrice(parseFloat(token.usdPrice))
                            : "--"}
                        </div>
                        {hasChange ? (
                          <div
                            className={cn(
                              "flex items-center justify-end gap-1 text-xs font-medium mt-0.5",
                              isPositive
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400",
                            )}
                            title="24 Hour Change"
                          >
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            <span>
                              {isPositive ? "+" : ""}
                              {change24h.toFixed(2)}%
                            </span>
                          </div>
                        ) : token.marketCap && token.marketCap > 0 ? (
                          <div
                            className="text-xs text-muted-foreground mt-0.5"
                            title="Market Cap"
                          >
                            {token.marketCap >= 1000000000
                              ? `$${(token.marketCap / 1000000000).toFixed(1)}B`
                              : token.marketCap >= 1000000
                                ? `$${(token.marketCap / 1000000).toFixed(1)}M`
                                : token.marketCap >= 1000
                                  ? `$${(token.marketCap / 1000).toFixed(0)}K`
                                  : `$${token.marketCap.toFixed(0)}`}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {parseFloat(token.usdPrice) > 0 ? "Live" : "--"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Load More Indicator */}
            {loadingMore && (
              <div className="py-4 flex items-center justify-center">
                <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 rounded-full bg-primary/20 animate-pulse"></div>
                  <span className="text-sm">Loading more tokens...</span>
                </div>
              </div>
            )}

            {/* End of list indicator */}
            {!hasMore && tokens.length > 0 && !loading && (
              <div className="py-4 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">
                  Showing all {tokens.length} tokens
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
