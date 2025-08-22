"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { formatTokenPrice, formatCurrency } from "@/lib/utils/format/format";
import { ChevronUp, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface TokenData {
  symbol: string;
  name: string;
  price: number;
  supply: number;
  marketCap: number;
  decimals: number;
  faAddress?: string;
  tokenAddress?: string;
  logoUrl?: string;
  panoraTags?: string[];
  isVerified?: boolean;
}

interface PriceListProps {
  className?: string;
}

export function PriceList({ className }: PriceListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'marketCap' | 'price' | 'name'>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [displayedCount, setDisplayedCount] = useState(55);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showUnverified, setShowUnverified] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch token prices
  const { data: tokens, isLoading } = useQuery({
    queryKey: ['token-prices'],
    queryFn: async () => {
      const response = await fetch("/api/aptos/tokens?limit=5000"); // Fetch more tokens
      if (!response.ok) throw new Error("Failed to fetch token prices");
      const result = await response.json();
      return result.data?.tokens || [];
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 60000,
  });

  // Filter and sort tokens (moved before useEffect to fix reference error)
  const { verifiedTokens, unverifiedTokens, displayTokens } = useMemo(() => {
    if (!tokens) return { verifiedTokens: [], unverifiedTokens: [], displayTokens: [] };
    
    // First separate verified and unverified tokens
    const verified = tokens.filter((token: TokenData) => {
      const isVerified = token.isVerified;
      
      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return isVerified && (
          token.symbol?.toLowerCase().includes(search) ||
          token.name?.toLowerCase().includes(search)
        );
      }
      return isVerified;
    });

    const unverified = tokens.filter((token: TokenData) => {
      const isUnverified = !token.isVerified;
      
      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return isUnverified && (
          token.symbol?.toLowerCase().includes(search) ||
          token.name?.toLowerCase().includes(search)
        );
      }
      return isUnverified;
    });

    // Sort function
    const sortTokens = (tokenList: TokenData[]) => {
      return tokenList.sort((a: TokenData, b: TokenData) => {
        let compareValue = 0;
        
        switch (sortBy) {
          case 'marketCap':
            compareValue = (a.marketCap || 0) - (b.marketCap || 0);
            break;
          case 'price':
            compareValue = (a.price || 0) - (b.price || 0);
            break;
          case 'name':
            compareValue = (a.symbol || '').localeCompare(b.symbol || '');
            break;
        }
        
        return sortOrder === 'desc' ? -compareValue : compareValue;
      });
    };

    const sortedVerified = sortTokens([...verified]);
    const sortedUnverified = sortTokens([...unverified]);

    // Combine tokens based on showUnverified state
    let allTokens = [...sortedVerified];
    if (showUnverified) {
      allTokens = [...sortedVerified, ...sortedUnverified];
    }

    return {
      verifiedTokens: sortedVerified,
      unverifiedTokens: sortedUnverified,
      displayTokens: allTokens.slice(0, displayedCount)
    };
  }, [tokens, searchTerm, sortBy, sortOrder, displayedCount, showUnverified]);

  // Handle scroll-based loading
  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container || isLoadingMore) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      const totalAvailable = showUnverified 
        ? verifiedTokens.length + unverifiedTokens.length 
        : verifiedTokens.length;

      // Load more when user scrolls to 80% of the content
      if (scrollPercentage > 0.8 && displayedCount < totalAvailable) {
        setIsLoadingMore(true);
        
        setTimeout(() => {
          setDisplayedCount(prevCount => Math.min(prevCount + 100, totalAvailable));
          setIsLoadingMore(false);
        }, 300);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [displayedCount, verifiedTokens.length, unverifiedTokens.length, showUnverified, isLoadingMore]);

  // Reset displayed count and unverified state when search or sort changes
  useEffect(() => {
    setDisplayedCount(55);
    setShowUnverified(false);
  }, [searchTerm, sortBy, sortOrder]);

  const handleSort = (newSortBy: 'marketCap' | 'price' | 'name') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="px-4 py-2 flex-shrink-0">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Prices Powered by{" "}
          <a 
            href="https://panora.exchange/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white hover:text-white/80 transition-colors"
          >
            Panora
          </a>
        </h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        
        {/* Sort buttons */}
        <div className="flex gap-1 mt-3">
          <button
            onClick={() => handleSort('marketCap')}
            className={cn(
              "px-2 py-1 text-xs rounded transition-colors",
              sortBy === 'marketCap' 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80"
            )}
          >
            Market Cap
            {sortBy === 'marketCap' && (
              sortOrder === 'desc' ? <ChevronDown className="inline h-3 w-3 ml-1" /> : <ChevronUp className="inline h-3 w-3 ml-1" />
            )}
          </button>
          <button
            onClick={() => handleSort('price')}
            className={cn(
              "px-2 py-1 text-xs rounded transition-colors",
              sortBy === 'price' 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80"
            )}
          >
            Price
            {sortBy === 'price' && (
              sortOrder === 'desc' ? <ChevronDown className="inline h-3 w-3 ml-1" /> : <ChevronUp className="inline h-3 w-3 ml-1" />
            )}
          </button>
          <button
            onClick={() => handleSort('name')}
            className={cn(
              "px-2 py-1 text-xs rounded transition-colors",
              sortBy === 'name' 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80"
            )}
          >
            Name
            {sortBy === 'name' && (
              sortOrder === 'desc' ? <ChevronDown className="inline h-3 w-3 ml-1" /> : <ChevronUp className="inline h-3 w-3 ml-1" />
            )}
          </button>
        </div>
      </div>
      
      <div ref={scrollContainerRef} className="overflow-y-auto flex-1 min-h-0">
        {isLoading ? (
          <div className="px-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-muted rounded-full animate-pulse" />
                  <div>
                    <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-20 bg-muted rounded animate-pulse mt-1" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-12 bg-muted rounded animate-pulse mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="">
            {displayTokens.map((token: TokenData, index: number) => {
              const isUnverifiedToken = !token.isVerified;
              const isFirstUnverified = isUnverifiedToken && index > 0 && displayTokens[index - 1]?.isVerified;
              
              return (
                <div key={token.faAddress || token.tokenAddress || index}>
                  {/* Show divider and label when transitioning to unverified tokens */}
                  {isFirstUnverified && (
                    <div className="px-4 py-2 bg-muted/10 border-y border-border/50">
                      <p className="text-xs font-medium text-muted-foreground">Unverified Tokens</p>
                    </div>
                  )}
                  
                  <div className={cn(
                    "px-4 py-2 hover:bg-muted/20 transition-colors border-b border-border/30",
                    isUnverifiedToken && "opacity-75"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {token.logoUrl && (
                          <Image
                            src={token.logoUrl}
                            alt={token.symbol}
                            width={20}
                            height={20}
                            className={cn(
                              "rounded-full flex-shrink-0",
                              token.symbol === "APT" && "dark:invert"
                            )}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-medium truncate">{token.symbol}</p>
                            {isUnverifiedToken && (
                              <span className="text-xs text-amber-500 dark:text-amber-400">⚠</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{token.name}</p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-mono">{formatTokenPrice(token.price)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(token.marketCap, "USD", { compact: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Show Unverified button */}
            {!showUnverified && !searchTerm && unverifiedTokens.length > 0 && displayedCount >= verifiedTokens.length && (
              <div className="px-4 py-3 text-center border-t border-border/30">
                <button
                  onClick={() => setShowUnverified(true)}
                  className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
                >
                  Show Unverified ({unverifiedTokens.length})
                </button>
              </div>
            )}

            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="px-4 py-3 text-center text-sm text-muted-foreground">
                <div className="inline-flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Loading more tokens...
                </div>
              </div>
            )}

            {displayTokens.length === 0 && !isLoading && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {searchTerm ? `No tokens found for "${searchTerm}"` : "No tokens available"}
              </div>
            )}
            
            {/* Show count and scroll indicator */}
            {!isLoadingMore && showUnverified && displayedCount < (verifiedTokens.length + unverifiedTokens.length) && !searchTerm && (
              <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-border/30">
                Showing {displayTokens.length} of {verifiedTokens.length + unverifiedTokens.length} tokens • Scroll to load more
              </div>
            )}

            {/* Show verified tokens count when only showing verified */}
            {!isLoadingMore && !showUnverified && displayedCount < verifiedTokens.length && !searchTerm && (
              <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-border/30">
                Showing {displayTokens.length} of {verifiedTokens.length} verified tokens • Scroll to load more
              </div>
            )}

            {/* Show when all tokens are loaded */}
            {!isLoadingMore && showUnverified && displayedCount >= (verifiedTokens.length + unverifiedTokens.length) && (verifiedTokens.length + unverifiedTokens.length) > 55 && !searchTerm && (
              <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-border/30">
                All {verifiedTokens.length + unverifiedTokens.length} tokens loaded ({verifiedTokens.length} verified, {unverifiedTokens.length} unverified)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}