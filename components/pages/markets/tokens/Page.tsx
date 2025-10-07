"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  AlertCircle,
  ArrowUpDown,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  Copy,
  DollarSign,
  Download,
  PieChart,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

// Lazy load heavy components to reduce initial bundle size
const VirtualizedTokenList = dynamic(
  () => import("./VirtualizedTokenList").then((m) => ({ default: m.VirtualizedTokenList })),
  {
    loading: () => <div className="h-96 animate-pulse bg-gray-200 rounded"></div>,
  }
);

const TokenTreemap = dynamic(
  () => import("./TokenTreemap").then((m) => ({ default: m.TokenTreemap })),
  {
    loading: () => <div className="h-96 animate-pulse bg-gray-200 rounded"></div>,
  }
);

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LEGITIMATE_STABLECOINS } from "@/lib/constants/tokens/stablecoins";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { formatCurrency, formatNumber, formatTokenPrice } from "@/lib/utils/format/format";

interface TokenData {
  chainId: number;
  panoraId: string;
  tokenAddress: string | null;
  faAddress: string | null;
  name: string;
  symbol: string;
  decimals: number;
  bridge?: string | null;
  panoraSymbol: string;
  usdPrice: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  panoraUI: boolean;
  panoraTags: string[];
  panoraIndex: number;
  coinGeckoId?: string | null;
  coinMarketCapId?: number | null;
  isInPanoraTokenList: boolean;
  isBanned: boolean;
  // Calculated fields
  price: number;
  supply?: number;
  marketCap?: number;
  fdv?: number;
}

interface CategoryData {
  count: number;
  total_market_cap: number;
  tokens: TokenData[];
}

interface AltcoinsData {
  summary: {
    total_market_cap_non_apt: number;
    total_market_cap_with_apt: number;
    apt_market_cap: number;
    tokens_with_supply: number;
    tokens_analyzed: number;
    tokens_returned: number;
    total_tokens: number;
    average_market_cap: number;
    median_market_cap: number;
    timestamp: string;
  };
  distribution: {
    above1B: number;
    from100MTo1B: number;
    from10MTo100M: number;
    from1MTo10M: number;
    from100KTo1M: number;
    below100K: number;
  };
  categories: {
    stablecoins: CategoryData;
    bitcoin: CategoryData;
    defi: CategoryData;
    liquid_staking: CategoryData;
  };
  tokens: TokenData[];
}

function SortableHeader({ column, title }: { column: any; title: string }) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="-ml-4 h-auto p-0 hover:bg-transparent"
    >
      <div className="flex items-center gap-1">
        {title}
        {sorted === "desc" ? (
          <ChevronDown className="w-3 h-3" />
        ) : sorted === "asc" ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </div>
    </Button>
  );
}

export default function TokensPage() {
  const [data, setData] = useState<AltcoinsData | null>(null);
  const [allTokens, setAllTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasLoadedAll, setHasLoadedAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeAPT, setIncludeAPT] = useState(true);
  const [includeStables, setIncludeStables] = useState(true);
  const [showUnverified, setShowUnverified] = useState(false);
  const [btcData, setBtcData] = useState<any>(null);
  const [bitcoinPrice, setBitcoinPrice] = useState<number | null>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: "fdv", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showTopMovers, setShowTopMovers] = useState(false);

  // Helper function to determine token category
  const getTokenCategory = (token: TokenData) => {
    const symbol = token.symbol;
    const name = token.name?.toLowerCase() || "";

    // Use API panoraTags if available
    if (token.panoraTags && Array.isArray(token.panoraTags) && token.panoraTags.length > 0) {
      // Prioritize certain tags for display
      const primaryTag =
        token.panoraTags.find((tag) =>
          ["Verified", "Native", "Bridged", "LP", "Meme"].includes(tag)
        ) || token.panoraTags[0];

      switch (primaryTag) {
        case "Native":
          return {
            label: "Native",
            className: "bg-primary/10 text-primary border-primary/30",
            panoraTag: "Native",
          };
        case "Bridged":
          return {
            label: "Bridged",
            className:
              "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-300 dark:border-cyan-800",
            panoraTag: "Bridged",
          };
        case "LP":
          return {
            label: "LP",
            className:
              "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-300 dark:border-gray-800",
            panoraTag: "LP",
          };
        case "Meme":
          return {
            label: "Meme",
            className:
              "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 border-pink-300 dark:border-pink-800",
            panoraTag: "Meme",
          };
        case "Verified":
          return {
            label: "Verified",
            className:
              "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-800",
            panoraTag: "Verified",
          };
        default:
          return {
            label: primaryTag,
            className:
              "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-300 dark:border-gray-800",
            panoraTag: primaryTag,
          };
      }
    }

    // APT - Native
    if (symbol === "APT") {
      return {
        label: "Native",
        className: "bg-primary/10 text-primary border-primary/30",
        panoraTag: "Native",
      };
    }

    // Check for stablecoins using the official address list
    const isLegitimateStablecoin =
      LEGITIMATE_STABLECOINS.has(token.faAddress || "") ||
      LEGITIMATE_STABLECOINS.has(token.tokenAddress || "");
    const isSymbolStablecoin = [
      "USDC",
      "USDT",
      "USDt",
      "USDe",
      "sUSDe",
      "USDA",
      "MOD",
      "lzUSDC",
      "lzUSDT",
      "whUSDC",
      "whUSDT",
      "ceUSDC",
      "ceUSDT",
    ].includes(symbol);
    const isNameStablecoin =
      name.includes("usd") || name.includes("dollar") || name.includes("stable");

    if (isLegitimateStablecoin || isSymbolStablecoin || isNameStablecoin) {
      return {
        label: "Stablecoin",
        className:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800",
        panoraTag: "Native",
      };
    }

    // Check for Bitcoin variants
    if (
      symbol.includes("BTC") ||
      symbol.includes("WBTC") ||
      symbol === "aBTC" ||
      symbol === "SBTC" ||
      symbol === "fiaBTC" ||
      name.includes("bitcoin")
    ) {
      return {
        label: "Bitcoin",
        className:
          "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-800",
        panoraTag: "Native",
      };
    }

    // Check for liquid staking tokens
    if (
      (symbol.includes("APT") && (symbol.includes("st") || symbol.includes("am"))) ||
      name.includes("staked") ||
      name.includes("liquid") ||
      symbol === "amAPT"
    ) {
      return {
        label: "Liquid Staking",
        className:
          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-800",
        panoraTag: "Native",
      };
    }

    // Check for RWA tokens
    if (
      ["ZUIT", "USTB", "MORE", "USDM"].includes(symbol) ||
      name.includes("treasury") ||
      name.includes("rwa") ||
      name.includes("real world")
    ) {
      return {
        label: "RWA",
        className:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-800",
        panoraTag: "Native",
      };
    }

    // Check for known DeFi tokens
    if (["AMI", "RION", "THL", "ECHO", "LSD", "CELL", "CAKE", "GUI", "ABEL"].includes(symbol)) {
      return {
        label: "DeFi",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-800",
        panoraTag: "Native",
      };
    }

    // Check for bridged tokens (common bridge patterns)
    if (
      symbol.includes("lz") ||
      symbol.includes("wh") ||
      symbol.includes("ce") ||
      name.includes("layerzero") ||
      name.includes("wormhole") ||
      name.includes("celer")
    ) {
      return {
        label: "Bridged",
        className:
          "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-300 dark:border-cyan-800",
        panoraTag: "Bridged",
      };
    }

    // Check for LP tokens
    if (symbol.includes("LP") || name.includes("liquidity") || name.includes("pool")) {
      return {
        label: "LP",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-300 dark:border-gray-800",
        panoraTag: "LP",
      };
    }

    // Meme tokens
    if (
      name.includes("doge") ||
      name.includes("shib") ||
      name.includes("pepe") ||
      name.includes("meme") ||
      symbol.includes("DOGE") ||
      symbol.includes("SHIB") ||
      symbol.includes("PEPE")
    ) {
      return {
        label: "Meme",
        className:
          "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 border-pink-300 dark:border-pink-800",
        panoraTag: "Meme",
      };
    }

    // Default to "Other" for tokens that don't match any specific category
    return {
      label: "Other",
      className:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-300 dark:border-gray-800",
      panoraTag: "Native",
    };
  };

  // Category filters with counts (simplified for inline display)
  const categoryFilters = useMemo(() => {
    const categories = [
      { name: "Native", description: "Native Aptos tokens", icon: Zap },
      { name: "Meme", description: "Meme tokens", icon: Sparkles },
      {
        name: "Bridged",
        description: "Cross-chain bridged tokens",
        icon: Search,
      },
    ];

    // Add counts to each category
    return categories.map((cat) => ({
      ...cat,
      count: allTokens.filter((t) => {
        const category = getTokenCategory(t);
        return (
          category.label === cat.name &&
          (showUnverified ? true : t.panoraTags?.includes("Verified"))
        );
      }).length,
    }));
  }, [allTokens, showUnverified]);

  const fetchBtcData = async () => {
    try {
      const response = await fetch("/api/aptos/btc");
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setBtcData(result.data);
        }
      }
    } catch (err) {
      // BTC data is optional
    }
  };

  const fetchBitcoinPrice = async () => {
    try {
      const response = await fetch("/api/data/prices/cmc/btc");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.price) {
          setBitcoinPrice(result.data.price);
        }
      }
    } catch (err) {
      // Bitcoin price is optional
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Use optimized server-side endpoint that handles all data fetching
      const response = await fetch("/api/markets/tokens?limit=5000&all=true");

      if (!response.ok) {
        throw new Error(`Failed to fetch token data: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.tokens) {
        throw new Error("Invalid response format from tokens API");
      }

      const { tokens, totalMarketCap, aptPrice, totalTokens, categories, distribution } = data;

      // Convert API data format to component format
      const processedTokens = tokens.map((token: any) => ({
        name: token.name,
        symbol: token.symbol,
        price: token.price ? parseFloat(token.price) : 0,
        marketCap: token.marketCap || 0,
        fdv: token.fullyDilutedValuation || token.marketCap || 0,
        supply: token.supply || 0,
        priceChange: token.priceChange24H || 0,
        category: token.category || "other",
        bridge: token.bridge || null,
        logoUrl: token.logoUrl,
        panoraSymbol: token.panoraSymbol,
        panoraTags: token.panoraTags || [],
        panoraUI: token.panoraUI,
        websiteUrl: token.websiteUrl,
        faAddress: token.faAddress,
        tokenAddress: token.tokenAddress,
        coinGeckoId: token.coinGeckoId,
        rank: token.rank || 0,
        isVerified: token.isVerified || false,
      }));

      setAllTokens(processedTokens);
      setHasLoadedAll(true);

      // Convert distribution format
      const distributionData = {
        above1B: distribution.find((d: any) => d.range === "> $1B")?.count || 0,
        from100MTo1B: distribution.find((d: any) => d.range === "$100M - $1B")?.count || 0,
        from10MTo100M: distribution.find((d: any) => d.range === "$10M - $100M")?.count || 0,
        from1MTo10M: distribution.find((d: any) => d.range === "$1M - $10M")?.count || 0,
        from100KTo1M: distribution.find((d: any) => d.range === "$100K - $1M")?.count || 0,
        below100K: distribution.find((d: any) => d.range === "< $100K")?.count || 0,
      };

      const summary = {
        total_tokens: totalTokens,
        tokens_with_supply: processedTokens.filter((t: any) => (t.supply || 0) > 0).length,
        tokens_analyzed: totalTokens,
        tokens_returned: processedTokens.length,
        total_market_cap_with_apt: totalMarketCap,
        total_market_cap_non_apt:
          totalMarketCap - (processedTokens.find((t: any) => t.symbol === "APT")?.fdv || 0),
        apt_market_cap: processedTokens.find((t: any) => t.symbol === "APT")?.fdv || 0,
        average_market_cap: totalTokens > 0 ? totalMarketCap / totalTokens : 0,
        median_market_cap: 0,
        timestamp: new Date().toISOString(),
      };

      setData({
        summary,
        distribution: distributionData,
        categories: {
          stablecoins: { count: 0, total_market_cap: 0, tokens: [] },
          bitcoin: { count: 0, total_market_cap: 0, tokens: [] },
          defi: { count: 0, total_market_cap: 0, tokens: [] },
          liquid_staking: { count: 0, total_market_cap: 0, tokens: [] },
        },
        tokens: processedTokens,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Calculate BTC-derived prices for SBTC and fiaBTC
  const getAdjustedPrice = useCallback(
    (token: TokenData): number => {
      if (token.symbol === "USDY") {
        return 1; // Fixed $1 price for USDY stablecoin
      }

      if ((token.symbol === "SBTC" || token.symbol === "fiaBTC") && btcData && bitcoinPrice) {
        // Find the corresponding BTC token data
        const btcToken = btcData.supplies?.find(
          (supply: any) =>
            supply.symbol === token.symbol ||
            (token.symbol === "fiaBTC" && supply.symbol === "FiaBTC")
        );

        if (btcToken) {
          // Price = (BTC amount * BTC price) / token supply
          const btcAmount = parseFloat(btcToken.formatted_supply || "0");
          const tokenSupply = token.supply || 1;

          if (tokenSupply > 0 && btcAmount > 0) {
            return (btcAmount * bitcoinPrice) / tokenSupply;
          }
        }
      }

      return token.price; // Return original price if no override needed
    },
    [btcData, bitcoinPrice]
  );

  const filteredTokens = useMemo(() => {
    let tokens = allTokens;

    // Apply price overrides
    if (btcData || bitcoinPrice) {
      tokens = tokens.map((token) => {
        const adjustedPrice = getAdjustedPrice(token);
        const adjustedFdv = adjustedPrice * (token.supply || 0);
        return {
          ...token,
          price: adjustedPrice,
          marketCap: adjustedFdv,
          fdv: adjustedFdv,
        };
      });
    }

    // Always hide the specific problematic token
    const problematicTokenAddress =
      "0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12";
    tokens = tokens.filter((token) => {
      if (
        token.faAddress === problematicTokenAddress ||
        token.tokenAddress === problematicTokenAddress
      )
        return false;
      return true;
    });

    // Filter by verification status - show verified only by default
    if (!showUnverified) {
      // When in "verified only" mode, ONLY show tokens with Verified tag
      tokens = tokens.filter((token) => {
        return token.panoraTags?.includes("Verified");
      });
    }
    // When showUnverified is true, show ALL tokens (both verified and non-verified)

    // Filter tokens based on APT inclusion setting
    if (!includeAPT) {
      tokens = tokens.filter((token) => token.symbol !== "APT");
    }

    // Filter tokens based on stablecoin inclusion setting
    if (!includeStables) {
      tokens = tokens.filter((token) => {
        const symbol = token.symbol;
        if (!symbol) return true;

        // Check if it's any stablecoin variant
        if (symbol === "USDT" || symbol === "USDt") return false;
        if (symbol === "USDC") return false;
        if (symbol === "USDe") return false;
        if (symbol === "sUSDe") return false;
        if (symbol === "USDA") return false;
        if (symbol === "MOD") return false;
        if (symbol === "lzUSDC") return false;
        if (symbol === "lzUSDT") return false;
        if (symbol === "whUSDC") return false;
        if (symbol === "whUSDT") return false;
        if (symbol === "ceUSDC") return false;
        if (symbol === "ceUSDT") return false;

        return true;
      });
    }

    // Filter by selected categories
    if (selectedTags.length > 0) {
      tokens = tokens.filter((token) => {
        const category = getTokenCategory(token);
        return selectedTags.includes(category.label);
      });
    }

    // Filter by search (include addresses)
    if (globalFilter) {
      const searchLower = globalFilter.toLowerCase();
      tokens = tokens.filter(
        (token) =>
          token.symbol?.toLowerCase().includes(searchLower) ||
          token.name?.toLowerCase().includes(searchLower) ||
          token.faAddress?.toLowerCase().includes(searchLower) ||
          token.tokenAddress?.toLowerCase().includes(searchLower)
      );
    }

    return tokens;
  }, [
    allTokens,
    includeAPT,
    includeStables,
    btcData,
    bitcoinPrice,
    selectedTags,
    showUnverified,
    globalFilter,
  ]);

  // Calculate metrics based on APT and stablecoin toggles
  const displayMetrics = useMemo(() => {
    if (!data || !allTokens.length)
      return {
        marketCap: 0,
        tokenCount: 0,
        averageMarketCap: 0,
        medianMarketCap: 0,
        distribution: { above1B: 0, from100MTo1B: 0, from10MTo100M: 0 },
        aptMarketCap: 0,
        nonAptTotalMarketCap: 0,
        nonAptNoStablesTotalMarketCap: 0,
      };

    // Calculate APT market cap from all tokens (before filtering)
    const aptToken = allTokens.find((token) => token.symbol === "APT");
    const aptMarketCap = aptToken ? getAdjustedPrice(aptToken) * (aptToken.supply || 0) : 0;

    // Filter tokens based on settings
    let relevantTokens = allTokens;

    // Filter by verification status first
    if (!showUnverified) {
      // When in "verified only" mode, ONLY show tokens with Verified tag
      relevantTokens = relevantTokens.filter((token) => token.panoraTags?.includes("Verified"));
    }

    // Calculate total non-APT market cap
    const nonAptTokens = relevantTokens.filter((token) => token.symbol !== "APT");
    const nonAptMarketCaps = nonAptTokens
      .map((token) => {
        const adjustedPrice = getAdjustedPrice(token);
        return adjustedPrice * (token.supply || 0);
      })
      .filter((cap) => cap > 0);
    const nonAptTotalMarketCap = nonAptMarketCaps.reduce((sum, cap) => sum + cap, 0);

    // Calculate total non-APT non-stables market cap
    const nonAptNoStablesTokens = nonAptTokens.filter((token) => {
      const category = getTokenCategory(token);
      return !category || category.label !== "Stablecoin";
    });
    const nonAptNoStablesMarketCaps = nonAptNoStablesTokens
      .map((token) => {
        const adjustedPrice = getAdjustedPrice(token);
        return adjustedPrice * (token.supply || 0);
      })
      .filter((cap) => cap > 0);
    const nonAptNoStablesTotalMarketCap = nonAptNoStablesMarketCaps.reduce(
      (sum, cap) => sum + cap,
      0
    );

    // Now apply filters for display metrics
    if (!includeAPT) {
      relevantTokens = relevantTokens.filter((token) => token.symbol !== "APT");
    }

    if (!includeStables) {
      relevantTokens = relevantTokens.filter((token) => {
        const symbol = token.symbol;
        if (!symbol) return true;

        // Remove all stablecoins
        if (symbol === "USDT" || symbol === "USDt") return false;
        if (symbol === "USDC") return false;
        if (symbol === "USDe") return false;
        if (symbol === "sUSDe") return false;
        if (symbol === "USDA") return false;
        if (symbol === "MOD") return false;
        if (symbol === "lzUSDC") return false;
        if (symbol === "lzUSDT") return false;
        if (symbol === "whUSDC") return false;
        if (symbol === "whUSDT") return false;
        if (symbol === "ceUSDC") return false;
        if (symbol === "ceUSDT") return false;

        return true;
      });
    }

    // Filter by selected categories
    if (selectedTags.length > 0) {
      relevantTokens = relevantTokens.filter((token) => {
        const category = getTokenCategory(token);
        return selectedTags.includes(category.label);
      });
    }

    // Filter by search (same as table filtering)
    if (globalFilter) {
      const searchLower = globalFilter.toLowerCase();
      relevantTokens = relevantTokens.filter(
        (token) =>
          token.symbol?.toLowerCase().includes(searchLower) ||
          token.name?.toLowerCase().includes(searchLower) ||
          token.faAddress?.toLowerCase().includes(searchLower) ||
          token.tokenAddress?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate market caps with adjusted prices
    const tokenMarketCaps = relevantTokens
      .map((token) => {
        const adjustedPrice = getAdjustedPrice(token);
        return adjustedPrice * (token.supply || 0);
      })
      .filter((cap) => cap > 0);

    // Total market cap
    const totalMarketCap = tokenMarketCaps.reduce((sum, cap) => sum + cap, 0);

    // Token count
    const tokenCount = relevantTokens.length;

    // Average market cap
    const averageMarketCap = tokenCount > 0 ? totalMarketCap / tokenCount : 0;

    // Median market cap
    const sortedCaps = [...tokenMarketCaps].sort((a, b) => a - b);
    const medianMarketCap =
      sortedCaps.length > 0
        ? sortedCaps.length % 2 === 0
          ? (sortedCaps[sortedCaps.length / 2 - 1] + sortedCaps[sortedCaps.length / 2]) / 2
          : sortedCaps[Math.floor(sortedCaps.length / 2)]
        : 0;

    // Distribution
    const distribution = tokenMarketCaps.reduce(
      (dist, cap) => {
        if (cap > 1000000000) dist.above1B++;
        else if (cap > 100000000) dist.from100MTo1B++;
        else if (cap > 10000000) dist.from10MTo100M++;
        return dist;
      },
      { above1B: 0, from100MTo1B: 0, from10MTo100M: 0 }
    );

    return {
      marketCap: totalMarketCap,
      tokenCount,
      averageMarketCap,
      medianMarketCap,
      distribution,
      aptMarketCap,
      nonAptTotalMarketCap,
      nonAptNoStablesTotalMarketCap,
    };
  }, [
    data,
    includeAPT,
    includeStables,
    allTokens,
    btcData,
    bitcoinPrice,
    showUnverified,
    selectedTags,
  ]);

  const columns: ColumnDef<TokenData>[] = useMemo(
    () => [
      {
        accessorKey: "rank",
        header: "#",
        cell: ({ row }) => {
          const actualIndex = pagination.pageIndex * pagination.pageSize + row.index + 1;
          return <span className="text-muted-foreground text-sm">{actualIndex}</span>;
        },
        size: 60,
      },
      {
        accessorKey: "symbol",
        header: ({ column }) => <SortableHeader column={column} title="Token" />,
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {row.original.logoUrl ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-secondary">
                    <Image
                      src={row.original.logoUrl}
                      alt={row.original.symbol}
                      fill
                      sizes="32px"
                      className={cn("object-cover", row.original.symbol === "APT" && "dark:invert")}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <span className="font-bold text-gray-600 dark:text-gray-300 text-xs">
                      {row.original.symbol.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">
                  {row.original.panoraSymbol || row.original.symbol}
                </div>
                <div className="text-xs text-muted-foreground font-normal truncate">
                  {row.original.name}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: ({ column }) => <SortableHeader column={column} title="Category" />,
        cell: ({ row }) => {
          const category = getTokenCategory(row.original);
          return category ? (
            <span className="inline-flex items-center bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
              {category.label}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          );
        },
        size: 120,
      },
      {
        accessorKey: "address",
        header: "Address",
        cell: ({ row }) => {
          const address = row.original.faAddress || row.original.tokenAddress;
          if (!address) return <span className="text-muted-foreground text-sm">—</span>;

          const displayAddress =
            address.length > 20 ? `${address.slice(0, 6)}...${address.slice(-6)}` : address;

          const handleCopy = () => {
            copyToClipboard(address, "Address");
          };

          return (
            <div className="flex items-center gap-2 group">
              <Badge
                variant="outline"
                className="font-mono text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                title={address}
                onClick={handleCopy}
              >
                {displayAddress}
              </Badge>
              <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                title="Copy address"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          );
        },
        size: 180,
      },
      {
        accessorKey: "supply",
        header: ({ column }) => <SortableHeader column={column} title="Supply" />,
        cell: ({ row }) => {
          const supply = row.original.supply;
          if (!supply || supply <= 0) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          return <span className="font-medium text-sm">{formatNumber(supply)}</span>;
        },
      },
      {
        accessorKey: "price",
        header: ({ column }) => <SortableHeader column={column} title="Price" />,
        cell: ({ row }) => {
          const price = getAdjustedPrice(row.original);
          if (!price || price <= 0) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          return <span className="font-medium text-sm">{formatTokenPrice(price)}</span>;
        },
      },
      {
        accessorKey: "fdv",
        header: ({ column }) => <SortableHeader column={column} title="FDV" />,
        cell: ({ row }) => {
          const fdv = row.original.fdv || 0;
          if (!fdv || fdv <= 0) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          return <span className="font-medium text-sm">{formatCurrency(fdv)}</span>;
        },
      },
    ],
    [pagination.pageIndex, pagination.pageSize, getAdjustedPrice]
  );

  const table = useReactTable({
    data: filteredTokens,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    // Use filtered tokens count for accurate page count
    pageCount: Math.ceil(filteredTokens.length / pagination.pageSize),
    manualPagination: false, // Let the table handle pagination
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 flex-1 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <div className="flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 flex-1 relative">
          <div className="p-4 rounded-md bg-destructive/10 text-destructive mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error loading tokens</span>
            </div>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
              Retry
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 flex-1 relative">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={
              selectedTags.length > 0
                ? `${selectedTags.join(" + ")} Market Cap`
                : includeAPT
                  ? "Total Market Cap"
                  : "Non-APT Market Cap"
            }
            value={formatCurrency(displayMetrics.marketCap)}
            tooltip={
              selectedTags.length > 0
                ? `Market capitalization of ${selectedTags.join(", ")} tokens`
                : includeAPT
                  ? "Combined market capitalization of all tokens"
                  : "Market capitalization excluding APT"
            }
          />
          <StatCard
            title="Token Count"
            value={formatNumber(displayMetrics.tokenCount)}
            tooltip={
              selectedTags.length > 0
                ? `Number of ${selectedTags.join(", ")} tokens displayed`
                : "Total number of tokens displayed"
            }
          />
          <StatCard
            title="Average Market Cap"
            value={formatCurrency(displayMetrics.averageMarketCap)}
            tooltip="Average market capitalization across all displayed tokens"
          />
          <StatCard
            title="Median Market Cap"
            value={formatCurrency(displayMetrics.medianMarketCap)}
            tooltip="Median market capitalization across all displayed tokens"
          />
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-3">
          {/* Search Bar */}
          <div className="w-full">
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, symbol, or address..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 bg-background h-10 w-full"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Token Type Filters */}
            <Button
              variant={includeAPT ? "default" : "outline"}
              size="sm"
              onClick={() => setIncludeAPT(!includeAPT)}
              className="h-9 min-w-[70px]"
            >
              APT
            </Button>
            <Button
              variant={includeStables ? "default" : "outline"}
              size="sm"
              onClick={() => setIncludeStables(!includeStables)}
              className="h-9 min-w-[80px]"
            >
              Stables
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Category Filters */}
            <Button
              variant={selectedTags.includes("Native") ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedTags((prev) =>
                  prev.includes("Native")
                    ? prev.filter((tag) => tag !== "Native")
                    : [...prev, "Native"]
                );
              }}
              className="h-9 min-w-[75px]"
            >
              Native
            </Button>
            <Button
              variant={selectedTags.includes("Meme") ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedTags((prev) =>
                  prev.includes("Meme") ? prev.filter((tag) => tag !== "Meme") : [...prev, "Meme"]
                );
              }}
              className="h-9 min-w-[80px]"
            >
              Memes
            </Button>
            <Button
              variant={selectedTags.includes("Bridged") ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedTags((prev) =>
                  prev.includes("Bridged")
                    ? prev.filter((tag) => tag !== "Bridged")
                    : [...prev, "Bridged"]
                );
              }}
              className="h-9 min-w-[85px]"
            >
              Bridged
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Verification Filter */}
            <Button
              variant={showUnverified ? "default" : "outline"}
              size="sm"
              onClick={() => setShowUnverified(!showUnverified)}
              className="h-9 min-w-[110px]"
            >
              {showUnverified ? "All Tokens" : "Verified Only"}
            </Button>

            <div className="ml-auto flex items-center gap-2">
              {/* View Mode Toggle */}
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-9 min-w-[70px]"
              >
                Table
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-9 min-w-[90px]"
              >
                Treemap
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedTags.length > 0 ||
          globalFilter ||
          !includeAPT ||
          !includeStables ||
          showUnverified) && (
          <div className="flex flex-wrap items-center gap-2 pb-4">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {globalFilter && <Badge variant="secondary">Search: {globalFilter}</Badge>}
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            {!includeAPT && <Badge variant="secondary">Exclude APT</Badge>}
            {!includeStables && <Badge variant="secondary">Exclude Stables</Badge>}
            {showUnverified && <Badge variant="secondary">Including Unverified</Badge>}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTags([]);
                setGlobalFilter("");
                setIncludeAPT(true);
                setIncludeStables(true);
                setShowUnverified(false); // Reset to verified only
              }}
              className="text-xs"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Tokens Table */}
        {viewMode === "table" ? (
          <>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="py-3">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="text-center py-12">
                        <p className="text-lg font-medium text-muted-foreground">
                          No tokens found.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between py-4 mt-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <TokenTreemap tokens={filteredTokens} />
        )}
      </main>
    </div>
  );
}
