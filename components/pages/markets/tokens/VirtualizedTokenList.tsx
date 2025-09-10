"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UI_CONSTANTS } from "@/lib/config/portfolio";
import type { TokenListItem, TokensResponse } from "@/lib/types/tokens";
import { formatCurrency, formatNumber, formatTokenPrice } from "@/lib/utils/format";

const ITEM_HEIGHT = UI_CONSTANTS.ITEM_HEIGHT;
const PAGE_SIZE = UI_CONSTANTS.PAGE_SIZE; // Load all tokens to show verified ones first

async function fetchTokens({ pageParam = 0 }): Promise<TokensResponse> {
  const response = await fetch(`/api/aptos/tokens?limit=${PAGE_SIZE}&offset=${pageParam}`);

  if (!response.ok) {
    throw new Error("Failed to fetch tokens");
  }

  const data = await response.json();

  return {
    tokens: data.data?.tokens || [],
    totalTokens: data.data?.totalTokens || 0,
    hasMore: (data.data?.tokens?.length || 0) === PAGE_SIZE,
    nextCursor: pageParam + PAGE_SIZE,
  };
}

function TokenRow({ token, style }: { token: TokenListItem; style: React.CSSProperties }) {
  const priceChangeColor = (token.priceChange24H || 0) >= 0 ? "text-green-500" : "text-red-500";
  const TrendIcon = (token.priceChange24H || 0) >= 0 ? TrendingUp : TrendingDown;

  return (
    <div style={style} className="px-4">
      <div className="py-2 border-b hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Rank */}
            <span className="text-sm text-muted-foreground font-medium w-8">
              #{token.rank || 0}
            </span>

            {/* Logo and Name */}
            <div className="flex items-center gap-2">
              {token.logoUrl ? (
                <img
                  src={token.logoUrl}
                  alt={token.symbol}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-semibold">
                    {token.symbol?.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{token.symbol}</span>
                  {token.isVerified && (
                    <Badge variant="secondary" className="h-5 text-xs">
                      Verified
                    </Badge>
                  )}
                  {token.panoraTags?.includes("Bridged") && (
                    <Badge
                      variant="outline"
                      className="h-5 text-xs border-muted-foreground/60 text-muted-foreground bg-muted/20"
                    >
                      Bridged
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{token.name}</span>
              </div>
            </div>
          </div>

          {/* Price and Market Data */}
          <div className="flex items-center gap-6">
            {/* Price */}
            <div className="text-right">
              <div className="font-medium">
                {token.price ? formatTokenPrice(parseFloat(token.price)) : "-"}
              </div>
              {token.priceChange24H !== undefined && token.priceChange24H !== 0 && (
                <div className={`flex items-center justify-end gap-1 text-xs ${priceChangeColor}`}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{Math.abs(token.priceChange24H).toFixed(2)}%</span>
                </div>
              )}
            </div>

            {/* Market Cap */}
            <div className="text-right min-w-[100px]">
              <div className="text-xs text-muted-foreground">Market Cap</div>
              <div className="font-medium">
                {token.marketCap ? formatCurrency(token.marketCap) : "-"}
              </div>
            </div>

            {/* FDV */}
            <div className="text-right min-w-[100px]">
              <div className="text-xs text-muted-foreground">FDV</div>
              <div className="font-medium">
                {token.fullyDilutedValuation
                  ? formatCurrency(token.fullyDilutedValuation)
                  : token.marketCap
                    ? formatCurrency(token.marketCap)
                    : "-"}
              </div>
            </div>

            {/* Category */}
            <div className="min-w-[80px]">
              <Badge variant="outline" className="capitalize">
                {token.category || "other"}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingRow({ style }: { style: React.CSSProperties }) {
  return (
    <div style={style} className="px-4">
      <div className="py-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-4" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <div>
              <Skeleton className="w-16 h-4 mb-1" />
              <Skeleton className="w-24 h-3" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Skeleton className="w-20 h-8" />
            <Skeleton className="w-24 h-8" />
            <Skeleton className="w-24 h-8" />
            <Skeleton className="w-16 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function VirtualizedTokenList() {
  const listRef = useRef<List>(null);
  const [listHeight, setListHeight] = useState<number>(UI_CONSTANTS.MIN_LIST_HEIGHT);

  useEffect(() => {
    const updateHeight = () => {
      setListHeight(
        Math.max(UI_CONSTANTS.MIN_LIST_HEIGHT, window.innerHeight - UI_CONSTANTS.VIEWPORT_OFFSET)
      );
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: ["tokens"],
      queryFn: fetchTokens,
      getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
      initialPageParam: 0,
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 5, // 5 minutes cache time
    });

  // Flatten all pages of tokens
  const tokens = data?.pages.flatMap((page) => page.tokens) || [];
  const totalTokens = data?.pages[0]?.totalTokens || 0;

  // Debug logging removed for production

  // Infinite loader item count
  const itemCount = hasNextPage ? tokens.length + 1 : tokens.length;

  // Check if item is loaded
  const isItemLoaded = useCallback(
    (index: number) => !hasNextPage || index < tokens.length,
    [hasNextPage, tokens.length]
  );

  // Load more items
  const loadMoreItems = useCallback(
    (startIndex: number, stopIndex: number): Promise<void> => {
      if (!isFetchingNextPage) {
        return fetchNextPage().then(() => void 0);
      }
      return Promise.resolve();
    },
    [fetchNextPage, isFetchingNextPage]
  );

  // Render row
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      if (!isItemLoaded(index)) {
        return <LoadingRow style={style} />;
      }

      const token = tokens[index];
      return token ? (
        <TokenRow token={{ ...token, rank: index + 1 }} style={style} />
      ) : (
        <LoadingRow style={style} />
      );
    },
    [isItemLoaded, tokens]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading tokens...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-500">
          <p>Failed to load tokens</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">All Tokens ({formatNumber(totalTokens)})</CardTitle>
          <div className="text-sm text-muted-foreground">
            Showing {tokens.length} of {formatNumber(totalTokens)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Virtualized List */}
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={(list) => {
                ref(list);
                (listRef as any).current = list;
              }}
              height={listHeight}
              itemCount={itemCount}
              itemSize={ITEM_HEIGHT}
              width="100%"
              onItemsRendered={onItemsRendered}
              className="scrollbar-thin scrollbar-thumb-gray-300"
            >
              {Row}
            </List>
          )}
        </InfiniteLoader>
      </CardContent>

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Loading more tokens...</span>
        </div>
      )}
    </Card>
  );
}
