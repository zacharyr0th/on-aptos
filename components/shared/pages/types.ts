/**
 * Shared types for page components
 */

import { ReactNode } from "react";

// Page layout types
export interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  badges?: string[];
  isLoading?: boolean;
  onRefresh?: () => void;
  refreshLabel?: string;
  isRefreshing?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface PageSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

// State component types
export interface LoadingStateProps {
  message?: string;
  showSpinner?: boolean;
  className?: string;
  variant?: "default" | "skeleton" | "dots";
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  error?: Error | null;
}

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

// Data display types
export interface StatItem {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  change?: number;
  changeType?: "increase" | "decrease" | "stable";
  status?: "good" | "warning" | "danger" | "neutral";
  className?: string;
  valueClassName?: string;
}

export interface StatsGridProps {
  stats: StatItem[];
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  isLoading?: boolean;
  className?: string;
}

// Search and filter types
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

export interface SearchFiltersProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: {
    id: string;
    label: string;
    options: FilterOption[];
    value?: string;
    onChange?: (value: string) => void;
    multiple?: boolean;
  }[];
  showSearch?: boolean;
  showFilters?: boolean;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

// Table types
export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
  render?: (value: any, row: T, index: number) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T, index: number) => void;
  onRetry?: () => void;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  sorting?: {
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    onSort?: (key: string) => void;
  };
  className?: string;
  stickyHeader?: boolean;
  virtualized?: boolean;
  rowHeight?: number;
}

// Virtualized list types
export interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number | ((index: number) => number);
  isLoading?: boolean;
  loadingComponent?: ReactNode;
  emptyComponent?: ReactNode;
  overscan?: number;
  className?: string;
  containerHeight?: number | string;
}

// Common data types
export interface BaseEntity {
  id: string;
  name: string;
  [key: string]: any;
}

export interface PageMetadata {
  title: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
}

// Utility types
export type SortOrder = "asc" | "desc";
export type ViewMode = "grid" | "list" | "table";
export type LoadingVariant = "spinner" | "skeleton" | "dots" | "shimmer";

// Hook return types
export interface UsePageDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isRefetching: boolean;
}

export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
}

export interface UseSearchReturn {
  query: string;
  debouncedQuery: string;
  setQuery: (query: string) => void;
  clearQuery: () => void;
  isSearching: boolean;
}

export interface UseFiltersReturn<T> {
  filters: T;
  activeFilters: string[];
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  clearFilter: (key: keyof T) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}
