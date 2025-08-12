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
  getPaginationRowModel,
  PaginationState,
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
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import React, { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatCurrency, formatPercentage } from "@/lib/utils/format/format";
import { logger } from "@/lib/utils/core/logger";
import { safeWindowOpen } from "@/lib/utils/core/security";

interface YieldTableProps {
  walletAddress?: string;
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
    { id: "tvl", desc: true }, // Default sort by TVL descending
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Filter states
  const [selectedAsset, setSelectedAsset] = useState<string>("all");
  const [selectedProtocol, setSelectedProtocol] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [minAPY, setMinAPY] = useState<string>("");

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
  const filteredOpportunities = React.useMemo(() => {
    let filtered = [...opportunities];

    // Filter out Tortuga and Aptin protocols
    filtered = filtered.filter(
      (o) =>
        !o.protocol.toLowerCase().includes("tortuga") &&
        !o.protocol.toLowerCase().includes("aptin"),
    );

    if (selectedAsset !== "all") {
      filtered = filtered.filter((o) => o.assetSymbol === selectedAsset);
    }

    if (selectedProtocol !== "all") {
      filtered = filtered.filter((o) => o.protocol === selectedProtocol);
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((o) => o.opportunityType === selectedType);
    }

    if (minAPY) {
      const min = parseFloat(minAPY);
      if (!isNaN(min)) {
        filtered = filtered.filter((o) => o.apy >= min);
      }
    }

    if (globalFilter) {
      filtered = filtered.filter(
        (o) =>
          o.protocol.toLowerCase().includes(globalFilter.toLowerCase()) ||
          o.assetSymbol.toLowerCase().includes(globalFilter.toLowerCase()) ||
          o.pairedAssetSymbol
            ?.toLowerCase()
            .includes(globalFilter.toLowerCase()),
      );
    }

    return filtered;
  }, [
    opportunities,
    selectedAsset,
    selectedProtocol,
    selectedType,
    minAPY,
    globalFilter,
  ]);

  // Get unique values for filters
  const uniqueAssets = React.useMemo(
    () => ["all", ...new Set(opportunities.map((o) => o.assetSymbol))].sort(),
    [opportunities],
  );

  const uniqueProtocols = React.useMemo(
    () =>
      [
        "all",
        ...new Set(
          opportunities
            .filter(
              (o) =>
                !o.protocol.toLowerCase().includes("tortuga") &&
                !o.protocol.toLowerCase().includes("aptin"),
            )
            .map((o) => o.protocol),
        ),
      ].sort(),
    [opportunities],
  );

  const uniqueTypes = React.useMemo(
    () => ["all", ...new Set(opportunities.map((o) => o.opportunityType))],
    [opportunities],
  );

  // Clear all filters
  const clearFilters = () => {
    setSelectedAsset("all");
    setSelectedProtocol("all");
    setSelectedType("all");
    setMinAPY("");
    setGlobalFilter("");
  };

  const hasActiveFilters =
    selectedAsset !== "all" ||
    selectedProtocol !== "all" ||
    selectedType !== "all" ||
    minAPY !== "" ||
    globalFilter !== "";

  // Table columns
  const columns = React.useMemo<ColumnDef<YieldOpportunity>[]>(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }) => {
          return row.getCanExpand() ? (
            <button onClick={row.getToggleExpandedHandler()} className="p-1">
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : null;
        },
        size: 30,
      },
      {
        accessorKey: "protocol",
        header: ({ column }) => (
          <SortableHeader column={column} title="Protocol" />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("protocol")}</div>
        ),
        size: 120,
      },
      {
        accessorKey: "apy",
        header: ({ column }) => <SortableHeader column={column} title="APY" />,
        cell: ({ row }) => {
          const apy = row.getValue("apy") as number;
          return (
            <div className="text-left font-mono text-sm">
              <span className="font-bold">{formatPercentage(apy)}</span>
            </div>
          );
        },
        size: 100,
      },
      {
        accessorKey: "tvl",
        header: ({ column }) => <SortableHeader column={column} title="TVL" />,
        cell: ({ row }) => (
          <div className="text-left font-mono text-sm">
            {formatCurrency(row.getValue("tvl"))}
          </div>
        ),
        size: 120,
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
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm">{asset}</span>
              {paired && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-mono text-sm">{paired}</span>
                </>
              )}
            </div>
          );
        },
        size: 150,
      },
      {
        accessorKey: "opportunityType",
        header: ({ column }) => <SortableHeader column={column} title="Type" />,
        cell: ({ row }) => getTypeBadge(row.getValue("opportunityType")),
        size: 100,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const protocol = row.original.protocol
            .toLowerCase()
            .replace(/\s+/g, "");
          return (
            <div className="text-right">
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  safeWindowOpen(`https://${protocol}.fi`, "_blank")
                }
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        size: 80,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredOpportunities,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
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

        <div className="border-b border-border"></div>

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
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="space-y-4">
        {/* Filter Dropdowns - Responsive */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
          <div className="w-full sm:flex-1">
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="bg-transparent w-full">
                <SelectValue placeholder="All Assets" />
              </SelectTrigger>
              <SelectContent>
                {uniqueAssets.map((asset) => (
                  <SelectItem key={asset} value={asset}>
                    {asset === "all" ? "All Assets" : asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:flex-1">
            <Select
              value={selectedProtocol}
              onValueChange={setSelectedProtocol}
            >
              <SelectTrigger className="bg-transparent w-full">
                <SelectValue placeholder="All Protocols" />
              </SelectTrigger>
              <SelectContent>
                {uniqueProtocols.map((protocol) => (
                  <SelectItem key={protocol} value={protocol}>
                    {protocol === "all" ? "All Protocols" : protocol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:flex-1">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="bg-transparent w-full">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "all" ? "All Types" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="h-4 w-4 mr-2" />
              Clear filters
            </Button>
          )}
        </div>

        {/* Search and Asset Filter Buttons - Mobile responsive */}
        <div className="flex flex-col sm:grid sm:grid-cols-9 gap-2 sm:gap-4 w-full">
          <div className="w-full sm:col-span-2">
            <Input
              placeholder="Type to Search"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="bg-transparent w-full h-10 !bg-transparent"
            />
          </div>

          {/* Asset filter buttons - Grid on mobile */}
          <div className="grid grid-cols-4 sm:contents gap-2">
            <Button
              variant={selectedAsset === "APT" ? "default" : "ghost"}
              size="sm"
              onClick={() =>
                setSelectedAsset(selectedAsset === "APT" ? "all" : "APT")
              }
              className="text-xs h-10 bg-transparent border border-input hover:bg-accent hover:text-accent-foreground"
            >
              APT
            </Button>
            <Button
              variant={selectedAsset === "USDT" ? "default" : "ghost"}
              size="sm"
              onClick={() =>
                setSelectedAsset(selectedAsset === "USDT" ? "all" : "USDT")
              }
              className="text-xs h-10 bg-transparent border border-input hover:bg-accent hover:text-accent-foreground"
            >
              USDT
            </Button>
            <Button
              variant={selectedAsset === "USDC" ? "default" : "ghost"}
              size="sm"
              onClick={() =>
                setSelectedAsset(selectedAsset === "USDC" ? "all" : "USDC")
              }
              className="text-xs h-10 bg-transparent border border-input hover:bg-accent hover:text-accent-foreground"
            >
              USDC
            </Button>
            <Button
              variant={selectedAsset === "SUSDE" ? "default" : "ghost"}
              size="sm"
              onClick={() =>
                setSelectedAsset(selectedAsset === "SUSDE" ? "all" : "SUSDE")
              }
              className="text-xs h-10 bg-transparent border border-input hover:bg-accent hover:text-accent-foreground"
            >
              SUSDE
            </Button>
            <Button
              variant={
                selectedAsset === "aBTC" || selectedAsset === "ABTC"
                  ? "default"
                  : "ghost"
              }
              size="sm"
              onClick={() => {
                if (selectedAsset === "aBTC" || selectedAsset === "ABTC") {
                  setSelectedAsset("all");
                } else {
                  // Try both capitalizations to find which one exists in the data
                  const hasABTC = opportunities.some(
                    (o) => o.assetSymbol === "aBTC",
                  );
                  const hasABTCCaps = opportunities.some(
                    (o) => o.assetSymbol === "ABTC",
                  );
                  setSelectedAsset(
                    hasABTC ? "aBTC" : hasABTCCaps ? "ABTC" : "aBTC",
                  );
                }
              }}
              className="text-xs h-10 bg-transparent border border-input hover:bg-accent hover:text-accent-foreground"
            >
              aBTC
            </Button>
            <Button
              variant={
                selectedAsset === "xBTC" || selectedAsset === "XBTC"
                  ? "default"
                  : "ghost"
              }
              size="sm"
              onClick={() => {
                if (selectedAsset === "xBTC" || selectedAsset === "XBTC") {
                  setSelectedAsset("all");
                } else {
                  // Try both capitalizations to find which one exists in the data
                  const hasXBTC = opportunities.some(
                    (o) => o.assetSymbol === "xBTC",
                  );
                  const hasXBTCCaps = opportunities.some(
                    (o) => o.assetSymbol === "XBTC",
                  );
                  setSelectedAsset(
                    hasXBTC ? "xBTC" : hasXBTCCaps ? "XBTC" : "xBTC",
                  );
                }
              }}
              className="text-xs h-10 bg-transparent border border-input hover:bg-accent hover:text-accent-foreground"
            >
              xBTC
            </Button>
            <Button
              variant={selectedAsset === "WBTC" ? "default" : "ghost"}
              size="sm"
              onClick={() =>
                setSelectedAsset(selectedAsset === "WBTC" ? "all" : "WBTC")
              }
              className="text-xs h-10 bg-transparent border border-input hover:bg-accent hover:text-accent-foreground"
            >
              WBTC
            </Button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-border"></div>

      {/* Table Container - Responsive with scroll */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
          <Table className="min-w-[700px] sm:min-w-[1000px] lg:min-w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.column.getSize() }}
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
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-muted/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="p-0">
                          <div className="bg-muted/30 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Features */}
                              {row.original.features &&
                                row.original.features.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium mb-2">
                                      Features
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {row.original.features.map((feature) => (
                                        <Badge
                                          key={feature}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {feature}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              {/* Rewards */}
                              {row.original.rewards &&
                                row.original.rewards.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium mb-2">
                                      Rewards
                                    </p>
                                    <div className="space-y-1">
                                      {row.original.rewards.map((reward) => (
                                        <div
                                          key={reward.token}
                                          className="text-sm"
                                        >
                                          <span className="font-mono">
                                            {reward.symbol}:
                                          </span>{" "}
                                          <span className="text-green-500 dark:text-green-400">
                                            +{formatPercentage(reward.apr)} APR
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              {/* Additional Info */}
                              <div>
                                <p className="text-sm font-medium mb-2">
                                  Details
                                </p>
                                <div className="space-y-1 text-sm">
                                  {row.original.apr !== undefined &&
                                    row.original.apr !== row.original.apy && (
                                      <div>
                                        Base APR:{" "}
                                        {formatPercentage(row.original.apr)}
                                      </div>
                                    )}
                                  {row.original.lockPeriod !== undefined && (
                                    <div>
                                      Lock Period:{" "}
                                      {row.original.lockPeriod === 0
                                        ? "None"
                                        : `${row.original.lockPeriod} days`}
                                    </div>
                                  )}
                                  {row.original.autoCompound && (
                                    <div>Auto-compound: Yes</div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const protocol = row.original.protocol
                                    .toLowerCase()
                                    .replace(/\s+/g, "");
                                  safeWindowOpen(
                                    `https://${protocol}.fi`,
                                    "_blank",
                                  );
                                }}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open in {row.original.protocol}
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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
      </div>

      {/* Pagination - Mobile responsive */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between pt-4 mt-4 border-t border-border">
        <div className="text-sm text-muted-foreground text-center sm:text-left">
          Showing{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}{" "}
          to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            filteredOpportunities.length,
          )}{" "}
          of {filteredOpportunities.length}
          <span className="hidden sm:inline"> opportunities</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 px-2">
            <span className="text-xs sm:text-sm">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
