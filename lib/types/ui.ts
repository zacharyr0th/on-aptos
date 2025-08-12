/**
 * Centralized UI component type definitions
 */

import { StaticImageData } from "next/image";

import { TokenMetadata } from "./tokens";

// Dialog props
export interface BaseTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
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

export interface LoadingSkeletonProps {
  variant: LoadingSkeletonVariant;
  className?: string;
  count?: number;
  [key: string]: any; // For variant-specific props
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

// Table types
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
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

// Search types
export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  loading?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  className?: string;
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
  return (
    typeof src === "string" || (src && typeof src === "object" && "src" in src)
  );
}
