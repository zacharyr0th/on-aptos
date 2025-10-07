"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Coins,
  DollarSign,
  ExternalLink,
  Layers,
  Percent,
  Shield,
  TrendingUp,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

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
import { YieldAggregatorService, type YieldOpportunity } from "@/lib/services/yield";
import type { YieldTableProps as BaseYieldTableProps } from "@/lib/types/ui";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/utils/core/logger";
import { safeWindowOpen } from "@/lib/utils/core/security";
import { formatCurrency, formatPercentage } from "@/lib/utils/format/format";

interface YieldTableProps extends BaseYieldTableProps {
  // walletAddress, limit, and compact are inherited from BaseYieldTableProps
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
// Normalize protocol names for grouping
const normalizeProtocolName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/v\d+/g, "") // Remove version numbers like "v2", "v3"
    .replace(/[^a-z0-9]/g, ""); // Remove special characters
};

// Get display name for protocols (grouped)
const getProtocolDisplayName = (protocolName: string): string => {
  const normalized = normalizeProtocolName(protocolName);

  // Map normalized names to display names
  const displayNameMap: Record<string, string> = {
    thala: "Thala",
    thalav: "Thala",
    thalaswap: "Thala",
    pancakeswap: "PancakeSwap",
    pancake: "PancakeSwap",
    liquidswap: "LiquidSwap",
    cellana: "Cellana",
    aries: "Aries",
    merkle: "Merkle",
    echelon: "Echelon",
    echelonmarket: "Echelon",
    amnis: "Amnis",
    amnisfinance: "Amnis",
    sushi: "Sushi",
    sushiswap: "Sushi",
    kana: "Kana",
    echo: "Echo",
    joule: "Joule",
    thetis: "Thetis",
    hyperion: "Hyperion",
    tapp: "Tapp",
    tappexchange: "Tapp",
  };

  return displayNameMap[normalized] || protocolName.charAt(0).toUpperCase() + protocolName.slice(1);
};

const getProtocolLogoPath = (protocolName: string): string | null => {
  const protocolIcons: Record<string, string> = {
    // Main protocols (grouped by base name)
    pancakeswap: "/icons/protocols/pancake.webp",
    pancake: "/icons/protocols/pancake.webp",
    thala: "/icons/protocols/thala.avif",
    thalav: "/icons/protocols/thala.avif", // Covers thala v2, etc
    thalaswap: "/icons/protocols/thala.avif", // thalaswap-v2
    liquidswap: "/icons/protocols/liquidswap.webp",
    cellana: "/icons/protocols/cellana.webp",
    aries: "/icons/protocols/aries.avif",
    merkle: "/icons/protocols/merkle.webp",
    echelon: "/icons/protocols/echelon.avif",
    echelonmarket: "/icons/protocols/echelon.avif",
    amnis: "/icons/protocols/amnis.avif",
    amnisfinance: "/icons/protocols/amnis.avif",
    sushi: "/icons/protocols/sushi.webp",
    sushiswap: "/icons/protocols/sushi.webp",
    kana: "/icons/protocols/kana.webp",
    echo: "/icons/protocols/echo.webp",
    joule: "/icons/protocols/joule.webp",
    thetis: "/icons/protocols/thetis.webp",
    hyperion: "/icons/protocols/hyperion.webp",
    // Additional protocols from directory
    agdex: "/icons/protocols/agdex.webp",
    anqa: "/icons/protocols/anqa.webp",
    celer: "/icons/protocols/celer.webp",
    crossmint: "/icons/protocols/crossmint.webp",
    eliza: "/icons/protocols/eliza.webp",
    goblin: "/icons/protocols/goblin.webp",
    ichi: "/icons/protocols/ichi.webp",
    kofi: "/icons/protocols/kofi.avif",
    lz: "/icons/protocols/lz.webp",
    layerzero: "/icons/protocols/lz.webp",
    meso: "/icons/protocols/meso.webp",
    metamove: "/icons/protocols/metamove.webp",
    moar: "/icons/protocols/moar.webp",
    panora: "/icons/protocols/panora.webp",
    pumpuptos: "/icons/protocols/pump-uptos.webp",
    superposition: "/icons/protocols/superposition.webp",
    tapp: "/icons/protocols/tapp.webp",
    tappexchange: "/icons/protocols/tapp.webp",
    tradeport: "/icons/protocols/tradeport.webp",
    trufin: "/icons/protocols/trufin.webp",
    vibrantx: "/icons/protocols/vibrantx.webp",
    wormhole: "/icons/protocols/wormhole.webp",
  };

  const normalizedName = normalizeProtocolName(protocolName);
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

export function YieldTable({ walletAddress, limit, compact = false }: YieldTableProps) {
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([
    { id: "tvl", desc: true }, // Default sort by TVL descending
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Filter states
  const [selectedAsset, setSelectedAsset] = useState<string>("all");
  const [selectedProtocol, setSelectedProtocol] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = limit || 200;

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

      // Filter out Tortuga opportunities and sort by TVL (highest first)
      const filteredOpps = allOpps
        .filter((opp) => !opp.protocol.toLowerCase().includes("tortuga"))
        .sort((a, b) => b.tvl - a.tvl);

      setOpportunities(filteredOpps);
      logger.info(`Loaded ${filteredOpps.length} yield opportunities`);
    } catch (err) {
      logger.error(
        `Failed to load yield opportunities: ${err instanceof Error ? err.message : String(err)}`
      );
      setError("Failed to load yield opportunities");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and pagination
  const { filteredOpportunities, displayOpportunities, totalPages } = React.useMemo(() => {
    let filtered = [...opportunities];

    if (selectedProtocol !== "all") {
      filtered = filtered.filter(
        (o) => getProtocolDisplayName(o.protocol).toLowerCase() === selectedProtocol
      );
    }

    if (selectedAsset !== "all") {
      filtered = filtered.filter(
        (o) => o.assetSymbol === selectedAsset || o.pairedAssetSymbol === selectedAsset
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.protocol.toLowerCase().includes(query) ||
          o.assetSymbol.toLowerCase().includes(query) ||
          o.pairedAssetSymbol?.toLowerCase().includes(query) ||
          o.opportunityType.toLowerCase().includes(query)
      );
    }

    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayOpportunities = filtered.slice(startIndex, endIndex);

    return {
      filteredOpportunities: filtered,
      displayOpportunities,
      totalPages,
    };
  }, [opportunities, selectedProtocol, selectedAsset, searchQuery, currentPage, itemsPerPage]);

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
        label: value === "all" ? "All Protocols" : getProtocolDisplayName(value),
        count,
      }))
      .sort((a, b) => {
        if (a.value === "all") return -1;
        if (b.value === "all") return 1;
        return b.count - a.count;
      });
  }, [opportunities]);

  // Calculate counts for each asset
  const assetCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: opportunities.length,
    };

    opportunities.forEach((opp) => {
      // Count primary asset
      counts[opp.assetSymbol] = (counts[opp.assetSymbol] || 0) + 1;

      // Count paired asset if exists
      if (opp.pairedAssetSymbol) {
        counts[opp.pairedAssetSymbol] = (counts[opp.pairedAssetSymbol] || 0) + 1;
      }
    });

    return counts;
  }, [opportunities]);

  // Format asset symbol for display
  const formatAssetSymbol = (symbol: string): string => {
    if (symbol === "all" || symbol === "All") return symbol;

    // Explicit mappings for specific assets
    const explicitMappings: Record<string, string> = {
      TRUAPT: "truAPT",
      AMAPT: "amAPT",
      STAPT: "stAPT",
      KAPT: "kAPT",
      THAPT: "thAPT",
      STKAPT: "stkAPT",
      SUSDE: "sUSDe",
      USDE: "USDe",
      USDT: "USDt",
      USDC: "USDC",
      ZUSDT: "zUSDt",
      ZUSDC: "zUSDC",
      ZWETH: "zWETH",
      USD1: "USD1",
      APT: "APT",
      MOD: "MOD",
      XBTC: "xBTC",
      SBTC: "sBTC",
      BRBTC: "brBTC",
      FIABTC: "fiaBTC",
      UNIBTC: "uniBTC",
      ABTC: "aBTC",
      BTC: "BTC",
      ETH: "ETH",
      WETH: "WETH",
      DAI: "DAI",
      WBTC: "WBTC",
      THL: "THL",
      USDA: "USDA",
      USDY: "USDY",
      MKLP: "MKLP",
    };

    // Check explicit mappings first
    if (explicitMappings[symbol]) {
      return explicitMappings[symbol];
    }

    // For other bridged/derivative assets, try pattern matching
    // Check if it starts with 1-3 uppercase letters followed by more uppercase
    const prefixMatch = symbol.match(/^([A-Z]{1,3})([A-Z]+)$/);
    if (prefixMatch) {
      const [, prefix, rest] = prefixMatch;
      // Convert prefix to lowercase for derivatives
      return prefix.toLowerCase() + rest;
    }

    return symbol;
  };

  // Split assets into top categories and dropdown
  const { topAssets, dropdownAssets } = React.useMemo(() => {
    // Priority assets to show as buttons (in order)
    const priorityAssets = [
      "all",
      "APT",
      "STAPT",
      "THAPT",
      "KAPT",
      "WBTC",
      "XBTC",
      "FIABTC",
      "ABTC",
      "BRBTC",
      "USDT",
      "USDC",
      "SUSDE",
      "USD1",
    ];

    const allAssets = Object.entries(assetCounts)
      .map(([value, count]) => ({
        value,
        label: value === "all" ? "All" : formatAssetSymbol(value),
        count,
      }))
      .filter((asset) => asset.value === "all" || asset.count > 0);

    // Separate priority assets and others
    const topAssets = priorityAssets
      .map((priority) => allAssets.find((asset) => asset.value === priority))
      .filter(
        (asset): asset is { value: string; label: string; count: number } => asset !== undefined
      );

    // Remaining assets sorted by count for dropdown
    const dropdownAssets = allAssets
      .filter((asset) => !priorityAssets.includes(asset.value))
      .sort((a, b) => b.count - a.count);

    return { topAssets, dropdownAssets };
  }, [assetCounts]);

  // Get top protocols
  const topProtocols = React.useMemo(() => {
    const protocolCounts: Record<string, number> = {};

    opportunities.forEach((opp) => {
      const displayName = getProtocolDisplayName(opp.protocol);
      protocolCounts[displayName] = (protocolCounts[displayName] || 0) + 1;
    });

    return [
      { value: "all", label: "All", count: opportunities.length },
      ...Object.entries(protocolCounts)
        .map(([label, count]) => ({
          value: label.toLowerCase(),
          label,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
    ];
  }, [opportunities]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedProtocol("all");
    setSelectedAsset("all");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedProtocol !== "all" || selectedAsset !== "all" || searchQuery !== "";

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedAsset, selectedProtocol]);

  // Table columns
  const columns = React.useMemo<ColumnDef<YieldOpportunity>[]>(
    () => [
      {
        accessorKey: "protocol",
        header: ({ column }) => <SortableHeader column={column} title="Protocol" />,
        cell: ({ row }) => {
          const protocol = row.getValue("protocol") as string;
          const logoPath = getProtocolLogoPath(protocol);
          const TypeIcon = getTypeIcon(row.original.opportunityType);

          return (
            <div className="flex items-center gap-2 w-[200px] flex-shrink-0">
              {logoPath ? (
                <img
                  src={logoPath}
                  alt={protocol}
                  className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const iconSpan = target.nextElementSibling as HTMLElement;
                    if (iconSpan) iconSpan.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="rounded-full p-2 bg-muted flex-shrink-0"
                style={{ display: logoPath ? "none" : "flex" }}
              >
                <TypeIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">
                  {getProtocolDisplayName(protocol)}
                </div>
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
        header: ({ column }) => <SortableHeader column={column} title="Asset" />,
        cell: ({ row }) => {
          const asset = row.getValue("assetSymbol") as string;
          const paired = row.original.pairedAssetSymbol;
          return (
            <div className="w-[140px] flex-shrink-0">
              <div className="flex items-center gap-1">
                <span className="font-mono text-sm">{formatAssetSymbol(asset)}</span>
                {paired && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-mono text-sm">{formatAssetSymbol(paired)}</span>
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
              <span className="font-mono text-sm font-bold text-emerald-500 dark:text-emerald-400">
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
            <span className="font-mono text-sm">{formatCurrency(row.getValue("tvl"))}</span>
          </div>
        ),
        size: 120,
        minSize: 120,
        maxSize: 120,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const protocol = row.original.protocol.toLowerCase().replace(/\s+/g, "");
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
    []
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
                <div key={i} className="grid grid-cols-7 gap-4 p-4 border-b last:border-b-0">
                  <Skeleton className="h-4 w-4" /> {/* Expander chevron */}
                  <Skeleton className="h-5 w-24" /> {/* Protocol name */}
                  <Skeleton className="h-5 w-16 font-mono" /> {/* APY percentage */}
                  <Skeleton className="h-5 w-20 font-mono" /> {/* TVL amount */}
                  <div className="flex items-center gap-1">
                    {" "}
                    {/* Asset pair */}
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" /> {/* Type badge */}
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
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* Mobile: Yields Header */}
      <div className="flex items-center gap-2 mb-6 lg:hidden flex-shrink-0">
        <TrendingUp className="h-4 w-4" />
        <h2 className="text-base font-medium">Yields</h2>
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
                      <Badge variant="secondary" className="ml-2 h-4 px-2 text-xs">
                        {option.count}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Asset Dropdown - Mobile */}
          <Select value={selectedAsset} onValueChange={setSelectedAsset}>
            <SelectTrigger className="w-full bg-transparent border-border hover:bg-accent hover:text-accent-foreground">
              <SelectValue placeholder="All Assets" />
            </SelectTrigger>
            <SelectContent>
              {topAssets.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <Badge variant="secondary" className="ml-2 h-4 px-2 text-xs">
                      {option.count}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="w-full">
        {/* Asset Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {topAssets.map((option, index) => (
            <React.Fragment key={option.value}>
              <Button
                variant={selectedAsset === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedAsset(option.value)}
                className={cn(
                  "text-xs h-8 px-3 font-medium transition-all",
                  selectedAsset === option.value
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {option.label} ({option.count})
              </Button>
              {/* Add dividers after kAPT and brBTC */}
              {(option.value === "KAPT" || option.value === "BRBTC") && (
                <div className="h-6 w-px bg-border" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto min-h-0 max-h-full">
        {/* Content */}
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
                    const protocol = opportunity.protocol.toLowerCase().replace(/\s+/g, "");
                    safeWindowOpen(`https://${protocol}.fi`, "_blank");
                  }}
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between min-h-[56px]">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {logoPath ? (
                          <img
                            src={logoPath}
                            alt={opportunity.protocol}
                            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const iconSpan = target.nextElementSibling as HTMLElement;
                              if (iconSpan) iconSpan.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="rounded-full p-2 bg-muted flex-shrink-0 w-10 h-10 items-center justify-center"
                          style={{ display: logoPath ? "none" : "flex" }}
                        >
                          <TypeIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <div className="font-medium text-sm truncate">
                            {getProtocolDisplayName(opportunity.protocol)}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {opportunity.opportunityType === "liquidity"
                              ? "LP"
                              : opportunity.opportunityType === "staking"
                                ? "LST"
                                : opportunity.opportunityType.charAt(0).toUpperCase() +
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
                          {formatAssetSymbol(opportunity.assetSymbol)}
                          {opportunity.pairedAssetSymbol && (
                            <span className="text-muted-foreground">
                              /{formatAssetSymbol(opportunity.pairedAssetSymbol)}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-sm font-bold text-emerald-500 dark:text-emerald-400">
                          {formatPercentage(opportunity.apy)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(opportunity.tvl)}
                        </div>
                      </div>
                    </div>

                    {/* Features/Rewards */}
                    <div className="min-h-[24px] flex items-start">
                      {opportunity.features && opportunity.features.length > 0 && (
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
            <div className="text-center py-8 text-muted-foreground">No opportunities found.</div>
          )}
        </div>

        {/* Desktop Table View */}
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
                    onClick={() => {
                      const protocol = row.original.protocol.toLowerCase().replace(/\s+/g, "");
                      safeWindowOpen(`https://${protocol}.fi`, "_blank");
                    }}
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
                    No opportunities found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredOpportunities.length)} of{" "}
              {filteredOpportunities.length} opportunities
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Simple count for single page */}
        {totalPages <= 1 && (
          <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-border/30">
            Showing {filteredOpportunities.length} opportunities
          </div>
        )}
      </div>
    </div>
  );
}
