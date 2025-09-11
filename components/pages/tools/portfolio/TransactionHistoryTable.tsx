"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { GeistMono } from "geist/font/mono";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpDown,
  ArrowUpRight,
  Clock,
  Coins,
  ExternalLink,
  Gift,
  History,
  Layers,
  Search,
  Shield,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CATEGORY_COLORS } from "@/lib/constants/ui/colors";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { cn, getCachedData, setCachedData } from "@/lib/utils";
import { logger } from "@/lib/utils/core/logger";
import { safeWindowOpen } from "@/lib/utils/core/security";
import { convertRawTokenAmount } from "@/lib/utils/format";
import {
  ActivityType,
  OptimizedTransactionAnalyzer as EnhancedTransactionAnalyzer,
  type OptimizedTransactionInfo as EnhancedTransactionInfo,
  TransactionCategory,
} from "@/lib/utils/token/transaction-analysis";

interface Transaction {
  transaction_version: string;
  transaction_timestamp: string;
  type: string;
  amount: string;
  asset_type: string;
  success: boolean;
  function?: string;
  gas_fee?: string;
}

interface TransactionHistoryTableProps {
  walletAddress: string | undefined;
  className?: string;
  limit?: number;
  initialLimit?: number;
  preloadedTransactions?: Transaction[] | null;
  preloadedTransactionsLoading?: boolean;
  transactions?: any[] | null;
  isLoading?: boolean;
  hasMoreTransactions?: boolean;
  loadMoreTransactions?: () => void;
}

function SortableHeader({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick} className="-ml-4">
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

const getTransactionTypeIcon = (transaction: Transaction) => {
  const analysis = getTransactionAnalysis(transaction);

  // Use enhanced analysis for better icon selection
  switch (analysis.category) {
    case TransactionCategory.DEFI:
      switch (analysis.activityType) {
        case ActivityType.SWAP:
          return ArrowLeftRight;
        case ActivityType.LIQUIDITY_ADD:
        case ActivityType.LIQUIDITY_REMOVE:
          return Layers;
        case ActivityType.LENDING_SUPPLY:
        case ActivityType.LENDING_WITHDRAW:
        case ActivityType.LENDING_BORROW:
        case ActivityType.LENDING_REPAY:
          return TrendingUp;
        case ActivityType.FARMING_STAKE:
        case ActivityType.FARMING_UNSTAKE:
          return Shield;
        case ActivityType.FARMING_HARVEST:
          return Gift;
        default:
          return Coins;
      }

    case TransactionCategory.STAKING:
      if (analysis.activityType === ActivityType.CLAIM_REWARDS) {
        return Gift;
      }
      return Shield;

    case TransactionCategory.TRANSFER:
      return analysis.direction === "incoming" ? ArrowDownRight : ArrowUpRight;

    case TransactionCategory.CEX:
    case TransactionCategory.BRIDGE:
      return ArrowLeftRight;

    case TransactionCategory.NFT:
      return Wallet;

    case TransactionCategory.RWA:
      return TrendingUp;

    case TransactionCategory.SYSTEM:
      return Zap;

    default: {
      // Fallback to original logic
      const lowerType = transaction.type.toLowerCase();
      if (lowerType.includes("transfer") || lowerType.includes("send")) {
        return ArrowUpRight;
      }
      if (lowerType.includes("deposit") || lowerType.includes("receive")) {
        return ArrowDownRight;
      }
      return History;
    }
  }
};

// Enhanced transaction analysis function
const getTransactionAnalysis = (tx: Transaction): EnhancedTransactionInfo => {
  return EnhancedTransactionAnalyzer.analyzeTransactionSync(tx);
};

// Map protocol names to local icon paths
const getProtocolLogoPath = (protocolName: string): string | null => {
  const protocolIcons: Record<string, string> = {
    panora: "/icons/protocols/panora.webp",
    pancakeswap: "/icons/protocols/pancake.webp",
    thala: "/icons/protocols/thala.avif",
    liquidswap: "/icons/protocols/liquidswap.webp",
    cellana: "/icons/protocols/cellana.webp",
    aries: "/icons/protocols/aries.avif",
    merkle: "/icons/protocols/merkle.webp",
    echelon: "/icons/protocols/echelon.avif",
    superposition: "/icons/protocols/superposition.webp",
    amnis: "/icons/protocols/amnis.avif",
    sushi: "/icons/protocols/sushi.webp",
    wormhole: "/icons/protocols/wormhole.png",
    layerzero: "/icons/protocols/lz.png",
    celer: "/icons/protocols/celer.jpg",
    kana: "/icons/protocols/kana.webp",
    echo: "/icons/protocols/echo.webp",
    joule: "/icons/protocols/joule.webp",
    thetis: "/icons/protocols/thetis.webp",
    tradeport: "/icons/protocols/tradeport.jpg",
    hyperion: "/icons/protocols/hyperion.webp",
    metamove: "/icons/protocols/metamove.png",
  };

  const normalizedName = protocolName.toLowerCase().replace(/\s+/g, "");
  return protocolIcons[normalizedName] || null;
};

// Legacy category function for backwards compatibility
const getTransactionCategory = (tx: Transaction) => {
  const analysis = getTransactionAnalysis(tx);

  // Map enhanced categories back to simple ones for existing UI
  switch (analysis.category) {
    case TransactionCategory.DEFI:
      if (analysis.activityType === ActivityType.SWAP) return "swap";
      if (
        analysis.activityType === ActivityType.LIQUIDITY_ADD ||
        analysis.activityType === ActivityType.LIQUIDITY_REMOVE
      )
        return "liquidity";
      if (
        analysis.activityType === ActivityType.LENDING_SUPPLY ||
        analysis.activityType === ActivityType.LENDING_WITHDRAW ||
        analysis.activityType === ActivityType.LENDING_BORROW ||
        analysis.activityType === ActivityType.LENDING_REPAY
      )
        return "liquidity";
      if (
        analysis.activityType === ActivityType.FARMING_STAKE ||
        analysis.activityType === ActivityType.FARMING_UNSTAKE
      )
        return "staking";
      if (analysis.activityType === ActivityType.FARMING_HARVEST) return "rewards";
      return "other";

    case TransactionCategory.STAKING:
      if (analysis.activityType === ActivityType.CLAIM_REWARDS) return "rewards";
      return "staking";

    case TransactionCategory.TRANSFER:
      return analysis.direction === "incoming" ? "received" : "sent";

    case TransactionCategory.CEX:
      return "cex";
    case TransactionCategory.BRIDGE:
      return "bridge";
    case TransactionCategory.NFT:
      return "nft";
    case TransactionCategory.RWA:
      return "rwa";
    case TransactionCategory.SYSTEM:
      return "system";

    default:
      return "other";
  }
};

// Helper function to get category colors
const getCategoryColors = (category: string): string => {
  return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.default;
};

export const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = React.memo(
  ({
    walletAddress,
    className,
    preloadedTransactions,
    preloadedTransactionsLoading,
    loadMoreTransactions,
    hasMoreTransactions,
  }) => {
    const { t } = useTranslation("common");
    const [allTransactions, setAllTransactions] = React.useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = React.useState(
      preloadedTransactions === null && walletAddress !== undefined
    );
    const [isLoadingMore, setIsLoadingMore] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    // Start with 100 to show all preloaded transactions
    const [displayedCount, setDisplayedCount] = React.useState(100);
    const [totalCount, setTotalCount] = React.useState(0);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Table state without pagination (using scroll-based loading)
    const [sorting, setSorting] = React.useState<SortingState>([
      { id: "date", desc: true }, // Default sort by date, newest first
    ]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    // Removed category and protocol state for simplicity

    const tableRef = React.useRef<HTMLDivElement>(null);

    // Removed category and protocol filtering
    /*
    const allCategoryOptions = [
      { value: "all", label: "All", count: 0 },
      { value: "received", label: "Received", count: 0 },
      { value: "sent", label: "Sent", count: 0 },
      { value: "swap", label: "Swaps", count: 0 },
      { value: "staking", label: "Staking", count: 0 },
      { value: "liquidity", label: "LP", count: 0 },
      { value: "rewards", label: "Rewards", count: 0 },
      { value: "cex", label: "CEX", count: 0 },
      { value: "bridge", label: "Bridge", count: 0 },
      { value: "nft", label: "NFT", count: 0 },
      { value: "rwa", label: "RWA", count: 0 },
      { value: "system", label: "System", count: 0 },
      { value: "other", label: "Other", count: 0 },
    ];

    // Generate protocol options dynamically from transactions
    const protocolOptions = React.useMemo(() => {
      const protocolCounts: Record<string, { label: string; count: number }> = {
        all: { label: "All Protocols", count: 0 },
      };

      allTransactions.forEach((tx) => {
        const analysis = getTransactionAnalysis(tx);
        const protocolKey = analysis.protocol?.name || "none";
        const protocolLabel = analysis.protocol?.label || "No Protocol";

        if (!protocolCounts[protocolKey]) {
          protocolCounts[protocolKey] = { label: protocolLabel, count: 0 };
        }
        protocolCounts[protocolKey].count++;
        protocolCounts.all.count++;
      });

      return Object.entries(protocolCounts)
        .map(([value, { label, count }]) => ({ value, label, count }))
        .sort((a, b) => {
          if (a.value === "all") return -1;
          if (b.value === "all") return 1;
          if (a.value === "none") return 1;
          if (b.value === "none") return -1;
          return b.count - a.count;
        });
    }, [allTransactions]);

    // Calculate counts for each category
    const categoryCounts = React.useMemo(() => {
      const counts: Record<string, number> = {
        all: allTransactions.length,
        received: 0,
        sent: 0,
        swap: 0,
        staking: 0,
        liquidity: 0,
        rewards: 0,
        cex: 0,
        bridge: 0,
        nft: 0,
        rwa: 0,
        system: 0,
        other: 0,
      };

      allTransactions.forEach((tx) => {
        const category = getTransactionCategory(tx);
        counts[category] = (counts[category] || 0) + 1;
      });

      return counts;
    }, [allTransactions]);

    // Split categories into top categories (buttons) and dropdown categories
    const { topCategories, dropdownCategories } = React.useMemo(() => {
      // Update counts for all categories
      const categoriesWithCounts = allCategoryOptions.map((option) => ({
        ...option,
        count: categoryCounts[option.value] || 0,
      }));

      // Filter out categories with zero count (except "All")
      const nonZeroCategories = categoriesWithCounts.filter(
        (cat) => cat.value === "all" || cat.count > 0
      );

      // Sort by count (descending) but keep "All" first
      const sortedCategories = nonZeroCategories.sort((a, b) => {
        if (a.value === "all") return -1;
        if (b.value === "all") return 1;
        return b.count - a.count;
      });

      // Top 5 categories as buttons (including "All")
      const topCategories = sortedCategories.slice(0, 5);

      // Remaining categories for dropdown
      const dropdownCategories = sortedCategories.slice(5);

      return { topCategories, dropdownCategories };
    }, [categoryCounts]);
    */

    // Use the optimized loadMoreTransactions function from the hook (25 at a time)

    // Filter and limit transactions based on search, category, protocol, and displayedCount
    const { filteredTransactions, displayTransactions } = React.useMemo(() => {
      let filtered = allTransactions;

      // Removed protocol and category filtering for simplicity

      // Filter by search query using enhanced analysis
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((tx) => {
          const analysis = getTransactionAnalysis(tx);
          const typeLabel = analysis.displayName.toLowerCase();
          const category = getTransactionCategory(tx);
          const version = String(tx.transaction_version || "");
          const assetSymbol = analysis.assetInfo?.displaySymbol?.toLowerCase() || "apt";
          const protocolName = analysis.protocol?.name?.toLowerCase() || "";
          const protocolLabel = analysis.protocolLabel?.toLowerCase() || "";
          const activityType = EnhancedTransactionAnalyzer.getActivityTypeDisplayName(
            analysis.activityType
          ).toLowerCase();

          return (
            typeLabel.includes(query) ||
            category.includes(query) ||
            version.includes(query) ||
            assetSymbol.includes(query) ||
            protocolName.includes(query) ||
            protocolLabel.includes(query) ||
            activityType.includes(query) ||
            analysis.description.toLowerCase().includes(query) ||
            (tx.type || "").toLowerCase().includes(query)
          );
        });
      }

      // Apply displayedCount limit for scroll-based pagination
      const displayTransactions = filtered.slice(0, displayedCount);

      return { filteredTransactions: filtered, displayTransactions };
    }, [allTransactions, searchQuery, displayedCount]);

    // Handle scroll-based loading similar to PriceList
    React.useEffect(() => {
      const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container || isLoadingMore) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

        // Check if we need to load more data or increase display count
        if (scrollPercentage > 0.8 && !isLoadingMore) {
          if (displayedCount < filteredTransactions.length) {
            // Show more from existing data (100 at a time for smoother experience)
            setDisplayedCount((prev) => Math.min(prev + 100, filteredTransactions.length));
          } else if (
            hasMoreTransactions &&
            (allTransactions.length < totalCount || totalCount === 0)
          ) {
            // Fetch more data from API - only if we haven't loaded all transactions yet
            loadMoreTransactions?.();
          }
        }
      };

      const container = scrollContainerRef.current;
      if (container) {
        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
      }
    }, [
      displayedCount,
      filteredTransactions.length,
      isLoadingMore,
      allTransactions.length,
      totalCount,
    ]);

    // Reset displayed count when search or filters change
    React.useEffect(() => {
      // Reset to initial amount when filters change
      setDisplayedCount(100);
    }, [searchQuery]);

    // Initialize with preloaded transactions if available
    React.useEffect(() => {
      if (
        preloadedTransactions !== null &&
        preloadedTransactions !== undefined &&
        preloadedTransactions.length > 0
      ) {
        // Use preloaded transactions - these are typically just the first 100
        setAllTransactions(preloadedTransactions || []);
        setIsLoading(preloadedTransactionsLoading || false);
        // Keep displayed count at 100 initially, user can scroll for more
        setDisplayedCount(100);
        // Set total count if we know it from the batch API
        if (preloadedTransactions.length === 100) {
          // If we have exactly 100, there are likely more
          setTotalCount(0); // Will be set when we fetch more
        }
        logger.info(
          `Using ${(preloadedTransactions || []).length} preloaded transactions for wallet ${walletAddress}`
        );
      } else if (walletAddress && allTransactions.length === 0 && !preloadedTransactions) {
        // Only load if we don't have any transactions yet
        loadMoreTransactions?.();
      }
    }, [walletAddress, preloadedTransactions, preloadedTransactionsLoading]);

    // Clear filters function
    const clearFilters = () => {
      setSearchQuery("");
      // Filters removed
    };

    // Check if any filters are active
    const hasActiveFilters = searchQuery !== "";

    // Memoize columns
    const columns = React.useMemo<ColumnDef<Transaction>[]>(
      () => [
        {
          id: "date",
          accessorFn: (row) => new Date(row.transaction_timestamp),
          header: ({ column }) => (
            <SortableHeader title="Date" onClick={() => column.toggleSorting()} />
          ),
          cell: ({ row }) => {
            const date = row.getValue("date") as Date;
            return (
              <div className="text-sm w-[120px] flex-shrink-0">
                <div>{date.toLocaleDateString()}</div>
                <div className="text-xs text-muted-foreground">
                  {date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            );
          },
          size: 120,
          minSize: 120,
          maxSize: 120,
        },
        {
          accessorKey: "type",
          header: "Type",
          cell: ({ row }) => {
            const transaction = row.original;
            const analysis = getTransactionAnalysis(transaction);
            const IconComponent = getTransactionTypeIcon(transaction);

            // Convert from octas to APT if needed
            const rawAmount = transaction.amount || "0";
            const amount =
              transaction.asset_type === "APT"
                ? convertRawTokenAmount(rawAmount, 8)
                : parseFloat(rawAmount);
            const isIncoming = amount > 0;
            const isOutgoing = amount < 0;

            return (
              <div className="flex items-center gap-2 w-[280px] flex-shrink-0">
                <div
                  className={cn(
                    "rounded-full p-2 flex-shrink-0",
                    isIncoming
                      ? "bg-green-100 dark:bg-green-900/20"
                      : isOutgoing
                        ? "bg-red-100 dark:bg-red-900/20"
                        : "bg-muted"
                  )}
                >
                  {(() => {
                    const logoPath = analysis.protocol?.name
                      ? getProtocolLogoPath(analysis.protocol.name)
                      : null;
                    return logoPath ? (
                      <img
                        src={logoPath}
                        alt={analysis.protocol?.label || "Protocol"}
                        className="h-4 w-4 rounded-full object-cover"
                        onError={(e) => {
                          // Fallback to icon if logo fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const iconSpan = target.nextElementSibling as HTMLElement;
                          if (iconSpan) iconSpan.style.display = "block";
                        }}
                      />
                    ) : null;
                  })()}
                  <IconComponent
                    className={cn(
                      "h-4 w-4",
                      analysis.protocol?.name && getProtocolLogoPath(analysis.protocol.name)
                        ? "hidden"
                        : "block",
                      isIncoming
                        ? "text-green-600 dark:text-green-400"
                        : isOutgoing
                          ? "text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{analysis.displayName}</div>
                  {analysis.protocol && (
                    <div className="text-xs text-muted-foreground truncate">
                      {analysis.protocolLabel || analysis.protocol.label}
                    </div>
                  )}
                  {!analysis.protocol &&
                    transaction.type &&
                    !transaction.type.includes("transfer_coins") && (
                      <code className="text-xs text-muted-foreground font-mono truncate block">
                        {transaction.type.split("::").slice(0, 2).join("::")}
                      </code>
                    )}
                </div>
              </div>
            );
          },
          size: 280,
          minSize: 280,
          maxSize: 280,
        },
        {
          id: "category",
          header: "Category",
          cell: ({ row }) => {
            const transaction = row.original;
            const analysis = getTransactionAnalysis(transaction);

            // Enhanced category display
            const getCategoryBadgeInfo = () => {
              const category = getTransactionCategory(transaction);
              const colors = getCategoryColors(category);

              switch (analysis.category) {
                case TransactionCategory.DEFI:
                  return {
                    label: EnhancedTransactionAnalyzer.getActivityTypeDisplayName(
                      analysis.activityType
                    ),
                    colors,
                  };
                case TransactionCategory.STAKING:
                  return {
                    label:
                      analysis.activityType === ActivityType.CLAIM_REWARDS ? "Rewards" : "Staking",
                    colors,
                  };
                case TransactionCategory.CEX:
                  return { label: "CEX", colors };
                case TransactionCategory.BRIDGE:
                  return { label: "Bridge", colors };
                case TransactionCategory.NFT:
                  return { label: "NFT", colors };
                case TransactionCategory.RWA:
                  return { label: "RWA", colors };
                case TransactionCategory.SYSTEM:
                  return { label: "System", colors };
                case TransactionCategory.TRANSFER:
                default:
                  return {
                    label: analysis.direction === "incoming" ? "Received" : "Sent",
                    colors,
                  };
              }
            };

            const badgeInfo = getCategoryBadgeInfo();

            return (
              <div className="w-[120px] flex-shrink-0">
                <Badge variant="outline" className={cn("capitalize border", badgeInfo.colors)}>
                  {badgeInfo.label}
                </Badge>
              </div>
            );
          },
          size: 120,
          minSize: 120,
          maxSize: 120,
        },
        {
          accessorKey: "asset_type",
          header: "Asset",
          cell: ({ row }) => {
            const transaction = row.original;
            const analysis = getTransactionAnalysis(transaction);

            return (
              <div className="w-[100px] flex-shrink-0">
                <span className="text-sm font-mono">
                  {analysis.assetInfo?.displaySymbol || "APT"}
                </span>
                {analysis.assetInfo && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {analysis.assetInfo.isStablecoin && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        Stable
                      </Badge>
                    )}
                    {analysis.assetInfo.isLST && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        LST
                      </Badge>
                    )}
                    {analysis.assetInfo.isRWA && (
                      <Badge variant="default" className="text-xs px-1 py-0">
                        RWA
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            );
          },
          size: 100,
          minSize: 100,
          maxSize: 100,
        },
        {
          id: "actions",
          cell: ({ row }) => {
            const transaction = row.original;
            return (
              <div className="w-[60px] flex-shrink-0 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    safeWindowOpen(
                      `https://explorer.aptoslabs.com/txn/${transaction.transaction_version}?network=mainnet`,
                      "_blank"
                    );
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            );
          },
          size: 60,
          minSize: 60,
          maxSize: 60,
        },
      ],
      []
    );

    const table = useReactTable({
      data: displayTransactions,
      columns,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      enableColumnResizing: false,
      columnResizeMode: "onChange",
      manualPagination: true, // Disable automatic pagination
      pageCount: 1, // Single page with all data
      state: {
        sorting,
        columnFilters,
      },
    });

    if (isLoading || (preloadedTransactionsLoading && allTransactions.length === 0)) {
      return (
        <div className={className}>
          {/* Filter skeletons */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <Skeleton className="h-10 w-full lg:w-[200px]" />
              <Skeleton className="h-10 w-full lg:w-64" />
            </div>

            {/* Category filter skeleton */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>

          <div className="border-b border-border mb-4"></div>

          {/* Mobile card view skeleton - matches actual card layout */}
          <div className="block sm:hidden space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  {/* Header Row - Fixed height container */}
                  <div className="flex items-start justify-between min-h-[56px]">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0 py-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-4 flex-shrink-0 ml-2" />
                  </div>

                  {/* Details Row - Fixed spacing */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Skeleton className="h-6 w-16 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 w-8 flex-shrink-0" />
                    </div>
                    <div className="text-right flex-shrink-0 ml-2 space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>

                  {/* Asset badges - Fixed height container */}
                  <div className="min-h-[24px] flex items-start">
                    <div className="flex gap-1">
                      <Skeleton className="h-5 w-12 rounded-full" />
                      <Skeleton className="h-5 w-8 rounded-full" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop table view skeleton - matches fixed column layout */}
          <div className="hidden sm:block overflow-x-auto">
            <Table className="min-w-[800px] lg:min-w-full" style={{ tableLayout: "fixed" }}>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: "120px" }} className="overflow-hidden">
                    <Skeleton className="h-4 w-12" />
                  </TableHead>
                  <TableHead style={{ width: "280px" }} className="overflow-hidden">
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                  <TableHead style={{ width: "120px" }} className="overflow-hidden">
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead style={{ width: "100px" }} className="overflow-hidden">
                    <Skeleton className="h-4 w-12" />
                  </TableHead>
                  <TableHead style={{ width: "60px" }} className="overflow-hidden">
                    <Skeleton className="h-4 w-8" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {/* Date column - 120px */}
                    <TableCell style={{ width: "120px" }} className="overflow-hidden">
                      <div className="w-[120px] flex-shrink-0 space-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </TableCell>

                    {/* Type column - 280px */}
                    <TableCell style={{ width: "280px" }} className="overflow-hidden">
                      <div className="flex items-center gap-2 w-[280px] flex-shrink-0">
                        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>

                    {/* Category column - 120px */}
                    <TableCell style={{ width: "120px" }} className="overflow-hidden">
                      <div className="w-[120px] flex-shrink-0">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </TableCell>

                    {/* Asset column - 100px */}
                    <TableCell style={{ width: "100px" }} className="overflow-hidden">
                      <div className="w-[100px] flex-shrink-0 space-y-2">
                        <Skeleton className="h-4 w-12" />
                        <div className="flex gap-1">
                          <Skeleton className="h-4 w-8 rounded-full" />
                        </div>
                      </div>
                    </TableCell>

                    {/* Actions column - 60px */}
                    <TableCell style={{ width: "60px" }} className="overflow-hidden">
                      <div className="w-[60px] flex-shrink-0 flex justify-center">
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination skeleton */}
            <div className="flex items-center justify-between mt-4">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8" />
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={className}>
          <div className="flex items-center gap-2 mb-6">
            <History className="h-4 w-4" />
            <h2 className="text-base font-medium">{t("portfolio.transactions.title")}</h2>
          </div>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className={`text-lg font-semibold ${GeistMono.className}`}>
                {t("portfolio.transactions.unable_to_load")}
              </h3>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                {t("actions.refresh")}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (!allTransactions.length) {
      return (
        <div className={className}>
          <div className="flex items-center gap-2 mb-6">
            <History className="h-4 w-4" />
            <h2 className="text-base font-medium">{t("portfolio.transactions.title")}</h2>
          </div>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className={`text-lg font-semibold ${GeistMono.className}`}>
                {t("portfolio.transactions.no_transactions")}
              </h3>
              <p className="text-muted-foreground text-xs max-w-md mx-auto">
                {t("portfolio.transactions.transaction_data_will_appear")}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={cn("flex flex-col h-full", className)}>
        {/* Mobile: Transaction History Header */}
        <div className="flex items-center gap-2 mb-6 lg:hidden flex-shrink-0">
          <History className="h-4 w-4" />
          <h2 className="text-base font-medium">
            {t("transactions.history") || "Transaction History"}
          </h2>
        </div>

        {/* Simplified - removed all filter dropdowns and category buttons */}

        {/* Loading indicator for batch loading */}
        {preloadedTransactionsLoading && allTransactions.length > 0 && (
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Loading more transactions... ({allTransactions.length} loaded)
            </div>
          </div>
        )}

        {/* Scrollable Transaction Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto min-h-0"
          style={{ scrollBehavior: "smooth" }}
        >
          {/* Mobile Card View - Only on small screens */}
          <div className="block sm:hidden space-y-3 pb-4">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const transaction = row.original;
                const date = new Date(transaction.transaction_timestamp);
                const analysis = getTransactionAnalysis(transaction);
                const IconComponent = getTransactionTypeIcon(transaction);
                const rawAmount = transaction.amount || "0";
                const amount =
                  transaction.asset_type === "APT"
                    ? convertRawTokenAmount(rawAmount, 8)
                    : parseFloat(rawAmount);
                const isIncoming = amount > 0;
                const isOutgoing = amount < 0;

                const getCategoryBadgeInfo = () => {
                  const category = getTransactionCategory(transaction);
                  const colors = getCategoryColors(category);

                  switch (analysis.category) {
                    case TransactionCategory.DEFI:
                      return {
                        label: EnhancedTransactionAnalyzer.getActivityTypeDisplayName(
                          analysis.activityType
                        ),
                        colors,
                      };
                    case TransactionCategory.STAKING:
                      return {
                        label:
                          analysis.activityType === ActivityType.CLAIM_REWARDS
                            ? "Rewards"
                            : "Staking",
                        colors,
                      };
                    case TransactionCategory.CEX:
                      return { label: "CEX", colors };
                    case TransactionCategory.BRIDGE:
                      return { label: "Bridge", colors };
                    case TransactionCategory.NFT:
                      return { label: "NFT", colors };
                    case TransactionCategory.RWA:
                      return { label: "RWA", colors };
                    case TransactionCategory.SYSTEM:
                      return { label: "System", colors };
                    case TransactionCategory.TRANSFER:
                    default:
                      return {
                        label: analysis.direction === "incoming" ? "Received" : "Sent",
                        colors,
                      };
                  }
                };

                const badgeInfo = getCategoryBadgeInfo();
                const logoPath = analysis.protocol?.name
                  ? getProtocolLogoPath(analysis.protocol.name)
                  : null;

                return (
                  <Card
                    key={row.id}
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      safeWindowOpen(
                        `https://explorer.aptoslabs.com/txn/${transaction.transaction_version}?network=mainnet`,
                        "_blank"
                      )
                    }
                  >
                    <div className="space-y-3">
                      {/* Header Row - Fixed height container */}
                      <div className="flex items-start justify-between min-h-[56px]">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className={cn(
                              "rounded-full p-2 flex-shrink-0 w-10 h-10 flex items-center justify-center",
                              isIncoming
                                ? "bg-green-100 dark:bg-green-900/20"
                                : isOutgoing
                                  ? "bg-red-100 dark:bg-red-900/20"
                                  : "bg-muted"
                            )}
                          >
                            {logoPath ? (
                              <>
                                <img
                                  src={logoPath}
                                  alt={analysis.protocol?.label || "Protocol"}
                                  className="h-5 w-5 rounded-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    const iconSpan = target.nextElementSibling as HTMLElement;
                                    if (iconSpan) iconSpan.style.display = "block";
                                  }}
                                />
                                <IconComponent
                                  className={cn(
                                    "h-5 w-5 hidden",
                                    isIncoming
                                      ? "text-green-600 dark:text-green-400"
                                      : isOutgoing
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-muted-foreground"
                                  )}
                                />
                              </>
                            ) : (
                              <IconComponent
                                className={cn(
                                  "h-5 w-5",
                                  isIncoming
                                    ? "text-green-600 dark:text-green-400"
                                    : isOutgoing
                                      ? "text-red-600 dark:text-red-400"
                                      : "text-muted-foreground"
                                )}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <div className="font-medium text-sm truncate">
                              {analysis.displayName}
                            </div>
                            {analysis.protocol && (
                              <div className="text-xs text-muted-foreground truncate">
                                {analysis.protocolLabel || analysis.protocol.label}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Details Row - Fixed spacing */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge
                            variant="outline"
                            className={cn("text-xs border flex-shrink-0", badgeInfo.colors)}
                          >
                            {badgeInfo.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
                            {analysis.assetInfo?.displaySymbol || "APT"}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-xs whitespace-nowrap">
                            {date.toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {date.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Asset badges - Fixed height container */}
                      <div className="min-h-[24px] flex items-start">
                        {analysis.assetInfo &&
                          (analysis.assetInfo.isStablecoin ||
                            analysis.assetInfo.isLST ||
                            analysis.assetInfo.isRWA) && (
                            <div className="flex gap-1 flex-wrap">
                              {analysis.assetInfo.isStablecoin && (
                                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                  Stable
                                </Badge>
                              )}
                              {analysis.assetInfo.isLST && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5">
                                  LST
                                </Badge>
                              )}
                              {analysis.assetInfo.isRWA && (
                                <Badge variant="default" className="text-xs px-2 py-0.5">
                                  RWA
                                </Badge>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">No transactions found.</div>
            )}
          </div>

          {/* Desktop Table View - sm and larger screens */}
          <div className="hidden sm:block overflow-x-auto pb-4">
            <Table className="min-w-[800px] lg:min-w-full" style={{ tableLayout: "fixed" }}>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={{ width: `${header.getSize()}px` }}
                        className="overflow-hidden"
                      >
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
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        safeWindowOpen(
                          `https://explorer.aptoslabs.com/txn/${row.original.transaction_version}?network=mainnet`,
                          "_blank"
                        )
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{ width: `${cell.column.getSize()}px` }}
                          className="overflow-hidden"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="px-4 py-3 text-center text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Loading more transactions...
              </div>
            </div>
          )}

          {/* Transaction count display - always show for debugging */}
          <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-border/30">
            Showing {displayedCount} of {filteredTransactions.length} filtered
            {" | "}Total loaded: {allTransactions.length}
            {totalCount > 0 && <span> of {totalCount.toLocaleString()} total</span>}
            {allTransactions.length < totalCount && <span> (scroll for more)</span>}
          </div>
        </div>
      </div>
    );
  }
);

TransactionHistoryTable.displayName = "TransactionHistoryTable";

export default TransactionHistoryTable;
