"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCompactNumber, formatCurrency, formatTokenPrice } from "@/lib/utils/format";

interface TokenData {
  symbol: string;
  name: string;
  price: number;
  supply: number;
  marketCap: number;
  fullyDilutedValuation?: number;
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch token prices for portfolio page - limited to 25 for performance
  const { data: tokens, isLoading } = useQuery({
    queryKey: ["token-prices"],
    queryFn: async () => {
      const response = await fetch("/api/markets/tokens?limit=25");
      if (!response.ok) throw new Error("Failed to fetch token prices");
      const result = await response.json();
      return result.data?.tokens || [];
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 60000,
  });

  // Filter and sort tokens (moved before useEffect to fix reference error)
  const { verifiedTokens, unverifiedTokens, displayTokens, categoryCounts } = useMemo(() => {
    if (!tokens)
      return {
        verifiedTokens: [],
        unverifiedTokens: [],
        displayTokens: [],
        categoryCounts: {},
      };

    // Calculate category counts for all tokens
    const counts: { [key: string]: number } = {
      all: tokens.length,
      defi: 0,
      memes: 0,
    };

    // Get all unique Panora categories
    const panoraCategories = new Set<string>();
    tokens.forEach((token: TokenData) => {
      if (token.panoraTags) {
        token.panoraTags.forEach((tag: string) => {
          panoraCategories.add(tag.toLowerCase());
          if (!counts[tag.toLowerCase()]) {
            counts[tag.toLowerCase()] = 0;
          }
        });
      }
    });

    // Count tokens in each category
    tokens.forEach((token: TokenData) => {
      const symbol = token.symbol?.toUpperCase();
      const name = token.name?.toLowerCase();

      // DeFi tokens (custom category)
      if (
        [
          "AMI",
          "RION",
          "THL",
          "ECHO",
          "LSD",
          "CELL",
          "CAKE",
          "SUSHI",
          "UNI",
          "AAVE",
          "CRV",
          "COMP",
        ].includes(symbol) ||
        name?.includes("finance") ||
        name?.includes("swap") ||
        name?.includes("lending")
      ) {
        counts.defi++;
      }

      // Meme tokens (enhanced with Panora tags)
      if (
        token.panoraTags?.includes("Meme") ||
        ["DOGE", "SHIB", "PEPE", "FLOKI", "BONK", "WIF"].includes(symbol) ||
        name?.includes("doge") ||
        name?.includes("shib") ||
        name?.includes("pepe") ||
        name?.includes("moon") ||
        name?.includes("inu")
      ) {
        counts.memes++;
      }

      // Count Panora tags
      if (token.panoraTags) {
        token.panoraTags.forEach((tag: string) => {
          counts[tag.toLowerCase()]++;
        });
      }
    });

    // Filter by category
    const categoryFilteredTokens = tokens.filter((token: TokenData) => {
      if (selectedCategory === "all") return true;

      const symbol = token.symbol?.toUpperCase();
      const name = token.name?.toLowerCase();

      if (selectedCategory === "defi") {
        // DeFi tokens (custom category)
        return (
          [
            "AMI",
            "RION",
            "THL",
            "ECHO",
            "LSD",
            "CELL",
            "CAKE",
            "SUSHI",
            "UNI",
            "AAVE",
            "CRV",
            "COMP",
          ].includes(symbol) ||
          name?.includes("finance") ||
          name?.includes("swap") ||
          name?.includes("lending")
        );
      }

      if (selectedCategory === "memes") {
        // Meme tokens (enhanced with Panora tags)
        return (
          token.panoraTags?.includes("Meme") ||
          ["DOGE", "SHIB", "PEPE", "FLOKI", "BONK", "WIF"].includes(symbol) ||
          name?.includes("doge") ||
          name?.includes("shib") ||
          name?.includes("pepe") ||
          name?.includes("moon") ||
          name?.includes("inu")
        );
      }

      // Check if token has the selected Panora tag
      return (
        token.panoraTags?.some((tag) => tag.toLowerCase() === selectedCategory.toLowerCase()) ||
        false
      );
    });

    // First separate verified and unverified tokens
    const verified = categoryFilteredTokens.filter((token: TokenData) => {
      const isVerified = token.isVerified;

      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          isVerified &&
          (token.symbol?.toLowerCase().includes(search) ||
            token.name?.toLowerCase().includes(search))
        );
      }
      return isVerified;
    });

    const unverified = categoryFilteredTokens.filter((token: TokenData) => {
      const isUnverified = !token.isVerified;

      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          isUnverified &&
          (token.symbol?.toLowerCase().includes(search) ||
            token.name?.toLowerCase().includes(search))
        );
      }
      return isUnverified;
    });

    // Sort function - always sort by market cap descending
    const sortTokens = (tokenList: TokenData[]) => {
      return tokenList.sort((a: TokenData, b: TokenData) => {
        return (b.marketCap || 0) - (a.marketCap || 0);
      });
    };

    const sortedVerified = sortTokens([...verified]);
    const sortedUnverified = sortTokens([...unverified]);

    // Always show all tokens (verified first, then unverified)
    const allTokens = [...sortedVerified, ...sortedUnverified];

    return {
      verifiedTokens: sortedVerified,
      unverifiedTokens: sortedUnverified,
      displayTokens: allTokens.slice(0, displayedCount),
      categoryCounts: counts,
    };
  }, [tokens, searchTerm, selectedCategory, displayedCount]);

  // Handle scroll-based loading
  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container || isLoadingMore) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      const totalAvailable = verifiedTokens.length + unverifiedTokens.length;

      // Load more when user scrolls to 70% of the content (lowered threshold)
      if (scrollPercentage > 0.7 && displayedCount < totalAvailable) {
        setIsLoadingMore(true);

        setTimeout(() => {
          setDisplayedCount((prevCount) => Math.min(prevCount + 20, totalAvailable)); // Load 20 at a time
          setIsLoadingMore(false);
        }, 200);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [displayedCount, verifiedTokens.length, unverifiedTokens.length, isLoadingMore]);

  // Reset displayed count when search or category changes
  useEffect(() => {
    setDisplayedCount(12);
  }, [searchTerm, selectedCategory]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setIsDropdownOpen(false);
  };

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      <div className="px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Powered by{" "}
            <a
              href="https://panora.exchange/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-foreground/80 transition-colors"
            >
              Panora
            </a>
          </h3>
          <div className="text-sm font-medium">
            <span className="text-muted-foreground">Total FDV: </span>
            <a
              href="/markets/tokens"
              className="text-foreground hover:text-foreground/80 transition-colors font-mono"
            >
              {formatCompactNumber(
                verifiedTokens.reduce(
                  (sum, token) => sum + (token.fullyDilutedValuation || token.marketCap || 0),
                  0
                )
              )}
            </a>
          </div>
        </div>

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

        {/* Category filter buttons */}
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2">
            {/* Left side - Category buttons */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <button
                onClick={() => handleCategoryChange("all")}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                All ({categoryCounts.all || 0})
              </button>
              <button
                onClick={() => handleCategoryChange("defi")}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  selectedCategory === "defi"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                DeFi ({categoryCounts.defi || 0})
              </button>
              <button
                onClick={() => handleCategoryChange("memes")}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  selectedCategory === "memes"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                Memes ({categoryCounts.memes || 0})
              </button>
            </div>

            {/* Right side - Category dropdown */}
            <div ref={dropdownRef} className="relative flex-shrink-0">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors bg-muted hover:bg-muted/80"
              >
                Categories
                <ChevronDown className="h-3 w-3" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-background border rounded-md shadow-lg z-50 min-w-[200px]">
                  <div className="max-h-60 overflow-y-auto py-1">
                    {Object.entries(categoryCounts)
                      .filter(([category]) => !["all", "defi", "memes"].includes(category))
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, count]) => (
                        <button
                          key={category}
                          onClick={() => handleCategoryChange(category)}
                          className={cn(
                            "w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors capitalize",
                            selectedCategory === category && "bg-primary/10 text-primary"
                          )}
                        >
                          {category} ({count})
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto min-h-0"
        style={{ scrollBehavior: "smooth" }}
      >
        {isLoading ? (
          <div className="px-4 space-y-3 pb-4">
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
          <div className="pb-4">
            {displayTokens.map((token: TokenData, index: number) => {
              const isUnverifiedToken = !token.isVerified;
              const isFirstUnverified =
                isUnverifiedToken && index > 0 && displayTokens[index - 1]?.isVerified;

              return (
                <div key={token.faAddress || token.tokenAddress || index}>
                  {/* Show divider and label when transitioning to unverified tokens */}
                  {isFirstUnverified && (
                    <div className="px-4 py-2 bg-muted/10 border-y border-border/50">
                      <p className="text-xs font-medium text-muted-foreground">Unverified Tokens</p>
                    </div>
                  )}

                  <div
                    className={cn(
                      "px-4 py-2 hover:bg-muted/20 transition-colors border-b border-border/30",
                      isUnverifiedToken && "opacity-75"
                    )}
                  >
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
                            {token.panoraTags?.includes("Bridged") && (
                              <span className="text-xs text-muted-foreground font-medium px-1.5 py-0.5 bg-muted/20 border border-muted-foreground/20 rounded">
                                Bridged
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{token.name}</p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-mono">{formatTokenPrice(token.price)}</p>
                        {(token.fullyDilutedValuation || token.marketCap) > 0 &&
                          (token.fullyDilutedValuation || token.marketCap) < 1000000000000 && (
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(
                                token.fullyDilutedValuation || token.marketCap,
                                "USD",
                                {
                                  compact: true,
                                }
                              )}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="px-4 py-3 text-center text-sm text-muted-foreground">
                <div className="inline-flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Loading more tokens...
                </div>
              </div>
            )}

            {/* No tokens found */}
            {displayTokens.length === 0 && !isLoading && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {searchTerm ? `No tokens found for "${searchTerm}"` : "No tokens available"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
