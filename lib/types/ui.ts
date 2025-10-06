/**
 * Centralized UI component type definitions
 */

import type { StaticImageData } from "next/image";

import type { TokenMetadata } from "./tokens";

// Base Dialog/Modal Props
export interface BaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface BaseModalProps extends BaseDialogProps {
  title?: string;
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

// Dialog props
export interface BaseTokenDialogProps extends BaseDialogProps {
  symbol: string;
  name: string;
  decimals: number;
  supply: string;
  logoUrl?: string;
  description?: string;
  metadata?: TokenMetadata;
}

export interface ExtendedTokenDialogProps extends BaseTokenDialogProps {
  price?: number;
  priceChange24h?: number;
  marketCap?: string;
  volume24h?: string;
  susdePrice?: number;
  suppliesData?: Record<string, string>;
}

// Generic Dialog Props for different content types
export interface GenericDialogProps<T = any> extends BaseDialogProps {
  data: T | null;
  loading?: boolean;
  error?: string | null;
}

export interface NFTDialogProps extends BaseDialogProps {
  nft: any | null; // Can be typed more specifically based on NFT type
}

export interface ProtocolDialogProps extends BaseDialogProps {
  protocolName: string;
  protocolLogo: string;
  defiPosition?: any;
}

// Base Loading/Error State Props
export interface BaseLoadingProps {
  loading?: boolean;
  loadingMessage?: string;
  className?: string;
}

export interface BaseErrorProps {
  error?: string | null;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}

export interface BaseLoadingErrorProps extends BaseLoadingProps, BaseErrorProps {}

// Loading states
export type LoadingSkeletonVariant =
  | "nft-grid"
  | "asset-table"
  | "wallet-summary"
  | "chart"
  | "stats"
  | "defi-summary"
  | "transactions"
  | "yield-table"
  | "yield-opportunities";

export interface LoadingSkeletonProps extends BaseLoadingProps {
  variant: LoadingSkeletonVariant;
  count?: number;
  columns?: number;
  rows?: number;
  [key: string]: any; // For variant-specific props
}

// Error Fallback Props
export interface ErrorFallbackProps extends BaseErrorProps {
  onCloseDialog?: () => void;
}

// Chart types
export interface ChartDataPoint {
  time: string | number;
  value: number;
  label?: string;
}

export interface ChartConfig {
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  colors?: string[];
  formatValue?: (value: number) => string;
  formatLabel?: (label: string | number) => string;
}

// Base Table/List Props
export interface BaseTableProps<T = any> {
  selectedItem?: T;
  onItemSelect: (item: T) => void;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  className?: string;
}

export interface SortableTableProps<T = any> extends BaseTableProps<T> {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange: (sortBy: string, order: "asc" | "desc") => void;
}

// Table types
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableProps<T = any> extends BaseTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
}

// Specific Table Props
export interface AssetsTableProps extends BaseTableProps {
  visibleAssets: any[];
  showOnlyVerified: boolean;
  portfolioAssets: any[];
}

export interface DeFiTableProps extends SortableTableProps {
  groupedDeFiPositions: any[] | null;
  defiPositionsLoading: boolean;
  getProtocolLogo: (protocol: string) => string;
}

export interface YieldTableProps {
  walletAddress?: string;
  limit?: number;
  compact?: boolean;
}

// Card types
export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

// Tab types
export interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

// Modal/Dialog types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

// Image types
export interface OptimizedImageProps {
  src: string | StaticImageData;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  fallback?: string;
  onError?: () => void;
}

// Button types
export interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
}

// Input types
export interface InputProps {
  type?: "text" | "number" | "email" | "password" | "search";
  value?: string | number;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  helper?: string;
  required?: boolean;
  className?: string;
}

// Select types
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
}

// Toast/Notification types
export interface ToastProps {
  type?: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

// Pagination types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  className?: string;
}

// Base Search/Filter Props
export interface BaseSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export interface BaseFilterProps<T = any> {
  filters: T;
  onChange: (filters: T) => void;
  onReset?: () => void;
  className?: string;
}

// Search types
export interface SearchProps extends BaseSearchProps {
  onSearch?: () => void;
  loading?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

// Filter types
export interface FilterOption<T = string> {
  label: string;
  value: T;
  count?: number;
  disabled?: boolean;
}

export interface FilterControlsProps<T = any> extends BaseFilterProps<T> {
  options?: FilterOption[];
  multiSelect?: boolean;
  showClearAll?: boolean;
}

// Search Bar specific props
export interface SearchBarProps extends BaseSearchProps {
  onSubmit?: (value: string) => void;
  showButton?: boolean;
  buttonText?: string;
}

// Badge types
export interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

// Progress types
export interface ProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  color?: string;
  className?: string;
}

// Tooltip types
export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

// Type guards
export function isValidImageSrc(src: any): src is string | StaticImageData {
  return typeof src === "string" || (src && typeof src === "object" && "src" in src);
}
