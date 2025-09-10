import type { TableColumn } from "@/lib/types/ui";
import { cn } from "@/lib/utils";

export interface SortConfig {
  key: string;
  order: "asc" | "desc";
}

export function sortData<T extends Record<string, any>>(
  data: T[],
  sortConfig: SortConfig | null
): T[] {
  if (!sortConfig) return data;

  return [...data].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    let comparison = 0;
    if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      comparison = aValue - bValue;
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }

    return sortConfig.order === "asc" ? comparison : -comparison;
  });
}

export function filterData<T extends Record<string, any>>(
  data: T[],
  filters: Record<string, any>
): T[] {
  return data.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      const itemValue = item[key];
      if (Array.isArray(value)) {
        return value.includes(itemValue);
      }
      if (typeof value === "string") {
        return String(itemValue).toLowerCase().includes(value.toLowerCase());
      }
      return itemValue === value;
    });
  });
}

export function paginateData<T>(data: T[], page: number, pageSize: number): T[] {
  const startIndex = (page - 1) * pageSize;
  return data.slice(startIndex, startIndex + pageSize);
}

export function getTableCellClass(align?: "left" | "center" | "right", className?: string): string {
  return cn(
    "py-2",
    align === "center" && "text-center",
    align === "right" && "text-right",
    className
  );
}

export function createColumn<T>(
  key: keyof T | string,
  label: string,
  options?: Partial<TableColumn<T>>
): TableColumn<T> {
  return {
    key: String(key),
    label,
    sortable: false,
    align: "left",
    ...options,
  };
}

export function createSortableColumn<T>(
  key: keyof T | string,
  label: string,
  options?: Partial<TableColumn<T>>
): TableColumn<T> {
  return createColumn(key, label, { ...options, sortable: true });
}

export function getNestedValue<T>(obj: T, path: string): any {
  return path.split(".").reduce((current: any, key) => current?.[key], obj);
}

export function formatTableValue(
  value: any,
  type?: "currency" | "number" | "percent" | "date"
): string {
  if (value === null || value === undefined) return "—";

  switch (type) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    case "number":
      return new Intl.NumberFormat("en-US").format(value);
    case "percent":
      return `${(value * 100).toFixed(2)}%`;
    case "date":
      return new Date(value).toLocaleDateString();
    default:
      return String(value);
  }
}

export interface TableSortState {
  sortBy: string | null;
  sortOrder: "asc" | "desc";
}

export function useTableSort<T>(
  data: T[],
  initialSort?: TableSortState
): [T[], (key: string) => void, TableSortState] {
  const [sortState, setSortState] = useState<TableSortState>(
    initialSort || { sortBy: null, sortOrder: "asc" }
  );

  const handleSort = useCallback((key: string) => {
    setSortState((prev) => {
      if (prev.sortBy === key) {
        return {
          sortBy: key,
          sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
        };
      }
      return { sortBy: key, sortOrder: "asc" };
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sortState.sortBy) return data;
    return sortData(data, {
      key: sortState.sortBy,
      order: sortState.sortOrder,
    });
  }, [data, sortState]);

  return [sortedData, handleSort, sortState];
}

import { useCallback, useMemo, useState } from "react";
