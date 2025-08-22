"use client";

import { useState, useEffect, useMemo } from "react";
import { logger } from "@/lib/utils/core/logger";
import Image from "next/image";
import {
  ArrowUpDown,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  Search,
  Download,
  Filter,
  Sparkles,
  Zap,
  AlertCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { Footer } from "@/components/layout/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  formatNumber,
  formatCurrency,
  formatTokenPrice,
} from "@/lib/utils/format/format";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  getPaginationRowModel,
  PaginationState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="-ml-4"
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
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
  const [sorting, setSorting] = useState<SortingState>([
    { id: "marketCap", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showTopMovers, setShowTopMovers] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Helper function to determine token category
  const getTokenCategory = (token: TokenData) => {
    const symbol = token.symbol;
    const name = token.name?.toLowerCase() || "";

    // Use API panoraTags if available
    if (token.panoraTags && token.panoraTags.length > 0) {
      // Prioritize certain tags for display
      const primaryTag =
        token.panoraTags.find((tag) =>
          ["Verified", "Native", "Bridged", "LP", "Emojicoin", "Meme"].includes(
            tag,
          ),
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
        case "Emojicoin":
          return {
            label: "Emojicoin",
            className:
              "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800",
            panoraTag: "Emojicoin",
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

    // Check for stablecoins first (comprehensive list from stables page)
    if (
      [
        "USDC",
        "USDT",
        "USDt",
        "USDe",
        "sUSDe",
        "mUSD",
        "USDA",
        "MOD",
        "lzUSDC",
        "lzUSDT",
        "whUSDC",
        "whUSDT",
        "ceUSDC",
        "ceUSDT",
      ].includes(symbol) ||
      name.includes("usd") ||
      name.includes("dollar") ||
      name.includes("stable")
    ) {
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
      (symbol.includes("APT") &&
        (symbol.includes("st") || symbol.includes("am"))) ||
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
    if (
      [
        "AMI",
        "RION",
        "THL",
        "ECHO",
        "LSD",
        "CELL",
        "CAKE",
        "GUI",
        "ABEL",
      ].includes(symbol)
    ) {
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
    if (
      symbol.includes("LP") ||
      name.includes("liquidity") ||
      name.includes("pool")
    ) {
      return {
        label: "LP",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-300 dark:border-gray-800",
        panoraTag: "LP",
      };
    }

    // Emojicoin tokens (tokens from emojicoin.fun)
    if (
      name.includes("emoji") ||
      symbol.match(
        /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u,
      )
    ) {
      return {
        label: "Emojicoin",
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800",
        panoraTag: "Emojicoin",
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

  // Category filters with counts
  const categoryFilters = useMemo(() => {
    const categories = [
      { name: "All", description: "Show all tokens", icon: Sparkles },
      { name: "Native", description: "Native Aptos tokens", icon: Zap },
      {
        name: "Stablecoin",
        description: "USD-pegged stablecoins",
        icon: DollarSign,
      },
      {
        name: "Bitcoin",
        description: "Bitcoin variants (BTC, WBTC, etc)",
        icon: TrendingUp,
      },
      {
        name: "Liquid Staking",
        description: "Liquid staking tokens (LST)",
        icon: BarChart3,
      },
      { name: "RWA", description: "Real World Assets", icon: PieChart },
      { name: "DeFi", description: "DeFi protocol tokens", icon: Filter },
      {
        name: "Bridged",
        description: "Cross-chain bridged tokens",
        icon: Search,
      },
      { name: "LP", description: "Liquidity pool tokens", icon: BarChart3 },
      {
        name: "Emojicoin",
        description: "Emojicoin.fun tokens",
        icon: Sparkles,
      },
      { name: "Meme", description: "Meme tokens", icon: Zap },
    ];

    // Add counts to each category
    return categories.map((cat) => ({
      ...cat,
      count:
        cat.name === "All"
          ? allTokens.filter((t) =>
              !showUnverified ? t.isVerified === true : true,
            ).length
          : allTokens.filter((t) => {
              const category = getTokenCategory(t);
              return (
                category.label === cat.name &&
                (!showUnverified ? t.isVerified === true : true)
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
      logger.warn("Failed to fetch BTC data:", err);
    }
  };

  const fetchBitcoinPrice = async () => {
    try {
      const response = await fetch("/api/prices/cmc/btc");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.price) {
          setBitcoinPrice(result.data.price);
        }
      }
    } catch (err) {
      logger.warn("Failed to fetch Bitcoin price:", err);
    }
  };

  useEffect(() => {
    fetchInitialData();
    fetchBtcData();
    fetchBitcoinPrice();
  }, []);

  // No longer needed - we fetch all tokens upfront

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch all tokens
      const response = await fetch("/api/aptos/tokens?limit=5000");

      if (!response.ok) {
        throw new Error("Failed to fetch tokens data");
      }

      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
        setAllTokens(result.data.tokens);
        // Mark as loaded all since we're fetching with high limit
        setHasLoadedAll(true);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchRemainingTokens = async () => {
    if (!data || loadingMore || hasLoadedAll) return;

    try {
      setLoadingMore(true);
      // Fetch remaining tokens starting from offset 100
      const response = await fetch("/api/aptos/tokens?offset=100&limit=5000");

      if (!response.ok) {
        throw new Error("Failed to fetch remaining tokens");
      }

      const result = await response.json();
      if (result.success && result.data) {
        // Append the new tokens to our existing list
        setAllTokens((prev) => [...prev, ...result.data.tokens]);
        setHasLoadedAll(true);
      }
    } catch (err) {
      logger.error("Failed to load remaining tokens:", err);
      // Don't show error to user, just log it
    } finally {
      setLoadingMore(false);
    }
  };

  // Calculate BTC-derived prices for SBTC and fiaBTC
  const getAdjustedPrice = (token: TokenData): number => {
    if (token.symbol === "USDY") {
      return 1; // Fixed $1 price for USDY stablecoin
    }

    if (
      (token.symbol === "SBTC" || token.symbol === "fiaBTC") &&
      btcData &&
      bitcoinPrice
    ) {
      // Find the corresponding BTC token data
      const btcToken = btcData.supplies?.find(
        (supply: any) =>
          supply.symbol === token.symbol ||
          (token.symbol === "fiaBTC" && supply.symbol === "FiaBTC"),
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
  };

  const filteredTokens = useMemo(() => {
    let tokens = allTokens;

    // Apply price overrides
    if (btcData || bitcoinPrice) {
      tokens = tokens.map((token) => ({
        ...token,
        price: getAdjustedPrice(token),
        marketCap: getAdjustedPrice(token) * (token.supply || 0),
      }));
    }

    // Filter by verification status first - only show verified by default
    // Also hide the specific problematic token unless showUnverified is true
    const problematicTokenAddress =
      "0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12";
    if (!showUnverified) {
      tokens = tokens.filter((token) => {
        // Hide unverified tokens
        if (token.isVerified !== true) return false;
        // Also hide the specific problematic token even if it's marked as verified
        if (
          token.faAddress === problematicTokenAddress ||
          token.tokenAddress === problematicTokenAddress
        )
          return false;
        return true;
      });
    }

    // Filter tokens based on APT inclusion setting
    if (!includeAPT) {
      tokens = tokens.filter((token) => token.symbol !== "APT");
    }

    // Filter tokens based on stablecoin inclusion setting
    if (!includeStables) {
      tokens = tokens.filter((token) => {
        const category = getTokenCategory(token);
        return !category || category.label !== "Stablecoin";
      });
    }

    // Filter by selected categories
    if (selectedTags.length > 0 && !selectedTags.includes("All")) {
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
          token.tokenAddress?.toLowerCase().includes(searchLower),
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
    const aptMarketCap = aptToken
      ? getAdjustedPrice(aptToken) * (aptToken.supply || 0)
      : 0;

    // Filter tokens based on settings
    let relevantTokens = allTokens;

    // Filter by verification status first
    if (!showUnverified) {
      relevantTokens = relevantTokens.filter(
        (token) => token.isVerified === true,
      );
    }

    // Calculate total non-APT market cap
    const nonAptTokens = relevantTokens.filter(
      (token) => token.symbol !== "APT",
    );
    const nonAptMarketCaps = nonAptTokens
      .map((token) => {
        const adjustedPrice = getAdjustedPrice(token);
        return adjustedPrice * (token.supply || 0);
      })
      .filter((cap) => cap > 0);
    const nonAptTotalMarketCap = nonAptMarketCaps.reduce(
      (sum, cap) => sum + cap,
      0,
    );

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
      0,
    );

    // Now apply filters for display metrics
    if (!includeAPT) {
      relevantTokens = relevantTokens.filter((token) => token.symbol !== "APT");
    }

    if (!includeStables) {
      relevantTokens = relevantTokens.filter((token) => {
        const category = getTokenCategory(token);
        return !category || category.label !== "Stablecoin";
      });
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
          ? (sortedCaps[sortedCaps.length / 2 - 1] +
              sortedCaps[sortedCaps.length / 2]) /
            2
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
      { above1B: 0, from100MTo1B: 0, from10MTo100M: 0 },
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
  ]);

  const columns: ColumnDef<TokenData>[] = useMemo(
    () => [
      {
        accessorKey: "rank",
        header: "#",
        cell: ({ row }) => {
          const actualIndex =
            pagination.pageIndex * pagination.pageSize + row.index + 1;
          return <span className="text-muted-foreground">{actualIndex}</span>;
        },
        size: 50,
      },
      {
        accessorKey: "symbol",
        header: ({ column }) => (
          <SortableHeader column={column} title="Token" />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2 -ml-2">
              {row.original.logoUrl && (
                <Image
                  src={row.original.logoUrl}
                  alt={row.original.symbol}
                  width={24}
                  height={24}
                  className={cn(
                    "rounded-full flex-shrink-0",
                    row.original.symbol === "APT" && "dark:invert",
                  )}
                  onError={(e) => {
                    // Hide image on error
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div className="flex flex-col">
                <span className="font-medium">{row.original.symbol}</span>
                <span className="text-xs text-muted-foreground">
                  {row.original.name}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <SortableHeader column={column} title="Category" />
        ),
        cell: ({ row }) => {
          const category = getTokenCategory(row.original);
          return category ? (
            <Badge
              variant="outline"
              className={cn("text-xs", category.className)}
            >
              {category.label}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          );
        },
        size: 100,
      },
      {
        accessorKey: "address",
        header: "Address",
        cell: ({ row }) => {
          const address = row.original.faAddress || row.original.tokenAddress;
          if (!address) return <span className="text-muted-foreground">—</span>;

          // Truncate address for display
          const displayAddress =
            address.length > 20
              ? `${address.slice(0, 8)}...${address.slice(-8)}`
              : address;

          const copyToClipboard = () => {
            navigator.clipboard.writeText(address);
            toast.success("Address copied to clipboard!", {
              description: address,
            });
          };

          return (
            <div className="flex items-center gap-2 group">
              <Badge
                variant="outline"
                className="font-mono text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                title={address}
                onClick={copyToClipboard}
              >
                {displayAddress}
              </Badge>
              <button
                onClick={copyToClipboard}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                title="Copy address"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: "supply",
        header: ({ column }) => (
          <SortableHeader column={column} title="Supply" />
        ),
        cell: ({ row }) => {
          const supply = row.original.supply;
          if (!supply || supply <= 0) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <span className="font-mono text-sm">{formatNumber(supply)}</span>
          );
        },
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <SortableHeader column={column} title="Price" />
        ),
        cell: ({ row }) => {
          const price = row.original.price;
          if (!price || price <= 0) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <span className="font-mono text-sm">{formatTokenPrice(price)}</span>
          );
        },
      },
      {
        accessorKey: "marketCap",
        header: ({ column }) => <SortableHeader column={column} title="FDV" />,
        cell: ({ row }) => {
          const marketCap = row.original.marketCap;
          if (!marketCap || marketCap <= 0) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <span className="font-mono text-sm">
              {formatCurrency(marketCap)}
            </span>
          );
        },
      },
    ],
    [pagination.pageIndex, pagination.pageSize],
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
      <div className="w-full px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600">
              Error: {error || "Failed to load data"}
            </p>
            <button
              onClick={() => fetchInitialData()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quick filters for top tokens
  const quickFilters = [
    { label: "Top 10", filter: () => filteredTokens.slice(0, 10) },
    { label: "Top 50", filter: () => filteredTokens.slice(0, 50) },
    {
      label: "New Listings",
      filter: () => filteredTokens.slice(-20).reverse(),
    },
    {
      label: "> $100M",
      filter: () => filteredTokens.filter((t) => t.marketCap > 100000000),
    },
  ];

  return (
    <div className="w-full px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-8">
        <StatCard
          title="Total FDV"
          value={
            <div className="space-y-2">
              <div className="text-base sm:text-lg md:text-2xl font-bold font-mono">
                {formatCurrency(displayMetrics.marketCap, "USD", {
                  compact: true,
                })}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                <span className="hidden sm:inline">Include:</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Checkbox
                      id="include-apt-altcoins"
                      checked={includeAPT}
                      onCheckedChange={(checked) => setIncludeAPT(!!checked)}
                      className="h-3 w-3"
                    />
                    <label
                      htmlFor="include-apt-altcoins"
                      className="cursor-pointer select-none"
                    >
                      APT
                    </label>
                  </div>
                  <div className="flex items-center gap-1">
                    <Checkbox
                      id="include-stables-altcoins"
                      checked={includeStables}
                      onCheckedChange={(checked) =>
                        setIncludeStables(!!checked)
                      }
                      className="h-3 w-3"
                    />
                    <label
                      htmlFor="include-stables-altcoins"
                      className="cursor-pointer select-none"
                    >
                      Stables
                    </label>
                  </div>
                </div>
              </div>
            </div>
          }
          tooltip={`Total Fully Diluted Valuation (FDV) of filtered tokens ${includeAPT ? "including APT" : "excluding APT"}${includeStables ? ", including stablecoins" : ", excluding stablecoins"}`}
          isLoading={false}
          showError={false}
        />

        <StatCard
          title="Total Tokens"
          value={
            <div className="space-y-1">
              <div className="text-lg md:text-2xl font-bold font-mono">
                {displayMetrics.tokenCount}
              </div>
              <div className="text-xs text-muted-foreground">
                {(() => {
                  const verifiedCount = allTokens.filter(
                    (t) => t.isVerified,
                  ).length;
                  const unverifiedCount = allTokens.length - verifiedCount;
                  if (!includeAPT || !includeStables) {
                    return `Filtered from ${verifiedCount} verified + ${unverifiedCount} unverified`;
                  }
                  return `${verifiedCount} verified + ${unverifiedCount} unverified tokens`;
                })()}
              </div>
            </div>
          }
          tooltip={`Number of tokens matching current filters. Total tokens: ${allTokens.filter((t) => t.isVerified).length} verified + ${allTokens.length - allTokens.filter((t) => t.isVerified).length} unverified`}
          isLoading={false}
          showError={false}
        />

        <StatCard
          title="Average FDV"
          value={
            <div className="space-y-1">
              <div className="text-base sm:text-lg md:text-2xl font-bold font-mono">
                {formatCurrency(displayMetrics.averageMarketCap, "USD", {
                  compact: true,
                })}
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                {displayMetrics.aptMarketCap > 0 &&
                  displayMetrics.nonAptTotalMarketCap > 0 && (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                        <div className="flex items-center gap-1">
                          <span>APT:</span>
                          <span className="font-semibold">
                            {formatCurrency(
                              displayMetrics.aptMarketCap,
                              "USD",
                              { compact: true },
                            )}
                          </span>
                        </div>
                        <span className="hidden sm:inline text-muted-foreground/70">
                          vs
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="sm:hidden">ALT:</span>
                          <span className="font-semibold">
                            {formatCurrency(
                              displayMetrics.nonAptTotalMarketCap,
                              "USD",
                              { compact: true },
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] sm:text-xs">Ratio:</span>
                        <span className="font-semibold text-[10px] sm:text-xs">
                          {displayMetrics.nonAptTotalMarketCap >
                          displayMetrics.aptMarketCap
                            ? `1:${(displayMetrics.nonAptTotalMarketCap / displayMetrics.aptMarketCap).toFixed(1)}`
                            : `${(displayMetrics.aptMarketCap / displayMetrics.nonAptTotalMarketCap).toFixed(1)}:1`}
                        </span>
                      </div>
                    </>
                  )}
              </div>
            </div>
          }
          tooltip={`Average Fully Diluted Valuation. Shows APT's FDV compared to the combined FDV of all other tokens.`}
          isLoading={false}
          showError={false}
        />

        <StatCard
          title="Market Distribution"
          value={
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>&gt;$1B:</span>
                <span className="font-semibold">
                  {displayMetrics.distribution.above1B}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>$100M-$1B:</span>
                <span className="font-semibold">
                  {displayMetrics.distribution.from100MTo1B}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>$10M-$100M:</span>
                <span className="font-semibold">
                  {displayMetrics.distribution.from10MTo100M}
                </span>
              </div>
            </div>
          }
          tooltip={`Distribution of filtered tokens across market cap tiers ${includeAPT ? "including APT" : "excluding APT"}${includeStables ? ", including stablecoins" : ", excluding stablecoins"}`}
          isLoading={false}
          showError={false}
        />
      </div>

      {/* Token Table - No Card container */}
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, symbol, or address..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Export Dialog */}
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-10">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Export Token Data</DialogTitle>
                <DialogDescription>
                  Choose your preferred export format. The data will include all{" "}
                  {filteredTokens.length} tokens currently visible in the table.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const csv = [
                      [
                        "Symbol",
                        "Name",
                        "Price",
                        "Market Cap",
                        "Supply",
                        "Category",
                        "Address",
                      ].join(","),
                      ...filteredTokens.map((t) =>
                        [
                          t.symbol,
                          t.name,
                          t.price,
                          t.marketCap,
                          t.supply,
                          getTokenCategory(t).label,
                          t.faAddress || t.tokenAddress || "",
                        ]
                          .map((val) =>
                            typeof val === "string" && val.includes(",")
                              ? `"${val}"`
                              : val,
                          )
                          .join(","),
                      ),
                    ].join("\n");

                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `aptos-tokens-${new Date().toISOString().split("T")[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    toast.success("Exported token data as CSV");
                    setExportDialogOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <div className="rounded-lg bg-muted p-2">
                    <svg
                      className="h-8 w-8"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 2V8H20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 15H15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 11H15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">CSV Format</p>
                    <p className="text-xs text-muted-foreground">
                      Excel compatible
                    </p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const jsonData = filteredTokens.map((t) => ({
                      symbol: t.symbol,
                      name: t.name,
                      price: t.price,
                      marketCap: t.marketCap,
                      supply: t.supply,
                      category: getTokenCategory(t).label,
                      address: t.faAddress || t.tokenAddress || null,
                      decimals: t.decimals,
                      logoUrl: t.logoUrl || null,
                      isVerified: t.isVerified || false,
                      panoraTags: t.panoraTags || [],
                    }));

                    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
                      type: "application/json",
                    });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `aptos-tokens-${new Date().toISOString().split("T")[0]}.json`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    toast.success("Exported token data as JSON");
                    setExportDialogOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <div className="rounded-lg bg-muted p-2">
                    <svg
                      className="h-8 w-8"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 2V8H20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <text
                        x="12"
                        y="16"
                        fontSize="6"
                        fontFamily="monospace"
                        textAnchor="middle"
                        fill="currentColor"
                      >{`{}`}</text>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">JSON Format</p>
                    <p className="text-xs text-muted-foreground">
                      Developer friendly
                    </p>
                  </div>
                </Button>
              </div>
              <DialogFooter className="sm:justify-start">
                <p className="text-xs text-muted-foreground">
                  {filteredTokens.length} tokens will be exported
                </p>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Desktop Filters - Horizontal buttons */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            {/* Category Filters */}
            {categoryFilters.map((filter) => {
              const isSelected = selectedTags.includes(filter.name);
              return (
                <Button
                  key={filter.name}
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    if (filter.name === "All") {
                      setSelectedTags(["All"]);
                    } else if (isSelected) {
                      setSelectedTags((prev) =>
                        prev.filter((t) => t !== filter.name),
                      );
                    } else {
                      setSelectedTags((prev) =>
                        prev.filter((t) => t !== "All").concat(filter.name),
                      );
                    }
                  }}
                  className="text-xs h-10 bg-transparent border border-input hover:bg-accent hover:text-accent-foreground relative"
                  title={`${filter.description} (${filter.count} tokens)`}
                >
                  <span>{filter.name}</span>
                  {filter.count > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1.5 px-1 py-0 h-4 text-[10px]"
                    >
                      {filter.count}
                    </Badge>
                  )}
                </Button>
              );
            })}

            <div className="h-6 border-l border-border mx-1" />

            {/* Verification Toggle */}
            <Button
              variant={showUnverified ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowUnverified(!showUnverified)}
              className="text-xs h-10"
              title={
                showUnverified
                  ? "Showing all tokens"
                  : "Showing only verified tokens"
              }
            >
              {showUnverified ? "✓ Include Unverified" : "Verified Only"}
            </Button>

            {selectedTags.length > 0 && selectedTags[0] !== "All" && (
              <>
                <div className="h-6 border-l border-border mx-1" />
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline px-2"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>

          {/* Mobile Filters - Dropdown */}
          <div className="sm:hidden flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Categories
                  {selectedTags.length > 0 && selectedTags[0] !== "All" && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-4 px-1 text-xs"
                    >
                      {selectedTags.length}
                    </Badge>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Categories</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {selectedTags.length > 0 && selectedTags[0] !== "All" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setSelectedTags([])}
                      className="text-muted-foreground"
                    >
                      Clear filters
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {categoryFilters.map((filter) => {
                  const isSelected = selectedTags.includes(filter.name);
                  return (
                    <DropdownMenuItem
                      key={filter.name}
                      onClick={() => {
                        if (filter.name === "All") {
                          setSelectedTags(["All"]);
                        } else if (isSelected) {
                          setSelectedTags((prev) =>
                            prev.filter((t) => t !== filter.name),
                          );
                        } else {
                          setSelectedTags((prev) =>
                            prev.filter((t) => t !== "All").concat(filter.name),
                          );
                        }
                      }}
                      className={cn(
                        "cursor-pointer",
                        isSelected && "bg-accent",
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{filter.name}</span>
                        {isSelected && <span className="text-primary">✓</span>}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Verification Toggle - Mobile */}
            <Button
              variant={showUnverified ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowUnverified(!showUnverified)}
              className="text-xs"
            >
              {showUnverified ? "✓ Unverified" : "Verified"}
            </Button>
          </div>
        </div>

        {/* Table - Responsive with horizontal scroll */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <Table className="min-w-[700px] sm:min-w-full">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
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
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-48 text-center"
                    >
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">No tokens found</p>
                          <p className="text-xs text-muted-foreground">
                            {globalFilter
                              ? `No tokens matching "${globalFilter}"`
                              : selectedTags.length > 0 &&
                                  !selectedTags.includes("All")
                                ? `No tokens in selected categories`
                                : `No tokens available`}
                          </p>
                        </div>
                        {(globalFilter ||
                          (selectedTags.length > 0 &&
                            !selectedTags.includes("All"))) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setGlobalFilter("");
                              setSelectedTags([]);
                            }}
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Loading indicator for background loading */}
        {loadingMore && (
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Loading remaining tokens in background...
            </div>
          </div>
        )}

        {/* Pagination - Mobile responsive */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
          <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            <span className="hidden sm:inline">Showing </span>
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
            -
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              filteredTokens.length,
            )}{" "}
            <span className="hidden sm:inline">of </span>
            <span className="sm:hidden">/</span>
            {filteredTokens.length}{" "}
            {showUnverified ? "tokens" : "verified tokens"}
            {!includeAPT || !includeStables
              ? " (" +
                [
                  !includeAPT && "APT excluded",
                  !includeStables && "Stablecoins excluded",
                ]
                  .filter(Boolean)
                  .join(", ") +
                ")"
              : ""}
            {!hasLoadedAll &&
              allTokens.length < (data?.summary.total_tokens || 0) && (
                <span className="text-xs ml-2">
                  ({allTokens.length} loaded)
                </span>
              )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              <ChevronsLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <div className="text-xs sm:text-sm px-2">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {Math.ceil(
                filteredTokens.length / table.getState().pagination.pageSize,
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                table.setPageIndex(
                  Math.ceil(
                    filteredTokens.length /
                      table.getState().pagination.pageSize,
                  ) - 1,
                )
              }
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              <ChevronsRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8">
        <div className="text-center text-sm text-gray-500 mb-6">
          Last updated: {new Date(data.summary.timestamp).toLocaleString()}
        </div>
        <Footer />
      </div>
    </div>
  );
}
