"use client";

import { GeistMono } from "geist/font/mono";
import { Coins, TrendingUp } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { DataTable } from "@/components/shared/pages/DataTable";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTableState } from "@/lib/hooks/tables/useTableState";
import { cn } from "@/lib/utils";
import { formatCurrency, formatTokenAmount } from "@/lib/utils/format/format";
import { ASSET_TABLE_COLUMNS, DEFI_TABLE_COLUMNS } from "@/lib/utils/tables/table-configs";
import {
  renderAssetLogo,
  renderChangeValue,
  renderProtocolBadge,
  renderProtocolLogo,
  renderVerificationBadge,
} from "@/lib/utils/tables/table-renderers";
import { cleanProtocolName, getDetailedProtocolInfo } from "./shared/PortfolioMetrics";

interface SimplifiedAssetsTableProps {
  assets: any[];
  selectedAsset?: any;
  onAssetSelect: (asset: any) => void;
  isLoading?: boolean;
  showOnlyVerified?: boolean;
}

export const SimplifiedAssetsTable: React.FC<SimplifiedAssetsTableProps> = ({
  assets = [],
  selectedAsset,
  onAssetSelect,
  isLoading = false,
  showOnlyVerified = false,
}) => {
  const {
    displayData,
    handleSort,
    sortBy,
    sortOrder,
    isMobile,
    displayedCount,
    isLoadingMore,
    hasMore,
  } = useTableState({
    data: assets,
    initialSort: { key: "value", order: "desc" },
    pageSize: 50,
    enableVirtualScroll: true,
  });

  // Separate APT from other assets
  const aptAsset = displayData.find((asset) => asset.asset_type === "0x1::aptos_coin::AptosCoin");
  const otherAssets = displayData.filter(
    (asset) => asset.asset_type !== "0x1::aptos_coin::AptosCoin"
  );

  // Custom columns with render functions
  const columns = ASSET_TABLE_COLUMNS.map((col) => ({
    ...col,
    render: (value: any, row: any) => {
      switch (col.key) {
        case "symbol":
          return (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0">
                {renderAssetLogo(row, 32)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{row.metadata?.symbol || "Unknown"}</span>
                  {renderVerificationBadge(!row.isVerified)}
                  {renderProtocolBadge(row.protocolInfo)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {row.metadata?.name || "Unknown Asset"}
                </div>
              </div>
            </div>
          );
        case "balance":
          return (
            <div className={`text-sm text-muted-foreground ${GeistMono.className}`}>
              {formatTokenAmount(row.balance || 0, undefined, {
                showSymbol: false,
              })}
            </div>
          );
        case "price":
          return row.price && row.price > 0 ? (
            <div className={`text-sm text-muted-foreground ${GeistMono.className}`}>
              {formatCurrency(row.price)}
            </div>
          ) : (
            "—"
          );
        case "value":
          return (
            <div className={`font-medium text-sm ${GeistMono.className}`}>
              {row.price && row.price > 0 ? formatCurrency(row.value || 0) : "—"}
            </div>
          );
        case "change24h":
        case "change7d":
          return renderChangeValue(row[col.key], GeistMono.className);
        default:
          return col.render ? col.render(value, row) : value;
      }
    },
  }));

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-16 ml-auto mb-1" />
              <Skeleton className="h-3 w-20 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Combine APT and other assets for display
  const finalDisplayData = aptAsset ? [aptAsset, ...otherAssets] : otherAssets;

  return (
    <div className="asset-table-container table-scroll-container" data-asset-table>
      <DataTable
        columns={columns}
        data={finalDisplayData}
        isLoading={isLoading}
        emptyTitle="No assets found"
        emptyDescription={
          showOnlyVerified
            ? "Try disabling the 'Verified tokens only' filter to see all assets"
            : "No assets found in this wallet"
        }
        onRowClick={onAssetSelect}
        sorting={{
          sortBy,
          sortOrder,
          onSort: handleSort,
        }}
        className={cn("asset-table", selectedAsset && "has-selection")}
      />

      {/* Loading indicator for virtual scroll */}
      {isLoadingMore && (
        <div className="text-center py-3 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Loading more assets...
          </div>
        </div>
      )}

      {/* Show indicator if there are more assets to load */}
      {!isLoadingMore && hasMore && (
        <div className="text-center py-3 text-sm text-muted-foreground">
          Showing {displayedCount} of {assets.length} assets • Scroll to load more
        </div>
      )}
    </div>
  );
};

interface SimplifiedDeFiTableProps {
  groupedDeFiPositions: any[];
  selectedPosition?: any;
  onPositionSelect: (position: any) => void;
  isLoading?: boolean;
  getProtocolLogo: (protocol: string) => string;
}

export const SimplifiedDeFiTable: React.FC<SimplifiedDeFiTableProps> = ({
  groupedDeFiPositions = [],
  selectedPosition,
  onPositionSelect,
  isLoading = false,
  getProtocolLogo,
}) => {
  const { displayData, handleSort, sortBy, sortOrder, isMobile } = useTableState({
    data: groupedDeFiPositions,
    initialSort: { key: "totalValue", order: "desc" },
    enableVirtualScroll: false, // DeFi positions are usually fewer
  });

  // Custom columns with render functions
  const columns = DEFI_TABLE_COLUMNS.map((col) => ({
    ...col,
    render: (value: any, row: any) => {
      switch (col.key) {
        case "protocol": {
          const protocolInfo = getDetailedProtocolInfo(row.protocol);
          return (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {protocolInfo?.href ? (
                  <a
                    href={protocolInfo.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                    title={`Visit ${cleanProtocolName(row.protocol)} website`}
                  >
                    {renderProtocolLogo(row.protocol, getProtocolLogo, 32)}
                  </a>
                ) : (
                  renderProtocolLogo(row.protocol, getProtocolLogo, 32)
                )}
              </div>
              <span className="font-medium text-sm">{cleanProtocolName(row.protocol)}</span>
            </div>
          );
        }
        case "type": {
          const primaryType = Array.from(row.protocolTypes || [])[0] as string;
          return (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
              {row.protocolTypes?.size > 1
                ? "Multiple"
                : primaryType === "derivatives"
                  ? "Perps"
                  : primaryType
                    ? primaryType
                        .replace("_", " ")
                        .split(" ")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")
                    : "Unknown"}
            </Badge>
          );
        }
        case "value":
          return (
            <div className={`font-medium text-sm ${GeistMono.className}`}>
              {formatCurrency(row.totalValue || 0)}
            </div>
          );
        case "change24h":
        case "change7d":
          return renderChangeValue(row[col.key], GeistMono.className);
        default:
          return col.render ? col.render(value, row) : value;
      }
    },
  }));

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16 mt-1" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="defi-table-container" data-defi-table>
      <DataTable
        columns={columns}
        data={displayData}
        isLoading={isLoading}
        emptyTitle="No DeFi positions found"
        emptyDescription="Start using DeFi protocols on Aptos to see your positions here"
        onRowClick={onPositionSelect}
        sorting={{
          sortBy,
          sortOrder,
          onSort: handleSort,
        }}
        className={cn("defi-table", selectedPosition && "has-selection")}
      />
    </div>
  );
};
