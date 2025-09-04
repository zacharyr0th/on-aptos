"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import type { DataTableProps, TableColumn } from "./types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  emptyTitle,
  emptyDescription,
  onRowClick,
  onRetry,
  pagination,
  sorting,
  className,
  stickyHeader = false,
}: DataTableProps<T>) {
  const [localSortBy, setLocalSortBy] = useState(sorting?.sortBy);
  const [localSortOrder, setLocalSortOrder] = useState(
    sorting?.sortOrder || "asc",
  );

  const handleSort = (key: string) => {
    if (!sorting?.onSort) return;

    if (localSortBy === key) {
      const newOrder = localSortOrder === "asc" ? "desc" : "asc";
      setLocalSortOrder(newOrder);
      sorting.onSort(key);
    } else {
      setLocalSortBy(key);
      setLocalSortOrder("asc");
      sorting.onSort(key);
    }
  };

  const getSortIcon = (key: string) => {
    if (localSortBy !== key) {
      return <ArrowUpDown className="h-4 w-4 ml-2" />;
    }
    return localSortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-2" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-2" />
    );
  };

  if (isLoading) {
    return <LoadingState variant="skeleton" className={className} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader
            className={cn(stickyHeader && "sticky top-0 bg-background z-10")}
          >
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.className,
                    column.sortable && "cursor-pointer hover:bg-muted/50",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow
                key={index}
                className={cn(onRowClick && "cursor-pointer hover:bg-muted/50")}
                onClick={() => onRowClick?.(row, index)}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                    )}
                  >
                    {column.render
                      ? column.render(row[column.key], row, index)
                      : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(
              pagination.page * pagination.pageSize,
              pagination.totalItems,
            )}{" "}
            of {pagination.totalItems} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {[
                ...Array(
                  Math.ceil(pagination.totalItems / pagination.pageSize),
                ),
              ].map((_, i) => {
                const pageNum = i + 1;
                const isCurrentPage = pageNum === pagination.page;
                const showPage =
                  pageNum === 1 ||
                  pageNum ===
                    Math.ceil(pagination.totalItems / pagination.pageSize) ||
                  Math.abs(pageNum - pagination.page) <= 1;

                if (!showPage && pageNum !== pagination.page - 2) return null;
                if (!showPage) return <span key={i}>...</span>;

                return (
                  <Button
                    key={i}
                    variant={isCurrentPage ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => pagination.onPageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={
                pagination.page >=
                Math.ceil(pagination.totalItems / pagination.pageSize)
              }
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
