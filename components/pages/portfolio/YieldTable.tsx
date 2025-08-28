"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  getExpandedRowModel,
  ExpandedState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ExternalLink,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  X,
  Percent,
  Coins,
  DollarSign,
  Shield,
  Layers,
} from "lucide-react";
import React, { useState, useEffect } from "react";

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
import { YieldOpportunity, YieldAggregatorService } from "@/lib/services/yield";
import { YieldTableProps as BaseYieldTableProps } from "@/lib/types/ui";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/utils/core/logger";
import { safeWindowOpen } from "@/lib/utils/core/security";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";

interface YieldTableProps extends BaseYieldTableProps {
  // walletAddress is inherited from BaseYieldTableProps
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

// Map protocol names to local icon paths
const getProtocolLogoPath = (protocolName: string): string | null => {
  const protocolIcons: Record<string, string> = {
    pancakeswap: "/icons/protocols/pancake.webp",
    thala: "/icons/protocols/thala.avif",
    liquidswap: "/icons/protocols/liquidswap.webp",
    cellana: "/icons/protocols/cellana.webp",
    aries: "/icons/protocols/aries.avif",
    merkle: "/icons/protocols/merkle.webp",
    echelon: "/icons/protocols/echelon.avif",
    amnis: "/icons/protocols/amnis.avif",
    sushi: "/icons/protocols/sushi.webp",
    kana: "/icons/protocols/kana.webp",
    echo: "/icons/protocols/echo.webp",
    joule: "/icons/protocols/joule.webp",
    thetis: "/icons/protocols/thetis.webp",
    hyperion: "/icons/protocols/hyperion.webp",
    mirage: "/icons/protocols/mirage.webp",
  };

  const normalizedName = protocolName.toLowerCase().replace(/\s+/g, "");
  return protocolIcons[normalizedName] || null;
};

// Get icon for opportunity type
const getTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "liquidity":
      return Layers;
    case "lending":
      return Coins;
    case "staking":
    case "lst":
      return Shield;
    case "farming":
    case "vault":
      return DollarSign;
    default:
      return Percent;
  }
};

const getTypeBadge = (type: string) => {
  // Map internal types to display labels
  const typeLabels: Record<string, string> = {
    liquidity: "LP",
    lending: "Lending",
    staking: "LST",
    farming: "Farming",
    vault: "Vault",
  };

  const displayLabel = typeLabels[type.toLowerCase()] || type;

  return (
    <Badge
      variant="outline"
      className="text-xs bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
    >
      {displayLabel}
    </Badge>
  );
};

export function YieldTable({ walletAddress }: YieldTableProps) {
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([
    { id: "apy", desc: true }, // Default sort by APY descending
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Filter states
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedProtocol, setSelectedProtocol] = useState<string>("all");

  // Display state
  const [displayedCount, setDisplayedCount] = useState(50);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const yieldService = YieldAggregatorService.getInstance();

  useEffect(() => {
    loadOpportunities();
  }, [walletAddress]);

  const loadOpportunities = async () => {
    setLoading(true);
    setError(null);

    try {
      const allOpps = await yieldService.discoverOpportunities(walletAddress, {
        includeInactive: false,
      });

      setOpportunities(allOpps);
      logger.info(`Loaded ${allOpps.length} yield opportunities`);
    } catch (err) {
      logger.error(
        `Failed to load yield opportunities: ${err instanceof Error ? err.message : String(err)}`,
      );
      setError("Failed to load yield opportunities");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const { filteredOpportunities, displayOpportunities } = React.useMemo(() => {
    let filtered = [...opportunities];

    if (selectedProtocol !== "all") {
      filtered = filtered.filter((o) => o.protocol === selectedProtocol);
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((o) => o.opportunityType === selectedType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.protocol.toLowerCase().includes(query) ||
          o.assetSymbol.toLowerCase().includes(query) ||
          o.pairedAssetSymbol?.toLowerCase().includes(query) ||
          o.opportunityType.toLowerCase().includes(query),
      );
    }

    // Apply display limit for scroll-based pagination
    const displayOpportunities = filtered.slice(0, displayedCount);

    return { filteredOpportunities: filtered, displayOpportunities };
  }, [
    opportunities,
    selectedProtocol,
    selectedType,
    searchQuery,
    displayedCount,
  ]);

  // Generate protocol options with counts
  const protocolOptions = React.useMemo(() => {
    const protocolCounts: Record<string, number> = {
      all: opportunities.length,
    };

    opportunities.forEach((opp) => {
      protocolCounts[opp.protocol] = (protocolCounts[opp.protocol] || 0) + 1;
    });

    return Object.entries(protocolCounts)
      .map(([value, count]) => ({
        value,
        label: value === "all" ? "All Protocols" : value,
        count,
      }))
      .sort((a, b) => {
        if (a.value === "all") return -1;
        if (b.value === "all") return 1;
        return b.count - a.count;
      });
  }, [opportunities]);

  // Calculate counts for each type
  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: opportunities.length,
      liquidity: 0,
      lending: 0,
      staking: 0,
      farming: 0,
      vault: 0,
    };

    opportunities.forEach((opp) => {
      const type = opp.opportunityType.toLowerCase();
      counts[type] = (counts[type] || 0) + 1;
    });

    return counts;
  }, [opportunities]);

  // Split types into top categories and dropdown
  const { topTypes, dropdownTypes } = React.useMemo(() => {
    const allTypes = [
      { value: "all", label: "All", count: typeCounts.all },
      { value: "liquidity", label: "LP", count: typeCounts.liquidity },
      { value: "lending", label: "Lending", count: typeCounts.lending },
      { value: "staking", label: "LST", count: typeCounts.staking },
      { value: "farming", label: "Farming", count: typeCounts.farming },
      { value: "vault", label: "Vault", count: typeCounts.vault },
    ];

    // Filter out types with zero count (except "All")
    const nonZeroTypes = allTypes.filter(
      (type) => type.value === "all" || type.count > 0,
    );

    // Sort by count (descending) but keep "All" first
    const sortedTypes = nonZeroTypes.sort((a, b) => {
      if (a.value === "all") return -1;
      if (b.value === "all") return 1;
      return b.count - a.count;
    });

    // Top 5 types as buttons
    const topTypes = sortedTypes.slice(0, 5);

    // Remaining types for dropdown
    const dropdownTypes = sortedTypes.slice(5);

    return { topTypes, dropdownTypes };
  }, [typeCounts]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedProtocol("all");
    setSelectedType("all");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedProtocol !== "all" || selectedType !== "all" || searchQuery !== "";

  // Handle scroll-based loading
  React.useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (scrollPercentage > 0.8) {
        if (displayedCount < filteredOpportunities.length) {
          setDisplayedCount((prev) =>
            Math.min(prev + 50, filteredOpportunities.length),
          );
        }
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [displayedCount, filteredOpportunities.length]);

  // Reset displayed count when filters change
  React.useEffect(() => {
    setDisplayedCount(50);
  }, [searchQuery, selectedType, selectedProtocol]);

  // Table columns
  const columns = React.useMemo<ColumnDef<YieldOpportunity>[]>(
    () => [
      {
        accessorKey: "protocol",
        header: ({ column }) => (
          <SortableHeader column={column} title="Protocol" />
        ),
        cell: ({ row }) => {
          const protocol = row.getValue("protocol") as string;
          const logoPath = getProtocolLogoPath(protocol);
          const TypeIcon = getTypeIcon(row.original.opportunityType);

          return (
            <div className="flex items-center gap-2 w-[200px] flex-shrink-0">
              <div className="rounded-full p-2 bg-muted flex-shrink-0">
                {logoPath ? (
                  <>
                    <img
                      src={logoPath}
                      alt={protocol}
                      className="h-4 w-4 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const iconSpan =
                          target.nextElementSibling as HTMLElement;
                        if (iconSpan) iconSpan.style.display = "block";
                      }}
                    />
                    <TypeIcon className="h-4 w-4 hidden text-muted-foreground" />
                  </>
                ) : (
                  <TypeIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{protocol}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {row.original.opportunityType === "liquidity"
                    ? "LP"
                    : row.original.opportunityType === "staking"
                      ? "LST"
                      : row.original.opportunityType.charAt(0).toUpperCase() +
                        row.original.opportunityType.slice(1)}
                </div>
              </div>
            </div>
          );
        },
        size: 200,
        minSize: 200,
        maxSize: 200,
      },
      {
        accessorKey: "assetSymbol",
        header: ({ column }) => (
          <SortableHeader column={column} title="Asset" />
        ),
        cell: ({ row }) => {
          const asset = row.getValue("assetSymbol") as string;
          const paired = row.original.pairedAssetSymbol;
          return (
            <div className="w-[140px] flex-shrink-0">
              <div className="flex items-center gap-1">
                <span className="font-mono text-sm">{asset}</span>
                {paired && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-mono text-sm">{paired}</span>
                  </>
                )}
              </div>
            </div>
          );
        },
        size: 140,
        minSize: 140,
        maxSize: 140,
      },
      {
        accessorKey: "apy",
        header: ({ column }) => <SortableHeader column={column} title="APY" />,
        cell: ({ row }) => {
          const apy = row.getValue("apy") as number;
          return (
            <div className="w-[100px] flex-shrink-0">
              <span className="font-mono text-sm font-bold text-green-600 dark:text-green-400">
                {formatPercentage(apy)}
              </span>
            </div>
          );
        },
        size: 100,
        minSize: 100,
        maxSize: 100,
      },
      {
        accessorKey: "tvl",
        header: ({ column }) => <SortableHeader column={column} title="TVL" />,
        cell: ({ row }) => (
          <div className="w-[120px] flex-shrink-0">
            <span className="font-mono text-sm">
              {formatCurrency(row.getValue("tvl"))}
            </span>
          </div>
        ),
        size: 120,
        minSize: 120,
        maxSize: 120,
      },
      {
        accessorKey: "opportunityType",
        header: ({ column }) => <SortableHeader column={column} title="Type" />,
        cell: ({ row }) => (
          <div className="w-[100px] flex-shrink-0">
            {getTypeBadge(row.getValue("opportunityType"))}
          </div>
        ),
        size: 100,
        minSize: 100,
        maxSize: 100,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const protocol = row.original.protocol
            .toLowerCase()
            .replace(/\s+/g, "");
          return (
            <div className="w-[60px] flex-shrink-0 flex justify-center">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  safeWindowOpen(`https://${protocol}.fi`, "_blank");
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
    [],
  );

  const table = useReactTable({
    data: displayOpportunities,
    columns,
    state: {
      sorting,
      columnFilters,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    enableColumnResizing: false,
    columnResizeMode: "onChange",
    manualPagination: true,
    pageCount: 1,
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <h2 className="text-base font-medium">Yields</h2>
        </div>

        {/* Filter skeletons */}
        <div className="space-y-4">
          {/* Dropdown filters */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
            <Skeleton className="h-10 w-full sm:flex-1" />
            <Skeleton className="h-10 w-full sm:flex-1" />
            <Skeleton className="h-10 w-full sm:flex-1" />
          </div>

          {/* Search and asset buttons */}
          <div className="flex flex-col sm:grid sm:grid-cols-9 gap-2 sm:gap-4 w-full">
            <Skeleton className="h-10 w-full sm:col-span-2" />
            <div className="grid grid-cols-4 sm:contents gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="border rounded-lg overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-7 gap-4 p-4 border-b bg-muted/50">
                <Skeleton className="h-4 w-4" /> {/* Expander */}
                <Skeleton className="h-4 w-20" /> {/* Protocol */}
                <Skeleton className="h-4 w-12" /> {/* APY */}
                <Skeleton className="h-4 w-12" /> {/* TVL */}
                <Skeleton className="h-4 w-16" /> {/* Asset */}
                <Skeleton className="h-4 w-12" /> {/* Type */}
                <Skeleton className="h-4 w-16" /> {/* Actions */}
              </div>

              {/* Table rows */}
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-7 gap-4 p-4 border-b last:border-b-0"
                >
                  <Skeleton className="h-4 w-4" /> {/* Expander chevron */}
                  <Skeleton className="h-5 w-24" /> {/* Protocol name */}
                  <Skeleton className="h-5 w-16 font-mono" />{" "}
                  {/* APY percentage */}
                  <Skeleton className="h-5 w-20 font-mono" /> {/* TVL amount */}
                  <div className="flex items-center gap-1">
                    {" "}
                    {/* Asset pair */}
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />{" "}
                  {/* Type badge */}
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-8" /> {/* Action button */}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination skeleton */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between pt-4 mt-4 border-t border-border">
              <Skeleton className="h-4 w-48" />
              <div className="flex items-center gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8" />
                ))}
                <Skeleton className="h-4 w-24 mx-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium text-muted-foreground">{error}</p>
        <Button onClick={loadOpportunities} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mobile: Yields Header */}
      <div className="flex items-center gap-2 mb-6 lg:hidden flex-shrink-0">
        <TrendingUp className="h-4 w-4" />
        <h2 className="text-base font-medium">Yield Opportunities</h2>
      </div>

      {/* Filters Section */}
      <div className="space-y-3 mb-4 flex-shrink-0">
        {/* Mobile Layout */}
        <div className="block lg:hidden space-y-3">
          {/* Protocol Dropdown */}
          <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
            <SelectTrigger className="w-full bg-transparent border-border hover:bg-accent hover:text-accent-foreground">
              <SelectValue placeholder="All Protocols" />
            </SelectTrigger>
            <SelectContent>
              {protocolOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    {option.count > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-4 px-2 text-xs"
                      >
                        {option.count}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type Dropdown - Mobile */}
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full bg-transparent border-border hover:bg-accent hover:text-accent-foreground">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              {[...topTypes, ...dropdownTypes].map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <Badge
                      variant="secondary"
                      className="ml-2 h-4 px-2 text-xs"
                    >
                      {option.count}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Clear filters
            </Button>
          )}
        </div>

        {/* Desktop Layout - Clear filters only */}
        <div className="hidden lg:flex lg:items-center lg:justify-start gap-4">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Type Filter - Top types as buttons + dropdowns */}
      <div className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left side - Type filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Top type buttons */}
            {topTypes.map((option) => (
              <Button
                key={option.value}
                variant={selectedType === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(option.value)}
                className={cn(
                  "text-xs h-10 border transition-colors",
                  selectedType === option.value
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {option.label} ({option.count})
              </Button>
            ))}

            {/* Dropdown for additional types */}
            {dropdownTypes.length > 0 && (
              <Select
                value={
                  dropdownTypes.find((type) => type.value === selectedType)
                    ? selectedType
                    : ""
                }
                onValueChange={setSelectedType}
              >
                <SelectTrigger className="w-[140px] h-10 text-xs">
                  <SelectValue placeholder="More..." />
                </SelectTrigger>
                <SelectContent>
                  {dropdownTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        <Badge
                          variant="secondary"
                          className="ml-2 h-4 px-2 text-xs"
                        >
                          {option.count}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Right side - Protocol dropdown */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Select
              value={selectedProtocol}
              onValueChange={setSelectedProtocol}
            >
              <SelectTrigger className="w-[160px] lg:w-[180px] h-10 text-xs bg-transparent border-border hover:bg-accent hover:text-accent-foreground">
                <SelectValue placeholder="All Protocols" />
              </SelectTrigger>
              <SelectContent>
                {protocolOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.count > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-4 px-2 text-xs"
                        >
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto min-h-0"
        style={{ scrollBehavior: "smooth" }}
      >
        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-3 pb-4">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const opportunity = row.original;
              const logoPath = getProtocolLogoPath(opportunity.protocol);
              const TypeIcon = getTypeIcon(opportunity.opportunityType);

              return (
                <Card
                  key={row.id}
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    const protocol = opportunity.protocol
                      .toLowerCase()
                      .replace(/\s+/g, "");
                    safeWindowOpen(`https://${protocol}.fi`, "_blank");
                  }}
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between min-h-[56px]">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="rounded-full p-2 bg-muted flex-shrink-0 w-10 h-10 flex items-center justify-center">
                          {logoPath ? (
                            <>
                              <img
                                src={logoPath}
                                alt={opportunity.protocol}
                                className="h-5 w-5 rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const iconSpan =
                                    target.nextElementSibling as HTMLElement;
                                  if (iconSpan)
                                    iconSpan.style.display = "block";
                                }}
                              />
                              <TypeIcon className="h-5 w-5 hidden text-muted-foreground" />
                            </>
                          ) : (
                            <TypeIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <div className="font-medium text-sm truncate">
                            {opportunity.protocol}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {opportunity.opportunityType === "liquidity"
                              ? "LP"
                              : opportunity.opportunityType === "staking"
                                ? "LST"
                                : opportunity.opportunityType
                                    .charAt(0)
                                    .toUpperCase() +
                                  opportunity.opportunityType.slice(1)}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Details Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getTypeBadge(opportunity.opportunityType)}
                        <span className="text-xs font-mono flex-shrink-0">
                          {opportunity.assetSymbol}
                          {opportunity.pairedAssetSymbol && (
                            <span className="text-muted-foreground">
                              /{opportunity.pairedAssetSymbol}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">
                          {formatPercentage(opportunity.apy)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(opportunity.tvl)}
                        </div>
                      </div>
                    </div>

                    {/* Features/Rewards */}
                    <div className="min-h-[24px] flex items-start">
                      {opportunity.features &&
                        opportunity.features.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {opportunity.features.slice(0, 2).map((feature) => (
                              <Badge
                                key={feature}
                                variant="secondary"
                                className="text-xs px-2 py-0.5"
                              >
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No opportunities found.
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto pb-4">
          <Table
            className="min-w-[800px] lg:min-w-full"
            style={{ tableLayout: "fixed" }}
          >
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
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      const protocol = row.original.protocol
                        .toLowerCase()
                        .replace(/\s+/g, "");
                      safeWindowOpen(`https://${protocol}.fi`, "_blank");
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{ width: `${cell.column.getSize()}px` }}
                        className="overflow-hidden"
                      >
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
                    className="h-24 text-center"
                  >
                    No opportunities found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Count display */}
        <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-border/30">
          Showing {displayedCount} of {filteredOpportunities.length}{" "}
          opportunities
          {displayedCount < filteredOpportunities.length && (
            <span> (scroll for more)</span>
          )}
        </div>
      </div>
    </div>
  );
}
